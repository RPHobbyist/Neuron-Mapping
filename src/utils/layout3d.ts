import { MindMapNode } from '@/types/mindmap';
import * as THREE from 'three';

export type LayoutType = '2d-projection' | 'sphere' | 'grid' | 'force';

export const calculateLayout = (
    nodes: MindMapNode[],
    type: LayoutType,
    scaleFactor: number = 100 // Normalized scale used in GalaxyView
): Record<string, [number, number, number]> => {

    const positions: Record<string, [number, number, number]> = {};
    const count = nodes.length;

    switch (type) {
        case '2d-projection': {
            // Use smaller divisor to spread nodes apart in 3D space
            // Lower value = more spread out (15 gives good separation for dense maps)
            const projectionScale = 15;
            nodes.forEach(node => {
                positions[node.id] = [node.x / projectionScale, -node.y / projectionScale, 0];
            });
            break;
        }


        case 'sphere': {
            // Improved Radial Sphere Layout - distributes all nodes evenly on a sphere surface
            const root = nodes.find(n => !n.parentId) || nodes[0];

            if (root) positions[root.id] = [0, 0, 0];

            // Get all non-root nodes
            const otherNodes = nodes.filter(n => n.id !== root?.id);
            const n = otherNodes.length;

            if (n === 0) break;

            // Use golden spiral for even distribution on sphere
            const radius = Math.max(8, Math.sqrt(n) * 4); // Scale radius with node count
            const goldenRatio = (1 + Math.sqrt(5)) / 2;
            const angleIncrement = Math.PI * 2 * goldenRatio;

            otherNodes.forEach((node, i) => {
                // Distribute evenly from pole to pole
                const t = i / Math.max(n - 1, 1);
                const inclination = Math.acos(1 - 2 * t); // theta: 0 to PI
                const azimuth = angleIncrement * i; // phi: golden angle spiral

                const x = Math.sin(inclination) * Math.cos(azimuth) * radius;
                const y = Math.cos(inclination) * radius;
                const z = Math.sin(inclination) * Math.sin(azimuth) * radius;

                positions[node.id] = [x, y, z];
            });
            break;
        }

        case 'grid': {
            const cols = Math.ceil(Math.pow(count, 1 / 3));
            const gap = 15; // Increased from 4 for better spacing
            const offset = (cols * gap) / 2;

            nodes.forEach((node, i) => {
                const x = (i % cols) * gap - offset;
                const y = (Math.floor(i / cols) % cols) * gap - offset;
                const z = Math.floor(i / (cols * cols)) * gap - offset;
                positions[node.id] = [x, y, z];
            });
            break;
        }

        case 'force': {
            // Enhanced Force-Directed Layout
            // 1. Initialize random positions with better spread
            const tempNodes = nodes.map(n => ({
                id: n.id,
                x: (Math.random() - 0.5) * 30, // Wider spread
                y: (Math.random() - 0.5) * 30,
                z: (Math.random() - 0.5) * 30,
                vx: 0, vy: 0, vz: 0,
                isRoot: n.parentId === null
            }));

            // 2. Iterate
            const iterations = 150; // More iterations for stability
            const repulsion = 80;    // Stronger repulsion
            const attraction = 0.2;  // Weaker attraction for wider tree
            const centerPull = 0.02; // Weaker center pull

            for (let i = 0; i < iterations; i++) {
                // Repulsion (All nodes repel)
                for (let a = 0; a < count; a++) {
                    for (let b = a + 1; b < count; b++) {
                        const n1 = tempNodes[a];
                        const n2 = tempNodes[b];
                        const dx = n1.x - n2.x;
                        const dy = n1.y - n2.y;
                        const dz = n1.z - n2.z;
                        const distSq = dx * dx + dy * dy + dz * dz + 0.1;
                        const force = repulsion / distSq;

                        const fx = (dx / Math.sqrt(distSq)) * force;
                        const fy = (dy / Math.sqrt(distSq)) * force;
                        const fz = (dz / Math.sqrt(distSq)) * force;

                        if (!n1.isRoot) { n1.vx += fx; n1.vy += fy; n1.vz += fz; }
                        if (!n2.isRoot) { n2.vx -= fx; n2.vy -= fy; n2.vz -= fz; }
                    }
                }

                // Attraction (Parent-Child)
                nodes.forEach(node => {
                    if (node.parentId) {
                        const child = tempNodes.find(n => n.id === node.id);
                        const parent = tempNodes.find(n => n.id === node.parentId);
                        if (child && parent) {
                            const dx = parent.x - child.x;
                            const dy = parent.y - child.y;
                            const dz = parent.z - child.z;

                            // Distance based spring
                            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                            const springForce = (dist - 4) * attraction; // Target distance of 4 units

                            const fx = (dx / dist) * springForce;
                            const fy = (dy / dist) * springForce;
                            const fz = (dz / dist) * springForce;

                            child.vx += fx;
                            child.vy += fy;
                            child.vz += fz;

                            if (!parent.isRoot) {
                                parent.vx -= fx;
                                parent.vy -= fy;
                                parent.vz -= fz;
                            }
                        }
                    }
                });

                // Center Pull & Update
                tempNodes.forEach(n => {
                    if (!n.isRoot) {
                        n.vx -= n.x * centerPull;
                        n.vy -= n.y * centerPull;
                        n.vz -= n.z * centerPull;

                        // Damping
                        n.vx *= 0.8; // More damping
                        n.vy *= 0.8;
                        n.vz *= 0.8;

                        n.x += n.vx * 0.1;
                        n.y += n.vy * 0.1;
                        n.z += n.vz * 0.1;
                    } else {
                        // Root fixes at 0
                        n.x = 0; n.y = 0; n.z = 0;
                    }
                });
            }

            // 3. Map back
            tempNodes.forEach(n => {
                positions[n.id] = [n.x, n.y, n.z];
            });
            break;
        }
    }

    return positions;
};
