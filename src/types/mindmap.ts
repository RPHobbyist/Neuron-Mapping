export type NodeColor = 'teal' | 'purple' | 'orange' | 'pink' | 'blue' | 'green' | 'red' | 'cyan' | 'yellow' | 'grey' | 'root';

export type NodeShape = 'rounded' | 'rectangle' | 'pill' | 'diamond' | 'hexagon' | 'circle' | 'parallelogram' | 'isometric' | 'cloud';

export type ConnectionStyle = 'curved' | 'straight' | 'orthogonal' | 'dashed' | 'dotted' | 'arrow';

export type LineThickness = 'thin' | 'medium' | 'thick';

export type Side = 'left' | 'right' | 'top' | 'bottom';

export interface Relation {
  targetId: string;
  sourceId?: string;
  label?: string;
  type?: ConnectionStyle;
  thickness?: LineThickness;
  color?: string;
  animated?: boolean;
  animationSpeed?: 'slow' | 'medium' | 'fast';
  animationDirection?: 'forward' | 'reverse';
  animationType?: 'dash' | 'arrow' | 'cross';
  arrowDirection?: 'none' | 'forward' | 'reverse' | 'both';
  sourceSide?: Side;
  targetSide?: Side;
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
  nodeAnimation?: NodeAnimation;
  lineType?: ConnectionStyle;
  lineThickness?: LineThickness;
  lineColor?: string;
  lineLabel?: string;
  lineAnimated?: boolean;
  lineDouble?: boolean;
  lineGradient?: boolean;
  lineTension?: number;
  lineAnimationDirection?: 'forward' | 'reverse';
  lineAnimationType?: 'dash' | 'arrow' | 'cross';
  lineArrowDirection?: 'none' | 'forward' | 'reverse' | 'both';
  lineParentSide?: Side;
  lineChildSide?: Side;
  relations?: Relation[];
  width?: number;
  height?: number;
  measuredWidth?: number;
  measuredHeight?: number;

  image?: string;
  icon?: string;
  iconStyle?: 'plain' | 'boxed';
  link?: string;
  notes?: string;

  priority?: NodePriority;
  tags?: string[];
}

export interface SavedMindMap {
  id: string;
  name: string;
  nodes: MindMapNode[];
  connectionStyle: ConnectionStyle;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  drawings?: Drawing[];
}

export interface Drawing {

  id: string;
  points: { x: number, y: number }[];
  color: string;
}
 