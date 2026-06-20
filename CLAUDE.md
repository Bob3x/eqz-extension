# FreqWave EQ — Browser Extension

## What this is

A Manifest V3 Chrome extension that captures audio from the active tab,
processes it through an 8-band EQ + voice enhancement engine, and plays
the processed audio back. Goal: improve the audio of videos, movies, and
podcasts where the original mix is poor (especially voice-over-music balance).

## Status

Personal project, pre-release. Not currently planned for commercial sale —
the audio enhancement space is well-served by established tools. Primary
value: portfolio artifact, AI-native development practice, and a tool I
actually use.

## Tech stack

- Manifest V3 Chrome extension
- React + Vite + TailwindCSS for the popup UI
- Web Audio API for audio processing (runs in an offscreen document)
- chrome.tabCapture API for capturing tab audio

## Architecture

Three execution contexts, communicating via chrome.runtime messages:

1. **Popup (React)** — UI only. EQ sliders, knobs, presets, visualizer.
   Sends control messages. Does NOT touch audio directly.
2. **Service worker** — Coordinator. Routes messages between popup and
   offscreen document. Manages tab capture handoff. Creates offscreen
   document on demand (lazy). Does NOT process audio.
3. **Offscreen document** — The audio engine. Holds the AudioContext,
   builds the audio graph, receives parameter updates via messages.

## Audio graph

```
source (MediaStreamAudioSourceNode from getUserMedia)
  → pre-amp (GainNode)
  → 8 × BiquadFilterNode
  → master gain (GainNode)
  → analyser (AnalyserNode, for visualizer)
  → destination (AudioContext.destination)
```

### Band configuration (locked)

| Band | Frequency | Type      |
| ---- | --------- | --------- |
| 0    | 32 Hz     | lowshelf  |
| 1    | 64 Hz     | peaking   |
| 2    | 125 Hz    | peaking   |
| 3    | 250 Hz    | peaking   |
| 4    | 500 Hz    | peaking   |
| 5    | 1 kHz     | peaking   |
| 6    | 4 kHz     | peaking   |
| 7    | 8 kHz     | highshelf |

- Q factor for peaking filters: 1.41 (default, but expose Q as a per-band
  parameter in the engine for later tuning without refactoring)
- Gain range per band: ±12 dB
- Default state: all bands at 0 dB (flat)

### Gain controls

- **Pre-amp**: -24 dB to +12 dB (more cut than boost — its job is to
  prevent clipping before the filter chain)
- **Master**: -60 dB to 0 dB only — no boost on master (pre-amp handles
  boost). Use perceptual mapping (e.g., quadratic) for the knob so the
  control feel matches perceived loudness.

## Architectural decisions (locked)

### Power toggle UX

- The existing "Engine Active" badge in the popup IS the toggle.
  No separate power button.
- Three states: **Idle**, **Starting** (brief intermediate during capture
  initialization), **Active**.
- Click badge → start. Click again → stop.

### Tab capture behavior — sticky

- Engine attaches to the tab it was started on and stays there even
  when the user switches tabs.
- When popup opens on a different tab than the captured one, show the
  hostname of the captured tab (e.g., "Capturing: youtube.com").
- Reject new START_CAPTURE attempts while a capture is active. Show a
  clear message: "Engine is active on [hostname]. Stop it first."
- Service worker tracks captured tab ID + hostname in memory.

### Captured tab closed / navigated away

- Offscreen doc listens for `onended` on the audio track.
- When the stream ends, offscreen sends ENGINE_STOPPED to service worker.
- Service worker updates state to idle.
- Popup, if open, receives state-change message and badge returns to idle.
- If popup is not open, it queries state on next open.
- Stop silently — no error dialogs, no auto-reconnect.

### Offscreen document lifecycle — lazy, persistent

- Do NOT create on install.
- Create on the **first** START_CAPTURE.
- Use a ready-handshake: offscreen sends `OFFSCREEN_READY` when its
  script has loaded and AudioContext is initialized. Service worker
  waits for this before sending the stream ID.
- On STOP_CAPTURE, disconnect the audio graph but **keep the offscreen
  document alive**. Subsequent starts just rebuild the graph in the
  existing doc.
- Service worker must handle its own suspension/wake: on wake, query
  offscreen for current state rather than assuming.

### Visualizer

