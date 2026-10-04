/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Download,
  Github,
  Play,
  Plus,
  Minus,
  X as XIcon,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocumentSEO } from "@/hooks/useDocumentSEO";
import { SYSTEM_CONFIG } from "@/lib/core/core-system";
import { InteractiveMindMap } from "@/components/shared/InteractiveMindMap";
import {
  landingFaqs,
  homeSeo,
  homeJsonLd,
  OG_IMAGE_PATH,
  TEMPLATES_PATH,
  INDEXABLE_TEMPLATE_IDS,
  templateSearchName,
  templatePath,
  HOME_SCREENSHOTS
} from "@/data/seoContent";
import { templates } from "@/data/templates";
import type { Template } from "@/types/templates";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const
    }
  }
};

const blogs = [
  {
    title: "3D Neuron Mapping: Visual Knowledge Management for Makers",
    description: "Organize complex ideas with the 3D Neuron Mapping system. Discover how visual thinkers brainstorm, mind map, and build open-source mental schemas.",
    image: "https://rphobbyist.com/images/blogs/Neuro-Mapping/master-your-ideas-the-3d-neuron-mapping-system-for-visual-thinkers-hero.webp",
    url: "https://rphobbyist.com/blogs/master-your-ideas-the-3d-neuron-mapping-system-for-visual-thinkers/"
  }
];

const faqs = landingFaqs;

const findTemplates = (ids: readonly string[]) =>
  ids
    .map((id) => templates.find((t) => t.id === id))
    .filter((t): t is Template => Boolean(t));

const popularTemplates = findTemplates(INDEXABLE_TEMPLATE_IDS);

const BLOG_IMAGE_FALLBACK = "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=500&q=80";

const releaseNotes = [
  {
    title: "Text formatting",
    description: "Bold, italic, underline and strikethrough inside nodes, plus fonts, sizes, headings and lists."
  },
  {
    title: "Box areas",
    description: "Draw a labelled box around a group of nodes. When you drag the box, the nodes inside go with it."
  },
  {
    title: "Node status",
    description: "Mark a node as Backlog, Planning, In Progress, Review, Blocked or Done. Search can filter by status."
  },
  {
    title: "Custom colors",
    description: "A proper color picker, with an eyedropper in Chrome and Edge. It remembers your last 8 colors."
  },
  {
    title: "Arrowheads",
    description: "Put arrows on the start, the end or both ends of a line, pointing whichever way you need."
  },
  {
    title: "Resume unsaved work",
    description: "If you close the tab before saving, the start page offers to bring your last session back."
  },
  {
    title: "Snapshots per map",
    description: "Each map has its own snapshot history. Restoring an old one saves a backup of the current version first."
  }
];

const features = [
  {
    title: "Keyboard-friendly canvas",
    description: "Tab adds a child node, Space edits it, and the arrow keys move between nodes. You can build a whole map without touching the mouse."
  },
  {
    title: "Formatting and notes",
    description: "Format the text inside each node, and attach longer notes written in Markdown when a few words aren't enough."
  },
  {
    title: "Room for big maps",
    description: "Group nodes in box areas, give them a status, and use the search filters to find things again. Focus Mode hides everything except the branch you're working on."
  },
  {
    title: "Import what you already have",
    description: "Open a Markdown outline, CSV, OPML, JSON, XML or text file and it becomes a mind map. OPML is the easy way to move maps over from other apps."
  },
  {
    title: "Export and share",
    description: "Save a PDF or PNG for slides and reports, or a .nmm file so you can keep editing later."
  },
  {
    title: "3D Galaxy View",
    description: "Switch to 3D to see the whole map at once, with Sphere, Grid, Force and 2D Projection layouts. Useful for spotting clusters in large maps."
  },
  {
    title: "Play Mode",
    description: "Reveals a map one node at a time, which works well for lessons, pitches and team walkthroughs."
  },
  {
    title: "Private by default",
    description: "Maps are saved in your browser, on your own device. There's no account, and nothing you write gets uploaded."
  }
];

