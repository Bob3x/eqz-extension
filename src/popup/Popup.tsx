import { FreqWavePopup } from "../components/eq/freqwave-popup";

export default function Popup() {
    return (
        <div
            className="bg-[#202020] overflow-hidden select-none flex items-center justify-center"
            style={{ width: "min(640px, 100vw)", height: "min(560px, 100vh)" }}>
            <FreqWavePopup />
        </div>
    );
}
