/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { Link } from "react-router-dom";

import { templates } from "@/data/templates";
import { INDEXABLE_TEMPLATE_IDS, TEMPLATES_PATH, templatePath, templateSearchName } from "@/data/seoContent";
import type { Template } from "@/types/templates";

const guideTemplates = INDEXABLE_TEMPLATE_IDS
  .map((id) => templates.find((t) => t.id === id))
  .filter((t): t is Template => Boolean(t));

export function SiteFooter({ className = "mt-16" }: { className?: string }) {
  return (
    <footer className={`border-t border-slate-200 bg-white py-12 text-sm text-slate-500 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-8">
        <nav aria-label="Template guides">
          <p className="text-slate-900 font-bold text-sm mb-3">Template guides</p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
            {guideTemplates.map((template) => (
              <li key={template.id}>
                <Link to={templatePath(template.id)} className="hover:text-indigo-600 transition-colors">
                  {templateSearchName(template)} Template
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© <span suppressHydrationWarning>{new Date().getFullYear()}</span> Neuron Mapping by RP Hobbyist. Free and open source under the GNU AGPLv3.</p>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-slate-800 transition-colors">Home</Link>
            <Link to={TEMPLATES_PATH} className="hover:text-slate-800 transition-colors">All templates</Link>
            <Link to="/workspace" className="hover:text-slate-800 transition-colors">Editor</Link>
            <a href="https://rphobbyist.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 transition-colors">RP Hobbyist</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
