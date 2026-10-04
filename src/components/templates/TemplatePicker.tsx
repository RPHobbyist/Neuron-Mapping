/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, Map, Plus, FolderOpen, Upload, Trash2, Bookmark, History } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

import { Footer } from '@/components/layout/Footer';
import { templates, categories } from '@/data/templates';
import { Template } from '@/types/templates';
import { MindMapNode, ConnectionStyle, Drawing, BoxArea } from '@/types/mindmap';
import { getCustomTemplates, deleteCustomTemplate } from '@/utils/customTemplates';
import { loadFromFile, NeuronMindMapFile } from '@/utils/exportUtils';
import { maxImportSize } from '@/utils/importFile';
import { parseFile } from '@/utils/parsers';
import { autoLayoutNodes } from '@/utils/layoutUtils';
import { sessionTitle, type PendingSession } from '@/hooks/useAutoSave';
import type { SavedMapSummary } from '@/hooks/useSavedMaps';
import { listMaps, MAP_SORT_ORDERS, MapSortOrder, readPinnedMaps, writePinnedMaps } from '@/utils/mapLibrary';

import { BackupBar } from './BackupBar';
import { RenameMapDialog } from './RenameMapDialog';
import { SavedMapCard } from './SavedMapCard';
import { DynamicTemplatePreview } from './DynamicTemplatePreview';
import { FileUpload } from '../mindmap/FileUpload';
import { WhatsNewDialog } from '../mindmap/WhatsNewDialog';
import { ThemeToggle } from '../mindmap/ThemeToggle';
import { NeuronLogo } from '../common/NeuronLogo';

interface TemplatePickerProps {
  onSelectTemplate: (template: Template) => void;
  savedMaps?: SavedMapSummary[];
  thumbnails?: Record<string, string>;
  onSelectSavedMap?: (map: SavedMapSummary) => void;
  onRenameSavedMap?: (id: string, name: string) => void;
  onDuplicateSavedMap?: (id: string) => void;
  onExportSavedMap?: (id: string) => void;
  onDeleteSavedMap?: (id: string) => void;
  onRestored?: () => void;
  onLoadFromFile?: (nodes: MindMapNode[], name: string, connectionStyle?: ConnectionStyle, drawings?: Drawing[], boxAreas?: BoxArea[]) => Promise<boolean> | void;
  pendingSessions?: PendingSession[];
  onRefreshSessions?: () => void;
  onResumeSession?: (session: PendingSession) => void;
  onDiscardSession?: (session: PendingSession) => void;
}

const MAP_SORT_KEY = 'neuron-maps-sort';

const readMapSort = (): MapSortOrder => {
  try {
    const stored = localStorage.getItem(MAP_SORT_KEY);
    return MAP_SORT_ORDERS.find(order => order.value === stored)?.value ?? 'updated';
  } catch {
    return 'updated';
  }
};

