import { z } from 'zod';
import { Template } from '@/types/templates';
import { MindMapNode, ConnectionStyle } from '@/types/mindmap';
import { MindMapNodeSchema, ConnectionStyleSchema } from '@/lib/schemas';

const STORAGE_KEY = 'neuron-custom-templates';
export const CUSTOM_TEMPLATE_CATEGORY = 'my-templates';

const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  nodes: z.array(MindMapNodeSchema),
  tags: z.array(z.string()).optional(),
  connectionStyle: ConnectionStyleSchema.optional(),
  isCustom: z.boolean().optional(),
});

export function getCustomTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const valid: Template[] = [];
    for (const entry of parsed) {
      const result = TemplateSchema.safeParse(entry);
      if (result.success) {
        valid.push(result.data as Template);
      } else {
        console.error('Skipping invalid custom template:', result.error);
      }
    }
    return valid;
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
 