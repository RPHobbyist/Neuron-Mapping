import { MindMapNode } from '@/types/mindmap';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
    HORIZONTAL: {
        PARENT_CHILD_GAP: 200,  // Gap between parent and child
        SIBLING_GAP: 60,        // Gap between siblings
    },
    VERTICAL: {
        LEVEL_GAP: 150,         // Gap between levels
        SIBLING_GAP: 40,        // Gap between siblings
    },
    RADIAL: {
        RING_GAP: 300,          // Radius increment per level
        MIN_ANGLE_GAP: 0.1,     // Minimum angle between siblings (radians)
    },
} as const;

// =============================================================================
// TYPES
// =============================================================================

interface TreeNode {
    id: string;
    node: MindMapNode;
    children: TreeNode[];
    width: number;
    height: number;
    x: number;
    y: number;
    // Computed during layout
    subtreeHeight?: number;
    subtreeWidth?: number;
    weight?: number;
    angle?: number;
    rx?: number;  // Relative X to parent
    ry?: number;  // Relative Y to parent
}

type LayoutDirection = 'horizontal' | 'vertical' | 'radial';

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Auto-layout nodes in the specified direction.
 * Builds a tree structure, calculates positions, then returns updated nodes.
 */
export const autoLayoutNodes = (
    nodes: MindMapNode[],
    direction: LayoutDirection = 'horizontal'
): MindMapNode[] => {
    if (nodes.length === 0) return [];

    // Build tree structure
    const { nodeMap, rootNodes } = buildTree(nodes);
    if (rootNodes.length === 0) return nodes;

    // Layout each root tree (supports multiple disconnected trees)
    let offsetY = 0;
    rootNodes.forEach(root => {
        switch (direction) {
            case 'horizontal':
                layoutHorizontal(root);
                root.x = 0;
                root.y = offsetY;
                applyRelativePositions(root, 0, offsetY);
                offsetY += (root.subtreeHeight || root.height) + CONFIG.HORIZONTAL.SIBLING_GAP * 2;
                break;
            case 'vertical':
                layoutVertical(root);
                root.x = 0;
                root.y = offsetY;
                applyRelativePositions(root, 0, offsetY);
                offsetY += (root.subtreeHeight || root.height) + CONFIG.VERTICAL.LEVEL_GAP;
                break;
            case 'radial':
                layoutRadial(root);
                // Radial already sets absolute positions from center
                break;
        }
    });

    // Return updated nodes
    return Array.from(nodeMap.values()).map(tn => ({
        ...tn.node,
        x: tn.x,
        y: tn.y
    }));
};

// =============================================================================
// TREE BUILDING
// =============================================================================

function buildTree(nodes: MindMapNode[]): { nodeMap: Map<string, TreeNode>; rootNodes: TreeNode[] } {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Create TreeNode wrappers
    nodes.forEach(node => {
        nodeMap.set(node.id, {
            id: node.id,
            node: { ...node },
            children: [],
            width: node.measuredWidth || node.width || 150,
            height: node.measuredHeight || node.height || 60,
            x: 0,
            y: 0
        });
    });

    // Build parent-child relationships
    nodes.forEach(node => {
        const treeNode = nodeMap.get(node.id)!;
        if (node.parentId) {
            const parent = nodeMap.get(node.parentId);
            if (parent) {
                parent.children.push(treeNode);
            } else {
                // Orphan: treat as root
                rootNodes.push(treeNode);
            }
        } else {
            rootNodes.push(treeNode);
        }
    });

    return { nodeMap, rootNodes };
}

// =============================================================================
// HORIZONTAL LAYOUT (Mind Map Style)
// =============================================================================

function layoutHorizontal(root: TreeNode): void {
    if (root.children.length === 0) {
        root.subtreeHeight = root.height;
        return;
    }

    // Calculate weights for all children first
    root.children.forEach(child => calculateSubtreeWeight(child));

    // Split children into left and right groups, balanced by weight
    const { left, right } = balanceChildrenByWeight(root.children);

    // Recursively layout each side
    left.forEach(child => layoutHorizontalBranch(child, 'left'));
    right.forEach(child => layoutHorizontalBranch(child, 'right'));

    // Position children relative to root
    positionHorizontalChildren(root, left, 'left');
    positionHorizontalChildren(root, right, 'right');

    // Calculate root's subtree height
    const leftHeight = calculateGroupHeight(left);
    const rightHeight = calculateGroupHeight(right);
    root.subtreeHeight = Math.max(root.height, leftHeight, rightHeight);
}

function layoutHorizontalBranch(node: TreeNode, direction: 'left' | 'right'): void {
    if (node.children.length === 0) {
        node.subtreeHeight = node.height;
        return;
    }

    // Recurse first
    node.children.forEach(child => layoutHorizontalBranch(child, direction));

    // Calculate subtree height
    const childrenHeight = node.children.reduce((sum, c) => sum + (c.subtreeHeight || c.height), 0)
        + (node.children.length - 1) * CONFIG.HORIZONTAL.SIBLING_GAP;
    node.subtreeHeight = Math.max(node.height, childrenHeight);

    // Position children relative to this node
    let currentY = -childrenHeight / 2;
    node.children.forEach(child => {
        const dx = node.width / 2 + CONFIG.HORIZONTAL.PARENT_CHILD_GAP + child.width / 2;
        child.rx = direction === 'right' ? dx : -dx;
        child.ry = currentY + (child.subtreeHeight || child.height) / 2;
        currentY += (child.subtreeHeight || child.height) + CONFIG.HORIZONTAL.SIBLING_GAP;
    });
}

