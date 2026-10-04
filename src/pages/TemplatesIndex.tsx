/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Github } from "lucide-react";
import { templates, categories } from "@/data/templates";
import { DynamicTemplatePreview } from "@/components/templates/DynamicTemplatePreview";
import { useDocumentSEO } from "@/hooks/useDocumentSEO";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SYSTEM_CONFIG } from "@/lib/core/core-system";
import {
  templatesIndexSeo,
  templatesIndexJsonLd,
  templatePath,
  OG_IMAGE_PATH,
  TEMPLATES_PATH,
  HOME_SCREENSHOTS
} from "@/data/seoContent";

const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

const CATEGORY_INTROS: Record<string, string> = {
  all: "Every template opens in the free editor with its branches already filled in, so you start with a structure instead of a blank page.",
  "quick-diagrams": "Simple starting points for everyday diagrams: a blank mind map, a flowchart and a timeline.",
  business: "Strategy and operations frameworks such as SWOT analysis, Porter's Five Forces and the Business Model Canvas.",
  "project-management": "Plan launches, run sprint retrospectives and track work with kanban boards and project roadmaps.",
  hr: "Org charts and onboarding plans for growing teams.",
  legal: "Structure case preparation and compliance reviews.",
  planning: "Prioritization, goal setting and problem solving: the Eisenhower matrix, OKRs, 5 Whys, fishbone diagrams and decision trees.",
  communication: "Frameworks for discussions and user research: Six Thinking Hats, argument maps and empathy maps."
};

const steps = [
  {
    title: "Pick a template",
    description: "Use the search box or the categories to find one that fits what you're working on."
  },
  {
    title: "Make it yours",
    description: "Rename the branches, add your own ideas with Tab, and delete anything you don't need."
  },
  {
    title: "Save or export",
    description: "Download a PDF or PNG to share, or save a .nmm file so you can keep editing later."
  }
];

export default function TemplatesIndex() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useDocumentSEO({
    title: templatesIndexSeo.title,
    description: templatesIndexSeo.description,
    canonical: TEMPLATES_PATH,
    ogTitle: templatesIndexSeo.title,
    ogDescription: templatesIndexSeo.ogDescription,
    ogImage: OG_IMAGE_PATH,
    jsonLd: templatesIndexJsonLd
  });

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        template.name.toLowerCase().includes(q) ||
        template.description.toLowerCase().includes(q) ||
        template.category.toLowerCase().includes(q) ||
        (template.tags?.some(tag => tag.toLowerCase().includes(q)) ?? false);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const categoryButtonClass = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
      active
        ? "bg-indigo-600 text-white"
        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
    }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={SYSTEM_CONFIG.brandLogo} alt={`${SYSTEM_CONFIG.appName} Logo`} width={28} height={28} className="h-7 w-auto object-contain" />
            <span className="font-bold tracking-tight text-slate-900 text-sm sm:text-base">
              {SYSTEM_CONFIG.appName}
            </span>
          </Link>

          <nav aria-label="Main navigation" className="flex items-center gap-5 sm:gap-7 text-sm font-semibold text-slate-600">
            <Link to="/" className="hidden sm:inline hover:text-slate-900 transition-colors">Home</Link>
            <Link to={TEMPLATES_PATH} className="text-indigo-600">Templates</Link>
            <a
              href={SYSTEM_CONFIG.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="hidden sm:inline-flex text-slate-500 hover:text-slate-900 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold px-4 h-9 text-xs sm:text-sm border-none cursor-pointer">
              <Link to="/workspace">Open the app</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="py-12 md:py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 max-w-3xl">
            Free mind map templates
          </h1>
          <p className="mt-4 text-base text-slate-600 max-w-2xl leading-relaxed">
            {templates.length} templates for business strategy, project planning, HR, legal work and brainstorming. Each one opens in the editor with every branch filled in, ready for you to change. No signup needed.
          </p>

          <div className="mt-8 max-w-xl relative">
            <Search aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              aria-label="Search templates"
              placeholder="Search templates, for example SWOT or Kanban"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-4">
          <button onClick={() => setSelectedCategory("all")} className={categoryButtonClass(selectedCategory === "all")}>
            All templates ({templates.length})
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={categoryButtonClass(selectedCategory === cat.id)}>
              {cat.name}
            </button>
          ))}
        </div>

        <p className="mb-8 text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          {CATEGORY_INTROS[selectedCategory] ?? CATEGORY_INTROS.all}
        </p>

        {filteredTemplates.length === 0 ? (
          <div className="py-16 px-6 bg-white rounded-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">No templates match that search</h3>
            <p className="text-sm text-slate-600 mt-1">Try a different word, or pick another category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-indigo-300 transition-colors group"
              >
                <div>
                  <div className="aspect-[4/3] bg-slate-50 rounded-lg border border-slate-100 overflow-hidden mb-4">
                    <DynamicTemplatePreview nodes={template.nodes} />
                  </div>

                  <p className="text-xs text-slate-500 mb-1.5">
                    {categoryNameById.get(template.category) ?? template.category} · {template.nodes.length} nodes
                  </p>

                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    <Link to={templatePath(template.id)}>{template.name}</Link>
                  </h2>

                  <p className="mt-1.5 text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {template.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Link
                    to={templatePath(template.id)}
                    className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    How to use it
                  </Link>

                  <Button asChild size="sm" variant="outline" className="rounded-lg text-sm font-semibold border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    <Link to={`/workspace?template=${template.id}`}>Use template</Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <section className="py-20 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <figure className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-3/5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
              <img
                src={HOME_SCREENSHOTS.templates}
                alt="Template picker inside the Neuron Mapping editor, with Blank Canvas, Simple Flowchart, Timeline and SWOT Analysis templates"
                width={1600}
                height={1000}
                loading="lazy"
                decoding="async"
                className="w-full h-auto"
              />
            </div>
            <figcaption className="w-full md:w-2/5">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
                The same templates are in the app
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                When you open the editor, every template on this page is waiting on the start screen, sorted by category. Click one and it opens as a new map. You can also save any map you make as your own template.
              </p>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="py-20 border-t border-slate-200 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-10">
            How to use a mind map template
          </h2>
          <ol className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <li key={step.title}>
                <span className="block text-3xl font-extrabold text-indigo-200 mb-2">{i + 1}</span>
                <h3 className="text-base font-bold text-slate-900 mb-1">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16 border-t border-slate-200 bg-indigo-600">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            Rather start from scratch?
          </h2>
          <p className="text-indigo-100 text-sm sm:text-base leading-relaxed mb-8">
            Open a blank canvas, type your main idea and press Tab to start branching out.
          </p>
          <Button size="lg" asChild className="h-11 px-6 bg-white hover:bg-indigo-50 text-indigo-700 rounded-lg font-semibold text-sm border-none cursor-pointer">
            <Link to="/workspace">Start a blank map</Link>
          </Button>
        </div>
      </section>

      <SiteFooter className="" />
    </div>
  );
}
