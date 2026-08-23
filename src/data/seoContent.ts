/*
 * Neuron Mapping
 * Copyright (C) 2026 Rp Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */


export interface FaqEntry {
  q: string;
  a: string;
}

export const landingFaqs: FaqEntry[] = [
  {
    q: "How does Neuron Mapping keep my thoughts organized?",
    a: "Neuron Mapping provides a large, distraction-free canvas where you can build node hierarchies. You can color-code your branches, choose custom connection layouts (curved, straight, step, dashed, dotted, arrow), write extensive markdown-formatted notes, draw sketches directly on nodes, and attach icons from a library. All keyboard shortcuts are built to keep your hands on the keyboard and keep you in the flow."
  },
  {
    q: "Where is my data stored? Does it upload to the cloud?",
    a: "Your data is 100% secure and private. Neuron Mapping runs on a strict 'Local-First, Privacy-Absolute' architecture. All mind maps, templates, auto-saves, and custom settings are saved client-side on your local device (via IndexedDB). We have zero servers, zero telemetry trackers, and zero cloud uploads. Your data never leaves your computer."
  },
  {
    q: "Can I export my mind maps to other formats?",
    a: "Absolutely. You can export your maps as `.nmm` files (our native, local JSON structure) for backups or sharing. You can also export high-resolution PNG images or vector PDF files directly from the browser or desktop app to include in slides, papers, or printouts."
  },
  {
    q: "Is Neuron Mapping really a free mind mapping tool?",
    a: "Yes. Neuron Mapping is a 100% free, open-source mind mapping tool licensed under the GNU AGPLv3. There are no paywalls, no recurring monthly subscriptions, and no map size limitations. You can run it online, install the desktop app on Windows, macOS, or Linux, or host it on your own server."
  },
  {
    q: "Can I do mind mapping online with complete privacy?",
    a: "Absolutely. Neuron Mapping is designed as a local-first online mind mapping tool. All your mind maps, data, and configurations are stored securely inside your browser's IndexedDB. We have no tracking cookies, no server uploads, and no analytics - meaning your ideas remain completely private even while doing mind mapping online."
  },
  {
    q: "How does this compare to other open source mind mapping tools?",
    a: "Unlike standard open source mind mapping tools, Neuron Mapping features an interactive 3D Galaxy View that lets you visualize your node connections as WebGL-powered particle constellations. It also includes 30+ pre-built business and planning templates (SWOT, Porter's Five Forces, Market Research), offline capabilities, and a full distraction-free canvas with keyboard-first navigation."
  },
  {
    q: "What templates are included in the picker?",
    a: "Neuron Mapping includes 30+ pre-built, industry-standard templates: SWOT Analysis, Market Research, Porter's Five Forces, Purchase Requisition, Supplier Evaluation, Order Fulfilment, project planning roadmaps, brainstorming webs, and more."
  }
];

export const templateDetailFaqs: FaqEntry[] = [
  {
    q: "Can I modify this template?",
    a: "Yes! All templates are 100% editable. You can add, remove, recolor, and re-arrange any branch."
  },
  {
    q: "Is my data uploaded to a server?",
    a: "No. Neuron Mapping is local-first. Your mind map data remains strictly on your device."
  }
];


export const homeSeo = {
  title: "Free Mind Mapping Tool Online (No Signup) | Neuron Mapping",
  description:
    "Free open-source mind mapping tool. 30+ templates, 3D Galaxy View, PDF export — 100% private, no signup needed. Works offline.",
  ogTitle: "Neuron Mapping — Free Mind Mapping Tool Online (No Signup)",
  ogDescription:
    "Create unlimited mind maps with 30+ templates, 3D Galaxy View, and 100% local privacy. Free, open-source — no signup needed."
};

export const templatesIndexSeo = {
  title: "30+ Free Mind Map Templates & Diagrams | Neuron Mapping",
  description:
    "Browse 30+ free, pre-built mind map templates — SWOT Analysis, Porter's Five Forces, Customer Journey, and more. 100% private, no signup required.",
  ogDescription:
    "Explore 30+ free, open-source mind map templates for strategy, project management, HR, legal, and brainstorming. Instant editing, no account required."
};

export function templateSeoTitle(name: string): string {
  return `Free ${name} Mind Map Template | Neuron Mapping`;
}

export function templateSeoDescription(name: string, nodeCount: number): string {
  return `Create a ${name} mind map online, free. Pre-built with ${nodeCount} nodes for visual brainstorming — 100% private, no account needed.`;
}
 