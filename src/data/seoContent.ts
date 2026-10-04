/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { templates } from "./templates";

export const SITE_URL = "https://neuron-mapping.rphobbyist.com";

export const TEMPLATE_COUNT_LABEL = `${Math.floor(templates.length / 10) * 10}+`;

export const TEMPLATES_PATH = "/templates/";

export function templatePath(id: string): string {
  return `/templates/${id}/`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export const OG_IMAGE_PATH = "/og-image.png";

const SEARCH_NAMES: Record<string, string> = {
  "blank-mindmap": "Blank Mind Map",
  "cause-effect": "Fishbone Diagram",
  "eisenhower-box": "Eisenhower Matrix",
  "five-whys": "5 Whys Root Cause Analysis",
  "simple-flowchart": "Flowchart",
  "simple-timeline": "Timeline",
  "okr-planning": "OKR",
  "customer-journey": "Customer Journey Map",
  "cycle-diagram": "PDCA Cycle Diagram",
  "layer-stacking": "Technology Stack Diagram",
  "product-launch-radial": "Product Launch Plan"
};

export function templateSearchName(template: { id: string; name: string }): string {
  return SEARCH_NAMES[template.id] ?? template.name;
}

function imageSlug(id: string): string {
  const name = SEARCH_NAMES[id];
  const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : id;
  return `${slug}-template`;
}

export function templatePreviewPath(id: string): string {
  return `/template-previews/${imageSlug(id)}.webp`;
}

export function templateOgImagePath(id: string): string {
  return `/template-previews/${imageSlug(id)}-share.png`;
}

export const HOME_SCREENSHOTS = {
  editor: "/screenshots/mind-map-editor.webp",
  statusAndBoxAreas: "/screenshots/node-status-and-box-areas.webp",
  propertiesPanel: "/screenshots/node-properties-panel.webp",
  templates: "/screenshots/mind-map-templates.webp",
  import: "/screenshots/import-markdown-csv-opml.webp",
  galaxyView: "/screenshots/3d-galaxy-view.webp"
} as const;

export const CONTENT_LAST_UPDATED = "2026-10-04";

export const INDEXABLE_TEMPLATE_IDS = [
  "swot-analysis",
  "business-model-canvas",
  "eisenhower-box",
  "cause-effect",
  "five-whys",
  "decision-tree",
  "okr-planning",
  "customer-journey",
  "empathy-map",
  "porters-five-forces",
  "org-chart",
  "sprint-retrospective",
  "compliance-checklist",
  "kanban-board",
  "blank-mindmap",
  "simple-flowchart",
  "simple-timeline",
  "venn-diagram",
  "six-thinking-hats",
  "employee-onboarding",
  "product-launch-checklist",
  "project-management",
  "market-research",
  "argument-map",
  "cycle-diagram",
  "supplier-evaluation",
  "product-development",
  "legal-case",
  "business-analyst",
  "order-fulfillment",
  "purchase-requisition",
  "layer-stacking"
] as const;

export type IndexableTemplateId = (typeof INDEXABLE_TEMPLATE_IDS)[number];

export function isIndexableTemplate(id: string): id is IndexableTemplateId {
  return (INDEXABLE_TEMPLATE_IDS as readonly string[]).includes(id);
}

export interface FaqEntry {
  q: string;
  a: string;
}

export const landingFaqs: FaqEntry[] = [
  {
    q: "How do I make a mind map online for free?",
    a: "Open the Neuron Mapping editor in your browser, type your main idea into the center node and press Tab to add branches. You can start from one of the 30+ free templates, import notes from a Markdown, CSV or OPML file, or begin with a blank canvas. When you're done, export the map as a PDF or PNG, or save it as a .nmm file to keep editing later. You don't need an account and it doesn't cost anything."
  },
  {
    q: "Is Neuron Mapping really free?",
    a: "Yes. It's open source under the GNU AGPLv3, with no paid plan, no subscription and no limit on how big your maps get. You can use it in the browser, install the desktop app on Windows, macOS or Linux, or host it on your own server."
  },
  {
    q: "Do I need to create an account?",
    a: "No. There's no signup, email or login. Open the editor and start mapping."
  },
  {
    q: "Where are my maps saved? Do they get uploaded?",
    a: "Your maps are saved in your browser's storage (IndexedDB) on your own device. That includes templates you save, auto-saves and settings. Nothing is uploaded and there's no cloud sync, so your maps don't leave your computer unless you export them yourself."
  },
  {
    q: "What's new in version 1.7?",
    a: "Text formatting inside nodes, box areas that group nodes and move them together, node status tags you can filter in search, a color picker that remembers your colors, arrowheads at either end of a line, a way to get back unsaved work after closing the tab, and separate snapshot history for each map."
  },
  {
    q: "How do I keep a big mind map organized?",
    a: "Color-code your branches, group related nodes in named box areas, and tag tasks with a status like In Progress or Done. Search can filter by color, priority and status, and Focus Mode hides everything except the branch you're working on. Auto layout can also tidy the whole map into a horizontal, vertical or radial shape."
  },
  {
    q: "Can I import notes or maps from other apps?",
    a: "Yes. Neuron Mapping opens XMind and FreeMind/Freeplane maps, plus Markdown outlines, CSV, OPML, JSON, XML and plain text files, and turns them into mind maps. Most other outliners and mind map apps can export OPML, so that's usually the easiest way to bring existing work over."
  },
  {
    q: "What can I export my mind maps to?",
    a: "PNG and SVG images and PDF files for slides, papers and printouts, Markdown, OPML, text and CSV outlines, and .nmm files, the app's own format, which you can open again later to keep editing."
  },
  {
    q: "How is it different from other open source mind mapping tools?",
    a: "It runs in the browser with nothing to install, comes with 30+ ready-made templates, and has a few things you won't find in most tools, like the 3D Galaxy View, Play Mode for presenting a map step by step, and freehand drawing on the canvas."
  },
  {
    q: "What templates are included?",
    a: "More than 30, including SWOT Analysis, Business Model Canvas, Porter's Five Forces, Market Research, Kanban Board, OKR Planning, Decision Tree, Customer Journey Map, Supplier Evaluation, Order Fulfillment Process and a blank canvas."
  }
];

export const templateDetailFaqs: FaqEntry[] = [
  {
    q: "Can I change this template?",
    a: "Yes. Every branch can be renamed, recolored, moved or deleted, and you can add as many new ones as you need."
  },
  {
    q: "Is my map uploaded anywhere?",
    a: "No. The map is saved in your browser on your own device and only leaves it if you export it."
  }
];


export const homeSeo = {
  title: "Free Mind Mapping Tool Online (No Signup) | Neuron Mapping",
  description:
    "Free mind map maker that runs in your browser. 30+ templates, rich text, Markdown and OPML import, PDF export. No signup, and your maps stay on your device.",
  ogTitle: "Neuron Mapping: Free Mind Mapping Tool Online (No Signup)",
  ogDescription:
    "Make as many mind maps as you like, with 30+ templates, text formatting and box areas. Free and open source, with no signup."
};

export const templatesIndexSeo = {
  title: `${TEMPLATE_COUNT_LABEL} Free Mind Map Templates & Diagrams | Neuron Mapping`,
  description:
    "Browse 30+ free mind map templates, including SWOT Analysis, Porter's Five Forces and Customer Journey. Open one in the editor and start changing it. No signup.",
  ogDescription:
    "Free mind map templates for strategy, project management, HR, legal work and brainstorming. Open one and start editing, no account needed."
};

export function templateSeoTitle(name: string): string {
  return `Free ${name} Mind Map Template | Neuron Mapping`;
}

export function templateSeoDescription(name: string, nodeCount: number): string {
  return `Create a ${name} mind map online, free. Comes with ${nodeCount} nodes already filled in. Private, and no account needed.`;
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: entry.name,
      item: entry.path.startsWith("http") ? entry.path : absoluteUrl(entry.path)
    }))
  };
}

