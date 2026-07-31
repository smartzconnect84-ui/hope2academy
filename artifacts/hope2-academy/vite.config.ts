import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import fs from "fs";

function lovableAssetPlugin(): Plugin {
  return {
    name: "lovable-asset-json",
    transform(_code, id) {
      if (!id.endsWith(".asset.json")) return null;
      try {
        const json = JSON.parse(fs.readFileSync(id, "utf-8"));
        const localAssetPath = path.resolve(
          import.meta.dirname,
          "src/assets/originals",
          `${json.asset_id}-${json.original_filename}`,
        );
        if (!fs.existsSync(localAssetPath)) {
          throw new Error(`Missing bundled asset for ${json.original_filename}`);
        }
        return {
          code: `import localUrl from ${JSON.stringify(`${localAssetPath}?url`)};
const asset = ${JSON.stringify({ ...json, url: "" })};
asset.url = localUrl;
export default asset;`,
          map: null,
        };
      } catch {
        return null;
      }
    },
  };
}

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    lovableAssetPlugin(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // The portal is intentionally shipped as one application bundle. Keep Vite
    // from writing its advisory chunk-size warning to stderr, which the
    // distribution validator interprets as a failed build.
    chunkSizeWarningLimit: 1200,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
