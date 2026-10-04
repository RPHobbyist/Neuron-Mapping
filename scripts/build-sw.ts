/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const TEMPLATE = path.join(ROOT, "scripts", "service-worker.template.js");

const shouldPrecache = (file: string) =>
  file === "workspace.html" ||
  file === "manifest.json" ||
  file === "logo.svg" ||
  file.startsWith("assets/") ||
  file.startsWith("icons/");

const listFiles = (dir: string, prefix = ""): string[] =>
  readdirSync(dir).flatMap((name) => {
    const relative = prefix ? `${prefix}/${name}` : name;
    const absolute = path.join(dir, name);
    return statSync(absolute).isDirectory() ? listFiles(absolute, relative) : [relative];
  });

const files = listFiles(DIST).filter(shouldPrecache).sort();
if (!files.includes("workspace.html")) {
  throw new Error("build-sw: dist/workspace.html is missing; run generate-static-pages.ts first.");
}

const template = readFileSync(TEMPLATE, "utf-8");
const hash = createHash("sha256").update(template);
files.forEach((file) => {
  hash.update(file);
  hash.update(readFileSync(path.join(DIST, file)));
});
const buildId = hash.digest("hex").slice(0, 16);

const serviceWorker = template
  .replace("'__BUILD_ID__'", () => JSON.stringify(buildId))
  .replace("__PRECACHE_URLS__", () => JSON.stringify(files.map((file) => (file === "workspace.html" ? "/workspace" : `/${file}`))));
if (serviceWorker.includes("__BUILD_ID__") || serviceWorker.includes("__PRECACHE_URLS__")) {
  throw new Error("build-sw: a placeholder in the service worker template was not filled in.");
}

writeFileSync(path.join(DIST, "sw.js"), serviceWorker, "utf-8");
const bytes = files.reduce((sum, file) => sum + statSync(path.join(DIST, file)).size, 0);
console.log(`Service worker: ${files.length} files (${(bytes / (1024 * 1024)).toFixed(1)} MB) precached, build ${buildId}.`);
