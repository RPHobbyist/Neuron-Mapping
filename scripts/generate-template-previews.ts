/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { templates, categories } from "../src/data/templates";
import { templatePreviewPath, templateOgImagePath } from "../src/data/seoContent";
import { colorThemes } from "../src/components/templates/previewColorThemes";
import type { Template } from "../src/types/templates";
import type { MindMapNode } from "../src/types/mindmap";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "template-previews");

const FONT = "Segoe UI, Arial, sans-serif";

const NODE_FONT = 14;
const NODE_PAD_X = 16;
const NODE_H = 44;
const CHAR_W = 7.2;
const ROOT_D = 128;
const ROOT_FONT = 16;
const ROOT_CHARS_PER_LINE = 11;
const MARGIN = 40;
const MIN_GAP = 10;

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface Box { node: MindMapNode; w: number; h: number; isRoot: boolean; circle: boolean }

function measure(node: MindMapNode, k: number): Box {
  const isRoot = !node.parentId;
  const circle = (node.shape ?? (isRoot ? "circle" : "rounded")) === "circle";
  if (circle && isRoot) return { node, w: ROOT_D * k, h: ROOT_D * k, isRoot, circle };
  if (!node.text.trim()) return { node, w: 16 * k, h: 16 * k, isRoot, circle: true };
  const w = Math.max(circle ? 60 : 72, node.text.length * CHAR_W + NODE_PAD_X * 2) * k;
  return { node, w: circle ? Math.max(w, NODE_H * k) : w, h: circle ? Math.max(w, NODE_H * k) : NODE_H * k, isRoot, circle };
}

function overlaps(boxes: Box[]): boolean {
  return boxes.some((a, i) =>
    boxes.slice(i + 1).some((b) =>
      Math.abs(a.node.x - b.node.x) < (a.w + b.w) / 2 + MIN_GAP &&
      Math.abs(a.node.y - b.node.y) < (a.h + b.h) / 2 + MIN_GAP
    )
  );
}

function nodeScale(nodes: MindMapNode[]): number {
  for (let k = 2; k > 0.5; k -= 0.05) {
    if (!overlaps(nodes.map((n) => measure(n, k)))) return k;
  }
  return 0.5;
}

function mapSvg(template: Template, x: number, y: number, width: number, height: number): string {
  const k = nodeScale(template.nodes);
  const boxes = template.nodes.map((n) => measure(n, k));
  const byId = new Map(boxes.map((b) => [b.node.id, b]));
  const minX = Math.min(...boxes.map((b) => b.node.x - b.w / 2)) - MARGIN;
  const maxX = Math.max(...boxes.map((b) => b.node.x + b.w / 2)) + MARGIN;
  const minY = Math.min(...boxes.map((b) => b.node.y - b.h / 2)) - MARGIN;
  const maxY = Math.max(...boxes.map((b) => b.node.y + b.h / 2)) + MARGIN;

  const lines = boxes
    .filter((b) => b.node.parentId && byId.has(b.node.parentId))
    .map((b) => {
      const p = byId.get(b.node.parentId!)!.node;
      const { x: x2, y: y2 } = b.node;
      const dx = x2 - p.x;
      const dy = y2 - p.y;
      const theme = colorThemes[b.node.color] ?? colorThemes.grey;
      const d = Math.abs(dy) > Math.abs(dx) * 1.5
        ? `M ${p.x} ${p.y} C ${p.x} ${p.y + dy / 2}, ${x2} ${y2 - dy / 2}, ${x2} ${y2}`
        : `M ${p.x} ${p.y} C ${p.x + dx / 2} ${p.y}, ${x2 - dx / 2} ${y2}, ${x2} ${y2}`;
      return `<path d="${d}" fill="none" stroke="${theme.border}" stroke-width="${3 * k}" stroke-opacity="0.45" stroke-linecap="round"/>`;
    });

  const nodes = boxes.map(({ node, w, h, isRoot, circle }) => {
    const key = isRoot ? "root" : colorThemes[node.color] ? node.color : "grey";
    const theme = colorThemes[key];
    const fill = isRoot ? theme.from : `url(#grad-${key})`;
    const stroke = isRoot ? "none" : theme.border;
    const shape = circle
      ? `<circle cx="${node.x}" cy="${node.y}" r="${w / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${1.5 * k}"/>`
      : `<rect x="${node.x - w / 2}" y="${node.y - h / 2}" width="${w}" height="${h}" rx="${12 * k}" fill="${fill}" stroke="${stroke}" stroke-width="${1.5 * k}"/>`;
    const textLines = isRoot && circle ? wrap(node.text, ROOT_CHARS_PER_LINE) : [node.text];
    const fontSize = (isRoot && circle ? ROOT_FONT : NODE_FONT) * k;
    const lineH = fontSize * 1.25;
    const firstY = node.y - ((textLines.length - 1) * lineH) / 2 + fontSize * 0.35;
    const tspans = textLines
      .map((t, i) => `<tspan x="${node.x}" y="${firstY + i * lineH}">${escapeXml(t)}</tspan>`)
      .join("");
    const label = `<text text-anchor="middle" font-family="${FONT}" font-size="${fontSize}" font-weight="${isRoot ? 700 : 500}" fill="${theme.text}">${tspans}</text>`;
    return `<g filter="url(#shadow)">${shape}${label}</g>`;
  });

  const gradients = Object.entries(colorThemes)
    .map(([key, t]) => `<linearGradient id="grad-${key}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.from}"/><stop offset="1" stop-color="${t.to}"/></linearGradient>`)
    .join("");

  return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}" preserveAspectRatio="xMidYMid meet">
    <defs>${gradients}<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.08"/></filter></defs>
    ${lines.join("\n    ")}
    ${nodes.join("\n    ")}
  </svg>`;
}

function wrap(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && (line + " " + word).length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function mapPreview(template: Template): string {
  const w = 960;
  const h = 720;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#f8fafc"/>
  ${mapSvg(template, 0, 0, w, h)}
</svg>`;
}

