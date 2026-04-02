# Submission Checklist

## Before submitting either store

- [ ] Run `npm run build:chrome` and `npm run build:firefox` (clean builds)
- [ ] Run `npm run zip:chrome` and `npm run zip:firefox`
- [ ] Confirm version in both manifests matches the intended release
- [ ] Host privacy policy at https://justinpbarnett.github.io/clipjar/privacy (push docs/ to gh-pages)
- [ ] Generate store screenshots: `npm run screenshots`

---

## Chrome Web Store

**URL:** https://chrome.google.com/webstore/devconsole

### One-time setup
- [ ] Pay $5 developer registration fee
- [ ] Verify developer account

### Per-submission
- [ ] Upload `clipjar-chrome.zip`
- [ ] Fill in store listing (see store/listing.md for copy)
- [ ] Upload screenshots (store/screenshots/chrome-*.png, at least 2)
- [ ] Upload promo tile: store/screenshots/promo-tile-440x280.png
- [ ] Upload store icon: src/assets/icons/icon-128.png
- [ ] Set privacy policy URL: https://justinpbarnett.github.io/clipjar/privacy
- [ ] Set category: Productivity
- [ ] Set homepage: https://github.com/justinpbarnett/clipjar
- [ ] In "Privacy practices": mark all data types as NOT collected
- [ ] Submit for review

### Expected review time
First submission with <all_urls> host permission triggers enhanced review. Budget 1-3 weeks. Reviewers may ask why the extension needs all URLs. Answer: content script listens for copy events on every page. Be direct in your response.

---

## Firefox Add-ons (AMO)

**URL:** https://addons.mozilla.org/developers/

### Account setup (free)
- [ ] Create developer account at addons.mozilla.org

### Per-submission
- [ ] Upload `clipjar-firefox.zip` as the extension package
- [ ] Upload source code: create a zip of the project root (excluding node_modules, dist-*, .git)
  ```bash
  zip -r clipjar-source.zip . --exclude "node_modules/*" --exclude "dist-*" --exclude ".git/*"
  ```
- [ ] In the source code submission form, paste the build instructions from BUILDING.md
- [ ] Fill in listing copy (see store/listing.md)
- [ ] Upload screenshots (store/screenshots/firefox-*.png)
- [ ] Set privacy policy URL: https://justinpbarnett.github.io/clipjar/privacy
- [ ] Set category: Productivity
- [ ] Set license: MIT
- [ ] Set homepage: https://github.com/justinpbarnett/clipjar
- [ ] Set support: https://github.com/justinpbarnett/clipjar/issues

### Expected review time
AMO reviews are manual. Budget 1-3 weeks for initial review. Source code review is standard for minified/bundled extensions. BUILDING.md provides the exact commands to reproduce the build.

---

## Screenshots needed (generate with `npm run screenshots`)

| File | Size | Use |
|------|------|-----|
| store/screenshots/01-history.png | 1280x800 | Clipboard list view |
| store/screenshots/02-search.png | 1280x800 | Fuzzy search in action |
| store/screenshots/03-favorites.png | 1280x800 | Favorites tab |
| store/screenshots/04-snippets.png | 1280x800 | Snippets tab |
| store/screenshots/05-options.png | 1280x800 | Settings page |
| store/screenshots/promo-tile-440x280.png | 440x280 | Chrome promo tile |

Chrome Web Store: use all 6 (5 screenshots + promo tile).
Firefox AMO: use screenshots 01-05.

---

## After publishing

- [ ] Tag the release in git: `git tag v1.0.0 && git push --tags`
- [ ] Update README.md with Chrome Web Store and AMO install links
- [ ] Share the release
