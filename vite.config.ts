import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const remoteSupabase = env.VITE_SUPABASE_URL?.replace(/\/$/, "");

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      ...(remoteSupabase
        ? {
            proxy: {
              "/functions/v1": { target: remoteSupabase, changeOrigin: true, secure: true },
              "/rest/v1": { target: remoteSupabase, changeOrigin: true, secure: true },
              "/auth/v1": { target: remoteSupabase, changeOrigin: true, secure: true },
              "/storage/v1": { target: remoteSupabase, changeOrigin: true, secure: true },
            },
          }
        : {}),
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
