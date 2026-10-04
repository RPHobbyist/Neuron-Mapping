/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */


import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { templates } from "../src/data/templates";
import {
  TEMPLATES_PATH,
  INDEXABLE_TEMPLATE_IDS,
  homeSeo,
  templatesIndexSeo,
  homeJsonLd,
  templatesIndexJsonLd,
  templatePath,
  templatePreviewPath,
  templateOgImagePath,
  absoluteUrl
} from "../src/data/seoContent";
import { getTemplateSeo, templateContent } from "../src/data/templateContent";
import { getSitemapEntries, generateSitemap } from "./sitemap";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const SSR_ENTRY = path.join(ROOT, "dist-ssr", "entry-server.js");

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003C");
}

function replaceOnce(html: string, pattern: RegExp, replacement: string, label: string): string {
  if (!pattern.test(html)) {
    throw new Error(
      `generate-static-pages: pattern for "${label}" did not match dist/index.html — ` +
      `the built markup changed shape, so this tag would silently ship unchanged. ` +
      `Update the regex in scripts/generate-static-pages.ts.`
    );
  }
  return html.replace(pattern, () => replacement);
}

interface RouteSEO {
  routePath: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  robots?: string;
  ogImage?: string;
  ogImageAlt?: string;
  jsonLd: object[];
}

type RenderFn = (url: string) => string;

