import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  ArrowRight, 
  Download, 
  Github, 
  Youtube,
  Play, 
  Plus,
  Minus,
  CheckCircle,
  BookOpen,
  Map,
  Globe,
  Mail,
  Cpu,
  Settings,
  FileUp,
  TrendingUp,
  MessageSquare,
  Zap,
  X as XIcon,
  Check,
  FileText,
  Brain,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocumentSEO } from "@/hooks/useDocumentSEO";
import { SYSTEM_CONFIG } from "@/lib/core/core-system";
import { InteractiveMindMap } from "@/components/shared/InteractiveMindMap";

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
      ease: "easeOut"
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

const faqs = [
  {
    q: "How does Neuron Mapping keep my thoughts organized?",
    a: "Neuron Mapping provides a large, distraction-free canvas where you can build node hierarchies. You can color-code your branches, choose custom connection layouts (curved, straight, stepped), write extensive markdown-formatted notes, draw sketches directly on nodes, and attach icons from a library. All keyboard shortcuts are built to keep your hands on the keyboard and keep you in the flow."
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
    a: "Unlike standard open source mind mapping tools, Neuron Mapping features an interactive 3D Galaxy View that lets you visualize your node connections as WebGL-powered particle constellations. It also includes 20+ pre-built business and planning templates (SWOT, Porter's Five Forces, Market Research), offline capabilities, and a full distraction-free canvas with keyboard-first navigation."
  },
  {
    q: "What templates are included in the picker?",
    a: "Neuron Mapping includes 20+ pre-built, industry-standard templates: SWOT Analysis, Market Research, Porter's Five Forces, Purchase Requisition, Supplier Evaluation, Order Fulfilment, project planning roadmaps, brainstorming webs, and more."
  }
];

