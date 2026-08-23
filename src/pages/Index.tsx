import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

import { TemplatePicker } from '@/components/templates/TemplatePicker';
import { MindMapCanvas } from '@/components/mindmap/MindMapCanvas';
import { templates } from '@/data/templates';
import { useSavedMaps } from '@/hooks/useSavedMaps';
import { clearAutoSave } from '@/hooks/useAutoSave';
import { useDocumentSEO } from '@/hooks/useDocumentSEO';
import { Template } from '@/types/templates';
import { SavedMindMap, MindMapNode, ConnectionStyle, Drawing } from '@/types/mindmap';

interface ActiveMap {
  nodes: MindMapNode[];
  connectionStyle: ConnectionStyle;
  drawings?: Drawing[];
  name?: string;
  id?: string;
  templateId?: string;
}

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const templateQuery = searchParams.get('template');

  useDocumentSEO({
    title: "Mind Map Workspace | Neuron Mapping",
    description: "Design and organize your thoughts, workflows, and projects inside the local mind mapping workspace.",
    robots: "noindex, nofollow",
    canonical: "/workspace"
  });

  const [activeMap, setActiveMap] = useState<ActiveMap | null>(null);
  const { savedMaps, saveMap, deleteMap } = useSavedMaps();

  useEffect(() => {
    if (templateQuery && !activeMap) {
      const targetTemplate = templates.find((t) => t.id === templateQuery);
      if (targetTemplate) {
        clearAutoSave().then(() => {
          setActiveMap({
            nodes: targetTemplate.nodes || [],
            connectionStyle: targetTemplate.connectionStyle || 'curved',
            templateId: targetTemplate.id,
          });
        });
      }
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('template');
        return next;
      }, { replace: true });
    }
  }, [templateQuery]);

  const handleSelectTemplate = useCallback(async (template: Template) => {
    await clearAutoSave();
    setActiveMap({
      nodes: template.nodes || [],
      connectionStyle: template.connectionStyle || 'curved',
      templateId: template.id,
    });
  }, []);

  const handleSelectSavedMap = useCallback(async (map: SavedMindMap) => {
    await clearAutoSave();
    setActiveMap({
      nodes: map.nodes,
      connectionStyle: map.connectionStyle,
      drawings: map.drawings,
      name: map.name,
      id: map.id,
      templateId: map.templateId,
    });
  }, []);

  const handleDeleteSavedMap = useCallback(async (id: string) => {
    try {
      await deleteMap(id);
      toast.success('Mind map deleted');
    } catch (e) {
      console.error('Failed to delete map:', e);
      toast.error('Failed to delete mind map');
    }
  }, [deleteMap]);

  const handleBackToTemplates = useCallback(() => {
    setActiveMap(null);
  }, []);

  const handleLoadFromFile = useCallback(async (nodes: MindMapNode[], name: string, connectionStyle?: ConnectionStyle, drawings?: Drawing[]) => {
    await clearAutoSave();
    setActiveMap({
      nodes,
      connectionStyle: connectionStyle || 'curved',
      drawings,
      name,
    });
  }, []);

  const handleNameChange = useCallback((name: string) => {
    setActiveMap(prev => prev ? { ...prev, name } : null);
  }, []);

  const handleSave = useCallback(async (name: string, nodes: MindMapNode[], thumbnail: string | undefined, connectionStyle: ConnectionStyle, drawings?: Drawing[]) => {
    if (!activeMap) return;

    const saved = await saveMap(
      name,
      nodes,
      connectionStyle,
      activeMap.templateId,
      activeMap.id,
      thumbnail,
      drawings
    );

    setActiveMap(prev => prev ? { ...prev, id: saved.id, name: saved.name, connectionStyle, drawings } : null);
  }, [activeMap, saveMap]);

  return (
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
              initialNodes={activeMap.nodes}
              initialDrawings={activeMap.drawings}
              onBack={handleBackToTemplates}
              connectionStyle={activeMap.connectionStyle}
              onSave={handleSave}
              onNameChange={handleNameChange}
              mapName={activeMap.name}
              mapId={activeMap.id}
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
              onSelectSavedMap={handleSelectSavedMap}
              onDeleteSavedMap={handleDeleteSavedMap}
              onLoadFromFile={handleLoadFromFile}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Index;
 