function socialCard(template: Template, logoDataUri: string): string {
  const w = 1200;
  const h = 630;
  const category = categories.find((c) => c.id === template.category)?.name ?? template.category;
  const titleLines = wrap(`${template.name} Template`, 16).slice(0, 4);
  const titleSize = 52;
  const titleTop = 230;
  const title = titleLines
    .map((line, i) => `<text x="64" y="${titleTop + i * (titleSize + 10)}" font-family="${FONT}" font-size="${titleSize}" font-weight="700" fill="#0f172a">${escapeXml(line)}</text>`)
    .join("\n  ");
  const afterTitle = titleTop + (titleLines.length - 1) * (titleSize + 10);

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#f8fafc"/>
  <image x="64" y="64" width="44" height="44" href="${logoDataUri}"/>
  <text x="122" y="96" font-family="${FONT}" font-size="26" font-weight="700" fill="#0f172a">Neuron Mapping</text>
  <text x="64" y="160" font-family="${FONT}" font-size="22" font-weight="600" fill="#4f46e5">${escapeXml(category)}</text>
  ${title}
  <text x="64" y="${afterTitle + 64}" font-family="${FONT}" font-size="24" fill="#475569">Free mind map, ${template.nodes.length} nodes ready to edit</text>
  <rect x="520" y="48" width="632" height="534" rx="24" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
  ${mapSvg(template, 536, 64, 600, 502)}
</svg>`;
}

function rasterize(svg: string): Buffer {
  return new Resvg(svg, {
    font: { loadSystemFonts: true, defaultFontFamily: "Segoe UI", sansSerifFamily: "Segoe UI" }
  }).render().asPng();
}

async function writeImage(svg: string, sitePath: string): Promise<number> {
  const png = rasterize(svg);
  const data = sitePath.endsWith(".webp") ? await sharp(png).webp({ quality: 85, effort: 6 }).toBuffer() : png;
  writeFileSync(path.join(ROOT, "public", sitePath), data);
  return data.length;
}

async function main() {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });
  const logo = readFileSync(path.join(ROOT, "public", "logo.svg"));
  const logoDataUri = `data:image/svg+xml;base64,${logo.toString("base64")}`;

  const paths = templates.flatMap((t) => [templatePreviewPath(t.id), templateOgImagePath(t.id)]);
  const duplicates = paths.filter((p, i) => paths.indexOf(p) !== i);
  if (duplicates.length > 0) {
    throw new Error(`generate-template-previews: two templates map to the same image file:\n  ${duplicates.join("\n  ")}`);
  }

  for (const template of templates) {
    const previewBytes = await writeImage(mapPreview(template), templatePreviewPath(template.id));
    const shareBytes = await writeImage(socialCard(template, logoDataUri), templateOgImagePath(template.id));
    console.log(`  ${template.id}: ${Math.round(previewBytes / 1024)} KB preview, ${Math.round(shareBytes / 1024)} KB share card`);
  }
  console.log(`Done: ${templates.length} templates.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
