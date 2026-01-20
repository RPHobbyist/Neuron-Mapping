import { useRef, useState, useMemo } from 'react';
import { useThree, useFrame, ThreeEvent } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { MindMapNode } from '@/types/mindmap';
import { colorStyles } from '@/utils/nodeStyles';
import { iconMap } from '@/utils/iconLibrary';

// Must match projectionScale in layout3d.ts for correct drag behavior
const SCALE_FACTOR = 15;

// Map node colors to actual hex values for 3D label styling
const colorToHex: Record<string, { bg: string; text: string; border: string }> = {
    root: { bg: '#1e293b', text: '#ffffff', border: '#475569' },
    orange: { bg: '#fed7aa', text: '#9a3412', border: '#fb923c' },
    amber: { bg: '#fed7aa', text: '#9a3412', border: '#fb923c' },
    blue: { bg: '#bfdbfe', text: '#1e40af', border: '#3b82f6' },
    sky: { bg: '#bae6fd', text: '#0369a1', border: '#0ea5e9' },
    cyan: { bg: '#a5f3fc', text: '#0e7490', border: '#06b6d4' },
    teal: { bg: '#a5f3fc', text: '#0e7490', border: '#06b6d4' },
    violet: { bg: '#ddd6fe', text: '#5b21b6', border: '#8b5cf6' },
    purple: { bg: '#e9d5ff', text: '#7e22ce', border: '#a855f7' },
    yellow: { bg: '#fef08a', text: '#a16207', border: '#facc15' },
    green: { bg: '#bbf7d0', text: '#15803d', border: '#22c55e' },
    emerald: { bg: '#a7f3d0', text: '#047857', border: '#10b981' },
    lime: { bg: '#d9f99d', text: '#4d7c0f', border: '#84cc16' },
    grey: { bg: '#e2e8f0', text: '#334155', border: '#94a3b8' },
    gray: { bg: '#e2e8f0', text: '#334155', border: '#94a3b8' },
    slate: { bg: '#cbd5e1', text: '#1e293b', border: '#64748b' },
};

interface GalaxyNodeProps {
    node: MindMapNode;
    targetPosition: THREE.Vector3;
    isSelected?: boolean;
    onClick?: (e: ThreeEvent<MouseEvent>) => void;
    onDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
    onMove?: (id: string, x: number, y: number) => void;
}

export const GalaxyNode = ({
    node,
    targetPosition,
    isSelected,
    onClick,
    onDoubleClick,
    onMove
}: GalaxyNodeProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const [active, setActive] = useState(false);

    // Drag Logic
    const { camera, raycaster } = useThree();
    const isDragging = useRef(false);
    const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
    const planeIntersect = new THREE.Vector3();

    // Get color styles for this node
    const nodeColor = node.color || 'orange';
    const isRoot = node.parentId === null;

    // Support custom hex colors (starting with #) or predefined color names
    const isCustomHex = nodeColor.startsWith('#');
    const colorHex = isCustomHex
        ? { bg: nodeColor + '40', text: '#ffffff', border: nodeColor } // Use hex with 25% opacity for bg
        : (colorToHex[nodeColor] || colorToHex.orange);

    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        isDragging.current = true;
        // Cast to unknown then HTMLElement to satisfy TS if the target is indeed capturing events like a DOM element
        // In R3F, sometimes people do this for canvas capture. 
        // Properly, we should capture on the gl.domElement, but let's keep the user's logic structure but typed.
        (e.target as unknown as HTMLElement).setPointerCapture(e.pointerId);
        setActive(true);
        // Cast e to ThreeEvent<MouseEvent> for the callback as they likely expect similar structure
        onClick?.(e as unknown as ThreeEvent<MouseEvent>);
    };

    const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
        isDragging.current = false;
        (e.target as unknown as HTMLElement).releasePointerCapture(e.pointerId);
        setActive(false);
    };

    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (isDragging.current && onMove) {
            raycaster.setFromCamera(e.pointer, camera);
            raycaster.ray.intersectPlane(plane, planeIntersect);
            const newX = planeIntersect.x * SCALE_FACTOR;
            const newY = -planeIntersect.y * SCALE_FACTOR;
            onMove(node.id, newX, newY);
        }
    };

    // Fix: Double Click logic
    const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onDoubleClick?.(e);
    };

    // Rotating ring ref
    const ringRef = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.position.lerp(targetPosition, 0.1);
        }
        if (ringRef.current) {
            ringRef.current.rotation.z += delta * 0.5;
            ringRef.current.rotation.x += delta * 0.2;
        }
    });

    // Resolve icon if present
    const IconComponent = useMemo(() => {
        if (!node.icon) return null;
        return iconMap[node.icon] || null;
    }, [node.icon]);

    // 3D sphere material color
    const sphereColor = new THREE.Color(colorHex.border);

    return (
        <group
            ref={groupRef}
            onPointerDown={(e) => {
                e.stopPropagation();
                setActive(true);
                onClick?.(e as unknown as ThreeEvent<MouseEvent>);
            }}
            onPointerUp={() => setActive(false)}
            onDoubleClick={handleDoubleClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            {/* Glowing sphere */}
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
                <mesh scale={isRoot ? 1.5 : 0.8}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshStandardMaterial
                        color={sphereColor}
                        emissive={sphereColor}
                        emissiveIntensity={hovered || isSelected ? 1.0 : 0.5}
                        roughness={0.4}
                        metalness={0.1}
                    />
                </mesh>

                {/* Outer selection ring */}
                {isSelected && (
                    <mesh ref={ringRef} scale={isRoot ? 2.0 : 1.3}>
                        <torusGeometry args={[1, 0.05, 16, 64]} />
                        <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} />
                    </mesh>
                )}
            </Float>

            {/* Label & Icon */}
            <Html
                position={[0, isRoot ? 1.8 : 1.0, 0]}
                center
                distanceFactor={30}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
                zIndexRange={[100, 0]}
            >
                <div className={`
                    flex flex-col items-center gap-1
                    transform transition-transform duration-200
                    ${hovered || isSelected ? 'scale-110' : 'scale-100'}
                `}>
                    {/* Render Icon if present */}
                    {IconComponent && (
                        <div
                            className="p-1.5 rounded-full backdrop-blur-md mb-1 shadow-lg"
                            style={{
                                backgroundColor: colorHex.bg,
                                borderWidth: '1px',
                                borderColor: colorHex.border
                            }}
                        >

                            <IconComponent className="w-5 h-5" style={{ color: colorHex.text }} />
                        </div>
                    )}

                    <div
                        className="px-3 py-1.5 rounded-lg border shadow-lg whitespace-nowrap flex items-center justify-center"
                        style={{
                            backgroundColor: colorHex.bg,
                            borderColor: colorHex.border,
                            color: colorHex.text,
                            fontSize: isRoot ? '1.25rem' : '0.875rem',
                            fontWeight: isRoot ? 700 : 600
                        }}
                    >
                        {node.text}
                    </div>
                </div>
            </Html>
        </group>
    );
};
