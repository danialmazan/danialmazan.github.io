project_catalog_required_section_fields <- c(
  "id", "title", "url", "description", "projects"
)

project_catalog_required_project_fields <- c(
  "id", "title", "description", "url", "last_published"
)

project_catalog_known_sections <- c(
  "density-transport-analysis", "population", "transport", "elections", "games", "other"
)

project_catalog_languages <- c("en", "es")

catalog_error <- function(message, ...) {
  stop(sprintf(message, ...), call. = FALSE)
}

is_nonempty_string <- function(value) {
  is.character(value) && length(value) == 1L && nzchar(trimws(value))
}

assert_catalog_fields <- function(item, required_fields, item_label) {
  if (!is.list(item)) {
    catalog_error("%s must be a mapping.", item_label)
  }

  missing_fields <- setdiff(required_fields, names(item))
  if (length(missing_fields) > 0L) {
    catalog_error(
      "%s is missing required field(s): %s.",
      item_label,
      paste(missing_fields, collapse = ", ")
    )
  }
}

assert_localized_string <- function(value, item_label, field) {
  if (!is.list(value) || !identical(names(value), project_catalog_languages)) {
    catalog_error(
      "%s field '%s' must contain exactly 'en' and 'es', in that order.",
      item_label,
      field
    )
  }

  for (language in project_catalog_languages) {
    if (!is_nonempty_string(value[[language]])) {
      catalog_error(
        "%s field '%s.%s' must be a non-empty string.",
        item_label,
        field,
        language
      )
    }
  }
}

assert_catalog_url <- function(value, item_label, field) {
  if (!is_nonempty_string(value) ||
      !grepl("^https://danielalmazan\\.com/", value)) {
    catalog_error(
      "%s field '%s' must use https://danielalmazan.com/.",
      item_label,
      field
    )
  }
}

validate_project_catalog <- function(catalog) {
  if (!is.list(catalog) || !is.list(catalog$sections) ||
      length(catalog$sections) == 0L) {
    catalog_error("The project catalog must contain a non-empty sections list.")
  }

  section_ids <- character()
  section_urls <- character()
  project_ids <- character()
  project_urls <- character()

  for (section_index in seq_along(catalog$sections)) {
    section <- catalog$sections[[section_index]]
    section_label <- sprintf("Section %d", section_index)

    assert_catalog_fields(
      section,
      project_catalog_required_section_fields,
      section_label
    )

    if (!is_nonempty_string(section$id)) {
      catalog_error("%s field 'id' must be a non-empty string.", section_label)
    }
    assert_localized_string(section$title, section_label, "title")
    assert_localized_string(section$description, section_label, "description")
    assert_catalog_url(section$url, section_label, "url")
    for (field in intersect(c("url_en", "url_es"), names(section))) {
      assert_catalog_url(section[[field]], section_label, field)
    }

    if (!is.list(section$projects) || length(section$projects) == 0L) {
      catalog_error("%s must contain at least one project.", section_label)
    }

    section_ids <- c(section_ids, section$id)
    section_urls <- c(section_urls, section$url)

    for (project_index in seq_along(section$projects)) {
      project <- section$projects[[project_index]]
      project_label <- sprintf(
        "Project %d in section '%s'",
        project_index,
        section$id
      )

      assert_catalog_fields(
        project,
        project_catalog_required_project_fields,
        project_label
      )

      if (!is_nonempty_string(project$id)) {
        catalog_error("%s field 'id' must be a non-empty string.", project_label)
      }
      assert_localized_string(project$title, project_label, "title")
      assert_localized_string(project$description, project_label, "description")
      assert_catalog_url(project$url, project_label, "url")
      publication_date <- suppressWarnings(as.Date(project$last_published, format = "%Y-%m-%d"))
      if (!is_nonempty_string(project$last_published) || is.na(publication_date) ||
          !identical(format(publication_date, "%Y-%m-%d"), project$last_published) ||
          publication_date > Sys.Date()) {
        catalog_error("%s field 'last_published' must be a verified, non-future YYYY-MM-DD page upload/update date.", project_label)
      }
      for (field in intersect(c("url_en", "url_es"), names(project))) {
        assert_catalog_url(project[[field]], project_label, field)
      }

      project_ids <- c(project_ids, project$id)
      project_urls <- c(project_urls, project$url)
    }
  }

  if (anyDuplicated(section_ids)) {
    catalog_error("Section IDs must be unique.")
  }
  if (anyDuplicated(section_urls)) {
    catalog_error("Section URLs must be unique.")
  }
  if (!identical(section_ids, project_catalog_known_sections)) {
    catalog_error(
      "Sections must appear exactly in this order: %s.",
      paste(project_catalog_known_sections, collapse = ", ")
    )
  }
  if (anyDuplicated(project_ids)) {
    catalog_error("Project IDs must be unique across the catalog.")
  }
  if (anyDuplicated(project_urls)) {
    catalog_error("Project URLs must be unique across the catalog.")
  }

  invisible(TRUE)
}

