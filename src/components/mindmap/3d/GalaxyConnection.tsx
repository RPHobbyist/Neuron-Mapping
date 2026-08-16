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
    // Using explicit ref-based updates avoids React render cycles for smooth 60fps
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const currentStart = useRef(startPos.clone());
    const currentEnd = useRef(endPos.clone());
    const controlPoint = useMemo(() => new THREE.Vector3(), []);
    const tempDir = useMemo(() => new THREE.Vector3(), []);
    const curvePoints = useMemo(() => [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], []);

    useFrame((state, delta) => {
        // 0.1 was tuned as a per-frame factor at 60fps; converting it to a
        // decay rate keeps the settle speed tied to wall-clock time instead
        // of the actual frame rate (delta).
        const t = 1 - Math.pow(0.9, delta * 60);
        currentStart.current.lerp(startPos, t);
        currentEnd.current.lerp(endPos, t);

        // Control point for a simple outward arc: offset the midpoint away
        // from the world center, proportional to the connection's length.
        controlPoint.copy(currentStart.current).add(currentEnd.current).multiplyScalar(0.5);
        const len = currentStart.current.distanceTo(currentEnd.current);
        const bulge = len * 0.25; // 25% curve

        tempDir.copy(controlPoint).normalize();
        // Avoid a degenerate (zero-length) direction when the control point sits near the origin
        if (tempDir.lengthSq() < 0.01) tempDir.set(0, 1, 0);

        controlPoint.addScaledVector(tempDir, bulge);

        if (meshRef.current) {
            const count = meshRef.current.count;
            const speed = 0.2;
            const t = state.clock.elapsedTime * speed;

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

    // No Bloom/EffectComposer is configured anywhere in this scene, so this
    // renders to a plain 8-bit target — multiplying by 30 (meant for an HDR
    // bloom pass) just clips every channel above 1.0, making every relation
    // color render as flat white regardless of what was picked.
    const dotColor = useMemo(() => new THREE.Color(color), [color]);

    const cp = useMemo(() => {
        const mid = startPos.clone().add(endPos).multiplyScalar(0.5);
        const len = startPos.distanceTo(endPos);
        const dir = mid.clone().normalize();
        if (dir.lengthSq() < 0.001) dir.set(0, 1, 0); // fallback
        return mid.add(dir.multiplyScalar(len * 0.25));
    }, [startPos, endPos]);

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
                // The instance matrices are rewritten every frame in
                // useFrame, but Three only computes an InstancedMesh's
                // bounding sphere lazily on its first frustum check — it's
                // never recomputed after that. Left on, dots on connections
                // far from the scene origin eventually get culled as if
                // still inside whatever bounds existed on that first check,
                // making them invisible and unclickable.
                frustumCulled={false}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.(e);
                }}
                onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { document.body.style.cursor = 'auto'; }}
            >
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial
                    color={dotColor}
                    toneMapped={false}
                />
            </instancedMesh>
        </group>
    );
};