const useCases = [
  {
    title: "Students and teachers",
    description: "Turn a chapter into a study map, outline an essay before writing it, or plan a lesson.",
    templates: findTemplates(["blank-mindmap", "venn-diagram", "simple-timeline"])
  },
  {
    title: "Project managers",
    description: "Break a project into tasks, track where each one stands, and keep a launch on schedule.",
    templates: findTemplates(["kanban-board", "product-launch-checklist", "okr-planning"])
  },
  {
    title: "Founders and strategists",
    description: "Test a business idea, look at the competition, and get the whole plan onto one page.",
    templates: findTemplates(["swot-analysis", "business-model-canvas", "customer-journey"])
  },
  {
    title: "Problem solving",
    description: "Find the root cause of a problem, compare your options, and write down why you chose one.",
    templates: findTemplates(["five-whys", "decision-tree", "empathy-map"])
  }
];

const screenshots = [
  {
    src: HOME_SCREENSHOTS.editor,
    width: 1600,
    height: 1000,
    alt: "Neuron Mapping mind map editor showing a product launch plan with research, budget, marketing and product branches",
    title: "One map for the whole plan",
    description: "This is a real launch plan made in Neuron Mapping. Research, budget, marketing and product work all sit on one canvas, so you can see how everything connects."
  },
  {
    src: HOME_SCREENSHOTS.statusAndBoxAreas,
    width: 1200,
    height: 908,
    alt: "Mind map nodes with status tags like Done, In Progress and Blocked, grouped inside a Sprint 14 box area",
    title: "Track progress on the map itself",
    description: "Tag each task with a status and a priority, and draw a box around the ones that belong together. Here the Sprint 14 box holds this sprint's work, and the blocked checkout bug stands out in red."
  },
  {
    src: HOME_SCREENSHOTS.propertiesPanel,
    width: 1600,
    height: 1000,
    alt: "Node properties panel with text formatting, colors, shapes, priority and status options",
    title: "Style a node in a couple of clicks",
    description: "Select a node and everything you can change is in one panel: text formatting, color, shape, priority, status and the line that connects it."
  },
  {
    src: HOME_SCREENSHOTS.templates,
    width: 1600,
    height: 1000,
    alt: "Template picker with Blank Canvas, Simple Flowchart, Timeline, SWOT Analysis and other mind map templates",
    title: "Start from a template",
    description: `Pick from ${templates.length} templates sorted by category, from a blank canvas and simple flowcharts to SWOT analysis and purchase requisition workflows.`
  },
  {
    src: HOME_SCREENSHOTS.import,
    width: 1000,
    height: 893,
    alt: "Import dialog that accepts text, Markdown, JSON, OPML, CSV and XML files",
    title: "Bring in notes you already have",
    description: "Drop a Markdown outline, CSV, OPML, JSON, XML or text file into the import window and the branches are built for you."
  },
  {
    src: HOME_SCREENSHOTS.galaxyView,
    width: 1600,
    height: 938,
    alt: "The same mind map shown in the 3D Galaxy View with the Force Field layout",
    title: "Step back and see it in 3D",
    description: "The 3D Galaxy View lays the same map out in space. You can rotate it, zoom in, and switch between Force Field, Sphere, Grid and 2D Projection layouts."
  }
];

const steps = [
  {
    title: "Pick a starting point",
    description: "Choose a template, import a file, or start with a blank canvas."
  },
  {
    title: "Add your ideas",
    description: "Type the main idea, press Tab to branch out, and double-click any node to edit it."
  },
  {
    title: "Export or save",
    description: "Download a PDF or PNG, or save a .nmm file so you can pick it up later."
  }
];

