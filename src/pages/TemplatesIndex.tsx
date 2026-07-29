import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Brain, 
  LayoutGrid, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  FileText
} from "lucide-react";
import { templates, categories } from "@/data/templates";
import { useDocumentSEO } from "@/hooks/useDocumentSEO";
import { Button } from "@/components/ui/button";

export default function TemplatesIndex() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useDocumentSEO({
    title: "20+ Free Mind Map Templates & Diagrams Online | Neuron Mapping",
    description: "Browse 20+ free, pre-built mind map templates including SWOT Analysis, Porter's Five Forces, Customer Journey, Eisenhower Box, Fishbone, and more. 100% private, no signup.",
    canonical: "/templates",
    ogTitle: "20+ Free Mind Map Templates & Diagrams Online | Neuron Mapping",
    ogDescription: "Explore 20+ free, open-source mind map templates for strategy, project management, HR, legal, and brainstorming. Instant editing, no account required.",
    ogImage: "/readme-assets/promo-productivity.webp",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Neuron Mapping Template Gallery",
        "description": "Free, pre-built mind mapping templates for visual brainstorming and business strategy.",
        "url": "https://neuron-mapping.rphobbyist.com/templates",
        "isPartOf": {
          "@type": "WebSite",
          "name": "Neuron Mapping",
          "url": "https://neuron-mapping.rphobbyist.com/"
        }
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
          }
        ]
      }
    ]
  });

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
      const matchesSearch = 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

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

          <nav aria-label="Template Navigation" className="flex items-center gap-4 text-xs sm:text-sm font-semibold">
            <Link to="/" className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <Link to="/workspace">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm">
                <Brain className="w-3.5 h-3.5" /> Launch Workspace
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs mb-4">
            <Sparkles className="w-3.5 h-3.5" /> 20+ Free Mind Map Templates
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight max-w-3xl mx-auto">
            Kickstart Your Visual Brainstorming in Seconds
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Choose from industry-standard frameworks for business strategy, project roadmaps, legal workflows, and creative planning. 100% private, local-first, no account required.
          </p>

          {/* SEARCH BAR */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates (SWOT, Porter's 5 Forces, Customer Journey...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* CATEGORY TABS & TEMPLATE GRID */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            All Templates ({templates.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <LayoutGrid className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No templates found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg hover:border-indigo-200 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                      {template.category}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {template.nodes.length} nodes
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-950 group-hover:text-indigo-600 transition-colors">
                    {template.name}
                  </h3>

                  <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {template.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Link
                    to={`/templates/${template.id}`}
                    className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
                  >
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link to={`/workspace?template=${template.id}`}>
                    <Button size="sm" variant="outline" className="text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1">
                      Use Template <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-12 mt-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Neuron Mapping by RP Hobbyist. Free & Open-Source under GNU AGPLv3.</p>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-slate-800 transition-colors">Home</Link>
            <Link to="/workspace" className="hover:text-slate-800 transition-colors">Workspace</Link>
            <a href="https://rphobbyist.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 transition-colors">RP Hobbyist</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