export const TemplatePicker = ({
  onSelectTemplate,
  savedMaps = [],
  thumbnails = {},
  onSelectSavedMap,
  onRenameSavedMap,
  onDuplicateSavedMap,
  onExportSavedMap,
  onDeleteSavedMap,
  onRestored,
  onLoadFromFile,
  pendingSessions = [],
  onRefreshSessions,
  onResumeSession,
  onDiscardSession,
}: TemplatePickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [mapQuery, setMapQuery] = useState('');
  const [mapSort, setMapSort] = useState<MapSortOrder>(readMapSort);
  const [renamingMap, setRenamingMap] = useState<SavedMapSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pinnedMaps, setPinnedMaps] = useState<Set<string>>(readPinnedMaps);
  const shownMaps = useMemo(() => listMaps(savedMaps, mapQuery, mapSort, pinnedMaps), [savedMaps, mapQuery, mapSort, pinnedMaps]);
  const togglePin = (id: string) => {
    const next = new Set(pinnedMaps);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const kept = new Set([...next].filter(pinnedId => savedMaps.some(map => map.id === pinnedId)));
    setPinnedMaps(kept);
    writePinnedMaps(kept);
  };

  const changeMapSort = (order: MapSortOrder) => {
    setMapSort(order);
    try {
      localStorage.setItem(MAP_SORT_KEY, order);
    } catch {
    }
  };

  const reloadCustomTemplates = useCallback(async () => {
    try {
      setCustomTemplates(await getCustomTemplates());
    } catch (e) {
      console.error('Failed to load custom templates:', e);
    }
  }, []);

  useEffect(() => {
    reloadCustomTemplates();
  }, [reloadCustomTemplates]);

  const handleRestored = () => {
    reloadCustomTemplates();
    onRestored?.();
    onRefreshSessions?.();
  };

  useEffect(() => {
    onRefreshSessions?.();
  }, [onRefreshSessions]);

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

  const handleDeleteCustomTemplate = async (id: string) => {
    try {
      await deleteCustomTemplate(id);
      setCustomTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted');
    } catch {
      toast.error('Failed to delete the template');
    }
  };

  const handleCreateBlank = () => {
    const blank = templates.find(t => t.id === 'blank-mindmap');
    if (blank) onSelectTemplate(blank);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const maxSize = maxImportSize(file.name);
    if (file.size > maxSize) {
      toast.error(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
      return;
    }

    try {
      let opened = false;
      let name: string;
      try {
        const data: NeuronMindMapFile = await loadFromFile(file);
        name = data.name;
        opened = (await onLoadFromFile?.(data.nodes, data.name, data.connectionStyle, data.drawings, data.boxAreas)) === true;
      } catch (error) {
        if (!file.name.toLowerCase().endsWith('.json')) throw error;
        const nodes = await parseFile(file);
        if (nodes.length === 0) throw error;
        name = file.name.replace(/\.json$/i, '');
        opened = (await onLoadFromFile?.(autoLayoutNodes(nodes, 'horizontal'), name)) === true;
      }
      if (opened) toast.success(`Loaded "${name}"`);
    } catch (error) {
      toast.error('Failed to load file. Please select a valid .nmm or .json file.');
    }
  };

  return (
    <div className="h-screen w-screen bg-muted/50 flex flex-col">
      <header className="bg-card border-b px-8 py-4 flex items-center justify-between flex-shrink-0">
        <div
          onClick={(e) => {
            e.preventDefault();
            window.location.reload();
          }}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <Link to="/" aria-label="Neuron Mapping home" onClick={(e) => e.stopPropagation()} className="rounded-xl">
            <NeuronLogo className="w-11 h-11 rounded-xl shadow-sm" />
          </Link>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-bold text-foreground leading-none">Neuron Mapping</h1>
            <span className="text-xs text-muted-foreground font-medium">by <a href="https://www.rphobbyist.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline relative z-10" onClick={(e) => e.stopPropagation()}>RP Hobbyist</a></span>
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
            className="bg-muted text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted-foreground/15 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-muted text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted-foreground/15 transition-colors flex items-center gap-2"
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

          <ThemeToggle />

          <button
            onClick={() => setShowWhatsNew(true)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
          >
            What's New
          </button>
          <WhatsNewDialog open={showWhatsNew} onOpenChange={setShowWhatsNew} />
        </div>
      </header>

      {showImportModal && (
        <FileUpload
          onDataParsed={async (nodes, meta) => {
            const opened = await onLoadFromFile?.(nodes, meta?.name || 'Imported Map', meta?.connectionStyle || 'curved', meta?.drawings, meta?.boxAreas);
            return opened !== false;
          }}
          onClose={() => setShowImportModal(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-8">
          {pendingSessions.length > 0 && (
            <section className="mb-12" aria-labelledby="unsaved-changes-heading">
              <h2 id="unsaved-changes-heading" className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Unsaved changes
              </h2>
              <ul className="space-y-2">
                {pendingSessions.map((session) => {
                  const title = sessionTitle(session);
                  return (
                    <li
                      key={session.sessionId}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{title}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.mapId ? 'Edited since it was saved' : 'Not saved yet'} · {session.nodes.length} nodes · last edited {new Date(session.lastModified).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onDiscardSession?.(session)}
                          aria-label={`Discard the unsaved changes to ${title}`}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium text-foreground hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                        >
                          Discard
                        </button>
                        <button
                          onClick={() => onResumeSession?.(session)}
                          aria-label={`Resume ${title}`}
                          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Resume
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <BackupBar mapCount={savedMaps.length} onRestored={handleRestored} />

          {savedMaps.length > 0 && (
            <section className="mb-12" aria-labelledby="saved-maps-heading">
              <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                <h2 id="saved-maps-heading" className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Map className="w-5 h-5 text-muted-foreground" /> Your Maps
                  <span className="text-sm font-normal text-muted-foreground">({savedMaps.length})</span>
                </h2>
                {savedMaps.length > 1 && (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="saved-map-search-input"
                        name="saved-map-search"
                        type="search"
                        placeholder="Search your maps..."
                        aria-label="Search your maps"
                        className="pl-9 pr-3 py-2 rounded-lg border bg-card text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={mapQuery}
                        onChange={e => setMapQuery(e.target.value)}
                      />
                    </div>
                    <select
                      id="saved-map-sort-select"
                      name="saved-map-sort"
                      aria-label="Sort your maps"
                      value={mapSort}
                      onChange={e => changeMapSort(e.target.value as MapSortOrder)}
                      className="py-2 pl-3 pr-2 rounded-lg border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      {MAP_SORT_ORDERS.map(order => (
                        <option key={order.value} value={order.value}>{order.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {shownMaps.length === 0 ? (
                <div className="text-center py-10 bg-card rounded-xl border">
                  <p className="text-sm text-muted-foreground">None of your maps is called that.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {shownMaps.map(map => (
                    <SavedMapCard
                      key={map.id}
                      map={map}
                      thumbnail={thumbnails[map.id]}
                      onOpen={() => onSelectSavedMap?.(map)}
                      onRename={() => setRenamingMap(map)}
                      onDuplicate={() => onDuplicateSavedMap?.(map.id)}
                      onExport={() => onExportSavedMap?.(map.id)}
                      onDelete={() => onDeleteSavedMap?.(map.id)}
                      pinned={pinnedMaps.has(map.id)}
                      onTogglePin={() => togglePin(map.id)}
                    />
                  ))}
                </div>
              )}
              <RenameMapDialog
                name={renamingMap?.name ?? null}
                onClose={() => setRenamingMap(null)}
                onRename={(name) => renamingMap && onRenameSavedMap?.(renamingMap.id, name)}
              />
            </section>
          )}

          {filteredCustom.length > 0 && (
            <section className="mb-12">
              <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-muted-foreground" /> My Templates
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredCustom.map(template => (
                  <div key={template.id} className="group relative">
                    <button
                      onClick={() => onSelectTemplate(template)}
                      className="w-full text-left bg-card rounded-xl border p-4 hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <div className="aspect-[4/3] bg-muted/40 rounded-lg mb-4 border border-border overflow-hidden">
                        <DynamicTemplatePreview nodes={template.nodes} />
                      </div>
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomTemplate(template.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-card/90 border text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
                      title="Delete template"
                      aria-label={`Delete the template ${template.name}`}
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
              <h2 className="text-lg font-semibold text-foreground">Start from a template</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="template-search-input"
                  name="template-search"
                  type="text"
                  placeholder="Search templates..."
                  className="pl-9 pr-4 py-2 rounded-lg border bg-card text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-card text-muted-foreground border hover:bg-muted'}`}
              >
                All ({templates.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-card text-muted-foreground border hover:bg-muted'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-xl border">
                <p className="text-sm text-muted-foreground">No templates found. Try a different search or category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-8">
                {filtered.map(template => (
                  <button
                    key={template.id}
                    onClick={() => onSelectTemplate(template)}
                    className="group text-left bg-card rounded-xl border p-4 hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <div className="aspect-[4/3] bg-muted/40 rounded-lg mb-4 border border-border overflow-hidden">
                      <DynamicTemplatePreview nodes={template.nodes} />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
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
 