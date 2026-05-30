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
        // Vite 6: raise the inline threshold so small assets stay in JS bundles
        assetsInlineLimit: 4096
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
