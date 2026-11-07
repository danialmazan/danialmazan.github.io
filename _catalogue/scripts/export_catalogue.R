arguments <- commandArgs(trailingOnly = FALSE)
script <- sub("^--file=", "", grep("^--file=", arguments, value = TRUE))
root <- dirname(dirname(normalizePath(script)))
source(file.path(root, "R", "project_catalog.R"))
catalog <- read_project_catalog(file.path(root, "data", "project_catalog.yml"))
validate_publication_audit(catalog, file.path(root, "deployment", "publication-date-audit.json"))
catalog$sections <- lapply(catalog$sections, function(section) {
  section$projects <- lapply(section$projects, function(project) {
    project$topics <- I(project$topics)
    project
  })
  section
})
cat(jsonlite::toJSON(catalog, auto_unbox = TRUE))