- AnalyserNode-driven.
- Calm/idle when engine is off (don't animate constantly when bypassed).
- Spectrum view for now; waveform option deferred.

### Persistence

- No persistence yet. Settings reset on extension reload. Will revisit
  once the engine works end-to-end.

## Message protocol

Typed message constants in `src/messages/types.ts`.

**Popup → Service Worker:**

- `START_CAPTURE`
- `STOP_CAPTURE`
- `SET_BAND_GAIN` { bandIndex, gainDb }
- `SET_PREAMP_GAIN` { gainDb }
- `SET_MASTER_GAIN` { gainDb }
- `SET_BYPASS` { bypassed: boolean }
- `QUERY_STATE`

**Service Worker → Offscreen Document:**

- `INIT_CAPTURE` { streamId }
- `TEARDOWN_CAPTURE`
- (forwarded versions of the SET\_\* messages)

**Offscreen → Service Worker:**

- `OFFSCREEN_READY`
- `ENGINE_STOPPED` (stream ended unexpectedly)

**Service Worker → Popup:**

- `STATE_CHANGED` { state, capturedTabId, capturedHostname }

Do NOT overload SET_GAIN to handle pre-amp, master, and bands.
Use the separate typed messages above.

## Open questions / not yet decided

- Per-site vs. global EQ settings
- Whether presets (Dialogue, Leveler, Clarity) need dynamics processing
  (compressor, expander) beyond pure EQ — "Leveler" probably does
- Visualizer: stick with spectrum view (current) or add waveform option

## Code conventions

- Functional React components with hooks, no class components
- TailwindCSS utility classes; avoid inline styles unless dynamic
- Audio engine is plain TS (not React) — runs in offscreen doc context
- File naming: PascalCase for React components, camelCase for everything else

## Project layout (target)

```
src/
  popup/              # React UI
  background/         # Service worker
    serviceWorker.ts
  offscreen/          # Audio engine
    offscreen.html
    offscreen.ts
  messages/           # Shared message types
    types.ts
  shared/             # Utilities used in multiple contexts
manifest.json
```

## How to work on this project

- Run dev mode: `npm run dev` (Vite watch)
- Load into Chrome: chrome://extensions → Developer mode → Load unpacked → `dist/`
- After code changes, click the reload icon on the extension card
- Test target: YouTube in a regular tab. Confirm audio routes through engine.

## Implementation order — offscreen migration

Implement one step at a time. After each step, stop and report what was
changed + what I should test manually before moving to the next.

1. **Manifest changes.** Remove content_scripts, add offscreen +
   tabCapture permissions. Content script files stay in the codebase
   for now — deleted in step 9.
2. **Define message types** in `src/messages/types.ts`.
3. **Offscreen document skeleton.** Create `offscreen.html` +
   `offscreen.ts` that initializes AudioContext and sends OFFSCREEN_READY.
   No engine logic yet. Update `vite.config.ts` to bundle it.
4. **Service worker — minimal coordinator.** Handle START_CAPTURE
   (get stream ID, create offscreen if needed, wait for OFFSCREEN_READY,
   send INIT_CAPTURE), STOP_CAPTURE, QUERY_STATE. Track captured tab
   state. No EQ message forwarding yet.
5. **Audio engine in offscreen.** Build the graph on INIT_CAPTURE,
   disconnect on TEARDOWN_CAPTURE, listen for `onended`. With all
   controls flat, audio should pass through unmodified.
6. **Wire master volume only.** First end-to-end UI-to-audio proof.
7. **Wire pre-amp, bands, bypass.** Repeat the pattern.
8. **Popup state synchronization.** QUERY_STATE on mount, handle
   STATE_CHANGED, badge behavior, hostname display, reject-while-active.
9. **Delete content script.** Remove `src/content/` entirely.
10. **Test on a DRM site.** Netflix or Spotify web player. Confirms the
    architecture works where the content script approach couldn't.

## Known issues (pre-migration)

- Slider movement feels clunky — likely re-render or update-frequency
  issue. Address after the engine works.
- Audio engine not yet wired to UI controls — being fixed by this migration.

## What NOT to do

- Don't move the audio engine into the service worker. Service workers
  cannot use Web Audio API. Non-negotiable.
- Don't skip the ready-handshake. Sending stream IDs before the
  offscreen doc is ready creates hard-to-debug timing bugs.
- Don't destroy the offscreen document on STOP_CAPTURE. Lifecycle is
  lazy-create then persistent until extension unload.
- Don't auto-reconnect when the captured tab closes. Stop silently.
- Don't implement multiple migration steps in one pass. Stop and verify
  between each numbered step.
- Don't refactor the React UI beyond what's needed to send messages.
  The UI is finished. Don't "improve" it unprompted.
- Don't add new top-level dependencies without checking first.
- Don't add error dialogs or toast notifications for the closed-tab
  case. State change should be silent and visual only.
- Don't overload SET_GAIN — use the separate typed messages defined
  in the message protocol.
- Don't add features beyond what's specified. We'll iterate after v1.
- Don't refactor working code unless asked. Half-finished refactors are
  worse than messy working code.
