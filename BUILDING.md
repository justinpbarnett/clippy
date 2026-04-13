# Building Clipjar from Source

These instructions are provided for Firefox Add-on Marketplace reviewers who need to verify the submitted build.

## Requirements

- Node.js 20 or later
- npm 10 or later

Check versions:
```
node --version
npm --version
```

## Steps

```bash
# Install dependencies
npm install

# Build the Firefox extension
npm run build:firefox

# Package it
npm run zip:firefox
# Output: clipjar-firefox-1.1.0.zip
```

The resulting `clipjar-firefox-1.1.0.zip` contains the same files as the submitted package.

## Build output

`dist-firefox/` contains:
- `manifest.json` (from `manifest.firefox.json`)
- `src/` with compiled JS/CSS assets
- `src/assets/icons/` with all icon sizes

## Build the Chrome extension

```bash
npm run build:chrome
npm run zip:chrome
# Output: clipjar-chrome-1.1.0.zip
```

## Verify

After building, load the extension temporarily in Firefox:
1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file inside `dist-firefox/`

The extension should appear in the toolbar and open its popup when clicked.