export function faqPageJsonLd(faqs: FaqEntry[]) {
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

const SCREENSHOT_CAPTIONS: Record<keyof typeof HOME_SCREENSHOTS, string> = {
  editor: "Mind map editor with a product launch plan",
  statusAndBoxAreas: "Nodes with status tags grouped in a box area",
  propertiesPanel: "Node properties panel with formatting, color, shape, priority and status",
  templates: "Template picker with free mind map templates",
  import: "Import from Markdown, CSV, OPML, JSON, XML and text files",
  galaxyView: "3D Galaxy View of a mind map"
};

export const siteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Neuron Mapping",
    url: absoluteUrl("/"),
    description:
      "A free, open-source mind map maker for brainstorming, studying and project planning. Includes 30+ templates, rich text inside nodes, box areas, node status tags, Markdown/CSV/OPML import, a 3D Galaxy View, PDF and PNG export, and local-only storage with no signup.",
    featureList: [
      "30+ free mind map templates",
      "Rich text formatting inside nodes",
      "Named box areas to group nodes",
      "Node status tags and search filters",
      "Import from XMind, FreeMind, Markdown, CSV, OPML, JSON, XML and text",
      "Export to PDF, PNG, SVG, Markdown, OPML and .nmm",
      "Horizontal, vertical and radial auto layout",
      "3D Galaxy View",
      "Presentation play mode",
      "Freehand drawing",
      "Version snapshots",
      "Keyboard shortcuts",
      "No signup, data stored on your device"
    ],
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser with JavaScript enabled",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Organization", name: "RP Hobbyist", url: "https://rphobbyist.com" },
    license: "https://www.gnu.org/licenses/agpl-3.0.html",
    image: absoluteUrl(HOME_SCREENSHOTS.editor),
    screenshot: (Object.keys(HOME_SCREENSHOTS) as Array<keyof typeof HOME_SCREENSHOTS>).map((key) => ({
      "@type": "ImageObject",
      url: absoluteUrl(HOME_SCREENSHOTS[key]),
      caption: SCREENSHOT_CAPTIONS[key]
    }))
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RP Hobbyist",
    url: "https://rphobbyist.com",
    logo: absoluteUrl("/logo.svg"),
    sameAs: ["https://github.com/RPHobbyist"]
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Neuron Mapping",
    alternateName: ["Neuron Mapping by RP Hobbyist", "NeuronMapping"],
    url: absoluteUrl("/")
  }
];

export const homeJsonLd = [...siteJsonLd, faqPageJsonLd(landingFaqs)];

export const templatesIndexJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Free Mind Map Templates",
    description: "Free, pre-built mind mapping templates for visual brainstorming and business strategy.",
    url: absoluteUrl(TEMPLATES_PATH),
    isPartOf: { "@type": "WebSite", name: "Neuron Mapping", url: absoluteUrl("/") }
  },
  breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Templates", path: TEMPLATES_PATH }
  ])
];
