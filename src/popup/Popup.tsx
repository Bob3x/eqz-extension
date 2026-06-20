import { FreqWavePopup } from "../components/eq/freqwave-popup";

export default function Popup() {
    return (
        <div
            className="bg-[#202020] overflow-hidden select-none flex items-center justify-center"
            style={{ width: "640px", height: "640px" }}>
            <FreqWavePopup />
        </div>
    );
}