read_project_catalog <- function(path) {
  if (!requireNamespace("yaml", quietly = TRUE)) {
    catalog_error("Package 'yaml' is required to read the project catalog.")
  }
  if (!file.exists(path)) {
    catalog_error("Project catalog not found at %s.", path)
  }

  catalog <- yaml::read_yaml(path)
  validate_project_catalog(catalog)
  catalog
}

validate_publication_audit <- function(catalog, audit_path) {
  audit <- jsonlite::read_json(audit_path)
  projects <- unlist(lapply(catalog$sections, function(section) section$projects), recursive = FALSE)
  ids <- vapply(projects, function(project) project$id, character(1))
  audit_ids <- vapply(audit$projects, function(project) project$id, character(1))
  if (!identical(sort(ids), sort(audit_ids))) {
    catalog_error("Publication-date audit must cover every project exactly once.")
  }
  for (project in projects) {
    evidence <- audit$projects[[match(project$id, audit_ids)]]
    published <- as.POSIXct(evidence$published_at, format = "%Y-%m-%dT%H:%M:%SZ", tz = "UTC")
    if (is.null(evidence$deployment_url) ||
        !identical(project$last_published, format(published, "%Y-%m-%d", tz = "Europe/Madrid"))) {
      catalog_error("Project '%s' must use its verified page deployment date.", project$id)
    }
  }
  invisible(TRUE)
}

get_catalog_section <- function(catalog, section_id) {
  matches <- vapply(
    catalog$sections,
    function(section) identical(section$id, section_id),
    logical(1)
  )

  if (sum(matches) != 1L) {
    catalog_error("Expected exactly one catalog section with ID '%s'.", section_id)
  }

  catalog$sections[[which(matches)]]
}

localized_value <- function(item, field, language = "en") {
  item[[field]][[language]]
}

localized_url <- function(item, language = "en") {
  override <- item[[paste0("url_", language)]]
  if (is_nonempty_string(override)) override else item$url
}

localized_text_tag <- function(tag, text, ...) {
  tag(
    ...,
    `data-i18n-en` = text$en,
    `data-i18n-es` = text$es,
    text$en
  )
}

publication_badge_tag <- function(project) {
  date <- as.Date(project$last_published)
  month <- as.integer(format(date, "%m"))
  year <- format(date, "%Y")
  day <- as.integer(format(date, "%d"))
  short_months <- list(
    en = c("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"),
    es = c("Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic")
  )
  long_months <- list(
    en = c("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"),
    es = c("enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre")
  )
  labels <- lapply(short_months, function(months) paste0(months[month], "-", substr(year, 3L, 4L)))
  explanations <- list(
    en = sprintf("Page last uploaded / updated: %d %s %s", day, long_months$en[month], year),
    es = sprintf("Última publicación / actualización de la página: %d de %s de %s", day, long_months$es[month], year)
  )
  now <- Sys.Date()
  age <- (as.integer(format(now, "%Y")) - as.integer(year)) * 12L + as.integer(format(now, "%m")) - month
  age_band <- if (age <= 3L) "recent" else if (age <= 12L) "year" else if (age <= 24L) "previous" else "archive"
  htmltools::tags$time(
    class = "freshness-badge", datetime = project$last_published,
    `data-age` = age_band,
    `aria-label` = explanations$en,
    `data-i18n-aria-label-en` = explanations$en,
    `data-i18n-aria-label-es` = explanations$es,
    localized_text_tag(htmltools::tags$span, labels, class = "badge-date"),
    localized_text_tag(htmltools::tags$span, explanations, class = "badge-tooltip", `aria-hidden` = "true")
  )
}

project_card_tag <- function(project) {
  htmltools::tags$a(
    class = "project-card",
    href = localized_url(project, "en"),
    `data-i18n-href-en` = localized_url(project, "en"),
    `data-i18n-href-es` = localized_url(project, "es"),
    localized_text_tag(htmltools::tags$h3, project$title),
    localized_text_tag(htmltools::tags$p, project$description),
    publication_badge_tag(project)
  )
}

render_project_cards <- function(catalog, section_id) {
  if (!requireNamespace("htmltools", quietly = TRUE)) {
    catalog_error("Package 'htmltools' is required to render project cards.")
  }

  section <- get_catalog_section(catalog, section_id)
  cards <- lapply(section$projects, project_card_tag)
  paste(vapply(cards, as.character, character(1)), collapse = "\n")
}

