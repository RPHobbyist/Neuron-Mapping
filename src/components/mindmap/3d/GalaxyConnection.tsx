import { useRef, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Line, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import { Line2 } from 'three-stdlib';

interface GalaxyConnectionProps {
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    color?: string;
    onSelect?: (e: ThreeEvent<MouseEvent>) => void;
}

export const GalaxyConnection = ({
    startPos,
    endPos,
    color = '#94a3b8',
    onSelect
}: GalaxyConnectionProps) => {
    // 3D Line Animation logic
    // Using explicit ref-based updates avoids React render cycles for smooth 60fps

    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const currentStart = useRef(startPos.clone());
    const currentEnd = useRef(endPos.clone());
    const controlPoint = useMemo(() => new THREE.Vector3(), []);
    const curvePoints = useMemo(() => [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], []);

    useFrame((state) => {
        // 1. Lerp positions
        currentStart.current.lerp(startPos, 0.1);
        currentEnd.current.lerp(endPos, 0.1);

        // Calculate Control Point (Simple outward arc)
        // Midpoint
        controlPoint.copy(currentStart.current).add(currentEnd.current).multiplyScalar(0.5);
        // Desired bulge: proportional to distance, direction away from world center (0,0,0)
        const len = currentStart.current.distanceTo(currentEnd.current);
        const bulge = len * 0.25; // 25% curve

        // Direction from center
        const dir = controlPoint.clone().normalize();
        // If close to center, default to up?
        if (dir.lengthSq() < 0.01) dir.set(0, 1, 0);

        controlPoint.add(dir.multiplyScalar(bulge));

        // Update curve visual (if we used a meshLine, we'd update it here. 
        // For now, we update the dots to follow the bezier path)

        if (meshRef.current) {
            const count = meshRef.current.count;
            const speed = 0.2;
            const t = state.clock.elapsedTime * speed;

            // Bezier Helper
            const getBezierPoint = (t: number, p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, target: THREE.Vector3) => {
                const oneMinusT = 1 - t;
                // (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
                target.set(0, 0, 0)
                    .addScaledVector(p0, oneMinusT * oneMinusT)
                    .addScaledVector(p1, 2 * oneMinusT * t)
                    .addScaledVector(p2, t * t);
            };

            for (let i = 0; i < count; i++) {
                const spacing = i * (1 / count);
                const progress = (t + spacing) % 1.0;

                // Position on Curve
                getBezierPoint(progress, currentStart.current, controlPoint, currentEnd.current, dummy.position);

                // Scale: Pulse size + blink effect
                let scale = 1.0;
                if (progress < 0.1) scale = progress * 10;
                else if (progress > 0.9) scale = (1 - progress) * 10;
                const blink = Math.sin(progress * Math.PI * 6);
                scale *= (1 + blink * 0.3);

                dummy.scale.setScalar(scale);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
            }
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    const highDynamicRangeColor = useMemo(() => {
        return new THREE.Color(color).multiplyScalar(30);
    }, [color]);

    // Calculate static curve for the faint line (using raw props so it renders initially)
    // For smooth update, we'd need to re-render. Since props change, it re-renders.
    const mid = startPos.clone().add(endPos).multiplyScalar(0.5);
    const len = startPos.distanceTo(endPos);
    const dir = mid.clone().normalize();
    if (dir.lengthSq() < 0.001) dir.set(0, 1, 0); // fallback
    const cp = mid.add(dir.multiplyScalar(len * 0.25));

    return (
        <group>
            {/* Faint Guide Line */}
            <QuadraticBezierLine
                start={startPos}
                end={endPos}
                mid={cp}
                color={color}
                lineWidth={0.5}
                transparent
                opacity={0.1}
                segments={20}
            />

            {/* Moving Light Impulse Dots (Spheres) */}
            <instancedMesh
                ref={meshRef}
                args={[undefined, undefined, 8]}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.(e);
                }}
                onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { document.body.style.cursor = 'auto'; }}
            >
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial
                    color={highDynamicRangeColor}
                    toneMapped={false}
                />
            </instancedMesh>
        </group>
    );
};
