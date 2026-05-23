/**
 * content.ts — Equalizer audio engine
 *
 * Lifecycle:
 *  1. On load, scan existing <audio>/<video> elements and wire them up.
 *  2. Observe the DOM for elements added later (SPAs, lazy players).
 *  3. Listen for chrome.runtime messages from the popup to mutate gains.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EQBand {
    /** Centre frequency in Hz */
    frequency: number;
    /** BiquadFilterNode type appropriate for the band position */
    type: BiquadFilterType;
}

export type MessageKind =
    | { kind: "SET_GAIN"; bandIndex: number; gainDb: number }
    | { kind: "SET_BYPASS"; bypassed: boolean };

// ---------------------------------------------------------------------------
// Band definitions  (100 Hz · 300 Hz · 1 kHz · 4 kHz · 12 kHz)
// ---------------------------------------------------------------------------

const BAND_DEFS: EQBand[] = [
    { frequency: 100, type: "lowshelf" },
    { frequency: 300, type: "peaking" },
    { frequency: 1000, type: "peaking" },
    { frequency: 4000, type: "peaking" },
    { frequency: 12000, type: "highshelf" }
];

// Default Q for peaking bands; shelves ignore Q.
const DEFAULT_Q = 1.0;

// ---------------------------------------------------------------------------
// Per-element audio graph
// ---------------------------------------------------------------------------

interface ElementGraph {
    source: MediaElementAudioSourceNode;
    filters: BiquadFilterNode[];
    /** Dry-gain node that lets us bypass the filter chain */
    bypass: boolean;
}

// Keyed by the media element itself so WeakMap doesn't block GC.
const graphs = new WeakMap<HTMLMediaElement, ElementGraph>();

// Single shared AudioContext per content-script scope.
let ctx: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!ctx || ctx.state === "closed") {
        ctx = new AudioContext();
    }
    return ctx;
}

// ---------------------------------------------------------------------------
// Graph construction
// ---------------------------------------------------------------------------

function buildGraph(el: HTMLMediaElement): ElementGraph | null {
    // Avoid double-wiring.
    if (graphs.has(el)) return graphs.get(el)!;

    // CORS: without this, createMediaElementSource throws a SecurityError on
    // cross-origin streams (e.g. YouTube CDN audio). Setting it before the
    // element has loaded is safest; after load it triggers a reload on some
    // browsers but is still preferable to a silent failure.
    if (!el.crossOrigin) {
        el.crossOrigin = "anonymous";
    }

    const audioCtx = getAudioContext();

    let source: MediaElementAudioSourceNode;
    try {
        source = audioCtx.createMediaElementSource(el);
    } catch (err) {
        // Already connected to a different AudioContext, or CORS hard-blocked.
        console.warn("[EQ] Could not create MediaElementSource:", err);
        return null;
    }

    // Build a chain: source → filter[0] → … → filter[4] → destination
    const filters = BAND_DEFS.map((band) => {
        const f = audioCtx.createBiquadFilter();
        f.type = band.type;
        f.frequency.value = band.frequency;
        f.Q.value = DEFAULT_Q;
        f.gain.value = 0; // flat by default
        return f;
    });

    // Connect the chain.
    source.connect(filters[0]);
    for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
    }
    filters[filters.length - 1].connect(audioCtx.destination);

    const graph: ElementGraph = { source, filters, bypass: false };
    graphs.set(el, graph);
    return graph;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function allMediaElements(): HTMLMediaElement[] {
    return Array.from(document.querySelectorAll<HTMLMediaElement>("audio, video"));
}

function wireElement(el: HTMLMediaElement): void {
    // AudioContext must be resumed after a user gesture; we try here and
    // also re-attempt on the first play event.
    el.addEventListener(
        "play",
        () => {
            getAudioContext()
                .resume()
                .catch(() => {});
            buildGraph(el);
        },
        { once: false }
    );

    // If the element is already playing, wire immediately.
    if (!el.paused) {
        getAudioContext()
            .resume()
            .catch(() => {});
        buildGraph(el);
    }
}

// ---------------------------------------------------------------------------
// Mutation observer — catch dynamically injected players
// ---------------------------------------------------------------------------

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node instanceof HTMLMediaElement) {
                wireElement(node);
            } else if (node instanceof Element) {
                node.querySelectorAll<HTMLMediaElement>("audio, video").forEach(wireElement);
            }
        }
    }
});

observer.observe(document.documentElement, {
    childList: true,
    subtree: true
});

// Wire everything already in the DOM.
allMediaElements().forEach(wireElement);

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

function applySetGain(bandIndex: number, gainDb: number): void {
    if (bandIndex < 0 || bandIndex >= BAND_DEFS.length) return;

    // Apply to every wired element.
    allMediaElements().forEach((el) => {
        const graph = graphs.get(el);
        if (!graph) return;
        graph.filters[bandIndex].gain.value = gainDb;
    });
}

function applyBypass(bypassed: boolean): void {
    const audioCtx = getAudioContext();

    allMediaElements().forEach((el) => {
        const graph = graphs.get(el);
        if (!graph) return;

        graph.bypass = bypassed;

        if (bypassed) {
            // Disconnect filter chain; route source → destination directly.
            try {
                graph.source.disconnect();
            } catch (error) {
                void error;
            }
            graph.filters.forEach((f) => {
                try {
                    f.disconnect();
                } catch (error) {
                    void error;
                }
            });
            graph.source.connect(audioCtx.destination);
        } else {
            // Reconnect filter chain.
            try {
                graph.source.disconnect();
            } catch (error) {
                void error;
            }
            graph.source.connect(graph.filters[0]);
            for (let i = 0; i < graph.filters.length - 1; i++) {
                try {
                    graph.filters[i].disconnect();
                } catch (error) {
                    void error;
                }
                graph.filters[i].connect(graph.filters[i + 1]);
            }
            try {
                graph.filters[graph.filters.length - 1].disconnect();
            } catch (error) {
                void error;
            }
            graph.filters[graph.filters.length - 1].connect(audioCtx.destination);
        }
    });
}

chrome.runtime.onMessage.addListener((message: MessageKind, _sender, sendResponse) => {
    switch (message.kind) {
        case "SET_GAIN":
            applySetGain(message.bandIndex, message.gainDb);
            sendResponse({ ok: true });
            break;

        case "SET_BYPASS":
            applyBypass(message.bypassed);
            sendResponse({ ok: true });
            break;

        default:
            sendResponse({ ok: false, error: "unknown message kind" });
    }
    // Return true only if sendResponse will be called asynchronously.
    return false;
});
