# Clippy

The clipboard manager Chrome deserves. Free, private, keyboard-first.

![Clippy demo](demo.gif)

## Why

Every clipboard extension on the Chrome Web Store has at least one of these problems: hidden paywalls, broad permissions that read all your data, cloud sync that stores your copies on someone else's server, or slow UI that makes you reach for the mouse.

Clippy has none of them. Everything stays in your browser's local IndexedDB. No network requests. No accounts. No telemetry. No paywall, ever.

## Features

- **Clipboard history** that captures every copy across all tabs
- **Fuzzy search** across thousands of clips in under 10ms
- **Type detection** automatically tags clips as URL, Email, Phone, Code, JSON, or Text
- **Favorites** to pin clips you use all the time
- **Text snippets** with `:shortcut` expansion in any text field
- **Source tracking** shows where each clip came from
- **Password skip** automatically ignores copies from password fields
- **Keyboard-first** with full arrow key, Enter, Escape, and Tab navigation
- **Dark/light mode** that follows your system preference
- **Import/Export** for full JSON backup of all your data
- **Side panel** for a persistent view while you browse
- **Minimal permissions** captures text via `window.getSelection()`, so no `clipboardRead` permission needed at install

## Install

### From source (recommended)

**Prerequisites:** Node.js 18+ and npm.

```bash
git clone https://github.com/justinpbarnett/clippy.git
cd clippy
npm install
npm run build
```

Then load in Chrome:

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `dist/` folder inside the cloned repo

Done. Pin Clippy to your toolbar and press **Cmd+Shift+V** (Mac) or **Ctrl+Shift+V** (Windows/Linux) to open it.

### Claude Code auto-setup

Paste this into Claude Code and it will clone, build, and tell you exactly what to click:

```
Clone https://github.com/justinpbarnett/clippy, install dependencies, build it, then give me the exact steps to load it as an unpacked Chrome extension. Print the absolute path to the dist/ folder so I can paste it into Chrome.
```

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| **Cmd+Shift+V** | Open Clippy |
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

1. Open Clippy, switch to the **Snippets** tab
2. Click **+ New Snippet**
3. Set a shortcut (e.g. `:sig`) and the expansion text
4. Type `:sig` in any text field on any page and it expands instantly

## Settings

Open the options page from `chrome://extensions/` or right-click the Clippy icon and select **Options**.

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

## Development

```bash
npm run dev        # Vite dev server with HMR
npm run build      # Production build to dist/
npm run typecheck   # TypeScript type checking
npm run test       # Run vitest unit tests
npm run zip        # Package dist/ for Chrome Web Store
```

## Privacy

- All data stored locally in IndexedDB. Nothing leaves your browser.
- Zero network requests. No analytics, no telemetry, no tracking.
- No `clipboardRead` permission at install. Text is captured via `window.getSelection()` inside the native copy event.
- `clipboardRead` is an optional permission, requested only if you enable image capture in settings.
- Open source. Read every line.

## License

MIT
