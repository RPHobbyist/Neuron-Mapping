/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { readFileSync } from "fs";
import path from "path";

const { version } = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf8"));

const devSitemap = (): Plugin => ({
  name: "dev-sitemap",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use("/sitemap.xml", async (_req, res, next) => {
      try {
        const { getSitemapEntries, generateSitemap } = await server.ssrLoadModule("/scripts/sitemap.ts");
        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        res.end(generateSitemap(getSitemapEntries()));
      } catch (error) {
        next(error);
      }
    });
  },
});

export default defineConfig(({ mode, isSsrBuild }) => ({
  server: {
    host: "localhost",
    port: 8080,
  },
  plugins: [react(), devSitemap()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: mode === "development",
    rollupOptions: isSsrBuild ? {} : {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          animation: ["framer-motion"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
