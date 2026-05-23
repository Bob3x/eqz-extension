import { useState } from "react";

interface BandConfig {
    id: string;
    label: string;
    bandIndex: number;
}

const EQ_BANDS: BandConfig[] = [
    { id: "100", label: "100 Hz", bandIndex: 0 },
    { id: "300", label: "300 Hz", bandIndex: 1 },
    { id: "1000", label: "1 kHz", bandIndex: 2 },
    { id: "4000", label: "4 kHz", bandIndex: 3 },
    { id: "12000", label: "12 kHz", bandIndex: 4 }
];

export default function Popup() {
    const [gains, setGains] = useState<number[]>([0, 0, 0, 0, 0]);
    const [isBypass, setIsBypass] = useState(false);

    const updateGain = async (bandIndex: number, value: number) => {
        setGains((prev) => prev.map((gain, index) => (index === bandIndex ? value : gain)));

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, {
                kind: "SET_GAIN",
                bandIndex,
                gainDb: isBypass ? 0 : value
            });
        }
    };

    const toggleBypass = async () => {
        const nextBypass = !isBypass;
        setIsBypass(nextBypass);

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id!, {
                kind: "SET_BYPASS",
                bypassed: nextBypass
            });
        }
    };

    return (
        <div className="w-95 p-4 bg-[#121620] font-sans text-[#e2e8f0]">
            <div className="p-4 bg-[rgba(30,37,54,0.6)] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-2xl backdrop-blur-md">
                <header className="flex justify-between items-center mb-6 pb-2 border-b border-[rgba(255,255,255,0.05)]">
                    <h1 className="text-xs uppercase font-bold tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#5ce1e6] shadow-[0_0_8px_#5ce1e6]" />
                        EQ Control Panel
                    </h1>
                    <button
                        onClick={toggleBypass}
                        className={`px-3 py-1 rounded text-[11px] font-semibold tracking-wide transition-all duration-200 cursor-pointer border ${
                            isBypass
                                ? "border-red-500 text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                                : "border-slate-500 text-slate-400 hover:text-slate-200"
                        }`}>
                        {isBypass ? "BYPASS ACTIVE" : "BYPASS"}
                    </button>
                </header>

                <div className="flex justify-between h-50 py-2">
                    {EQ_BANDS.map((band) => (
                        <div
                            key={band.id}
                            className="flex flex-col items-center justify-between w-13.5 h-full">
                            <div className="h-32.5 flex justify-center">
                                <input
                                    type="range"
                                    min="-12"
                                    max="12"
                                    step="0.5"
                                    value={gains[band.bandIndex]}
                                    disabled={isBypass}
                                    onChange={(e) =>
                                        updateGain(band.bandIndex, parseFloat(e.target.value))
                                    }
                                    style={{ writingMode: "vertical-lr", direction: "rtl" }}
                                    className="w-2 h-full bg-[#0f121a] rounded-sm appearance-none outline-none cursor-pointer disabled:opacity-30"
                                />
                            </div>

                            <div className="font-mono text-[10px] text-[#5ce1e6] bg-black/40 px-1.5 py-0.5 rounded border border-[#5ce1e6]/20 w-11 text-center">
                                {gains[band.bandIndex] > 0
                                    ? `+${gains[band.bandIndex].toFixed(1)}`
                                    : gains[band.bandIndex].toFixed(1)}
                            </div>

                            <div className="text-[10px] font-medium text-slate-400">
                                {band.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
