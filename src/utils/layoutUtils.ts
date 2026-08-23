import { MindMapNode } from '@/types/mindmap';


const CONFIG = {
    HORIZONTAL: {
        PARENT_CHILD_GAP: 200,
        SIBLING_GAP: 60,
    },
    VERTICAL: {
        LEVEL_GAP: 150,
        SIBLING_GAP: 40,
    },
    RADIAL: {
        RING_GAP: 300,
        MIN_ANGLE_GAP: 0.1,
        TREE_SPACING: 1800,
    },
} as const;


interface TreeNode {
    id: string;
    node: MindMapNode;
    children: TreeNode[];
    width: number;
    height: number;
    x: number;
    y: number;
    subtreeHeight?: number;
    subtreeWidth?: number;
    weight?: number;
    angle?: number;
    rx?: number;
    ry?: number;
}

type LayoutDirection = 'horizontal' | 'vertical' | 'radial';


export const autoLayoutNodes = (
    nodes: MindMapNode[],
    direction: LayoutDirection = 'horizontal'
): MindMapNode[] => {
    if (nodes.length === 0) return [];

    const { nodeMap, rootNodes } = buildTree(nodes);
    if (rootNodes.length === 0) return nodes;

    let offsetY = 0;
    let radialOffsetX = 0;
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
                if (radialOffsetX !== 0) {
                    offsetTree(root, radialOffsetX, 0);
                }
                radialOffsetX += CONFIG.RADIAL.TREE_SPACING;
                break;
        }
    });

    return Array.from(nodeMap.values()).map(tn => ({
        ...tn.node,
        x: tn.x,
        y: tn.y
    }));
};


function buildTree(nodes: MindMapNode[]): { nodeMap: Map<string, TreeNode>; rootNodes: TreeNode[] } {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

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

    nodes.forEach(node => {
        const treeNode = nodeMap.get(node.id)!;
        if (node.parentId) {
            const parent = nodeMap.get(node.parentId);
            if (parent) {
                parent.children.push(treeNode);
            } else {
                rootNodes.push(treeNode);
            }
        } else {
            rootNodes.push(treeNode);
        }
    });

    return { nodeMap, rootNodes };
}


function layoutHorizontal(root: TreeNode): void {
    if (root.children.length === 0) {
        root.subtreeHeight = root.height;
        return;
    }

    root.children.forEach(child => calculateSubtreeWeight(child));

    const { left, right } = balanceChildrenByWeight(root.children);

    left.forEach(child => layoutHorizontalBranch(child, 'left'));
    right.forEach(child => layoutHorizontalBranch(child, 'right'));

    positionHorizontalChildren(root, left, 'left');
    positionHorizontalChildren(root, right, 'right');

    const leftHeight = calculateGroupHeight(left);
    const rightHeight = calculateGroupHeight(right);
    root.subtreeHeight = Math.max(root.height, leftHeight, rightHeight);
}

function layoutHorizontalBranch(node: TreeNode, direction: 'left' | 'right'): void {
    if (node.children.length === 0) {
        node.subtreeHeight = node.height;
        return;
    }

    node.children.forEach(child => layoutHorizontalBranch(child, direction));

    const childrenHeight = node.children.reduce((sum, c) => sum + (c.subtreeHeight || c.height), 0)
        + (node.children.length - 1) * CONFIG.HORIZONTAL.SIBLING_GAP;
    node.subtreeHeight = Math.max(node.height, childrenHeight);

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

    const sorted = [...children].sort((a, b) => (b.weight || 1) - (a.weight || 1));

    const left: TreeNode[] = [];
    const right: TreeNode[] = [];
    let leftWeight = 0;
    let rightWeight = 0;

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


function layoutVertical(root: TreeNode): void {
    layoutVerticalBranch(root);
}

function layoutVerticalBranch(node: TreeNode): void {
    if (node.children.length === 0) {
        node.subtreeWidth = node.width;
        node.subtreeHeight = node.height;
        return;
    }

    node.children.forEach(child => layoutVerticalBranch(child));

    const childrenWidth = node.children.reduce((sum, c) => sum + (c.subtreeWidth || c.width), 0)
        + (node.children.length - 1) * CONFIG.VERTICAL.SIBLING_GAP;
    node.subtreeWidth = Math.max(node.width, childrenWidth);

    const maxChildHeight = Math.max(...node.children.map(c => c.subtreeHeight || c.height));
    node.subtreeHeight = node.height + CONFIG.VERTICAL.LEVEL_GAP + maxChildHeight;

    let currentX = -childrenWidth / 2;
    node.children.forEach(child => {
        child.rx = currentX + (child.subtreeWidth || child.width) / 2;
        child.ry = node.height / 2 + CONFIG.VERTICAL.LEVEL_GAP + child.height / 2;
        currentX += (child.subtreeWidth || child.width) + CONFIG.VERTICAL.SIBLING_GAP;
    });
}


function layoutRadial(root: TreeNode): void {
    calculateSubtreeWeight(root);

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

        const angle = currentAngle + childSweep / 2;
        const radius = level * CONFIG.RADIAL.RING_GAP;

        child.x = radius * Math.cos(angle);
        child.y = radius * Math.sin(angle);
        child.angle = angle;

        layoutRadialBranch(child, currentAngle, childSweep, level + 1);

        currentAngle += childSweep;
    });
}


function applyRelativePositions(node: TreeNode, parentX: number, parentY: number): void {
    node.x = parentX + (node.rx || 0);
    node.y = parentY + (node.ry || 0);
    node.children.forEach(child => applyRelativePositions(child, node.x, node.y));
}

function offsetTree(node: TreeNode, dx: number, dy: number): void {
    node.x += dx;
    node.y += dy;
    node.children.forEach(child => offsetTree(child, dx, dy));
}
