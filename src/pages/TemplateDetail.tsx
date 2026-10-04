/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { templates, categories } from "@/data/templates";
import type { Template } from "@/types/templates";
import type { MindMapNode } from "@/types/mindmap";
import { useDocumentSEO } from "@/hooks/useDocumentSEO";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { templateDetailFaqs, TEMPLATES_PATH, templatePath } from "@/data/seoContent";
import { getTemplateContent, getTemplateSeo } from "@/data/templateContent";
import NotFound from "./NotFound";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatMonthYear(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

function visibleChildren(nodes: MindMapNode[], parentId: string | null): MindMapNode[] {
  return nodes
    .filter((n) => n.parentId === parentId)
    .flatMap((n) => (n.text.trim() ? [n] : visibleChildren(nodes, n.id)));
}

function NodeOutline({ nodes, parentId }: { nodes: MindMapNode[]; parentId: string }) {
  const children = visibleChildren(nodes, parentId);
  if (children.length === 0) return null;
  return (
    <ul className="pl-4 border-l-2 border-slate-200 space-y-2 mt-2">
      {children.map((child) => (
        <li key={child.id}>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800">
            {child.text}
          </div>
          <NodeOutline nodes={nodes} parentId={child.id} />
        </li>
      ))}
    </ul>
  );
}

export default function TemplateDetail() {
  const { templateId } = useParams<{ templateId: string }>();

  const template = useMemo(() => {
    return templates.find((t) => t.id === templateId);
  }, [templateId]);

  if (!template) {
    return <NotFound />;
  }

  return <TemplateDetailView key={template.id} template={template} />;
}

function TemplateDetailView({ template }: { template: Template }) {
  const content = getTemplateContent(template.id);
  const seo = useMemo(() => getTemplateSeo(template), [template]);

  useDocumentSEO({
    title: seo.title,
    description: seo.description,
    canonical: seo.path,
    ogTitle: seo.title,
    ogDescription: seo.description,
    ogImage: seo.ogImage,
    robots: seo.robots,
    jsonLd: seo.jsonLd
  });

  const categoryName = categories.find((c) => c.id === template.category)?.name ?? template.category;

  const relatedTemplates = useMemo(() => {
    const ids = content?.related ?? templates
      .filter((t) => t.category === template.category && t.id !== template.id)
      .slice(0, 4)
      .map((t) => t.id);
    return ids
      .map((id) => templates.find((t) => t.id === id))
      .filter((t): t is Template => Boolean(t));
  }, [content, template]);

  const faqs = [...(content?.faqs ?? []), ...templateDetailFaqs];
  const rootNode = visibleChildren(template.nodes, null)[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.svg" alt="Neuron Mapping Logo" width={28} height={28} className="h-7 w-auto object-contain" />
            <span className="font-bold tracking-tight text-slate-900 text-sm sm:text-base">
              Neuron Mapping
            </span>
          </Link>

          <nav aria-label="Template Detail Navigation" className="flex items-center gap-4 text-xs sm:text-sm font-semibold">
            <Link to={TEMPLATES_PATH} className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> All Templates
            </Link>
            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs">
              <Link to={`/workspace?template=${template.id}`}>Open in the editor</Link>
            </Button>
          </nav>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 py-3">
        <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-6 lg:px-8 text-xs text-slate-500 flex items-center gap-2">
          <Link to="/" className="hover:text-indigo-600">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={TEMPLATES_PATH} className="hover:text-indigo-600">Templates</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-semibold">{template.name}</span>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <article className="lg:col-span-7 space-y-8">
            <div>
              <p className="text-sm text-slate-500 mb-2">{categoryName}</p>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                {seo.heading}
              </h1>

              {content && (
                <p className="mt-3 text-xs text-slate-500">
                  By <a href="https://rphobbyist.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-700 hover:text-indigo-600">RP Hobbyist</a>
                  {" · "}Updated <time dateTime={content.updated}>{formatMonthYear(content.updated)}</time>
                </p>
              )}

              {content ? (
                <div className="mt-4 space-y-3 text-base text-slate-600 leading-relaxed">
                  {content.intro.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  {template.description}
                </p>
              )}
            </div>

            <figure className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <img
                src={seo.previewImage}
                alt={seo.imageAlt}
                width={960}
                height={720}
                className="w-full h-auto bg-slate-50"
              />
              <figcaption className="px-4 py-2 border-t border-slate-100 text-xs text-slate-500">
                The {template.name} template as it opens in the editor.
              </figcaption>
            </figure>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-y border-slate-200 py-5">
              <p className="text-sm text-slate-600">
                It opens as a new map with {template.nodes.length} topics already filled in. You don't need an account.
              </p>
              <Button asChild className="w-full sm:w-auto shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm">
                <Link to={`/workspace?template=${template.id}`}>Open in the editor</Link>
              </Button>
            </div>

            {content && (
              <>
                <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <h2 className="font-bold text-slate-900 text-lg">
                    When to use a {template.name}
                  </h2>
                  <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5 leading-relaxed">
                    {content.whenToUse.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>

                <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <h2 className="font-bold text-slate-900 text-lg">
                    What goes in each branch
                  </h2>
                  <dl className="space-y-4 text-sm">
                    {content.branches.map((branch) => (
                      <div key={branch.name}>
                        <dt className="font-bold text-slate-900">{branch.name}</dt>
                        <dd className="mt-1 text-slate-600 leading-relaxed">{branch.guide}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <h2 className="font-bold text-slate-900 text-lg">
                    Example: {content.example.scenario}
                  </h2>
                  <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5 leading-relaxed">
                    {content.example.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </section>

                <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <h2 className="font-bold text-slate-900 text-lg">
                    Tips
                  </h2>
                  <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5 leading-relaxed">
                    {content.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </section>
              </>
            )}

            <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-slate-900 text-lg">
                Using this template in Neuron Mapping
              </h2>
              <ol className="space-y-2 text-sm text-slate-600 leading-relaxed list-decimal pl-5">
                <li>Click <strong>Open in the editor</strong>. The template opens as a new map.</li>
                <li>Select a topic and press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 border border-slate-200 font-mono text-xs">Tab</kbd> to add a branch under it, or double-click a topic to change its text.</li>
                <li>Select a topic to change its color and shape, or add notes to it in Markdown.</li>
                <li>When you're done, export the map as a PDF or PNG, or save it to keep editing later.</li>
              </ol>
              <p className="text-xs text-slate-500 leading-relaxed">
                Everything runs locally in your browser: your map is saved on your device, works offline, and can be exported as PDF, PNG or an editable .nmm file.
              </p>
            </section>
          </article>

          <aside className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="font-bold text-slate-900 text-sm mb-4">
                What's in the template
              </h2>

              {rootNode && (
                <div>
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-xs text-indigo-900">
                    {rootNode.text}
                  </div>
                  <NodeOutline nodes={template.nodes} parentId={rootNode.id} />
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
              <h2 className="font-bold text-sm text-slate-900">
                Questions
              </h2>
              {faqs.map((faq, i) => (
                <details
                  key={faq.q}
                  className={`text-xs text-slate-600 ${i < faqs.length - 1 ? "border-b border-slate-100 pb-2" : ""}`}
                >
                  <summary className="font-semibold text-slate-800 cursor-pointer">{faq.q}</summary>
                  <p className="mt-1 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>

            {relatedTemplates.length > 0 && (
              <nav aria-label="Related templates" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                <h2 className="font-bold text-sm text-slate-900">Related templates</h2>
                <ul className="space-y-1.5 text-sm">
                  {relatedTemplates.map((related) => (
                    <li key={related.id}>
                      <Link
                        to={templatePath(related.id)}
                        className="text-indigo-600 hover:text-indigo-700 hover:underline underline-offset-2"
                      >
                        {related.name} template
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