export default function Landing() {
  useDocumentSEO({
    title: "Free Mind Mapping Tool Online (No Signup) | Neuron Mapping",
    description: "Free open-source mind mapping tool. 20+ templates, 3D Galaxy View, PDF export — 100% private, no signup needed. Works offline.",
    canonical: "/",
    ogTitle: "Neuron Mapping — Free Mind Mapping Tool Online (No Signup)",
    ogDescription: "Create unlimited mind maps with 20+ templates, 3D Galaxy View, and 100% local privacy. Free, open-source — no signup needed.",
    ogImage: "/readme-assets/promo-productivity.webp",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a
          }
        }))
      }
    ]
  });

  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element && scrollContainerRef.current) {
      const headerOffset = 80;
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      scrollContainerRef.current.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="h-screen overflow-y-auto scroll-smooth bg-slate-50 text-slate-800 font-sans overflow-x-hidden selection:bg-indigo-500/20 selection:text-indigo-900"
    >
      
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
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

          {/* Navigation Links */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8 text-xs sm:text-sm font-bold text-slate-600">
            <Link to="/templates" className="text-indigo-600 hover:text-indigo-700 transition-all flex items-center gap-1 font-bold">Templates (20+)</Link>
            <button onClick={() => handleScroll("features")} className="hover:text-slate-900 transition-all">Features</button>
            <button onClick={() => handleScroll("how-it-works")} className="hover:text-slate-900 transition-all">How It Works</button>
            <button onClick={() => handleScroll("tutorials")} className="hover:text-slate-900 transition-all">Tutorials</button>
            <button onClick={() => handleScroll("blogs")} className="hover:text-slate-900 transition-all">Blogs</button>
            <button onClick={() => handleScroll("privacy")} className="hover:text-slate-900 transition-all">Privacy</button>
            <button onClick={() => handleScroll("faq")} className="hover:text-slate-900 transition-all">FAQ</button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <a 
              href={SYSTEM_CONFIG.githubUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="GitHub" 
              className="hidden sm:inline-flex text-slate-500 hover:text-slate-900 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/10 transition-all duration-200 hover:-translate-y-0.5 font-bold px-4 h-9 text-xs border-none cursor-pointer">
              <Link to="/workspace">
                Launch Workspace
              </Link>
            </Button>
          </div>
        </div>
      </header>
      
      <main>
        
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-12 md:pt-16 md:pb-16 max-w-7xl mx-auto px-6 lg:px-8 overflow-hidden">
          {/* Decorative mesh background */}
          <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(circle_at_top_right,#c7d2fe,transparent_45%)]" />
          
          <motion.div 
            className="grid lg:grid-cols-12 gap-12 items-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            
            {/* Left Column Text */}
            <div className="lg:col-span-7 space-y-6 text-left">


              <motion.h1 
                className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 flex flex-col gap-2.5 sm:gap-3.5"
                variants={itemVariants}
              >
                <span>Your Thoughts,</span>
                <span className="text-indigo-600">Visually Organized</span>
              </motion.h1>

              <motion.p 
                className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-xl"
                variants={itemVariants}
              >
                The ultimate local-first mind mapping canvas. Organize ideas, plan complex projects, brainstorm visually, and see your links in 3D - all running privately on your machine. No accounts. Free forever.
              </motion.p>

              {/* CTAs */}
              <motion.div className="flex flex-wrap items-center gap-4" variants={itemVariants}>
                <Button 
                  size="lg" 
                  asChild 
                  className="h-11 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/15 font-bold text-xs sm:text-sm transition-all duration-200 hover:scale-[1.03] border-none cursor-pointer"
                >
                  <Link to="/workspace">
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Launch Mind Mapping Free
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-11 px-6 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 hover:border-indigo-200 cursor-pointer">
                  <a href={SYSTEM_CONFIG.downloadUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download Desktop App
                  </a>
                </Button>
              </motion.div>
              
              {/* Badges */}
              <motion.div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl text-[10px] font-bold text-indigo-700 uppercase tracking-wider" variants={itemVariants}>
                <span className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-indigo-150 bg-indigo-50/50">
                  <CheckCircle aria-hidden="true" className="w-3 h-3 text-indigo-500 shrink-0" /> 100% Local
                </span>
                <span className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-indigo-150 bg-indigo-50/50">
                  <CheckCircle aria-hidden="true" className="w-3 h-3 text-indigo-500 shrink-0" /> No Telemetry
                </span>
                <span className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-indigo-150 bg-indigo-50/50">
                  <CheckCircle aria-hidden="true" className="w-3 h-3 text-indigo-500 shrink-0" /> 3D Galaxy
                </span>
                <span className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-indigo-150 bg-indigo-50/50">
                  <CheckCircle aria-hidden="true" className="w-3 h-3 text-indigo-500 shrink-0" /> AGPLv3 Open
                </span>
              </motion.div>
            </div>

            {/* Right Column Interactive Mockup */}
            <motion.div 
              className="lg:col-span-5 relative"
              variants={itemVariants}
            >
              <InteractiveMindMap />
            </motion.div>

          </motion.div>
        </section>

        {/* CORE FEATURES SECTION */}
        <section id="features" className="py-20 border-t border-slate-200 bg-white relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
                One Canvas. Infinite Brainstorms.
              </h2>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
                Empower your brain with professional structuring, keyboard shortcuts, and 3D visual acceleration.
              </p>
            </div>

            {/* Features Pillar Grid */}
            <motion.div 
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              
              {/* Feature 1 */}
              <motion.div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:shadow-md hover:border-indigo-300 transition-all shadow-sm flex flex-col group" variants={itemVariants}>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Infinite Digital Canvas</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4 flex-1">
                  Create sprawling mind maps with fluid pan and zoom. Add nodes, delete, and trace parent-child hierarchies seamlessly with sub-pixel rendering.
                </p>
                <Link to="/workspace" className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:text-indigo-500 transition-colors inline-flex items-center gap-1 mt-auto">
                  Launch Editor <ArrowRight className="w-3 h-3" />
                </Link>
              </motion.div>

              {/* Feature 2 */}
              <motion.div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:shadow-md hover:border-indigo-300 transition-all shadow-sm flex flex-col group" variants={itemVariants}>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Interactive 3D Galaxy View</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4 flex-1">
                  Pivot your ideas into a WebGL-powered 3D particle landscape. Inspect connections, structural density, and nodes inside a deep-space constellation theme.
                </p>
                <Link to="/workspace" className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:text-indigo-500 transition-colors inline-flex items-center gap-1 mt-auto">
                  Preview 3D Space <ArrowRight className="w-3 h-3" />
                </Link>
              </motion.div>

              {/* Feature 3 */}
              <motion.div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:shadow-md hover:border-indigo-300 transition-all shadow-sm flex flex-col group" variants={itemVariants}>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Rich Node Customization</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4 flex-1">
                  Tailor every element. Choose flat or pastel theme nodes, customize border colors, add icons, write markdown descriptions, and paint custom connections.
                </p>
                <Link to="/workspace" className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:text-indigo-500 transition-colors inline-flex items-center gap-1 mt-auto">
                  Style Your Node <ArrowRight className="w-3 h-3" />
                </Link>
              </motion.div>

              {/* Feature 4 */}
              <motion.div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:shadow-md hover:border-indigo-300 transition-all shadow-sm flex flex-col group" variants={itemVariants}>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">20+ Templates Ready-to-Use</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4 flex-1">
                  Start mapping instantly with SWOT frameworks, Porter's Five Forces, product backlog breakdowns, supplier audits, study notes, or blank sheets.
                </p>
                <Link to="/workspace" className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:text-indigo-500 transition-colors inline-flex items-center gap-1 mt-auto">
                  Select Template <ArrowRight className="w-3 h-3" />
                </Link>
              </motion.div>

              {/* Feature 5 */}
              <motion.div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:shadow-md hover:border-indigo-300 transition-all shadow-sm flex flex-col group" variants={itemVariants}>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Local-First Sandbox Privacy</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4 flex-1">
                  Secure by default. All data stays locked in your browser's IndexedDB or desktop keychain folder. Zero external trackers, zero cookies, zero telemetry.
                </p>
                <button onClick={() => handleScroll("privacy")} className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:text-indigo-500 transition-colors inline-flex items-center gap-1 mt-auto text-left cursor-pointer">
                  Privacy details <ArrowRight className="w-3 h-3" />
                </button>
              </motion.div>

              {/* Feature 6 */}
              <motion.div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:shadow-md hover:border-indigo-300 transition-all shadow-sm flex flex-col group" variants={itemVariants}>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">High-Fidelity PDF & PNG Export</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4 flex-1">
                  Export high-resolution images of your layouts or format complete, vector-crisp PDF documents to attach to emails, slide decks, or team briefings.
                </p>
                <Link to="/workspace" className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:text-indigo-500 transition-colors inline-flex items-center gap-1 mt-auto">
                  Export Dashboard <ArrowRight className="w-3 h-3" />
                </Link>
              </motion.div>

            </motion.div>

            {/* APP SCREENSHOTS PREVIEW CAROUSEL */}
            <div className="mt-16 bg-slate-50 border border-slate-200/60 rounded-3xl p-6 sm:p-10 shadow-inner">
              <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">Built for Speed and Structure</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white aspect-[4/3] relative group">
                    <img 
                      src="/readme-assets/mindmap-node-editor-canvas.webp" 
                      alt="Neuron Mapping Mind Map Productivity View" 
                      width={800}
                      height={600}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Visual Mind Map Node Editor</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Manage spry child nodes, trace connection types, write markdown scripts, and customize color weights.</p>
                </div>
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white aspect-[4/3] relative group">
                    <img 
                      src="/readme-assets/advanced-node-styling-properties.webp" 
                      alt="Neuron Mapping Advanced Node Styling options" 
                      width={800}
                      height={600}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Advanced Style Manager</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Adjust layout structures, colors, border widths, shape clouds, and connection flow directions dynamically.</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-20 border-t border-slate-200 bg-slate-50">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
                Up and Running in 3 Steps
              </h2>
              <p className="text-slate-500 text-sm">
                No registrations, no cookies, no subscriptions. Select, design, and save instantly.
              </p>
            </div>

            <motion.div 
              className="grid md:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              {/* Step 1 */}
              <motion.div className="text-center space-y-4 bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm" variants={itemVariants}>
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 mx-auto shadow-sm">
                  <Settings className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Step 1</div>
                <h3 className="text-base font-bold text-slate-900">Select Template</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Pick from SWOT matrixes, study sheets, project roadmaps, or start on an infinite blank grid.
                </p>
              </motion.div>

              {/* Step 2 */}
              <motion.div className="text-center space-y-4 bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm" variants={itemVariants}>
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 mx-auto shadow-sm">
                  <Brain className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Step 2</div>
                <h3 className="text-base font-bold text-slate-900">Map Your Ideas</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Expand child nodes with Tab, edit details with double clicks, write note briefs, and draw sketches.
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div className="text-center space-y-4 bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm" variants={itemVariants}>
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 mx-auto shadow-sm">
                  <FileUp className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Step 3</div>
                <h3 className="text-base font-bold text-slate-900">Export & Share</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Export maps as vector PDFs or images. Save `.nmm` files locally to re-upload and edit later.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* YOUTUBE VIDEO TUTORIAL SECTION */}
        <section id="tutorials" className="py-20 border-t border-slate-200 bg-white">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
                See Neuron Mapping in Action
              </h2>
              <p className="text-slate-500 text-sm">Watch the official walkthrough and feature demo guide</p>
            </div>
            
            <a 
              href="https://youtu.be/tZC3a-83HXI" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Watch Neuron Mapping video walkthrough tutorial on YouTube"
              className="block relative group rounded-3xl overflow-hidden shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300"
            >
              <img 
                src="https://img.youtube.com/vi/tZC3a-83HXI/maxresdefault.jpg" 
                alt="Neuron Mapping Video Tutorial Walkthrough" 
                width={1280}
                height={720}
                className="w-full aspect-video object-cover group-hover:scale-[1.01] transition-transform duration-500"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-indigo-600 fill-indigo-600 ml-1" />
                </div>
              </div>
            </a>
          </div>
        </section>

        {/* WHY CHOOSE NEURON MAPPING - Feature Comparison Table */}
        <section className="py-20 border-t border-slate-200 bg-slate-50">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
                Built for Thinkers, Not Subscriptions
              </h2>
              <p className="text-slate-500 text-sm">Compare Neuron Mapping with generic whiteboards and cloud mapping platforms.</p>
            </div>

            <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
              <table aria-label="Feature comparison table between Neuron Mapping and generic competitors" className="w-full text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50/50">
                    <th className="text-left py-4 px-4 text-slate-500 font-bold uppercase tracking-wider">Feature</th>
                    <th className="py-4 px-4 text-slate-400 font-medium uppercase tracking-wider text-center">Simple Whiteboards</th>
                    <th className="py-4 px-4 text-slate-400 font-medium uppercase tracking-wider text-center">Cloud Mappers</th>
                    <th className="py-4 px-4 text-indigo-700 font-bold uppercase tracking-wider text-center bg-indigo-50/50 rounded-t-lg">Neuron Mapping</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Infinite Mind Map Grid", true, true, true],
                    ["20+ Strategy Templates", false, "partial", true],
                    ["3D Galaxy view", false, false, true],
                    ["100% Offline Capability", "partial", false, true],
                    ["Keyboard Shortcut Driven", "partial", true, true],
                    ["Complete Data Privacy Sandbox", "partial", false, true],
                    ["AGPLv3 Open Source", false, false, true],
                    ["Price", "Free-ish", "$8–15/mo", "Free Forever"],
                  ].map(([feature, simple, cloud, nmm], i) => (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-slate-50/20' : ''}`}>
                      <td className="py-3.5 px-4 font-bold text-slate-700">{feature as string}</td>
                      <td className="py-3.5 px-4 text-center">
                        {simple === true ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> 
                          : simple === "partial" ? <span className="text-[10px] text-amber-500 font-bold uppercase">Partial</span>
                          : simple === "Free-ish" ? <span className="text-[10px] text-slate-400 font-bold">Free-ish</span>
                          : <XIcon className="w-4 h-4 text-slate-300 mx-auto" />}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {cloud === true ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> 
                          : cloud === "partial" ? <span className="text-[10px] text-amber-500 font-bold uppercase">Partial</span>
                          : cloud === "$8–15/mo" ? <span className="text-[10px] text-red-400 font-bold uppercase">$8–15/mo</span>
                          : <XIcon className="w-4 h-4 text-slate-300 mx-auto" />}
                      </td>
                      <td className="py-3.5 px-4 text-center bg-indigo-50/20">
                        {nmm === true ? <Check className="w-5 h-5 text-indigo-600 mx-auto" /> 
                          : nmm === "Free Forever" ? <span className="text-xs font-black text-indigo-700 uppercase">Free Forever</span>
                          : <XIcon className="w-4 h-4 text-slate-300 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* BLOGS SECTION */}
        <section id="blogs" className="py-20 border-t border-slate-200 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
                Maker Articles & Guides
              </h2>
              <p className="text-slate-500 text-sm">
                Practical guides and strategy blogs on maker businesses and tooling from the author.
              </p>
            </div>

            {/* Blogs Grid */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {blogs.map((blog, i) => (
                <a 
                  key={i}
                  href={blog.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <motion.div 
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full"
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      <img 
                        src={blog.image} 
                        alt={blog.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          // Fallback placeholder if image link is block-injected
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=500&q=80";
                        }}
                      />
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2 leading-snug group-hover:text-indigo-600 transition-colors">
                          {blog.title}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
                          {blog.description}
                        </p>
                      </div>
                      <div className="mt-auto pt-2">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                          Read Guide <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </a>
              ))}
            </motion.div>

            <div className="mt-12 text-center">
              <Button variant="outline" asChild className="rounded-xl border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-600 font-bold px-6 h-10 text-xs sm:text-sm cursor-pointer">
                <a href="https://www.rphobbyist.com/blogs/" target="_blank" rel="noopener noreferrer">
                  Explore Creator's Website
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* PRIVACY TRUST SECTION */}
        <section id="privacy" className="py-20 border-t border-slate-200 bg-slate-50 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 lg:px-8 relative z-10">
            <div className="rounded-[2.5rem] border border-slate-250 bg-white p-10 sm:p-16 text-center shadow-sm">
              
              <div className="max-w-xl mx-auto">
                <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-6 shadow-inner">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
                  Local-First, Privacy-Absolute
                </h2>
                
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-8">
                  Neuron Mapping does not collect cookies, log details, or track your brainstorming. All file loading, canvas structuring, and exports run entirely inside your browser sandbox. Your data remains yours.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-6 border-t border-slate-100 pt-8 font-mono text-[10px] text-indigo-700 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-600" /> No Telemetry
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-600" /> Local Encrypted
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-600" /> Open Source AGPL
                  </span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-20 border-t border-slate-200 bg-white">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-slate-500 text-sm">
                Have questions about templates, shortcut controls, or file exports? We have got you covered.
              </p>
            </div>

            {/* Accordion list */}
            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <motion.div 
                    key={index} 
                    className={`border border-slate-200 bg-slate-50/50 rounded-xl overflow-hidden transition-all duration-300 shadow-sm ${isOpen ? 'ring-1 ring-indigo-500/20 bg-white' : ''}`}
                    initial={false}
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      <span className={`text-xs sm:text-sm font-bold tracking-tight transition-colors ${isOpen ? 'text-indigo-700' : 'text-slate-900'}`}>
                        {faq.q}
                      </span>
                      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-indigo-100 text-indigo-600 rotate-180' : 'bg-slate-200/80 text-slate-400'}`}>
                        {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                        >
                          <div className="px-5 pb-5 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

          </div>
        </section>

      </main>

      {/* OPTIMIZED FOOTER */}
      <footer className="bg-slate-100 border-t border-slate-200 pt-12 pb-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12">
            
            {/* Column 1: Brand details (5/12) */}
            <div className="md:col-span-5 space-y-4">
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
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm font-normal">
                Neuron Mapping is the privacy-absolute digital workspace for creative brainstorms, academic strategy, and structured business planning. 100% local, offline-capable, and open-source.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600/80 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Local-First Workspace</span>
              </div>
            </div>

            {/* Column 2: Resources (3/12) */}
            <div className="md:col-span-3 space-y-4">
              <h3 className="text-slate-950 font-bold text-xs uppercase tracking-wider">Resources</h3>
              <ul className="space-y-2 text-slate-450 font-medium">
                <li>
                  <Link to="/workspace" className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Templates
                  </Link>
                </li>
                <li>
                  <Link to="/workspace" className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-slate-400" /> Canvas Editor
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={() => handleScroll("blogs")}
                    className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> Creator Blogs
                  </button>
                </li>
                <li>
                  <a href={SYSTEM_CONFIG.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-slate-400" /> GitHub Repository
                  </a>
                </li>
                <li>
                  <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5">
                    <Map className="w-3.5 h-3.5 text-slate-400" /> Sitemap
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Community & Support (4/12) */}
            <div className="md:col-span-4 space-y-4">
              <h3 className="text-slate-950 font-bold text-xs uppercase tracking-wider">Community & Support</h3>
              <ul className="space-y-2 text-slate-450 font-medium">
                <li>
                  <a href={SYSTEM_CONFIG.youtubeUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5">
                    <Youtube className="w-3.5 h-3.5 text-slate-400" /> Video Walkthrough
                  </a>
                </li>
                <li>
                  <a href={SYSTEM_CONFIG.vendorLink} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" /> Official Website
                  </a>
                </li>
                <li>
                  <a href={`mailto:${SYSTEM_CONFIG.vendorEmail}`} className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Support Contact
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] sm:text-xs text-slate-400 font-medium">
            <div className="flex flex-wrap items-center gap-1.5">
              <span>&copy; {new Date().getFullYear()} {SYSTEM_CONFIG.appName} by <a href={SYSTEM_CONFIG.vendorLink} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-indigo-600 transition-colors font-bold">{SYSTEM_CONFIG.vendor}</a></span>
              <span className="hidden sm:inline text-slate-200">•</span>
              <span className="hidden sm:inline">AGPLv3 Licensed</span>
            </div>
            
            <div className="flex gap-6 items-center">
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">Sitemap</a>
              <button onClick={() => handleScroll("privacy")} className="hover:text-slate-600 transition-colors cursor-pointer">Privacy Sandbox</button>
              <button onClick={() => handleScroll("faq")} className="hover:text-slate-600 transition-colors cursor-pointer">FAQ</button>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
