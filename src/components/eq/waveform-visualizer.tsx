"use client";

import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
    // Expects the current dB levels (-12 to +12) from the parent console
    faderValues?: {
        "32Hz": number;
        "125Hz": number;
        "1kHz": number;
        "8kHz": number;
    };
}

export function WaveformVisualizer({ faderValues }: WaveformVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Maintain a mutable reference to the values so the animation loop always reads fresh data instantly
    const valuesRef = useRef(faderValues);
    useEffect(() => {
        valuesRef.current = faderValues;
    }, [faderValues]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        let offset = 0;

        const draw = () => {
            const width = canvas.width;
            const height = canvas.height;

            // Extract values or use flat defaults (0dB center)
            const current = valuesRef.current || { "32Hz": 0, "125Hz": 0, "1kHz": 0, "8kHz": 0 };

            // Normalize dB inputs (-12 to +12) into positive multipliers for the canvas waveform math
            const bass = ((current["32Hz"] + 12) / 24) * 2; // Affects left side
            const lowMid = ((current["125Hz"] + 12) / 24) * 2;
            const highMid = ((current["1kHz"] + 12) / 24) * 2;
            const treble = ((current["8kHz"] + 12) / 24) * 2; // Affects right side

            ctx.fillStyle = "#0a0a0a";
            ctx.fillRect(0, 0, width, height);

            // Draw underlying grid lines
            ctx.strokeStyle = "#121212";
            ctx.lineWidth = 1;
            for (let i = 0; i < width; i += 20) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, height);
                ctx.stroke();
            }
            for (let i = 0; i < height; i += 20) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(width, i);
                ctx.stroke();
            }

            // Zero-line (Horizontal absolute center)
            ctx.strokeStyle = "#1c1c1c";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.stroke();

            // Calculate current vector path positions
            const points: { x: number; y: number }[] = [];

            for (let x = 0; x < width; x++) {
                // Positional weights: map the canvas X position across the frequency ranges
                const leftWeight = Math.max(0, 1 - x / (width * 0.4));
                const midLeftWeight = Math.max(0, 1 - Math.abs(x - width * 0.35) / (width * 0.3));
                const midRightWeight = Math.max(0, 1 - Math.abs(x - width * 0.65) / (width * 0.3));
                const rightWeight = Math.max(0, 1 - (width - x) / (width * 0.4));

                // Synthesize composite sine waves influenced directly by the slider states
                const componentBass = Math.sin((x + offset) * 0.015) * 16 * bass * leftWeight;
                const componentLowMid = Math.sin((x - offset) * 0.03) * 12 * lowMid * midLeftWeight;
                const componentHighMid =
                    Math.sin((x + offset * 1.5) * 0.06) * 8 * highMid * midRightWeight;
                const componentTreble =
                    Math.sin((x - offset * 2) * 0.12) * 5 * treble * rightWeight;

                // Analog hardware noise emulation
                const noise = (Math.random() - 0.5) * (1.5 + treble);

                const y =
                    height / 2 +
                    componentBass +
                    componentLowMid +
                    componentHighMid +
                    componentTreble +
                    noise;
                points.push({ x, y });
            }

            // Draw the neon green spectrum stroke line
            ctx.beginPath();
            ctx.strokeStyle = "#66CC33";
            ctx.lineWidth = 2;
            ctx.shadowColor = "#66CC33";
            ctx.shadowBlur = 8;

            points.forEach((pt, idx) => {
                if (idx === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            });
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Draw ambient neon gradient fill underneath the wave baseline
            const gradient = ctx.createLinearGradient(0, height / 2, 0, height);
            gradient.addColorStop(0, "rgba(102, 204, 51, 0.12)");
            gradient.addColorStop(1, "rgba(102, 204, 51, 0)");

            ctx.beginPath();
            points.forEach((pt, idx) => {
                if (idx === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            });
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            offset += 1.5;
            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <div
            className="relative w-full h-24 rounded-xl overflow-hidden"
            style={{
                boxShadow: "inset 0 4px 12px rgba(0,0,0,0.8), inset 0 -2px 4px rgba(0,0,0,0.4)",
                background: "#0a0a0a"
            }}>
            <canvas ref={canvasRef} width={380} height={96} className="w-full h-full" />
            <div className="absolute inset-0 rounded-xl pointer-events-none border border-[#1a1a1a]" />
            <div className="absolute inset-0 rounded-xl pointer-events-none bg-linear-to-b from-white/2 to-transparent" />
        </div>
    );
}
