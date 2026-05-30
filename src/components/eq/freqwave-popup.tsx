"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";
import { RotaryKnob } from "./rotary-knob";
import { WaveformVisualizer } from "./waveform-visualizer";
import { EQFader } from "./eq-fader";

// Define our available DSP enhancer states
type VoiceMode = "off" | "dialogue" | "leveler" | "clarity";

export function FreqWavePopup() {
    const [voiceMode, setVoiceMode] = useState<VoiceMode>("off");
    const [faderValues, setFaderValues] = useState({
        "32Hz": 0,
        "64Hz": 0,
        "125Hz": 0,
        "250Hz": 0,
        "500Hz": 0,
        "1kHz": 0,
        "4kHz": 0,
        "8kHz": 0
    });

    const handleReset = () => {
        setVoiceMode("off");
        setFaderValues({
            "32Hz": 0,
            "64Hz": 0,
            "125Hz": 0,
            "250Hz": 0,
            "500Hz": 0,
            "1kHz": 0,
            "4kHz": 0,
            "8kHz": 0
        });
    };

    const handleFaderDoubleClick = (band: keyof typeof faderValues) => {
        setFaderValues((prev) => ({ ...prev, [band]: 0 }));
    };

    return (
        <div
            className="w-full h-full p-3 sm:p-4 flex items-center justify-center"
            style={{
                background: "#202020",
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`
            }}>
            {/* Main Console Layout */}
            <div
                className={cn(
                    "w-full h-full rounded-4xl p-3 sm:p-4 flex flex-col justify-between select-none",
                    "bg-linear-to-b from-[#252525] to-[#1a1a1a]",
                    "shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.03),inset_0_-4px_8px_rgba(0,0,0,0.4)]"
                )}>
                {/* 1. Header Zone */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 px-2 sm:px-3 pt-0.5">
                    <h1 className="text-base sm:text-lg tracking-tight">
                        <span className="font-extrabold text-white">Freq</span>
                        <span className="font-bold bg-linear-to-r from-lime-400 to-[#66CC33] bg-clip-text text-transparent">
                            Wave
                        </span>
                        <span className="text-white/60 font-light ml-1">EQ</span>
                    </h1>

                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d0d0d] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
                        <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse shadow-[0_0_8px_rgba(102,204,51,0.8)]" />
                        <span className="text-[9px] text-[#55AA22] font-semibold tracking-wider uppercase font-mono">
                            Engine Active
                        </span>
                    </div>
                </div>

                {/* 2. Top Control Zone - Rotary Knobs & VOICE ENHANCER MATRIX */}
                <div className="flex items-center justify-between gap-6 px-4 my-1">
                    <div className="flex items-center gap-8">
                        <RotaryKnob
                            label="MASTER VOLUME"
                            subLabel="dB GAIN"
                            size="large"
                            defaultValue={65}
                        />
                        <RotaryKnob
                            label="PRE-AMP"
                            subLabel="dB BOOST"
                            size="small"
                            defaultValue={40}
                        />
                    </div>

                    {/* Integrated 3-Option Voice Enhancer Module */}
                    <div className="flex flex-col items-end gap-2.5">
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-white tracking-widest block uppercase">
                                Voice Enhancer
                            </span>
                            <span className="text-[8px] text-zinc-500 font-mono tracking-wide">
                                DSP ALGORITHMIC PRESETS
                            </span>
                        </div>

                        <div className="flex p-1 bg-[#0d0d0d] rounded-xl border border-[#2d2d2d]/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                            {(["off", "dialogue", "leveler", "clarity"] as VoiceMode[]).map(
                                (mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setVoiceMode(mode)}
                                        className={cn(
                                            "px-3.5 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono transition-all duration-150 cursor-pointer",
                                            voiceMode === mode
                                                ? "bg-linear-to-b from-[#333] to-[#202020] text-lime-400 shadow-[0_2px_6px_rgba(0,0,0,0.4),inset_0_1px_0px_rgba(255,255,255,0.05)] border border-[#444]/60"
                                                : "text-zinc-500 hover:text-zinc-300 bg-transparent border border-transparent"
                                        )}
                                        style={
                                            voiceMode === mode
                                                ? {
                                                      textShadow: "0 0 6px rgba(163, 230, 53, 0.4)"
                                                  }
                                                : {}
                                        }>
                                        {mode}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Center Display Zone - Waveform Screen */}
                <div className="px-1">
                    <WaveformVisualizer faderValues={faderValues} />
                </div>

                {/* 4. Bottom EQ Zone - 8 Faders Layout Array */}
                <div className="px-1">
                    <div className="w-full flex justify-between items-center bg-[#0c0c0c]/50 p-4 rounded-2xl border border-[#222]/40 shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)]">
                        {Object.keys(faderValues).map((band) => (
                            <div
                                key={band}
                                onDoubleClick={() =>
                                    handleFaderDoubleClick(band as keyof typeof faderValues)
                                }
                                className="flex-1 flex justify-center">
                                <EQFader
                                    label={band}
                                    defaultValue={faderValues[band as keyof typeof faderValues]}
                                    onChange={(v) =>
                                        setFaderValues((prev) => ({ ...prev, [band]: v }))
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. Footer Interactive Control Bar */}
                <div className="flex items-center justify-between px-3 pt-1">
                    <p className="text-[8px] text-[#444] tracking-widest uppercase font-mono">
                        Audio Enhancement Suite v1.0
                    </p>

                    <button
                        onClick={handleReset}
                        className={cn(
                            "px-5 py-2 rounded-lg text-[9px] font-bold tracking-wider uppercase font-mono",
                            "bg-linear-to-b from-[#2a2a2a] to-[#1e1e1e]",
                            "text-[#55AA22] border border-[#333]/80",
                            "shadow-[0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.02)]",
                            "hover:shadow-[0_0_12px_rgba(102,204,51,0.25)]",
                            "hover:text-lime-400 hover:scale-103",
                            "active:scale-97 active:from-[#1c1c1c]",
                            "transition-all duration-100 cursor-pointer"
                        )}>
                        Zero EQ
                    </button>
                </div>
            </div>
        </div>
    );
}
