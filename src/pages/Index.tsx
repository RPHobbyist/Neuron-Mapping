/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

import { LicenseUpdateAnnouncement } from '@/components/feedback/LicenseUpdateAnnouncement';
import { EditorThemeProvider } from '@/components/EditorThemeProvider';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TemplatePicker } from '@/components/templates/TemplatePicker';
import { MindMapCanvas } from '@/components/mindmap/MindMapCanvas';
import { templates } from '@/data/templates';
import { useSavedMaps, SavedMapSummary } from '@/hooks/useSavedMaps';
import {
  clearAutoSave, mapSessionId, readPendingSession, readPendingSessions, renamePendingSession, sessionTitle, PendingSession,
} from '@/hooks/useAutoSave';
import { useDocumentSEO } from '@/hooks/useDocumentSEO';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { registerServiceWorker } from '@/lib/serviceWorker';
import { Template } from '@/types/templates';
import { MindMapNode, ConnectionStyle, Drawing, BoxArea, Viewport } from '@/types/mindmap';
import { saveToFile } from '@/utils/exportUtils';
import { copyName } from '@/utils/mapLibrary';

interface ActiveMap {
  nodes: MindMapNode[];
  connectionStyle: ConnectionStyle;
  drawings?: Drawing[];
  boxAreas?: BoxArea[];
  viewport?: Viewport;
  name?: string;
  id?: string;
  templateId?: string;
  resumed?: boolean;
  sessionId?: string;
}

