"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "../../lib/utils";

interface RotaryKnobProps {
    label: string;
    subLabel: string;
    size?: "large" | "small";
    defaultValue?: number;
    min?: number;
    max?: number;
    onChange?: (value: number) => void;
}

export function RotaryKnob({
    label,
    subLabel,
    size = "large",
    defaultValue = 50,
    min = 0,
    max = 100,
    onChange
}: RotaryKnobProps) {
    const [value, setValue] = useState(defaultValue);
    const [isDragging, setIsDragging] = useState(false);
    const knobRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const startValue = useRef(0);

    // Sync state when parent resets or updates values globally
    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    // Map the percentage value smoothly onto a 270-degree arc (-135 to +135 degrees)
    const rotation = ((value - min) / (max - min)) * 270 - 135;

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            setIsDragging(true);
            startY.current = e.clientY;
            startValue.current = value;
            e.preventDefault();
        },
        [value]
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging) return;
            // Dragging UP raises the volume dial value; dragging DOWN lowers it
            const deltaY = startY.current - e.clientY;
            const sensitivity = 0.5;
            const newValue = Math.min(
                max,
                Math.max(min, startValue.current + deltaY * sensitivity)
            );
            setValue(newValue);
            onChange?.(newValue);
        },
        [isDragging, max, min, onChange]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // DOUBLE-CLICK TO SNAP BACK TO DEFAULT VALUE
    const handleDoubleClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            // Standard initial values: Master Volume (65), Pre-Amp (40)
            const initialResetValue = label.includes("MASTER") ? 65 : 40;
            setValue(initialResetValue);
            onChange?.(initialResetValue);
        },
        [label, onChange]
    );

    // CORRECTED: Fixed the broken v0 layout state hook bug
    useEffect(() => {
        if (!isDragging) return;
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const sizeClasses = size === "large" ? "w-28 h-28" : "w-20 h-20";
    const innerSizeClasses = size === "large" ? "w-20 h-20" : "w-14 h-14";

    const tickMarks = Array.from({ length: 11 }, (_, i) => {
        const angle = (i * 27 - 135) * (Math.PI / 180);
        const outerRadius = size === "large" ? 52 : 38;
        const innerRadius = size === "large" ? 46 : 33;
        return {
            x1: Math.cos(angle) * innerRadius,
            y1: Math.sin(angle) * innerRadius,
            x2: Math.cos(angle) * outerRadius,
            y2: Math.sin(angle) * outerRadius
        };
    });

    return (
        <div className="flex flex-col items-center gap-2 select-none">
            <div className="relative flex items-center justify-center">
                {/* Tick marks */}
                <svg
                    className={cn(
                        "absolute pointer-events-none",
                        size === "large" ? "w-32 h-32" : "w-24 h-24"
                    )}
                    viewBox="-60 -60 120 120">
                    {tickMarks.map((tick, i) => {
                        // Calculate if this tick mark is "active" based on rotation angle
                        const currentTickAngle = i * 27 - 135;
                        const isActive = currentTickAngle <= rotation;
                        return (
                            <line
                                key={i}
                                x1={tick.x1}
                                y1={tick.y1}
                                x2={tick.x2}
                                y2={tick.y2}
                                stroke={isActive ? "#a3e635" : "#333"} // Dynamic glowing active ticks!
                                strokeWidth="2"
                                strokeLinecap="round"
                                className="transition-colors duration-100"
                            />
                        );
                    })}
                </svg>

                {/* Outer knob ring */}
                <div
                    ref={knobRef}
                    onMouseDown={handleMouseDown}
                    onDoubleClick={handleDoubleClick}
                    className={cn(
                        sizeClasses,
                        "rounded-full cursor-grab active:cursor-grabbing transition-all duration-150",
                        "bg-linear-to-b from-[#2a2a2a] to-[#1a1a1a]",
                        "shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),inset_0_-2px_4px_rgba(0,0,0,0.5),0_8px_16px_rgba(0,0,0,0.6)]",
                        "hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),inset_0_-2px_4px_rgba(0,0,0,0.5),0_8px_20px_rgba(102,204,51,0.2)]",
                        "hover:scale-105",
                        "flex items-center justify-center"
                    )}>
                    {/* Inner knob with rotation transform applied */}
                    <div
                        className={cn(
                            innerSizeClasses,
                            "rounded-full relative",
                            "bg-linear-to-b from-[#252525] to-[#181818]",
                            "shadow-[inset_0_4px_8px_rgba(0,0,0,0.6),0_2px_4px_rgba(255,255,255,0.02)]",
                            "transition-transform duration-75 ease-out"
                        )}
                        style={{ transform: `rotate(${rotation}deg)` }}>
                        {/* Indicator dot */}
                        <div
                            className={cn(
                                "absolute top-2 left-1/2 -translate-x-1/2",
                                size === "large" ? "w-3.5 h-3.5" : "w-2.5 h-2.5",
                                "rounded-full bg-lime-400",
                                "shadow-[0_0_8px_rgba(102,204,51,0.8),0_0_16px_rgba(102,204,51,0.4)]"
                            )}
                        />
                    </div>
                </div>
            </div>

            <div className="text-center mt-1">
                <p className="text-[10px] font-bold text-white tracking-wider uppercase">{label}</p>
                <p className="text-[8px] text-[#55AA22] tracking-wide font-mono uppercase">
                    {subLabel}
                </p>
                <p className="text-[8px] text-[#55AA22] tracking-wide font-mono">
                    {Math.round(value)}%
                </p>
            </div>
        </div>
    );
}
