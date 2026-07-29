import { useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { 
  ArrowLeft, 
  ArrowRight, 
  Brain, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Download, 
  Layers, 
  ChevronRight,
  FileText,
  Clock,
  HelpCircle
} from "lucide-react";
import { templates } from "@/data/templates";
import { useDocumentSEO } from "@/hooks/useDocumentSEO";
import { Button } from "@/components/ui/button";

export default function TemplateDetail() {
  const { templateId } = useParams<{ templateId: string }>();

  const template = useMemo(() => {
    return templates.find((t) => t.id === templateId);
  }, [templateId]);

  const seoTitle = template
    ? `Free ${template.name} Mind Map Template (Online & Private) | Neuron Mapping`
    : "Mind Map Template | Neuron Mapping";
  const seoDesc = template
    ? `Create a ${template.name} mind map online for free. Pre-built template with ${template.nodes.length} nodes for visual brainstorming. 100% local privacy, no account required.`
    : "Explore free mind map templates in Neuron Mapping.";

  useDocumentSEO({
    title: seoTitle,
    description: seoDesc,
    canonical: template ? `/templates/${template.id}` : "/templates",
    ogTitle: seoTitle,
    ogDescription: seoDesc,
    ogImage: "/readme-assets/promo-productivity.webp",
    jsonLd: template
      ? [
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": `How to Create a ${template.name} Mind Map`,
            "description": template.description,
            "step": [
              {
                "@type": "HowToStep",
                "position": 1,
                "name": "Open Template",
                "text": `Click 'Launch Template in Editor' to pre-load the ${template.name} framework.`
              },
              {
                "@type": "HowToStep",
                "position": 2,
                "name": "Customize Nodes",
                "text": "Add your ideas, customize branch colors, edit markdown notes, and format connectors."
              },
              {
                "@type": "HowToStep",
                "position": 3,
                "name": "Export & Save",
                "text": "Export your completed mind map as a PDF, high-resolution PNG image, or local .nmm backup file."
              }
            ]
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://neuron-mapping.rphobbyist.com/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Templates",
                "item": "https://neuron-mapping.rphobbyist.com/templates"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": template.name,
                "item": `https://neuron-mapping.rphobbyist.com/templates/${template.id}`
              }
            ]
          }
        ]
      : undefined
  });

  if (!template) {
    return <Navigate to="/templates" replace />;
  }

  const rootNode = template.nodes.find((n) => !n.parentId);
  const childNodes = template.nodes.filter((n) => n.parentId === rootNode?.id);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.svg" alt="Neuron Mapping Logo" width={28} height={28} className="h-7 w-auto object-contain" />
            <span className="font-bold tracking-tight text-slate-900 text-sm sm:text-base">
              Neuron Mapping
            </span>
          </Link>

          <nav aria-label="Template Detail Navigation" className="flex items-center gap-4 text-xs sm:text-sm font-semibold">
            <Link to="/templates" className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> All Templates
            </Link>
            <Link to={`/workspace?template=${template.id}`}>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm">
                <Brain className="w-3.5 h-3.5" /> Launch Template
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* BREADCRUMB */}
      <div className="bg-white border-b border-slate-200 py-3">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-xs text-slate-500 flex items-center gap-2">
          <Link to="/" className="hover:text-indigo-600">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/templates" className="hover:text-indigo-600">Templates</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-semibold">{template.name}</span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Template Information */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs mb-3">
                <Sparkles className="w-3.5 h-3.5" /> {template.category} Framework
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                {template.name} Mind Map Template
              </h1>

              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                {template.description}
              </p>
            </div>

            {/* CTA Box */}
            <div className="p-6 bg-indigo-900 text-white rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="font-bold text-base">Ready to edit this template?</h3>
                <p className="text-xs text-indigo-200 mt-1">Pre-loaded with {template.nodes.length} nodes. No account or setup required.</p>
              </div>
              <Link to={`/workspace?template=${template.id}`} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-white text-indigo-950 hover:bg-indigo-50 font-extrabold text-sm gap-2 shadow-md">
                  <Brain className="w-4 h-4 text-indigo-600" /> Launch Template
                </Button>
              </Link>
            </div>

            {/* Template Features Checklist */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Key Features & Capabilities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>100% Local-First & Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Export to Vector PDF & PNG</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Interactive 3D Galaxy View</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Keyboard-First Canvas Navigation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Custom Branch Colors & Connectors</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Markdown & Sketch Support</span>
                </div>
              </div>
            </div>

            {/* Step-by-Step Usage Guide */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" /> How to Use the {template.name} Template
              </h3>
              <ol className="space-y-3 text-xs text-slate-600 leading-relaxed list-decimal list-inside font-medium">
                <li>Click <strong>Launch Template</strong> to open the pre-populated diagram in your browser canvas.</li>
                <li>Click any node or press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 border border-slate-200 font-mono">Tab</kbd> to add sub-branches for your specific project.</li>
                <li>Use the inspector panel to adjust node colors, add markdown notes, or draw sketches.</li>
                <li>Export your final mind map as a PDF or PNG image for presentations and documentation.</li>
              </ol>
            </div>
          </div>

          {/* Right Column: Pre-built Structure Breakdown */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" /> Pre-built Node Hierarchy
              </h3>

              <div className="space-y-3">
                {rootNode && (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-xs text-indigo-900 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span>{rootNode.text}</span>
                  </div>
                )}

                <div className="pl-4 border-l-2 border-slate-200 space-y-2">
                  {childNodes.map((child) => (
                    <div key={child.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 flex items-center justify-between">
                      <span>{child.text}</span>
                      <span className="text-[10px] text-slate-400 font-normal capitalize">
                        {child.color} branch
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Template FAQ Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600" /> Frequently Asked Questions
              </h4>
              <details className="text-xs text-slate-600 border-b border-slate-100 pb-2">
                <summary className="font-semibold text-slate-800 cursor-pointer">Can I modify this template?</summary>
                <p className="mt-1 leading-relaxed">Yes! All templates are 100% editable. You can add, remove, recolor, and re-arrange any branch.</p>
              </details>
              <details className="text-xs text-slate-600">
                <summary className="font-semibold text-slate-800 cursor-pointer">Is my data uploaded to a server?</summary>
                <p className="mt-1 leading-relaxed">No. Neuron Mapping is local-first. Your mind map data remains strictly on your device.</p>
              </details>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
