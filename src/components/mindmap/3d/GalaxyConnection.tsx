import { useRef, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Line, QuadraticBezierLine, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Line2 } from 'three-stdlib';
import { ConnectionStyle, LineThickness } from '@/types/mindmap';

interface GalaxyConnectionProps {
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    color?: string;
    thickness?: LineThickness;
    type?: ConnectionStyle;
    animated?: boolean;
    label?: string;
    arrowDirection?: 'none' | 'forward' | 'reverse' | 'both';
    onSelect?: (e: ThreeEvent<MouseEvent>) => void;
}

const LINE_WIDTH: Record<LineThickness, number> = { thin: 0.6, medium: 1, thick: 1.8 };
const DOT_SCALE: Record<LineThickness, number> = { thin: 0.75, medium: 1, thick: 1.5 };

function bezierPoint(t: number, p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, target: THREE.Vector3) {
    const oneMinusT = 1 - t;
    target.set(0, 0, 0)
        .addScaledVector(p0, oneMinusT * oneMinusT)
        .addScaledVector(p1, 2 * oneMinusT * t)
        .addScaledVector(p2, t * t);
}

export const GalaxyConnection = ({
    startPos,
    endPos,
    color = '#94a3b8',
    thickness = 'medium',
    type = 'curved',
    animated = true,
    label,
    arrowDirection = 'none',
    onSelect
}: GalaxyConnectionProps) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const currentStart = useRef(startPos.clone());
    const currentEnd = useRef(endPos.clone());
    const controlPoint = useMemo(() => new THREE.Vector3(), []);
    const tempDir = useMemo(() => new THREE.Vector3(), []);
    const labelGroupRef = useRef<THREE.Group>(null);
    const startArrowRef = useRef<THREE.Mesh>(null);
    const endArrowRef = useRef<THREE.Mesh>(null);
    const tempQuat = useMemo(() => new THREE.Quaternion(), []);
    const tempDir2 = useMemo(() => new THREE.Vector3(), []);
    const upAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);

    const isStraight = type === 'straight';
    const isDashed = type === 'dashed' || type === 'dotted';
    const showStartArrow = arrowDirection === 'reverse' || arrowDirection === 'both';
    const showEndArrow = arrowDirection === 'forward' || arrowDirection === 'both';
    const dotScale = DOT_SCALE[thickness];

    useFrame((state, delta) => {
        const t = 1 - Math.pow(0.9, delta * 60);
        currentStart.current.lerp(startPos, t);
        currentEnd.current.lerp(endPos, t);

        controlPoint.copy(currentStart.current).add(currentEnd.current).multiplyScalar(0.5);
        const len = currentStart.current.distanceTo(currentEnd.current);
        const bulge = isStraight ? 0 : len * 0.25;

        tempDir.copy(controlPoint).normalize();
        if (tempDir.lengthSq() < 0.01) tempDir.set(0, 1, 0);

        controlPoint.addScaledVector(tempDir, bulge);

        if (labelGroupRef.current) {
            bezierPoint(0.5, currentStart.current, controlPoint, currentEnd.current, labelGroupRef.current.position);
        }

        if (showEndArrow && endArrowRef.current) {
            bezierPoint(0.88, currentStart.current, controlPoint, currentEnd.current, endArrowRef.current.position);
            tempDir2.copy(currentEnd.current).sub(endArrowRef.current.position);
            if (tempDir2.lengthSq() > 0.0001) {
                tempQuat.setFromUnitVectors(upAxis, tempDir2.normalize());
                endArrowRef.current.quaternion.copy(tempQuat);
            }
        }
        if (showStartArrow && startArrowRef.current) {
            bezierPoint(0.12, currentStart.current, controlPoint, currentEnd.current, startArrowRef.current.position);
            tempDir2.copy(currentStart.current).sub(startArrowRef.current.position);
            if (tempDir2.lengthSq() > 0.0001) {
                tempQuat.setFromUnitVectors(upAxis, tempDir2.normalize());
                startArrowRef.current.quaternion.copy(tempQuat);
            }
        }

        if (meshRef.current) {
            const count = meshRef.current.count;
            const speed = 0.2;
            const clock = animated ? state.clock.elapsedTime * speed : 0;

            for (let i = 0; i < count; i++) {
                const spacing = i * (1 / count);
                const progress = (clock + spacing) % 1.0;

                bezierPoint(progress, currentStart.current, controlPoint, currentEnd.current, dummy.position);

                let scale = 1.0;
                if (progress < 0.1) scale = progress * 10;
                else if (progress > 0.9) scale = (1 - progress) * 10;
                const blink = animated ? Math.sin(progress * Math.PI * 6) : 0;
                scale *= (1 + blink * 0.3);
                scale *= dotScale;

                dummy.scale.setScalar(scale);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
            }
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    const dotColor = useMemo(() => new THREE.Color(color), [color]);

    const cp = useMemo(() => {
        const mid = startPos.clone().add(endPos).multiplyScalar(0.5);
        const len = startPos.distanceTo(endPos);
        const dir = mid.clone().normalize();
        if (dir.lengthSq() < 0.001) dir.set(0, 1, 0);
        return mid.add(dir.multiplyScalar(isStraight ? 0 : len * 0.25));
    }, [startPos, endPos, isStraight]);

    const arrowSize = 0.18 * dotScale;

    return (
        <group>
            {isDashed ? (
                <Line
                    points={[startPos, cp, endPos]}
                    color={color}
                    lineWidth={LINE_WIDTH[thickness]}
                    transparent
                    opacity={0.35}
                    dashed
                    dashSize={type === 'dotted' ? 0.08 : 0.4}
                    gapSize={type === 'dotted' ? 0.18 : 0.25}
                />
            ) : (
                <QuadraticBezierLine
                    start={startPos}
                    end={endPos}
                    mid={cp}
                    color={color}
                    lineWidth={LINE_WIDTH[thickness]}
                    transparent
                    opacity={0.1}
                    segments={20}
                />
            )}

            {showEndArrow && (
                <mesh ref={endArrowRef}>
                    <coneGeometry args={[arrowSize, arrowSize * 2, 12]} />
                    <meshBasicMaterial color={dotColor} toneMapped={false} />
                </mesh>
            )}
            {showStartArrow && (
                <mesh ref={startArrowRef}>
                    <coneGeometry args={[arrowSize, arrowSize * 2, 12]} />
                    <meshBasicMaterial color={dotColor} toneMapped={false} />
                </mesh>
            )}

            {label && (
                <group ref={labelGroupRef}>
                    <Html center distanceFactor={30} style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        <div
                            className="px-2 py-0.5 rounded whitespace-nowrap text-xs font-medium shadow-lg"
                            style={{ backgroundColor: 'rgba(15,23,42,0.75)', color }}
                        >
                            {label}
                        </div>
                    </Html>
                </group>
            )}

            <instancedMesh
                ref={meshRef}
                args={[undefined, undefined, 8]}
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