function positionHorizontalChildren(parent: TreeNode, children: TreeNode[], direction: 'left' | 'right'): void {
    if (children.length === 0) return;

    const totalHeight = calculateGroupHeight(children);
    let currentY = -totalHeight / 2;

    children.forEach(child => {
        const dx = parent.width / 2 + CONFIG.HORIZONTAL.PARENT_CHILD_GAP + child.width / 2;
        child.rx = direction === 'right' ? dx : -dx;
        child.ry = currentY + (child.subtreeHeight || child.height) / 2;
        currentY += (child.subtreeHeight || child.height) + CONFIG.HORIZONTAL.SIBLING_GAP;
    });
}

function balanceChildrenByWeight(children: TreeNode[]): { left: TreeNode[]; right: TreeNode[] } {
    if (children.length <= 1) {
        return { left: [], right: children };
    }

    // Sort by weight descending for better balancing
    const sorted = [...children].sort((a, b) => (b.weight || 1) - (a.weight || 1));

    const left: TreeNode[] = [];
    const right: TreeNode[] = [];
    let leftWeight = 0;
    let rightWeight = 0;

    // Greedy assignment: add each child to the lighter side
    sorted.forEach(child => {
        const w = child.weight || 1;
        if (leftWeight <= rightWeight) {
            left.push(child);
            leftWeight += w;
        } else {
            right.push(child);
            rightWeight += w;
        }
    });

    return { left, right };
}

function calculateGroupHeight(nodes: TreeNode[]): number {
    if (nodes.length === 0) return 0;
    return nodes.reduce((sum, n) => sum + (n.subtreeHeight || n.height), 0)
        + (nodes.length - 1) * CONFIG.HORIZONTAL.SIBLING_GAP;
}

function calculateSubtreeWeight(node: TreeNode): number {
    if (node.children.length === 0) {
        node.weight = 1;
        return 1;
    }
    node.weight = node.children.reduce((sum, child) => sum + calculateSubtreeWeight(child), 0);
    return node.weight;
}

// =============================================================================
// VERTICAL LAYOUT (Org Chart Style)
// =============================================================================

function layoutVertical(root: TreeNode): void {
    layoutVerticalBranch(root);
}

function layoutVerticalBranch(node: TreeNode): void {
    if (node.children.length === 0) {
        node.subtreeWidth = node.width;
        node.subtreeHeight = node.height;
        return;
    }

    // Recurse first
    node.children.forEach(child => layoutVerticalBranch(child));

    // Calculate subtree dimensions
    const childrenWidth = node.children.reduce((sum, c) => sum + (c.subtreeWidth || c.width), 0)
        + (node.children.length - 1) * CONFIG.VERTICAL.SIBLING_GAP;
    node.subtreeWidth = Math.max(node.width, childrenWidth);

    const maxChildHeight = Math.max(...node.children.map(c => c.subtreeHeight || c.height));
    node.subtreeHeight = node.height + CONFIG.VERTICAL.LEVEL_GAP + maxChildHeight;

    // Position children
    let currentX = -childrenWidth / 2;
    node.children.forEach(child => {
        child.rx = currentX + (child.subtreeWidth || child.width) / 2;
        child.ry = node.height / 2 + CONFIG.VERTICAL.LEVEL_GAP + child.height / 2;
        currentX += (child.subtreeWidth || child.width) + CONFIG.VERTICAL.SIBLING_GAP;
    });
}

// =============================================================================
// RADIAL LAYOUT
// =============================================================================

function layoutRadial(root: TreeNode): void {
    // Calculate weights
    calculateSubtreeWeight(root);

    // Assign angles recursively
    root.x = 0;
    root.y = 0;
    layoutRadialBranch(root, 0, 2 * Math.PI, 1);
}

function layoutRadialBranch(node: TreeNode, startAngle: number, sweep: number, level: number): void {
    if (node.children.length === 0) return;

    const totalWeight = node.weight || 1;
    let currentAngle = startAngle;

    node.children.forEach(child => {
        const childWeight = child.weight || 1;
        const childSweep = Math.max(
            (childWeight / totalWeight) * sweep,
            CONFIG.RADIAL.MIN_ANGLE_GAP
        );

        // Position child at center of its allocated sector
        const angle = currentAngle + childSweep / 2;
        const radius = level * CONFIG.RADIAL.RING_GAP;

        child.x = radius * Math.cos(angle);
        child.y = radius * Math.sin(angle);
        child.angle = angle;

        // Recurse
        layoutRadialBranch(child, currentAngle, childSweep, level + 1);

        currentAngle += childSweep;
    });
}

// =============================================================================
// UTILITIES
// =============================================================================

function applyRelativePositions(node: TreeNode, parentX: number, parentY: number): void {
    node.x = parentX + (node.rx || 0);
    node.y = parentY + (node.ry || 0);
    node.children.forEach(child => applyRelativePositions(child, node.x, node.y));
}
