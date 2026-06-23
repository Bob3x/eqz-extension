// ---------------------------------------------------------------------------
// Popup → Service Worker
// ---------------------------------------------------------------------------

export interface StartCaptureMsg {
    kind: "START_CAPTURE";
}

export interface StopCaptureMsg {
    kind: "STOP_CAPTURE";
}

export interface SetBandGainMsg {
    kind: "SET_BAND_GAIN";
    bandIndex: number;
    gainDb: number;
}

export interface SetPreampGainMsg {
    kind: "SET_PREAMP_GAIN";
    gainDb: number;
}

export interface SetMasterGainMsg {
    kind: "SET_MASTER_GAIN";
    gainDb: number;
}

export interface SetBypassMsg {
    kind: "SET_BYPASS";
    bypassed: boolean;
}

export interface SetCompressorMsg {
    kind: "SET_COMPRESSOR";
    enabled: boolean;
}

export interface QueryStateMsg {
    kind: "QUERY_STATE";
}

export type PopupToSwMessage =
    | StartCaptureMsg
    | StopCaptureMsg
    | SetBandGainMsg
    | SetPreampGainMsg
    | SetMasterGainMsg
    | SetBypassMsg
    | SetCompressorMsg
    | QueryStateMsg;

// ---------------------------------------------------------------------------
// Service Worker → Offscreen Document
// ---------------------------------------------------------------------------

export interface InitCaptureMsg {
    kind: "INIT_CAPTURE";
    streamId: string;
}

export interface TeardownCaptureMsg {
    kind: "TEARDOWN_CAPTURE";
}

export type SwToOffscreenMessage =
    | InitCaptureMsg
    | TeardownCaptureMsg
    | SetBandGainMsg
    | SetPreampGainMsg
    | SetMasterGainMsg
    | SetBypassMsg
    | SetCompressorMsg;

// ---------------------------------------------------------------------------
// Offscreen Document → Service Worker
// ---------------------------------------------------------------------------

export interface OffscreenReadyMsg {
    kind: "OFFSCREEN_READY";
}

export interface EngineStoppedMsg {
    kind: "ENGINE_STOPPED";
}

export type OffscreenToSwMessage = OffscreenReadyMsg | EngineStoppedMsg;

// ---------------------------------------------------------------------------
// Service Worker → Popup
// ---------------------------------------------------------------------------

export type EngineState = "idle" | "starting" | "active";

export interface StateChangedMsg {
    kind: "STATE_CHANGED";
    state: EngineState;
    capturedTabId: number | null;
    capturedHostname: string | null;
}

export type SwToPopupMessage = StateChangedMsg;

// ---------------------------------------------------------------------------
// Union of every message that can arrive at chrome.runtime.onMessage
// ---------------------------------------------------------------------------

export type AnyMessage =
    | PopupToSwMessage
    | SwToOffscreenMessage
    | OffscreenToSwMessage
    | SwToPopupMessage;
