/*
 * Neuron Mapping
 * Copyright (C) 2026 Rp Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { templates } from "../src/data/templates";
import {
  landingFaqs,
  templateDetailFaqs,
  homeSeo,
  templatesIndexSeo,
  templateSeoTitle,
  templateSeoDescription
} from "../src/data/seoContent";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const BASE_URL = "https://neuron-mapping.rphobbyist.com";

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
  return html.replace(pattern, replacement);
}

interface RouteSEO {
  routePath: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  jsonLd: object[];
}

function renderPage(base: string, seo: RouteSEO): string {
  const canonical = `${BASE_URL}${seo.routePath}`;
  const ogTitle = seo.ogTitle ?? seo.title;
  const ogDescription = seo.ogDescription ?? seo.description;

  let html = base;

  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(seo.title)}</title>`, "title");

  html = replaceOnce(
    html,
    /<meta name="description"[\s\S]*?content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escapeAttr(seo.description)}" />`,
    "meta description"
  );

  html = replaceOnce(
    html,
    /<link rel="canonical" href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${canonical}" />`,
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

  html = replaceOnce(
    html,
    /<script id="structured-data-script" type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script id="structured-data-script" type="application/ld+json">${safeJsonLd(seo.jsonLd)}</script>`,
    "structured-data-script"
  );

  return html;
}

function writeRoute(base: string, seo: RouteSEO): void {
  const html = renderPage(base, seo);
  const outPath =
    seo.routePath === "/"
      ? path.join(DIST, "index.html")
      : path.join(DIST, seo.routePath.replace(/^\//, ""), "index.html");

  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, "utf-8");
  console.log(`  wrote ${path.relative(DIST, outPath)}`);
}

function breadcrumb(items: Array<{ name: string; item: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: entry.name,
      item: entry.item
    }))
  };
}

function faqPage(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a }
    }))
  };
}

function generateSitemap(): string {
  const today = new Date().toISOString().slice(0, 10);
  const urls: Array<{ loc: string; changefreq: string; priority: string }> = [
    { loc: `${BASE_URL}/`, changefreq: "weekly", priority: "1.0" },
    { loc: `${BASE_URL}/templates`, changefreq: "weekly", priority: "0.9" },
    ...templates.map((t) => ({
      loc: `${BASE_URL}/templates/${t.id}`,
      changefreq: "monthly",
      priority: "0.8"
    }))
  ];

  const body = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function main() {
  const base = readFileSync(path.join(DIST, "index.html"), "utf-8");

  console.log("Generating prerendered SEO pages...");

  writeRoute(base, {
    routePath: "/",
    title: homeSeo.title,
    description: homeSeo.description,
    ogTitle: homeSeo.ogTitle,
    ogDescription: homeSeo.ogDescription,
    jsonLd: [
      faqPage(landingFaqs),
      breadcrumb([
        { name: "RP Hobbyist", item: "https://rphobbyist.com" },
        { name: "Neuron Mapping", item: `${BASE_URL}/` }
      ])
    ]
  });

  writeRoute(base, {
    routePath: "/templates",
    title: templatesIndexSeo.title,
    description: templatesIndexSeo.description,
    ogDescription: templatesIndexSeo.ogDescription,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Neuron Mapping Template Gallery",
        description: "Free, pre-built mind mapping templates for visual brainstorming and business strategy.",
        url: `${BASE_URL}/templates`,
        isPartOf: { "@type": "WebSite", name: "Neuron Mapping", url: `${BASE_URL}/` }
      },
      breadcrumb([
        { name: "Home", item: `${BASE_URL}/` },
        { name: "Templates", item: `${BASE_URL}/templates` }
      ])
    ]
  });

  for (const template of templates) {
    const title = templateSeoTitle(template.name);
    const description = templateSeoDescription(template.name, template.nodes.length);

    writeRoute(base, {
      routePath: `/templates/${template.id}`,
      title,
      description,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: `How to Create a ${template.name} Mind Map`,
          description: template.description,
          step: [
            {
              "@type": "HowToStep",
              position: 1,
              name: "Open Template",
              text: `Click 'Launch Template in Editor' to pre-load the ${template.name} framework.`
            },
            {
              "@type": "HowToStep",
              position: 2,
              name: "Customize Nodes",
              text: "Add your ideas, customize branch colors, edit markdown notes, and format connectors."
            },
            {
              "@type": "HowToStep",
              position: 3,
              name: "Export & Save",
              text: "Export your completed mind map as a PDF, high-resolution PNG image, or local .nmm backup file."
            }
          ]
        },
        breadcrumb([
          { name: "Home", item: `${BASE_URL}/` },
          { name: "Templates", item: `${BASE_URL}/templates` },
          { name: template.name, item: `${BASE_URL}/templates/${template.id}` }
        ]),
        faqPage(templateDetailFaqs)
      ]
    });
  }

  const sitemapPath = path.join(DIST, "sitemap.xml");
  writeFileSync(sitemapPath, generateSitemap(), "utf-8");
  console.log(`  wrote sitemap.xml (${templates.length + 2} urls)`);

  console.log(`Done: ${templates.length + 2} routes prerendered.`);
}

main();
 