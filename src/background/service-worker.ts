/**
 * service-worker.ts — Equalizer background service worker
 *
 * Responsibilities:
 *  • Install / update lifecycle hooks.
 *  • Relay any messages that the popup cannot send directly (none currently,
 *    but the relay pattern is wired so it can be extended without refactoring).
 *  • Keep the extension icon in a known visual state.
 *
 * Intentionally minimal — all audio logic lives in content.ts.
 * MV3 service workers must NOT use tabCapture or any MV2-only APIs.
 */

/// <reference types="chrome"/>

// ---------------------------------------------------------------------------
// Install / update
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
        console.log("[EQ SW] Extension installed.");
    } else if (reason === chrome.runtime.OnInstalledReason.UPDATE) {
        console.log("[EQ SW] Extension updated.");
    }
});

// ---------------------------------------------------------------------------
// Optional relay: forward popup → content-script messages
// (The popup uses chrome.tabs.sendMessage directly, so this path is only
//  needed if a future feature requires the SW as an intermediary.)
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    // Guard: only handle relay requests; content-script messages are handled
    // inside content.ts itself.
    if (
        typeof message === "object" &&
        message !== null &&
        (message as Record<string, unknown>)["__relay"] === true
    ) {
        const { tabId, payload } = message as {
            tabId: number;
            payload: unknown;
        };
        chrome.tabs.sendMessage(tabId, payload, (response) => {
            sendResponse(response);
        });
        // Keep the message channel open for async sendResponse.
        return true;
    }

    // Not a relay — ignore, let other listeners handle it.
    return false;
});