export default function Landing() {
  useDocumentSEO({
    title: homeSeo.title,
    description: homeSeo.description,
    canonical: "/",
    ogTitle: homeSeo.ogTitle,
    ogDescription: homeSeo.ogDescription,
    ogImage: OG_IMAGE_PATH,
    jsonLd: homeJsonLd
  });

  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleScroll = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans overflow-x-clip selection:bg-indigo-500/20 selection:text-indigo-900">

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">

          <Link to="/" className="flex items-center gap-2 group">
            <img
              src={SYSTEM_CONFIG.brandLogo}
              alt={`${SYSTEM_CONFIG.appName} Logo`}
              width={28}
              height={28}
              className="h-7 w-auto object-contain"
            />
            <span className="font-bold tracking-tight text-slate-900 text-sm sm:text-base">
              {SYSTEM_CONFIG.appName}
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <Link to={TEMPLATES_PATH} className="text-indigo-600 hover:text-indigo-700 transition-colors">Templates</Link>
            <button onClick={() => handleScroll("whats-new")} className="hover:text-slate-900 transition-colors">What's new</button>
            <button onClick={() => handleScroll("features")} className="hover:text-slate-900 transition-colors">Features</button>
            <button onClick={() => handleScroll("use-cases")} className="hover:text-slate-900 transition-colors">Use cases</button>
            <button onClick={() => handleScroll("tutorials")} className="hover:text-slate-900 transition-colors">Tutorial</button>
            <button onClick={() => handleScroll("faq")} className="hover:text-slate-900 transition-colors">FAQ</button>
          </nav>

          <div className="flex items-center gap-4">
            <Link to={TEMPLATES_PATH} className="md:hidden text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
              Templates
            </Link>
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
              <Link to="/workspace">
                Open the app
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>

        <section className="relative pt-12 pb-12 md:pt-16 md:pb-16 max-w-7xl mx-auto px-6 lg:px-8 overflow-hidden">
          <motion.div
            className="grid lg:grid-cols-12 gap-12 items-center"
            variants={containerVariants}
            initial={false}
            whileInView="visible"
            viewport={{ once: true }}
          >

            <div className="lg:col-span-7 space-y-6 text-left">

              <motion.p className="text-sm text-slate-600" variants={itemVariants}>
                Version 1.7 is out, with text formatting, box areas and node status.{" "}
                <button
                  onClick={() => handleScroll("whats-new")}
                  className="font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-700 cursor-pointer"
                >
                  See what changed
                </button>
              </motion.p>

              <motion.div
                className="flex flex-col gap-2"
                variants={itemVariants}
              >
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                  Free online mind map maker
                </h1>
                <p className="text-2xl sm:text-4xl font-bold tracking-tight text-indigo-600">
                  Make sense of your ideas.
                </p>
              </motion.div>

              <motion.p
                className="text-base text-slate-600 leading-relaxed max-w-xl"
                variants={itemVariants}
              >
                Neuron Mapping is a mind mapping tool that runs in your browser. Pick one of {templates.length} templates or start from scratch, and export to PDF or PNG when you're done. There's no account to create, nothing to pay, and your maps are saved on your own device.
              </motion.p>

              <motion.div className="flex flex-wrap items-center gap-3" variants={itemVariants}>
                <Button
                  size="lg"
                  asChild
                  className="h-11 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm border-none cursor-pointer"
                >
                  <Link to="/workspace">
                    Start mapping
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-11 px-6 bg-white border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-sm cursor-pointer">
                  <a href={SYSTEM_CONFIG.downloadUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download desktop app
                  </a>
                </Button>
              </motion.div>

              <motion.p className="text-xs text-slate-500" variants={itemVariants}>
                Free and open source under the AGPLv3. The desktop app runs on Windows, macOS and Linux.
              </motion.p>
            </div>

            <motion.div
              className="lg:col-span-5 relative"
              variants={itemVariants}
            >
              <InteractiveMindMap />
            </motion.div>

          </motion.div>
        </section>

        <section id="whats-new" className="scroll-mt-20 py-16 border-t border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
                What's new in version 1.7
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Most of this release went into the editor. Here's what changed.
              </p>
            </div>

            <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
              {releaseNotes.map((note) => (
                <div key={note.title} className="border-t border-slate-200 pt-4">
                  <dt className="text-sm font-bold text-slate-900">{note.title}</dt>
                  <dd className="mt-1 text-sm text-slate-600 leading-relaxed">{note.description}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-10 text-sm text-slate-600">
              All of it is in the web app now.{" "}
              <Link to="/workspace" className="font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-700">
                Try it in the editor
              </Link>
            </p>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 py-20 border-t border-slate-200 bg-slate-50 relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">

            <div className="max-w-2xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
                Mind mapping features
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                The basics take a minute to pick up, and there's more to find when your maps get bigger.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature) => (
                <div key={feature.title} className="bg-white border border-slate-200 rounded-xl p-6">
                  <h3 className="text-base font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-base font-bold text-slate-900 mb-2">{templates.length} free templates</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  SWOT analysis, Business Model Canvas, Kanban board, decision tree, customer journey map and more. Every one of them is editable.{" "}
                  <Link to={TEMPLATES_PATH} className="font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-700">
                    See all templates
                  </Link>
                </p>
              </div>
            </div>

          </div>
        </section>

        <section id="screenshots" className="scroll-mt-20 py-20 border-t border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="max-w-2xl mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
                A closer look at the mind map editor
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                These are real screenshots, all from the same launch plan, so you know what you're getting before you open it.
              </p>
            </div>

            <div className="space-y-20">
              {screenshots.map((shot, i) => (
                <figure
                  key={shot.src}
                  className={`flex flex-col gap-8 items-center ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"}`}
                >
                  <div className="w-full md:w-3/5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                    <img
                      src={shot.src}
                      alt={shot.alt}
                      width={shot.width}
                      height={shot.height}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-auto"
                    />
                  </div>
                  <figcaption className="w-full md:w-2/5">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{shot.title}</h3>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{shot.description}</p>
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="mt-16">
              <Button size="lg" asChild className="h-11 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm border-none cursor-pointer">
                <Link to="/workspace">
                  Try it yourself
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 py-20 border-t border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
                How to make a mind map
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                No signup and no download. Open the editor and start typing.
              </p>
            </div>

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

        <section id="use-cases" className="scroll-mt-20 py-20 border-t border-slate-200 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
                Mind maps for school, work and planning
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                A few good places to start, depending on what you're working on.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {useCases.map((useCase) => (
                <div key={useCase.title} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col">
                  <h3 className="text-base font-bold text-slate-900 mb-2">{useCase.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1">{useCase.description}</p>
                  <ul className="space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                    {useCase.templates.map((template) => (
                      <li key={template.id}>
                        <Link
                          to={templatePath(template.id)}
                          className="text-indigo-600 hover:text-indigo-700 hover:underline underline-offset-2"
                        >
                          {templateSearchName(template)} template
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="templates" className="scroll-mt-20 py-20 border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
                Popular mind map templates
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Each one comes with a short guide on how to use it, and opens in the editor with one click.
              </p>
            </div>

            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularTemplates.map((template) => (
                <li key={template.id}>
                  <Link
                    to={templatePath(template.id)}
                    className="block h-full bg-slate-50 border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:bg-white transition-colors group"
                  >
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {templateSearchName(template)} Template
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                      {template.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Button variant="outline" asChild className="rounded-lg border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-5 h-10 text-sm cursor-pointer">
                <Link to={TEMPLATES_PATH}>
                  Browse all {templates.length} templates
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="tutorials" className="scroll-mt-20 py-20 border-t border-slate-200 bg-slate-50">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <div className="max-w-2xl mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
                Watch the video walkthrough
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">A full tour of the editor on YouTube.</p>
            </div>

            <a
              href="https://youtu.be/tZC3a-83HXI"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Watch the Neuron Mapping video walkthrough on YouTube"
              className="block relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm"
            >
              <img
                src="https://img.youtube.com/vi/tZC3a-83HXI/maxresdefault.jpg"
                alt="Neuron Mapping video walkthrough"
                width={1280}
                height={720}
                loading="lazy"
                decoding="async"
                className="w-full aspect-video object-cover"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-indigo-600 fill-indigo-600 ml-1" />
                </div>
              </div>
            </a>
          </div>
        </section>

        <section className="py-20 border-t border-slate-200 bg-white">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <div className="max-w-2xl mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
                How it compares
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">Neuron Mapping next to online whiteboards and paid mind map apps.</p>
            </div>

            <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl">
              <table aria-label="Feature comparison between Neuron Mapping, online whiteboards and paid mind map apps" className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Feature</th>
                    <th className="py-3 px-4 text-slate-500 font-semibold text-center">Online whiteboards</th>
                    <th className="py-3 px-4 text-slate-500 font-semibold text-center">Paid mind map apps</th>
                    <th className="py-3 px-4 text-indigo-700 font-bold text-center bg-indigo-50">Neuron Mapping</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Infinite canvas", true, true, true],
                    ["No signup needed", false, false, true],
                    [`${templates.length} planning templates`, false, "partial", true],
                    ["Text formatting inside nodes", "partial", true, true],
                    ["Import Markdown, CSV and OPML", false, "partial", true],
                    ["3D Galaxy View", false, false, true],
                    ["Works offline (desktop app)", "partial", false, true],
                    ["Keyboard shortcuts for everything", "partial", true, true],
                    ["Maps stay on your device", false, false, true],
                    ["Open source", false, false, true],
                    ["Price", "Free-ish", "$8–15/mo", "Free"],
                  ].map(([feature, simple, cloud, nmm], i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-b-0">
                      <td className="py-3 px-4 font-medium text-slate-700">{feature as string}</td>
                      <td className="py-3 px-4 text-center">
                        {simple === true ? <Check aria-label="Yes" className="w-4 h-4 text-emerald-600 mx-auto" />
                          : simple === "partial" ? <span className="text-xs text-amber-600 font-medium">Partly</span>
                          : simple === "Free-ish" ? <span className="text-xs text-slate-500 font-medium">Free-ish</span>
                          : <XIcon aria-label="No" className="w-4 h-4 text-slate-300 mx-auto" />}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {cloud === true ? <Check aria-label="Yes" className="w-4 h-4 text-emerald-600 mx-auto" />
                          : cloud === "partial" ? <span className="text-xs text-amber-600 font-medium">Partly</span>
                          : cloud === "$8–15/mo" ? <span className="text-xs text-slate-500 font-medium">$8–15/mo</span>
                          : <XIcon aria-label="No" className="w-4 h-4 text-slate-300 mx-auto" />}
                      </td>
                      <td className="py-3 px-4 text-center bg-indigo-50/40">
                        {nmm === true ? <Check aria-label="Yes" className="w-4 h-4 text-indigo-600 mx-auto" />
                          : nmm === "Free" ? <span className="text-xs font-bold text-indigo-700">Free</span>
                          : <XIcon aria-label="No" className="w-4 h-4 text-slate-300 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="privacy" className="scroll-mt-20 py-20 border-t border-slate-200 bg-slate-50">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-4">
              Your maps stay on your device
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4">
              Neuron Mapping saves everything in your browser's own storage. There's no account and no cookies, and your maps are never sent to a server. Opening files and exporting them happens on your computer too.
            </p>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              The code is open source, so you don't have to take our word for it.{" "}
              <a href={SYSTEM_CONFIG.githubUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-700">
                Read it on GitHub
              </a>
            </p>
          </div>
        </section>

        <section id="blogs" className="scroll-mt-20 py-20 border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">

            <div className="max-w-2xl mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
                From the blog
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Articles on mind mapping, making things and the tools behind them.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {blogs.map((blog, i) => (
                <a
                  key={i}
                  href={blog.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-300 transition-colors"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={blog.image}
                      alt={blog.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.src !== BLOG_IMAGE_FALLBACK) img.src = BLOG_IMAGE_FALLBACK;
                      }}
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2 leading-snug group-hover:text-indigo-600 transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                      {blog.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-8">
              <a href="https://www.rphobbyist.com/blogs/" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-700">
                More articles on rphobbyist.com
              </a>
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-slate-200 bg-indigo-600">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
              Ready to try it?
            </h2>
            <p className="text-indigo-100 text-sm sm:text-base leading-relaxed mb-8">
              Open the editor, type your main idea and press Tab. That's all it takes to get going.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild className="h-11 px-6 bg-white hover:bg-indigo-50 text-indigo-700 rounded-lg font-semibold text-sm border-none cursor-pointer">
                <Link to="/workspace">
                  Start mapping
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-11 px-6 bg-transparent border-indigo-300 hover:bg-indigo-500 text-white hover:text-white rounded-lg font-semibold text-sm cursor-pointer">
                <Link to={TEMPLATES_PATH}>
                  Browse templates
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 py-20 border-t border-slate-200 bg-white">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">

            <div className="mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
                Frequently asked questions
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Something not covered here?{" "}
                <a href={`${SYSTEM_CONFIG.githubUrl}/issues`} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-700">
                  Ask on GitHub
                </a>
                .
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <motion.div
                    key={index}
                    className={`border border-slate-200 rounded-xl overflow-hidden transition-colors ${isOpen ? 'bg-white' : 'bg-slate-50/50'}`}
                    initial={false}
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                      className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className={`text-sm font-semibold transition-colors ${isOpen ? 'text-indigo-700' : 'text-slate-900'}`}>
                        {faq.q}
                      </span>
                      <span className="shrink-0 text-slate-400">
                        {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </span>
                    </button>

                    <motion.div
                      initial={false}
                      animate={isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                      aria-hidden={!isOpen}
                    >
                      <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                        {faq.a}
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

          </div>
        </section>

      </main>

      <footer className="bg-slate-100 border-t border-slate-200 pt-12 pb-8 text-sm text-slate-600">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12">

            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-2">
                <img
                  src={SYSTEM_CONFIG.brandLogo}
                  alt={`${SYSTEM_CONFIG.appName} Logo`}
                  width={24}
                  height={24}
                  className="h-6 w-auto object-contain"
                />
                <span className="font-bold tracking-tight text-slate-900 text-sm">
                  {SYSTEM_CONFIG.appName}
                </span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                A free, open-source mind map maker by {SYSTEM_CONFIG.vendor}. No signup, and your maps stay on your device.
              </p>
            </div>

            <div className="md:col-span-3 space-y-3">
              <h3 className="text-slate-900 font-bold text-sm">Product</h3>
              <ul className="space-y-2">
                <li><Link to="/workspace" className="hover:text-indigo-600 transition-colors">Mind map editor</Link></li>
                <li><Link to={TEMPLATES_PATH} className="hover:text-indigo-600 transition-colors">Templates</Link></li>
                <li><a href={SYSTEM_CONFIG.downloadUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">Desktop app</a></li>
                <li><a href={SYSTEM_CONFIG.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">Source code on GitHub</a></li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-3">
              <h3 className="text-slate-900 font-bold text-sm">Help and contact</h3>
              <ul className="space-y-2">
                <li><a href={SYSTEM_CONFIG.youtubeUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">Video tutorials</a></li>
                <li><a href={SYSTEM_CONFIG.vendorLink} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">{SYSTEM_CONFIG.vendor} website</a></li>
                <li><a href={`${SYSTEM_CONFIG.githubUrl}/issues`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">Report a problem</a></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-1.5">
              <span>&copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span> {SYSTEM_CONFIG.appName} by <a href={SYSTEM_CONFIG.vendorLink} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-indigo-600 transition-colors font-semibold">{SYSTEM_CONFIG.vendor}</a></span>
              <span className="hidden sm:inline text-slate-300">·</span>
              <span className="hidden sm:inline">AGPLv3 license</span>
            </div>

            <div className="flex gap-6 items-center">
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 transition-colors">Sitemap</a>
              <button onClick={() => handleScroll("privacy")} className="hover:text-slate-700 transition-colors cursor-pointer">Privacy</button>
              <button onClick={() => handleScroll("faq")} className="hover:text-slate-700 transition-colors cursor-pointer">FAQ</button>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
