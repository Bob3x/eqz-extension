import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
import type { ManifestV3Export } from "@crxjs/vite-plugin";

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        ...(process.env.NODE_ENV === "production"
            ? [crx({ manifest: manifest as ManifestV3Export })]
            : [])
    ],

    build: {
        outDir: "dist",
        emptyOutDir: true,
        assetsInlineLimit: 4096,
        rollupOptions: {
            input: {
                // CRXJS handles popup + service worker; we add the offscreen doc manually.
                offscreen: "src/offscreen/offscreen.html"
            }
        }
    },

    // crxjs expects the server to run on a stable port during development so
    // the extension's hot-reload websocket can reconnect after page refreshes.
    server: {
        port: 5173,
        strictPort: true,
        hmr: {
            port: 5173
        }
    },

    // Allow Vite to resolve bare TS paths inside content / background entries.
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"]
    }
});