homepage_section_tag <- function(section) {
  heading_id <- paste0(section$id, "-title")
  heading_link <- htmltools::tags$a(
    href = localized_url(section, "en"),
    `data-i18n-href-en` = localized_url(section, "en"),
    `data-i18n-href-es` = localized_url(section, "es"),
    `data-i18n-en` = section$title$en,
    `data-i18n-es` = section$title$es,
    section$title$en
  )

  htmltools::tags$section(
    class = "section-block",
    `aria-labelledby` = heading_id,
    htmltools::tags$header(
      class = "section-heading",
      htmltools::tags$h2(id = heading_id, heading_link)
    ),
    htmltools::tags$div(
      class = "project-grid",
      htmltools::tagList(lapply(section$projects, project_card_tag))
    )
  )
}

render_homepage_sections <- function(catalog) {
  if (!requireNamespace("htmltools", quietly = TRUE)) {
    catalog_error("Package 'htmltools' is required to render homepage sections.")
  }

  sections <- lapply(catalog$sections, homepage_section_tag)
  paste(vapply(sections, as.character, character(1)), collapse = "\n\n")
}

render_language_switch <- function() {
  as.character(htmltools::tags$div(
    class = "language-switch",
    role = "group",
    `aria-label` = "Language",
    `data-i18n-aria-label-en` = "Language",
    `data-i18n-aria-label-es` = "Idioma",
    htmltools::tags$button(
      type = "button", `data-lang` = "en", `aria-pressed` = "true", "EN"
    ),
    htmltools::tags$span(`aria-hidden` = "true", "/"),
    htmltools::tags$button(
      type = "button", `data-lang` = "es", `aria-pressed` = "false", "ES"
    )
  ))
}

render_language_runtime <- function() {
  asset_directory <- if (dir.exists("../assets")) "../assets" else "assets"
  badge_css <- paste(readLines(file.path(asset_directory, "freshness.css"), warn = FALSE), collapse = "\n")
  badge_js <- paste(readLines(file.path(asset_directory, "freshness.js"), warn = FALSE), collapse = "\n")
  paste0(
    '<style>\n', badge_css, '\n</style>\n',
    '<script>\n',
    '(function () {\n',
    '  "use strict";\n',
    '  function languageFromUrl() {\n',
    '    return new URLSearchParams(window.location.search).get("lang") === "es" ? "es" : "en";\n',
    '  }\n',
    '  function setLanguage(language, updateUrl) {\n',
    '    document.documentElement.lang = language;\n',
    '    document.querySelectorAll("[data-i18n-en][data-i18n-es]").forEach(function (element) {\n',
    '      element.textContent = element.getAttribute("data-i18n-" + language);\n',
    '    });\n',
    '    document.querySelectorAll("[data-i18n-href-en][data-i18n-href-es]").forEach(function (element) {\n',
    '      element.setAttribute("href", element.getAttribute("data-i18n-href-" + language));\n',
    '    });\n',
    '    document.querySelectorAll("[data-i18n-aria-label-en][data-i18n-aria-label-es]").forEach(function (element) {\n',
    '      element.setAttribute("aria-label", element.getAttribute("data-i18n-aria-label-" + language));\n',
    '    });\n',
    '    document.querySelectorAll("[data-lang]").forEach(function (button) {\n',
    '      button.setAttribute("aria-pressed", String(button.getAttribute("data-lang") === language));\n',
    '    });\n',
    '    var page = document.querySelector("[data-page-title-en][data-page-title-es]");\n',
    '    if (page) {\n',
    '      document.title = page.getAttribute("data-page-title-" + language);\n',
    '      var meta = document.querySelector("meta[name=description]");\n',
    '      var description = page.getAttribute("data-page-description-" + language);\n',
    '      if (meta && description) meta.setAttribute("content", description);\n',
    '    }\n',
    '    if (updateUrl) {\n',
    '      var url = new URL(window.location.href);\n',
    '      if (language === "es") url.searchParams.set("lang", "es");\n',
    '      else url.searchParams.delete("lang");\n',
    '      history.replaceState({}, "", url);\n',
    '    }\n',
    '  }\n',
    '  document.querySelectorAll("[data-lang]").forEach(function (button) {\n',
    '    button.addEventListener("click", function () { setLanguage(button.getAttribute("data-lang"), true); });\n',
    '  });\n',
    '  window.addEventListener("popstate", function () { setLanguage(languageFromUrl(), false); });\n',
    '  setLanguage(languageFromUrl(), false);\n',
    '}());\n',
    '</script>\n<script>\n', badge_js, '\n</script>'
  )
}

catalog_expected_cards <- function(catalog, section_id, language = "en") {
  projects <- get_catalog_section(catalog, section_id)$projects
  lapply(
    projects,
    function(project) {
      list(
        url = localized_url(project, language),
        title = localized_value(project, "title", language),
        description = localized_value(project, "description", language)
      )
    }
  )
}
