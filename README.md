# Clipjar

Free clipboard manager for Chrome and Firefox. Saves everything you copy, searches in milliseconds, stays local.

![Clipjar demo](demo.gif)

## Why

Every clipboard extension on the Chrome Web Store has at least one of these problems: hidden paywalls, broad permissions that read all your data, cloud sync that stores your copies on someone else's server, or slow UI that makes you reach for the mouse.

Clipjar has none of them. Everything stays in your browser's local IndexedDB. No network requests. No accounts. No telemetry. No paywall, ever.

## Features

- Saves every copy across all tabs to local IndexedDB
- Fuzzy search across thousands of clips in under 10ms
- Auto-tags clips as URL, email, phone, code, JSON, or plain text
- Pin clips you use constantly to a Favorites tab
- Text snippets: define `:sig` once, type it anywhere, it expands
- Shows which site each clip came from
- Skips password fields automatically
- Arrow keys, Enter, Tab, Escape, no mouse required
- Follows your system dark/light preference
- Full JSON export and import
- Side panel for a persistent view while you browse
- No `clipboardRead` permission at install; captured via the native copy event

## Install

### From source

Prerequisites: Node.js 18+ and npm.

```bash
git clone https://github.com/justinpbarnett/clipjar.git
cd clipjar
npm install
```

**Chrome / Edge / Brave:**

```bash
npm run build:chrome
```

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**, select the `dist-chrome/` folder

**Firefox (128+):**

```bash
npm run build:firefox
```

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select any file inside `dist-firefox/`

For a permanent install, package it as a signed XPI via [about:addons](about:addons) or the [Firefox Add-on Hub](https://addons.mozilla.org/developers/).

Pin Clipjar to your toolbar and press **Cmd+Shift+V** (Mac) or **Ctrl+Shift+V** (Windows/Linux) to open it.

### Claude Code auto-setup

Paste this into Claude Code and it will clone, build, and tell you exactly what to click:

```
Clone https://github.com/justinpbarnett/clipjar, install dependencies, build it, then give me the exact steps to load it as an unpacked Chrome extension. Print the absolute path to the dist-chrome/ folder so I can paste it into Chrome.
```

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| **Cmd+Shift+V** | Open Clipjar |
| **Arrow Up/Down** | Navigate clips |
| **Enter** | Copy selected clip to clipboard |
| **Escape** | Close popup |
| **Tab / Shift+Tab** | Switch between All, Favorites, Snippets |
| **Cmd+S** | Pin/unpin selected clip |
| **Cmd+Backspace** | Delete selected clip |
| **Cmd+Shift+1** | Copy most recent clip (without opening popup) |

Shortcuts can be customized at `chrome://extensions/shortcuts`.

## Text snippets

Define shortcuts that auto-expand as you type:

1. Open Clipjar, switch to the **Snippets** tab
2. Click **+ New Snippet**
3. Set a shortcut (e.g. `:sig`) and the expansion text
4. Type `:sig` in any text field on any page and it expands instantly

## Settings

Open the options page from `chrome://extensions/` or right-click the Clipjar icon and select **Options**.

- Max clipboard history (default 1000)
- Theme (system, light, dark)
- Skip password fields (on by default)
- Enable snippet expansion
- Track source URLs
- Default tab
- Import/Export all data as JSON

## Architecture

```
Content Script (every page)
  copies text via window.getSelection() on the copy event
  skips password fields
  sends to service worker
       |
Service Worker
  deduplicates via SHA-256 hash
  detects content type (URL, email, code, JSON, phone, text)
  stores to IndexedDB
  prunes history to configured max
       |
Popup UI (380x500px)
  fuzzy search via fuzzysort
  virtual-scrolled clip list
  full keyboard navigation
  writes to clipboard via navigator.clipboard.writeText()
```

## Browser differences

| Feature | Chrome / Edge / Brave | Firefox |
|---|---|---|
| Side panel | `chrome.sidePanel` | `sidebar_action` (opens via View menu) |
| Clipboard shortcut | Offscreen document API | Content script relay |
| Minimum version | Chrome 116+ | Firefox 128+ |
| Extension ID | Auto-assigned | `clipjar@clipjar.dev` |

Everything else (history, search, favorites, snippets, keyboard nav) works identically in both browsers.

## Development

```bash
npm run dev            # Vite dev server with HMR
npm run build:chrome   # Production build to dist-chrome/
npm run build:firefox  # Production build to dist-firefox/
npm run typecheck      # TypeScript type checking
npm run test           # Run vitest unit tests
npm run zip            # Package dist-chrome/ for Chrome Web Store
```

## Privacy

All data is stored in IndexedDB locally. Nothing leaves your browser: no network requests, no analytics, no telemetry.

Text is captured via `window.getSelection()` inside the native copy event, so `clipboardRead` isn't needed at install. It's listed as an optional permission but nothing currently requests it.

Open source. Read every line.

## License

MIT
