export type NodeColor = 'teal' | 'purple' | 'orange' | 'pink' | 'blue' | 'green' | 'red' | 'cyan' | 'yellow' | 'grey' | 'root';

export type NodeShape = 'rounded' | 'rectangle' | 'pill' | 'diamond' | 'hexagon' | 'circle' | 'parallelogram' | 'isometric' | 'cloud';

export type ConnectionStyle = 'curved' | 'straight' | 'orthogonal' | 'dashed' | 'dotted' | 'arrow';

export type LineThickness = 'thin' | 'medium' | 'thick';

export interface Relation {
  targetId: string;
  sourceId?: string; // Optional back-reference if needed
  // Styling overrides for this specific relation
  label?: string;
  type?: ConnectionStyle;
  thickness?: LineThickness;
  color?: string;
  animated?: boolean;
  animationSpeed?: 'slow' | 'medium' | 'fast';
  animationDirection?: 'forward' | 'reverse';
  animationType?: 'dash' | 'arrow' | 'cross';
}

export type NodePriority = 'high' | 'medium' | 'low' | null;

export type NodeAnimation = 'ring' | 'snake' | 'blink';

export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  color: NodeColor;
  parentId: string | null;
  shape?: NodeShape;
  nodeAnimation?: NodeAnimation; // New animation property
  // Line properties for the connection TO this node
  lineType?: ConnectionStyle;
  lineThickness?: LineThickness;
  lineColor?: string; // Custom hex color
  lineLabel?: string; // Text on connection
  lineAnimated?: boolean; // Flowing animation
  lineDouble?: boolean; // Parallel double lines
  lineGradient?: boolean; // Gradient from parent to child
  lineTension?: number; // Bezier curve tension (0-1)
  lineAnimationDirection?: 'forward' | 'reverse'; // NEW
  lineAnimationType?: 'dash' | 'arrow' | 'cross';
  relations?: Relation[]; // Cross-links to other nodes
  width?: number; // Custom width (pixels)
  height?: number; // Custom height (pixels)
  measuredWidth?: number; // Actual rendered width (for auto-sized nodes)
  measuredHeight?: number; // Actual rendered height (for auto-sized nodes)

  // Rich Content
  image?: string; // URL or Base64 data
  icon?: string; // Icon name
  iconStyle?: 'plain' | 'boxed'; // Style of the icon
  link?: string; // External URL
  notes?: string; // Markdown notes

  // Organization
  priority?: NodePriority; // Priority level
  tags?: string[]; // Tags/labels
}

export interface SavedMindMap {
  id: string;
  name: string;
  nodes: MindMapNode[];
  connectionStyle: ConnectionStyle;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string; // Base64 image data
}

export interface MindMapState {
  nodes: MindMapNode[];
  selectedNodeId: string | null;
  zoom: number;
  panX: number;
  panY: number;
  connectionStyle?: ConnectionStyle;
}
