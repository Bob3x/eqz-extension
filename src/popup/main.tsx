import React from "react";
import ReactDOM from "react-dom/client";
import Popup from "./Popup";
import "../index.css"; // Direct entry point for Tailwind CSS v4

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>
);
