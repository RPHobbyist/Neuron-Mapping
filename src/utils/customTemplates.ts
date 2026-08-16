import { Template } from '@/types/templates';
import { MindMapNode, ConnectionStyle } from '@/types/mindmap';

const STORAGE_KEY = 'neuron-custom-templates';
export const CUSTOM_TEMPLATE_CATEGORY = 'my-templates';

export function getCustomTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(templates: Template[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function saveCustomTemplate(
  name: string,
  nodes: MindMapNode[],
  connectionStyle: ConnectionStyle
): Template {
  const template: Template = {
    id: `custom-${Date.now()}`,
    name: name.trim() || 'Untitled Template',
    category: CUSTOM_TEMPLATE_CATEGORY,
    description: `Custom template with ${nodes.length} nodes`,
    nodes,
    connectionStyle,
    isCustom: true,
  };
  const existing = getCustomTemplates();
  persist([...existing, template]);
  return template;
}

export function deleteCustomTemplate(id: string): void {
  persist(getCustomTemplates().filter(t => t.id !== id));
}
