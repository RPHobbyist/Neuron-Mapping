import { MindMapNode } from './mindmap';

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  nodes: MindMapNode[];
  preview: 'mindmap' | 'concept' | 'organigram' | 'fishbone' | 'timeline' | 'outline' | 'gantt' | 'websitePlanning' | 'marketingPlan' | 'swot' | 'businessAnalyst' | 'marketResearch' | 'portersForces' | 'supplierEvaluation' | 'productLaunchChecklist' | 'productLaunchRadial' | 'productDevelopment' | 'customerJourney' | 'eisenhowerBox' | 'cycleDiagram' | 'sixThinkingHats' | 'argumentMap' | 'vennDiagram' | 'layerStacking';
}

export type TemplateCategory = {
  id: string;
  name: string;
  isSection?: boolean;
};
