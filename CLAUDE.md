# Clipjar: Chrome Clipboard Manager Extension

## Tech stack
- Chrome Extension Manifest V3
- Vanilla TypeScript (no framework)
- Vite + @crxjs/vite-plugin for building
- Tailwind CSS for styling
- IndexedDB via `idb` library for storage
- fuzzysort for fuzzy search

## Architecture
- Content scripts capture copy events via window.getSelection()
- Service worker is the central hub: dedup, type detection, IDB writes
- Popup is the main UI: search, list, keyboard navigation
- Offscreen document handles clipboard writes from keyboard shortcuts
- Side panel is an optional persistent view

## Commands
- `npm run dev` -- start dev server with HMR
- `npm run build` -- production build to dist/
- `npm run test` -- run vitest tests
- `npm run typecheck` -- check types
- `npm run zip` -- package dist/ for Chrome Web Store

## File conventions
- All source in src/
- Components are vanilla TS modules exporting render() functions
- Message types centralized in src/lib/types.ts
- All IDB access through src/lib/db.ts
- No framework, no React. DOM manipulation only.
