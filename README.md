# EQZ Extension

EQZ Extension is a Chrome extension for adjusting audio playback with a simple 5-band equalizer. It is built with React, TypeScript, Vite, Tailwind CSS, and CRXJS.

The extension currently includes:

- A popup UI for adjusting EQ bands and bypassing the effect
- A content script that attaches Web Audio filters to media elements on pages
- A background service worker for extension lifecycle hooks

This repository is still under active development, so the README will grow as features and architecture settle.

## Development

- `npm run dev` starts the Vite development server
- `npm run build` creates a production build
- `npm run lint` runs ESLint across the project

## Project Structure

- `src/popup/` contains the extension popup UI
- `src/content/` contains the page audio logic
- `src/background/` contains the MV3 service worker
- `src/shared/` contains shared helpers
