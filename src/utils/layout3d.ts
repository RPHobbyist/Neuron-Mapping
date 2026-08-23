import { MindMapNode } from '@/types/mindmap';
import * as THREE from 'three';

export type LayoutType = '2d-projection' | 'sphere' | 'grid' | 'force';

function seededRandom(seed: string): () => number {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return function next() {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        h ^= h >>> 16;
        return (h >>> 0) / 4294967296;
    };
}

export const calculateLayout = (
    nodes: MindMapNode[],
    type: LayoutType,
    scaleFactor: number = 100
): Record<string, [number, number, number]> => {

    const positions: Record<string, [number, number, number]> = {};
    const count = nodes.length;
    const scale = scaleFactor / 100;

    switch (type) {
        case '2d-projection': {
            const projectionScale = 15;
            nodes.forEach(node => {
                positions[node.id] = [node.x / projectionScale, -node.y / projectionScale, 0];
            });
            break;
        }


        case 'sphere': {
            const root = nodes.find(n => !n.parentId) || nodes[0];

            if (root) positions[root.id] = [0, 0, 0];

            const otherNodes = nodes.filter(n => n.id !== root?.id);
            const n = otherNodes.length;

            if (n === 0) break;

            const radius = Math.max(8, Math.sqrt(n) * 4) * scale;
            const goldenRatio = (1 + Math.sqrt(5)) / 2;
            const angleIncrement = Math.PI * 2 * goldenRatio;

            otherNodes.forEach((node, i) => {
                const t = i / Math.max(n - 1, 1);
                const inclination = Math.acos(1 - 2 * t);
                const azimuth = angleIncrement * i;

                const x = Math.sin(inclination) * Math.cos(azimuth) * radius;
                const y = Math.cos(inclination) * radius;
                const z = Math.sin(inclination) * Math.sin(azimuth) * radius;

                positions[node.id] = [x, y, z];
            });
            break;
        }

        case 'grid': {
            const cols = Math.ceil(Math.pow(count, 1 / 3));
            const gap = 15 * scale;
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
            const tempNodes = nodes.map(n => {
                const rand = seededRandom(n.id);
                return {
                    id: n.id,
                    x: (rand() - 0.5) * 30 * scale,
                    y: (rand() - 0.5) * 30 * scale,
                    z: (rand() - 0.5) * 30 * scale,
                    vx: 0, vy: 0, vz: 0,
                    isRoot: n.parentId === null
                };
            });

            const iterations = 150;
            const repulsion = 80 * scale * scale;
            const attraction = 0.2;
            const centerPull = 0.02;
            const springTargetDist = 4 * scale;

            for (let i = 0; i < iterations; i++) {
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

                nodes.forEach(node => {
                    if (node.parentId) {
                        const child = tempNodes.find(n => n.id === node.id);
                        const parent = tempNodes.find(n => n.id === node.parentId);
                        if (child && parent) {
                            const dx = parent.x - child.x;
                            const dy = parent.y - child.y;
                            const dz = parent.z - child.z;

                            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                            const springForce = (dist - springTargetDist) * attraction;

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

                tempNodes.forEach(n => {
                    if (!n.isRoot) {
                        n.vx -= n.x * centerPull;
                        n.vy -= n.y * centerPull;
                        n.vz -= n.z * centerPull;

                        n.vx *= 0.8;
                        n.vy *= 0.8;
                        n.vz *= 0.8;

                        n.x += n.vx * 0.1;
                        n.y += n.vy * 0.1;
                        n.z += n.vz * 0.1;
                    } else {
                        n.x = 0; n.y = 0; n.z = 0;
                    }
                });
            }

            tempNodes.forEach(n => {
                positions[n.id] = [n.x, n.y, n.z];
            });
            break;
        }
    }

    return positions;
};
 