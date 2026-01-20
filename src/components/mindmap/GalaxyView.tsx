import { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { MindMapNode } from '@/types/mindmap';
import { calculateLayout, LayoutType } from '@/utils/layout3d';
import { GalaxyNode } from './3d/GalaxyNode';
import { GalaxyConnection } from './3d/GalaxyConnection';

import { ThreeEvent } from '@react-three/fiber';

// ...

interface GalaxyViewProps {
    nodes: MindMapNode[];
    selectedNodeIds?: Set<string>;
    onNodeClick?: (nodeId: string, e: ThreeEvent<MouseEvent>) => void;
    onNodeDoubleClick?: (nodeId: string) => void;
    onNodeMove?: (id: string, x: number, y: number) => void;
    onLineSelect?: (sourceId: string, targetId: string, relationId?: string) => void;
    onExit?: () => void;
}

const SCALE_FACTOR = 100;

export function GalaxyView({
    nodes,
    selectedNodeIds,
    onNodeClick,
    onNodeDoubleClick,
    onNodeMove,
    onLineSelect,
    onExit
}: GalaxyViewProps) {
    const [layoutMode, setLayoutMode] = useState<LayoutType>('2d-projection');

    const targetPositions = useMemo(() => {
        return calculateLayout(nodes, layoutMode, SCALE_FACTOR);
    }, [nodes, layoutMode]);

    return (
        <div className="w-full h-full bg-slate-950 relative">
            {/* UI Controls */}
            <div className="absolute top-4 right-4 z-50 flex gap-2 items-center">
                <div className="bg-black/60 backdrop-blur text-white/80 text-xs px-1 py-1 rounded-lg border border-white/10 flex items-center">
                    <select
                        value={layoutMode}
                        onChange={(e) => setLayoutMode(e.target.value as LayoutType)}
                        className="bg-transparent border-none outline-none text-white text-xs cursor-pointer px-2 [&>option]:bg-slate-900 [&>option]:text-white"
                    >
                        <option value="2d-projection">2D Projection</option>
                        <option value="sphere">Sphere</option>
                        <option value="grid">Grid</option>
                        <option value="force">Force Field</option>
                    </select>
                </div>

                <button
                    onClick={onExit}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-colors border border-white/10"
                >
                    Exit 3D View
                </button>
            </div>

            <Canvas camera={{ position: [0, 0, 20], fov: 50 }} dpr={[1, 2]}>
                <color attach="background" args={['#020617']} />

                {/* Atmosphere */}
                <fog attach="fog" args={['#020617', 50, 400]} />
                <Stars radius={150} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />

                <Sparkles count={200} scale={200} size={6} speed={0.4} opacity={0.2} color="#ffffff" />

                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
                <pointLight position={[-10, -10, -5]} intensity={3} color="#4f46e5" />
                <pointLight position={[0, 20, 0]} intensity={1} color="#c084fc" />

                <OrbitControls makeDefault enableDamping dampingFactor={0.05} maxDistance={500} minDistance={5} />

                <group>
                    {/* Nodes */}
                    {nodes.map(node => {
                        const pos = targetPositions[node.id] || [0, 0, 0];
                        return (
                            <GalaxyNode
                                key={node.id}
                                node={node}
                                targetPosition={new THREE.Vector3(...pos)}
                                isSelected={selectedNodeIds?.has(node.id)}
                                onClick={(e) => onNodeClick?.(node.id, e)}
                                onDoubleClick={onNodeDoubleClick ? (e) => onNodeDoubleClick(node.id) : undefined}
                                onMove={layoutMode === '2d-projection' ? onNodeMove : undefined}
                            />
                        );
                    })}

                    {/* Parent-Child Connections */}
                    {nodes.map(node => {
                        if (!node.parentId) return null;
                        const parent = nodes.find(n => n.id === node.parentId);
                        if (!parent) return null;

                        const startPos = new THREE.Vector3(...(targetPositions[parent.id] || [0, 0, 0]));
                        const endPos = new THREE.Vector3(...(targetPositions[node.id] || [0, 0, 0]));

                        return (
                            <GalaxyConnection
                                key={`${parent.id}-${node.id}`}
                                startPos={startPos}
                                endPos={endPos}
                                onSelect={(e) => onLineSelect?.(parent.id, node.id)}
                            />
                        );
                    })}

                    {/* Relations (Loops/Cross-links) */}
                    {nodes.flatMap(node => (
                        (node.relations || []).map((relation, idx) => {
                            const target = nodes.find(n => n.id === relation.targetId);
                            if (!target) return null;

                            const startPos = new THREE.Vector3(...(targetPositions[node.id] || [0, 0, 0]));
                            const endPos = new THREE.Vector3(...(targetPositions[target.id] || [0, 0, 0]));

                            return (
                                <GalaxyConnection
                                    key={`rel-${node.id}-${target.id}-${idx}`}
                                    startPos={startPos}
                                    endPos={endPos}
                                    color={relation.color || '#f59e0b'}
                                    onSelect={(e) => onLineSelect?.(node.id, target.id, `rel::${node.id}::${target.id}`)}
                                />
                            );
                        })
                    ))}
                </group>
            </Canvas>
        </div>
    );
}
