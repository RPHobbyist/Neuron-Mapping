/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type Page } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const ICONS = path.join(PUBLIC, "icons");

const logo = readFileSync(path.join(PUBLIC, "logo.svg"), "utf-8");
const fullBleed = logo.replace(/(<rect\b[^>]*?)\s+rx="[\d.]+"/, "$1");
if (fullBleed === logo) {
  throw new Error('generate-icons: the logo\'s rounded background (<rect ... rx="...">) was not found.');
}

const render = async (page: Page, svg: string, size: number): Promise<Buffer> => {
  await page.setViewportSize({ width: size, height: size });
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><img src="${src}" width="${size}" height="${size}" style="display:block"></body></html>`
  );
  await page.locator("img").evaluate((img: HTMLImageElement) => img.decode());
  return page.screenshot({ omitBackground: true, type: "png" });
};

const toIco = (images: { size: number; png: Buffer }[]): Buffer => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length + 16 * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map((image) => image.png)]);
};

async function main() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    mkdirSync(ICONS, { recursive: true });
    writeFileSync(path.join(ICONS, "icon-192.png"), await render(page, logo, 192));
    writeFileSync(path.join(ICONS, "icon-512.png"), await render(page, logo, 512));
    writeFileSync(path.join(ICONS, "icon-maskable-512.png"), await render(page, fullBleed, 512));
    writeFileSync(path.join(ICONS, "apple-touch-icon.png"), await render(page, fullBleed, 180));
    const favicon = [];
    for (const size of [16, 32, 48]) favicon.push({ size, png: await render(page, logo, size) });
    writeFileSync(path.join(PUBLIC, "favicon.ico"), toIco(favicon));
    console.log("Wrote public/icons/*.png and public/favicon.ico");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
