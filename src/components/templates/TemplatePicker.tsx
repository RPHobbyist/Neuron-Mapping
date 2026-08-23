import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Map, Plus, FolderOpen, Upload, Trash2, Bookmark } from 'lucide-react';
import { toast } from 'sonner';

import { Footer } from '@/components/layout/Footer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { templates, categories } from '@/data/templates';
import { MAX_FILE_SIZE } from '@/lib/constants';
import { Template } from '@/types/templates';
import { SavedMindMap, MindMapNode, ConnectionStyle, Drawing } from '@/types/mindmap';
import { getCustomTemplates, deleteCustomTemplate } from '@/utils/customTemplates';
import { loadFromFile, NeuronMindMapFile } from '@/utils/exportUtils';

import { SavedMapCard } from './SavedMapCard';
import { DynamicTemplatePreview } from './DynamicTemplatePreview';
import { FileUpload } from '../mindmap/FileUpload';
import { WhatsNewDialog } from '../mindmap/WhatsNewDialog';
import { NeuronLogo } from '../common/NeuronLogo';

interface TemplatePickerProps {
  onSelectTemplate: (template: Template) => void;
  savedMaps?: SavedMindMap[];
  onSelectSavedMap?: (map: SavedMindMap) => void;
  onDeleteSavedMap?: (id: string) => void;
  onLoadFromFile?: (nodes: MindMapNode[], name: string, connectionStyle?: ConnectionStyle, drawings?: Drawing[]) => void;
}

export const TemplatePicker = ({
  onSelectTemplate,
  savedMaps = [],
  onSelectSavedMap,
  onDeleteSavedMap,
  onLoadFromFile,
}: TemplatePickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<Template[]>(() => getCustomTemplates());

  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hasSeenSuggestion = localStorage.getItem('neuron-suggestion-shown');
    if (!hasSeenSuggestion) {
      const timer = setTimeout(() => {
        setShowSuggestionDialog(true);
        localStorage.setItem('neuron-suggestion-shown', 'true');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const matchesQuery = (t: Template, q: string) =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    (t.tags?.some(tag => tag.toLowerCase().includes(q)) ?? false);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return templates.filter(t => {
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      return !q || matchesQuery(t, q);
    });
  }, [searchQuery, selectedCategory]);

  const filteredCustom = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return customTemplates.filter(t => !q || matchesQuery(t, q));
  }, [customTemplates, searchQuery]);

  const handleDeleteCustomTemplate = (id: string) => {
    deleteCustomTemplate(id);
    setCustomTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted');
  };

  const handleCreateBlank = () => {
    const blank = templates.find(t => t.id === 'blank-mindmap');
    if (blank) onSelectTemplate(blank);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return;
    }

    try {
      const data: NeuronMindMapFile = await loadFromFile(file);
      onLoadFromFile?.(data.nodes, data.name, data.connectionStyle, data.drawings);
      toast.success(`Loaded "${data.name}"`);
    } catch (error) {
      toast.error('Failed to load file. Please select a valid .nmm file.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-8 py-4 flex items-center justify-between flex-shrink-0">
        <div
          onClick={(e) => {
            e.preventDefault();
            window.location.reload();
          }}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <NeuronLogo className="w-11 h-11 rounded-xl shadow-sm" />
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-bold text-gray-900 leading-none">Neuron Mapping</h1>
            <span className="text-xs text-gray-500 font-medium">by <a href="https://www.rphobbyist.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline relative z-10" onClick={(e) => e.stopPropagation()}>RP Hobbyist</a> • Visualize Your Thoughts & Ideas</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="template-file-input"
            name="template-file"
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

      {showImportModal && (
        <FileUpload
          onDataParsed={(nodes, meta) => {
            onLoadFromFile?.(nodes, meta?.name || 'Imported Map', meta?.connectionStyle || 'curved', meta?.drawings);
            setShowImportModal(false);
          }}
          onClose={() => setShowImportModal(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-8">
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

          {filteredCustom.length > 0 && (
            <section className="mb-12">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-gray-500" /> My Templates
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredCustom.map(template => (
                  <div key={template.id} className="group relative">
                    <button
                      onClick={() => onSelectTemplate(template)}
                      className="w-full text-left bg-white rounded-xl border p-4 hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-4 border border-gray-100 overflow-hidden">
                        <DynamicTemplatePreview nodes={template.nodes} />
                      </div>
                      <h3 className="font-semibold text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomTemplate(template.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 border text-gray-400 hover:text-red-600 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <h2 className="text-lg font-semibold text-gray-900">Start from a template</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="template-search-input"
                  name="template-search"
                  type="text"
                  placeholder="Search templates..."
                  className="pl-9 pr-4 py-2 rounded-lg border bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-100'}`}
              >
                All ({templates.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-100'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border">
                <p className="text-sm text-gray-500">No templates found. Try a different search or category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-8">
                {filtered.map(template => (
                  <button
                    key={template.id}
                    onClick={() => onSelectTemplate(template)}
                    className="group text-left bg-white rounded-xl border p-4 hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-4 border border-gray-100 overflow-hidden">
                      <DynamicTemplatePreview nodes={template.nodes} />
                    </div>
                    <h3 className="font-semibold text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div >
  );
};
