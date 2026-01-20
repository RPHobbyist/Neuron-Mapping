import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Map, Plus, FolderOpen, Upload, Send, Brain, Package, Briefcase, BarChart3, ShoppingCart, Target, Rocket, Lightbulb, ClipboardList, Users, Scale, Route, GitBranch, RefreshCw, MessageSquare, FileText, Grid2X2, AlertTriangle, Truck, Layers, LucideIcon } from 'lucide-react';
import { Template } from '@/types/templates';
import { SavedMindMap, MindMapNode, ConnectionStyle } from '@/types/mindmap';
import { templates } from '@/data/templates';
import { SavedMapCard } from './SavedMapCard';
import { FileUpload } from '../mindmap/FileUpload';
import { loadFromFile, NeuronMindMapFile } from '@/utils/exportUtils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WhatsNewDialog } from '../mindmap/WhatsNewDialog';
import { Footer } from '@/components/layout/Footer';

// Icon mapping for templates
const templateIcons: Record<string, LucideIcon> = {
  'blank-mindmap': Brain,
  'order-fulfillment': Package,
  'business-analyst': Briefcase,
  'market-research': BarChart3,
  'purchase-requisition': ShoppingCart,
  'swot-analysis': Target,
  'product-launch-checklist': ClipboardList,
  'product-launch-radial': Rocket,
  'product-development': Lightbulb,
  'project-management': ClipboardList,
  'employee-onboarding': Users,
  'legal-case': Scale,
  'customer-journey': Route,
  'venn-diagram': GitBranch,
  'cycle-diagram': RefreshCw,
  'six-thinking-hats': MessageSquare,
  'argument-map': FileText,
  'eisenhower-box': Grid2X2,
  'cause-effect': AlertTriangle,
  'supplier-evaluation': Truck,
  'porters-five-forces': Target,
  'layer-stacking': Layers,
};



interface TemplatePickerProps {
  onSelectTemplate: (template: Template) => void;
  savedMaps?: SavedMindMap[];
  onSelectSavedMap?: (map: SavedMindMap) => void;
  onDeleteSavedMap?: (id: string) => void;
  onLoadFromFile?: (nodes: MindMapNode[], name: string, connectionStyle?: ConnectionStyle) => void;
}

export const TemplatePicker = ({
  onSelectTemplate,
  savedMaps = [],
  onSelectSavedMap,
  onDeleteSavedMap,
  onLoadFromFile,
}: TemplatePickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-show suggestion dialog on first visit
  useEffect(() => {
    const hasSeenSuggestion = localStorage.getItem('neuron-suggestion-shown');
    if (!hasSeenSuggestion) {
      // Small delay to let page render first
      const timer = setTimeout(() => {
        setShowSuggestionDialog(true);
        localStorage.setItem('neuron-suggestion-shown', 'true');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery) return templates;
    return templates.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const handleCreateBlank = () => {
    const blank = templates.find(t => t.id === 'blank-mindmap');
    if (blank) onSelectTemplate(blank);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data: NeuronMindMapFile = await loadFromFile(file);
      onLoadFromFile?.(data.nodes, data.name, data.connectionStyle);
      toast.success(`Loaded "${data.name}"`);
    } catch (error) {
      toast.error('Failed to load file. Please select a valid .nmm file.');
    }

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col">
      {/* Simple Header */}
      <header className="bg-white border-b px-8 py-4 flex items-center justify-between flex-shrink-0">
        <a href="https://linktr.ee/RPHobbyist" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src="./logo.svg" alt="Neuron Mapping Logo" className="w-11 h-11 rounded-xl shadow-sm" />
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-bold text-gray-900 leading-none">Neuron Mapping</h1>
            <span className="text-xs text-gray-500 font-medium">by <span className="text-blue-600">Rp Hobbyist</span> • Visualize Your Thoughts & Ideas</span>
          </div>
        </a>
        <div className="flex items-center gap-2">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".nmm,.json"
            className="hidden"
          />
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <FolderOpen className="w-4 h-4" /> Open File
          </button>
          <button
            onClick={handleCreateBlank}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Map
          </button>

          <div className="w-px h-6 bg-border mx-2" />

          <button
            onClick={() => setShowWhatsNew(true)}
            className="breathing-border px-3 py-1.5 rounded-full text-sm font-medium bg-white border border-yellow-400 text-gray-900 hover:bg-yellow-50/50 transition-colors whitespace-nowrap"
          >
            What's New
          </button>
          <WhatsNewDialog open={showWhatsNew} onOpenChange={setShowWhatsNew} />
        </div>
      </header>

      {/* Import Modal */}
      {showImportModal && (
        <FileUpload
          onDataParsed={(nodes) => {
            onLoadFromFile?.(nodes, 'Imported Map', 'curved');
            setShowImportModal(false);
          }}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-8">
          {/* Saved Maps Section */}
          {savedMaps.length > 0 && (
            <section className="mb-12">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                <Map className="w-5 h-5 text-gray-500" /> Recent Maps
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {savedMaps.map(map => (
                  <SavedMapCard
                    key={map.id}
                    map={map}
                    onClick={() => onSelectSavedMap?.(map)}
                    onDelete={() => onDeleteSavedMap?.(map.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Templates Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Start from a template</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  className="pl-9 pr-4 py-2 rounded-lg border bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-8">
              {filtered.map(template => (
                <button
                  key={template.id}
                  onClick={() => onSelectTemplate(template)}
                  className="group text-left bg-white rounded-xl border p-4 hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-4 flex flex-col items-center justify-center border border-gray-100 gap-3">
                    {(() => {
                      const IconComponent = templateIcons[template.id] || Brain;
                      return <IconComponent className="w-12 h-12 text-gray-400 group-hover:text-blue-500 transition-colors" />;
                    })()}
                    <h3 className="font-semibold text-sm text-gray-700 group-hover:text-blue-600 transition-colors text-center px-2">
                      {template.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div >
  );
};
