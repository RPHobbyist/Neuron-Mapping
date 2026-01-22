import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Template } from '@/types/templates';
import { SavedMindMap, MindMapNode, ConnectionStyle } from '@/types/mindmap';
import { TemplatePicker } from '@/components/templates/TemplatePicker';
import { MindMapCanvas } from '@/components/mindmap/MindMapCanvas';
import { templateConfigs } from '@/data/templates';
import { useSavedMaps } from '@/hooks/useSavedMaps';
import { clearAutoSave } from '@/hooks/useAutoSave';
import { toast } from 'sonner';

interface ActiveMap {
  nodes: MindMapNode[];
  connectionStyle: ConnectionStyle;
  drawings?: any[];
  name?: string;
  id?: string;
  templateId?: string;
}

const Index = () => {
  const [activeMap, setActiveMap] = useState<ActiveMap | null>(null);
  const { savedMaps, saveMap, deleteMap } = useSavedMaps();

  const handleSelectTemplate = useCallback((template: Template) => {
    // Clear auto-save so the new template isn't overwritten by old data
    clearAutoSave();
    const config = templateConfigs[template.id];
    setActiveMap({
      nodes: template.nodes || [],
      connectionStyle: config?.connectionStyle || 'curved',
      templateId: template.id,
    });
  }, []);

  const handleSelectSavedMap = useCallback((map: SavedMindMap) => {
    // Clear auto-save so the loaded map isn't overwritten by old data
    clearAutoSave();
    setActiveMap({
      nodes: map.nodes,
      connectionStyle: map.connectionStyle,
      drawings: map.drawings,
      name: map.name,
      id: map.id,
      templateId: map.templateId,
    });
  }, []);

  const handleDeleteSavedMap = useCallback((id: string) => {
    deleteMap(id);
    toast.success('Mind map deleted');
  }, [deleteMap]);

  const handleBackToTemplates = useCallback(() => {
    setActiveMap(null);
  }, []);

  const handleLoadFromFile = useCallback((nodes: MindMapNode[], name: string, connectionStyle?: ConnectionStyle, drawings?: any[]) => {
    clearAutoSave();
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

  const handleSave = useCallback((name: string, nodes: MindMapNode[], thumbnail: string | undefined, connectionStyle: ConnectionStyle, drawings?: any[]) => {
    if (!activeMap) return;

    const saved = saveMap(
      name,
      nodes,
      connectionStyle,
      activeMap.templateId,
      activeMap.id,
      thumbnail,
      drawings
    );

    // Update active map with saved id and style
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
