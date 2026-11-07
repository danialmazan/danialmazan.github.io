# Cobalt catalogue source

The homepage and Games page are generated from the shared bilingual catalogue.
This folder contains the renderer, verified page dates, styles, JavaScript, fonts
and prepared thumbnails used in this release.

From this folder run `python3 scripts/build_catalogue.py`. Python 3 and R with the
`yaml` and `jsonlite` packages are required. The output is written to `html/`.
Publish its `index.html` and versioned `assets/portfolio/` directory at the domain
root, then publish `games.html` as `index.html` in the Games repository.

The feature selection is in `data/project_catalog.yml`. Update indicators refer
to the linked projects' verified deployments. Rebuilding this catalogue does not
advance those dates. The canonical working source is the local Web workspace.
