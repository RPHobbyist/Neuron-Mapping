/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import {
  TEMPLATES_PATH,
  CONTENT_LAST_UPDATED,
  INDEXABLE_TEMPLATE_IDS,
  templatePath,
  templatePreviewPath,
  absoluteUrl,
  HOME_SCREENSHOTS
} from "../src/data/seoContent";
import { templateContent } from "../src/data/templateContent";

export interface SitemapEntry {
  path: string;
  lastmod: string;
  images?: readonly string[];
}

export function getSitemapEntries(): SitemapEntry[] {
  const newestTemplateUpdate = Object.values(templateContent).map((c) => c.updated).sort().at(-1) ?? CONTENT_LAST_UPDATED;
  return [
    { path: "/", lastmod: CONTENT_LAST_UPDATED, images: Object.values(HOME_SCREENSHOTS) },
    {
      path: TEMPLATES_PATH,
      lastmod: [CONTENT_LAST_UPDATED, newestTemplateUpdate].sort()[1],
      images: [HOME_SCREENSHOTS.templates]
    },
    ...INDEXABLE_TEMPLATE_IDS.map((id) => ({
      path: templatePath(id),
      lastmod: templateContent[id].updated,
      images: [templatePreviewPath(id)]
    }))
  ];
}

export function generateSitemap(entries: SitemapEntry[]): string {
  const body = entries
    .map(({ path: p, lastmod, images = [] }) => {
      const imageTags = images
        .map((img) => `\n    <image:image>\n      <image:loc>${absoluteUrl(img)}</image:loc>\n    </image:image>`)
        .join("");
      return `  <url>
    <loc>${absoluteUrl(p)}</loc>
    <lastmod>${lastmod}</lastmod>${imageTags}
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;
}