const Workspace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const templateQuery = searchParams.get('template');

  useDocumentSEO({
    title: "Mind Map Workspace | Neuron Mapping",
    description: "Design and organize your thoughts, workflows, and projects inside the local mind mapping workspace.",
    robots: "noindex, nofollow"
  });

  const [activeMap, setActiveMap] = useState<ActiveMap | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [pendingSessions, setPendingSessions] = useState<PendingSession[]>([]);
  const {
    savedMaps, thumbnails, saveMap, renameMap, duplicateMap, deleteMap, undoDelete, loadMap, reload: reloadSavedMaps,
  } = useSavedMaps();

  useEffect(() => {
    registerServiceWorker((activate) => {
      toast('A new version of Neuron Mapping is ready', {
        description: 'Reload to use it. Unsaved changes stay available to resume.',
        action: { label: 'Reload', onClick: activate },
        duration: Infinity,
      });
    });
  }, []);

  const refreshPendingSessions = useCallback(async () => {
    setPendingSessions(await readPendingSessions());
  }, []);

  useEffect(() => {
    if (!templateQuery || activeMap) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('template');
      return next;
    }, { replace: true });

    const targetTemplate = templates.find((t) => t.id === templateQuery);
    if (!targetTemplate) return;
    setActiveMap({
      nodes: targetTemplate.nodes || [],
      connectionStyle: targetTemplate.connectionStyle || 'curved',
      templateId: targetTemplate.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateQuery]);

  const handleResumeSession = useCallback((session: PendingSession) => {
    setEditorKey(key => key + 1);
    setActiveMap({
      nodes: session.nodes,
      connectionStyle: session.connectionStyle,
      drawings: session.drawings,
      boxAreas: session.boxAreas,
      viewport: session.viewport,
      name: session.name,
      id: session.mapId,
      templateId: session.templateId,
      resumed: true,
      sessionId: session.sessionId,
    });
  }, []);

  const discardSession = useCallback(async (session: PendingSession) => {
    await clearAutoSave(session.sessionId);
    setPendingSessions(prev => prev.filter(s => s.sessionId !== session.sessionId));
  }, []);

  const handleDiscardSession = useCallback(async (session: PendingSession) => {
    if (!window.confirm(`Discard the unsaved changes to "${sessionTitle(session)}"? This cannot be undone.`)) return;
    await discardSession(session);
  }, [discardSession]);

  const handleSelectTemplate = useCallback((template: Template) => {
    setActiveMap({
      nodes: template.nodes || [],
      connectionStyle: template.connectionStyle || 'curved',
      drawings: template.drawings,
      boxAreas: template.boxAreas,
      templateId: template.id,
    });
  }, []);

  const handleSelectSavedMap = useCallback(async (summary: SavedMapSummary) => {
    const session = await readPendingSession(mapSessionId(summary.id));
    if (session) {
      const edited = new Date(session.lastModified).toLocaleString();
      if (window.confirm(`"${summary.name}" has unsaved changes from ${edited}. Open them?`)) {
        handleResumeSession(session);
        return;
      }
      if (!window.confirm(`Discard those unsaved changes and open the last saved version of "${summary.name}"?`)) return;
    }
    const map = await loadMap(summary.id);
    if (!map) {
      toast.error("This map couldn't be opened.");
      return;
    }
    if (session) await discardSession(session);
    setEditorKey(key => key + 1);
    setActiveMap({
      nodes: map.nodes,
      connectionStyle: map.connectionStyle,
      drawings: map.drawings,
      boxAreas: map.boxAreas,
      viewport: map.viewport,
      name: map.name,
      id: map.id,
      templateId: map.templateId,
    });
  }, [handleResumeSession, discardSession, loadMap]);

  const handleRenameSavedMap = useCallback(async (id: string, name: string) => {
    try {
      if (!(await renameMap(id, name))) {
        toast.error("This map couldn't be renamed: it is no longer stored.");
        return;
      }
      await renamePendingSession(mapSessionId(id), name);
      await refreshPendingSessions();
      toast.success(`Renamed to "${name}"`);
    } catch (e) {
      console.error('Failed to rename map:', e);
      toast.error('Failed to rename the map');
    }
  }, [renameMap, refreshPendingSessions]);

  const handleDuplicateSavedMap = useCallback(async (id: string) => {
    const original = savedMaps.find(map => map.id === id);
    if (!original) return;
    try {
      const copy = await duplicateMap(id, copyName(original.name, savedMaps.map(map => map.name)));
      if (copy) toast.success(`Created "${copy.name}"`);
      else toast.error("This map couldn't be duplicated: it is no longer stored.");
    } catch (e) {
      console.error('Failed to duplicate map:', e);
      toast.error('Failed to duplicate the map. Your browser storage may be full.');
    }
  }, [savedMaps, duplicateMap]);

  const handleExportSavedMap = useCallback(async (id: string) => {
    try {
      const map = await loadMap(id);
      if (!map) {
        toast.error("This map couldn't be read.");
        return;
      }
      saveToFile(map.nodes, map.name, map.connectionStyle, map.drawings, map.boxAreas);
      toast.success(`Exported "${map.name}"`);
    } catch (e) {
      console.error('Failed to export map:', e);
      toast.error('Failed to export the map');
    }
  }, [loadMap]);

  const handleDeleteSavedMap = useCallback(async (id: string) => {
    const name = savedMaps.find(map => map.id === id)?.name ?? 'Mind map';
    try {
      const deleted = await deleteMap(id);
      toast.success(`Deleted "${name}"`, {
        duration: 10_000,
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              if (await undoDelete(deleted)) toast.success(`Restored "${name}"`);
              else toast.error(`"${name}" couldn't be restored: a map with the same id has been saved since.`);
            } catch (e) {
              console.error('Failed to restore map:', e);
              toast.error(`Failed to restore "${name}"`);
            }
          },
        },
      });
    } catch (e) {
      console.error('Failed to delete map:', e);
      toast.error('Failed to delete mind map');
    }
  }, [savedMaps, deleteMap, undoDelete]);

  const handleBackToTemplates = useCallback(() => {
    setActiveMap(null);
  }, []);

  const handleLoadFromFile = useCallback(async (nodes: MindMapNode[], name: string, connectionStyle?: ConnectionStyle, drawings?: Drawing[], boxAreas?: BoxArea[]) => {
    setActiveMap({
      nodes,
      connectionStyle: connectionStyle || 'curved',
      drawings,
      boxAreas,
      name,
    });
    return true;
  }, []);

  const handleNameChange = useCallback((name: string) => {
    setActiveMap(prev => prev ? { ...prev, name } : null);
  }, []);

  const handleSave = useCallback(async (name: string, nodes: MindMapNode[], thumbnail: string | undefined, connectionStyle: ConnectionStyle, drawings?: Drawing[], boxAreas?: BoxArea[], viewport?: Viewport): Promise<string | undefined> => {
    if (!activeMap) return undefined;

    const saved = await saveMap(
      name,
      nodes,
      connectionStyle,
      activeMap.templateId,
      activeMap.id,
      thumbnail,
      drawings,
      boxAreas,
      viewport
    );

    setActiveMap(prev => prev ? { ...prev, id: saved.id, name: saved.name, connectionStyle, drawings, boxAreas } : null);
    return saved.id;
  }, [activeMap, saveMap]);

  return (
    <TooltipProvider>
      <ThemedToaster />
      <LicenseUpdateAnnouncement />
      <main className="w-full h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          {activeMap ? (
            <motion.div
              key="canvas"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <MindMapCanvas
                key={editorKey}
                initialNodes={activeMap.nodes}
                initialDrawings={activeMap.drawings}
                initialBoxAreas={activeMap.boxAreas}
                initialViewport={activeMap.viewport}
                onBack={handleBackToTemplates}
                connectionStyle={activeMap.connectionStyle}
                onSave={handleSave}
                onNameChange={handleNameChange}
                mapName={activeMap.name}
                mapId={activeMap.id}
                templateId={activeMap.templateId}
                initiallyDirty={activeMap.resumed}
                sessionId={activeMap.sessionId}
                savedMaps={savedMaps}
                onOpenMap={(id) => {
                  const summary = savedMaps.find(map => map.id === id);
                  if (summary) void handleSelectSavedMap(summary);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="picker"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <TemplatePicker
                onSelectTemplate={handleSelectTemplate}
                savedMaps={savedMaps}
                thumbnails={thumbnails}
                onRestored={reloadSavedMaps}
                onSelectSavedMap={handleSelectSavedMap}
                onRenameSavedMap={handleRenameSavedMap}
                onDuplicateSavedMap={handleDuplicateSavedMap}
                onExportSavedMap={handleExportSavedMap}
                onDeleteSavedMap={handleDeleteSavedMap}
                onLoadFromFile={handleLoadFromFile}
                pendingSessions={pendingSessions}
                onRefreshSessions={refreshPendingSessions}
                onResumeSession={handleResumeSession}
                onDiscardSession={handleDiscardSession}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </TooltipProvider>
  );
};

const ThemedToaster = () => <Sonner theme={useEditorTheme().resolved} />;

const Index = () => (
  <EditorThemeProvider>
    <Workspace />
  </EditorThemeProvider>
);

export default Index;