function renderPage(base: string, seo: RouteSEO, bodyHtml: string): string {
  const canonical = absoluteUrl(seo.routePath);
  const ogTitle = seo.ogTitle ?? seo.title;
  const ogDescription = seo.ogDescription ?? seo.description;

  let html = base;

  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(seo.title)}</title>`, "title");

  const descriptionTag = `<meta name="description" content="${escapeAttr(seo.description)}" />`;
  html = replaceOnce(
    html,
    /<meta name="description"[\s\S]*?content="[^"]*"\s*\/>/,
    seo.robots
      ? `${descriptionTag}\n  <meta name="robots" content="${escapeAttr(seo.robots)}" />`
      : descriptionTag,
    "meta description"
  );

  html = replaceOnce(
    html,
    /\n?[ \t]*<link rel="canonical" href="[^"]*"\s*\/>/,
    seo.robots?.includes("noindex") ? "" : `\n  <link rel="canonical" href="${canonical}" />`,
    "canonical link"
  );

  html = replaceOnce(
    html,
    /<meta property="og:url" content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${canonical}" />`,
    "og:url"
  );

  html = replaceOnce(
    html,
    /<meta property="og:title" content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${escapeAttr(ogTitle)}" />`,
    "og:title"
  );

  html = replaceOnce(
    html,
    /<meta property="og:description"[\s\S]*?content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${escapeAttr(ogDescription)}" />`,
    "og:description"
  );

  html = replaceOnce(
    html,
    /<meta name="twitter:title" content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${escapeAttr(ogTitle)}" />`,
    "twitter:title"
  );

  html = replaceOnce(
    html,
    /<meta name="twitter:description"[\s\S]*?content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${escapeAttr(ogDescription)}" />`,
    "twitter:description"
  );

  if (seo.ogImage) {
    const image = absoluteUrl(seo.ogImage);
    const alt = escapeAttr(seo.ogImageAlt ?? ogTitle);
    html = replaceOnce(html, /<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${image}" />`, "og:image");
    html = replaceOnce(html, /<meta property="og:image:alt" content="[^"]*"\s*\/>/, `<meta property="og:image:alt" content="${alt}" />`, "og:image:alt");
    html = replaceOnce(html, /<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${image}" />`, "twitter:image");
    html = replaceOnce(html, /<meta name="twitter:image:alt" content="[^"]*"\s*\/>/, `<meta name="twitter:image:alt" content="${alt}" />`, "twitter:image:alt");
  }

  html = replaceOnce(
    html,
    /<script id="structured-data-script" type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script id="structured-data-script" type="application/ld+json">${safeJsonLd(seo.jsonLd)}</script>`,
    "structured-data-script"
  );

  html = replaceOnce(
    html,
    /<div id="root"><\/div>/,
    `<div id="root" data-prerendered="${escapeAttr(seo.routePath)}">${bodyHtml}</div>`,
    "root container"
  );

  return html;
}

function withFontPreload(base: string): string {
  const fontFile = readdirSync(path.join(DIST, "assets")).find((f) => /^inter-latin-wght-normal-.*\.woff2$/.test(f));
  if (!fontFile) {
    throw new Error("generate-static-pages: Inter latin woff2 not found in dist/assets — did the @fontsource-variable/inter import move?");
  }
  return replaceOnce(
    base,
    /<\/head>/,
    `  <link rel="preload" href="/assets/${fontFile}" as="font" type="font/woff2" crossorigin />\n</head>`,
    "font preload"
  );
}

function render404(base: string): string {
  let html = replaceOnce(base, /<title>[\s\S]*?<\/title>/, "<title>Page Not Found | Neuron Mapping</title>", "404 title");
  html = replaceOnce(html, /<link rel="canonical" href="[^"]*"\s*\/>\s*/, "", "404 canonical");
  return replaceOnce(
    html,
    /<meta name="description"[\s\S]*?content="[^"]*"\s*\/>/,
    `<meta name="description" content="The page you requested does not exist." />\n  <meta name="robots" content="noindex" />`,
    "404 meta description"
  );
}

function renderWorkspace(base: string): string {
  let html = replaceOnce(base, /<title>[\s\S]*?<\/title>/, "<title>Mind Map Workspace | Neuron Mapping</title>", "workspace title");
  html = replaceOnce(html, /<link rel="canonical" href="[^"]*"\s*\/>\s*/, "", "workspace canonical");
  return replaceOnce(
    html,
    /<meta name="description"[\s\S]*?content="[^"]*"\s*\/>/,
    `<meta name="description" content="The Neuron Mapping editor, where you make and edit mind maps." />\n  <meta name="robots" content="noindex, nofollow" />`,
    "workspace meta description"
  );
}

function writeRoute(base: string, render: RenderFn, seo: RouteSEO): void {
  const bodyHtml = render(seo.routePath);
  if (!bodyHtml.includes("<h1")) {
    throw new Error(`generate-static-pages: prerendered ${seo.routePath} has no <h1> — did the route fail to match?`);
  }

  const html = renderPage(base, seo, bodyHtml);
  const outPath = path.join(DIST, seo.routePath, "index.html");

  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, "utf-8");
  console.log(`  wrote ${path.relative(DIST, outPath)}${seo.robots ? ` (${seo.robots})` : ""}`);
}

function assertIndexableTemplatesConsistent(): void {
  const templateIds = new Set(templates.map((t) => t.id));
  const contentIds = Object.keys(templateContent);
  const problems = [
    ...INDEXABLE_TEMPLATE_IDS.filter((id) => !templateIds.has(id)).map((id) => `"${id}" is not a template id`),
    ...INDEXABLE_TEMPLATE_IDS.filter((id) => !contentIds.includes(id)).map((id) => `"${id}" has no templateContent entry`),
    ...contentIds.filter((id) => !(INDEXABLE_TEMPLATE_IDS as readonly string[]).includes(id)).map((id) => `templateContent "${id}" is not in INDEXABLE_TEMPLATE_IDS`),
    ...Object.entries(templateContent).flatMap(([id, c]) =>
      c.related.filter((r) => !templateIds.has(r)).map((r) => `"${id}" lists unknown related template "${r}"`)
    )
  ];
  if (problems.length > 0) {
    throw new Error(`generate-static-pages: indexable template config is inconsistent:\n  ${problems.join("\n  ")}`);
  }
}

function decodeAttr(str: string): string {
  return str.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

function readBuiltPage(routePath: string): string {
  return readFileSync(path.join(DIST, routePath, "index.html"), "utf-8");
}

function assertIndexingConsistent(sitemapPaths: string[]): void {
  const errors: string[] = [];
  const warnings: string[] = [];
  const robotsOf = (html: string) => html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? "";

  for (const routePath of sitemapPaths) {
    const html = readBuiltPage(routePath);
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
    const robots = robotsOf(html);
    if (canonical !== absoluteUrl(routePath)) {
      errors.push(`${routePath}: canonical is ${canonical ?? "missing"}, sitemap says ${absoluteUrl(routePath)}`);
    }
    if (robots.includes("noindex")) errors.push(`${routePath}: listed in sitemap.xml but has robots "${robots}"`);
    if (!html.includes("<h1")) errors.push(`${routePath}: no <h1>`);

    const title = decodeAttr(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
    const description = decodeAttr(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "");
    if (title.length > 60) warnings.push(`${routePath}: title is ${title.length} chars (over 60)`);
    if (description.length < 70 || description.length > 160) {
      warnings.push(`${routePath}: description is ${description.length} chars (want 70-160)`);
    }
  }

  const inSitemap = new Set(sitemapPaths);
  for (const template of templates) {
    const routePath = templatePath(template.id);
    if (inSitemap.has(routePath)) continue;
    const robots = robotsOf(readBuiltPage(routePath));
    if (!robots.includes("noindex")) errors.push(`${routePath}: not in sitemap.xml but indexable (robots "${robots}")`);
  }

  for (const w of warnings) console.warn(`  warning: ${w}`);
  if (errors.length > 0) {
    throw new Error(`generate-static-pages: sitemap and page indexing disagree:\n  ${errors.join("\n  ")}`);
  }
}

function assertTemplatePreviewsExist(): void {
  const missing = templates
    .flatMap((t) => [templatePreviewPath(t.id), templateOgImagePath(t.id)])
    .filter((p) => !existsSync(path.join(DIST, p)));
  if (missing.length > 0) {
    throw new Error(`generate-static-pages: missing template previews (run "npm run previews"):\n  ${missing.join("\n  ")}`);
  }
}

async function main() {
  assertIndexableTemplatesConsistent();
  assertTemplatePreviewsExist();

  if (!existsSync(SSR_ENTRY)) {
    throw new Error(`generate-static-pages: ${path.relative(ROOT, SSR_ENTRY)} not found — run "vite build --ssr src/entry-server.tsx --outDir dist-ssr" first (npm run build does).`);
  }
  const { render } = (await import(pathToFileURL(SSR_ENTRY).href)) as { render: RenderFn };

  const base = withFontPreload(readFileSync(path.join(DIST, "index.html"), "utf-8"));

  console.log("Generating prerendered SEO pages...");

  writeFileSync(path.join(DIST, "workspace.html"), renderWorkspace(base), "utf-8");
  console.log("  wrote workspace.html (client-only, noindex)");

  writeFileSync(path.join(DIST, "404.html"), render404(base), "utf-8");
  console.log("  wrote 404.html (noindex)");

  writeRoute(base, render, {
    routePath: "/",
    title: homeSeo.title,
    description: homeSeo.description,
    ogTitle: homeSeo.ogTitle,
    ogDescription: homeSeo.ogDescription,
    jsonLd: homeJsonLd
  });

  writeRoute(base, render, {
    routePath: TEMPLATES_PATH,
    title: templatesIndexSeo.title,
    description: templatesIndexSeo.description,
    ogDescription: templatesIndexSeo.ogDescription,
    jsonLd: templatesIndexJsonLd
  });

  for (const template of templates) {
    const seo = getTemplateSeo(template);
    writeRoute(base, render, {
      routePath: seo.path,
      title: seo.title,
      description: seo.description,
      robots: seo.robots,
      ogImage: seo.ogImage,
      ogImageAlt: seo.imageAlt,
      jsonLd: seo.jsonLd
    });
  }

  const sitemapEntries = getSitemapEntries();
  writeFileSync(path.join(DIST, "sitemap.xml"), generateSitemap(sitemapEntries), "utf-8");
  console.log(`  wrote sitemap.xml (${sitemapEntries.length} urls)`);

  assertIndexingConsistent(sitemapEntries.map((e) => e.path));

  console.log(`Done: ${templates.length + 2} routes prerendered, ${sitemapEntries.length} indexable.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
