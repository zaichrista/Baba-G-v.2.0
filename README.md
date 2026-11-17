# Baba G website

The complete static website lives at the repository root. `index.html` is the homepage; all styles, scripts and images use relative paths so the site also works under a GitHub Pages repository URL.

## GitHub Pages

In Settings → Pages, use **Deploy from a branch**, branch **main**, folder **/ (root)**. No build or package installation is needed. `.nojekyll` ensures the files are served directly.

## Local preview and checks

Run `python3 -m http.server 4400` and open http://localhost:4400/.

Run `npm test` for the tests. Run `npm run build` to package the static files into `dist/` for other static hosts, including the retained Sites configuration. `dist/` is generated and is not committed.
