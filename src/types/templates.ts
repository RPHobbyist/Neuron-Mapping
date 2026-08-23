import { MindMapNode, ConnectionStyle } from './mindmap';

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  nodes: MindMapNode[];
  tags?: string[];
  connectionStyle?: ConnectionStyle;
  isCustom?: boolean;
}

export type TemplateCategory = {
  id: string;
  name: string;
  isSection?: boolean;
};
