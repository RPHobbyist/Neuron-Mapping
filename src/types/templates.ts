import { MindMapNode, ConnectionStyle } from './mindmap';

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  nodes: MindMapNode[];
  // Search/filter keywords beyond what's already in name/description (synonyms,
  // methodology names, abbreviations like "okr" or "bmc").
  tags?: string[];
  // Connector style this template was authored for. Falls back to 'curved'
  // where omitted.
  connectionStyle?: ConnectionStyle;
  // True for user-saved templates (stored in localStorage), which the picker
  // renders in a separate "My Templates" section with a delete action.
  isCustom?: boolean;
}

export type TemplateCategory = {
  id: string;
  name: string;
  isSection?: boolean;
};
