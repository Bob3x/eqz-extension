"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "../../lib/utils";

interface EQFaderProps {
    label: string;
    defaultValue?: number;
    onChange?: (value: number) => void;
}

export function EQFader({ label, defaultValue = 50, onChange }: EQFaderProps) {
    const [value, setValue] = useState(defaultValue);
    const [isDragging, setIsDragging] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    // CRITICAL FIX: Sync internal state when parent resets or changes the defaultValue prop
    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    const calculateValueFromY = useCallback(
        (clientY: number) => {
            if (!trackRef.current) return value;
            const rect = trackRef.current.getBoundingClientRect();
            const y = clientY - rect.top;
            // Calculate raw percentage (0 at bottom, 100 at top)
            const percentage = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100));
            // Map 0-100% smoothly onto a scale of -12 to +12 dB
            const dbValue = Math.round((percentage / 100) * 24 - 12);
            return dbValue;
        },
        [value]
    );

    // Triggers when dragging begins
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            setIsDragging(true);
            const newValue = calculateValueFromY(e.clientY);
            setValue(newValue);
            onChange?.(newValue);
            e.preventDefault();
        },
        [calculateValueFromY, onChange]
    );

    // Handle clicking directly on the track track without dragging
    const handleTrackClick = useCallback(
        (e: React.MouseEvent) => {
            const newValue = calculateValueFromY(e.clientY);
            setValue(newValue);
            onChange?.(newValue);
        },
        [calculateValueFromY, onChange]
    );

    // DOUBLE CLICK TO RESET FEATURE
    const handleDoubleClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation(); // Prevents triggering single click behavior
            setValue(0);
            onChange?.(0);
        },
        [onChange]
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging) return;
            const newValue = calculateValueFromY(e.clientY);
            setValue(newValue);
            onChange?.(newValue);
        },
        [isDragging, calculateValueFromY, onChange]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (!isDragging) return;
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Convert dB value (-12 to +12) back to a visual 0-100% for styling positions
    const visualPercentage = ((value + 12) / 24) * 100;
    const tickMarks = Array.from({ length: 11 }, (_, i) => i);

    return (
        <div className="flex flex-col items-center gap-2 select-none">
            {/* Visual dB readout directly above fader */}
            <span className="text-[9px] font-mono text-zinc-500">
                {value > 0 ? `+${value}` : value}dB
            </span>

            <div className="relative flex items-center gap-1">
                {/* Left tick marks */}
                <div className="flex flex-col justify-between h-32 py-1">
                    {tickMarks.map((_, i) => (
                        <div key={`left-${i}`} className="w-1.5 h-0.5 bg-[#333] rounded-full" />
                    ))}
                </div>

                {/* Fader track */}
                <div
                    ref={trackRef}
                    className={cn(
                        "relative w-6 h-32 rounded-lg cursor-pointer",
                        "bg-[#0a0a0a]",
                        "shadow-[inset_0_4px_8px_rgba(0,0,0,0.8),inset_0_-2px_4px_rgba(0,0,0,0.4)]"
                    )}
                    onMouseDown={handleMouseDown}
                    onClick={handleTrackClick}
                    onDoubleClick={handleDoubleClick}>
                    {/* Active track (glowing green line) */}
                    <div
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 rounded-full bg-lime-400 transition-all duration-75"
                        style={{
                            height: `${visualPercentage}%`,
                            boxShadow:
                                "0 0 8px rgba(102, 204, 51, 0.6), 0 0 16px rgba(102, 204, 51, 0.3)"
                        }}
                    />

                    {/* Fader handle */}
                    <div
                        className={cn(
                            "absolute left-1/2 -translate-x-1/2 w-7 h-6 rounded-md cursor-grab active:cursor-grabbing",
                            "bg-linear-to-b from-[#3a3a3a] to-[#252525]",
                            "shadow-[0_2px_6px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]",
                            "hover:shadow-[0_2px_10px_rgba(102,204,51,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]",
                            "hover:scale-105 transition-all duration-75",
                            "flex items-center justify-center"
                        )}
                        style={{
                            bottom: `calc(${visualPercentage}% - 12px)`
                        }}>
                        {/* Handle grip lines */}
                        <div className="flex flex-col gap-0.5">
                            <div className="w-4 h-px bg-[#555]" />
                            <div className="w-4 h-px bg-[#555]" />
                            <div className="w-4 h-px bg-[#555]" />
                        </div>
                    </div>
                </div>

                {/* Right tick marks */}
                <div className="flex flex-col justify-between h-32 py-1">
                    {tickMarks.map((_, i) => (
                        <div key={`right-${i}`} className="w-1.5 h-0.5 bg-[#333] rounded-full" />
                    ))}
                </div>
            </div>

            <p className="text-[9px] font-medium text-[#55AA22] tracking-wide">{label}</p>
        </div>
    );
}
