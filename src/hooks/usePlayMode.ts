import { useState, useCallback, useEffect, useMemo } from 'react';
import { MindMapNode } from '@/types/mindmap';

interface AnimationStep {
    type: 'node' | 'line';
    id: string;
}

interface UsePlayModeReturn {
    isPlaying: boolean;
    visibleNodeIds: Set<string>;
    visibleLineIds: Set<string> | undefined;
    startPlay: () => void;
    stopPlay: () => void;
    nextStep: () => void;
    currentStep: number;
    totalSteps: number;
}

export const usePlayMode = (nodes: MindMapNode[]): UsePlayModeReturn => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string>>(new Set());
    const [visibleLineIds, setVisibleLineIds] = useState<Set<string>>(new Set());
    const [currentStep, setCurrentStep] = useState(0);

    const sequence = useMemo(() => {
        if (nodes.length === 0) return [];

        const root = nodes.find(n => !n.parentId);
        if (!root) return [];

        const steps: AnimationStep[] = [];

        const dfs = (nodeId: string) => {
            steps.push({ type: 'node', id: nodeId });

            const children = nodes
                .filter(n => n.parentId === nodeId)
                .sort((a, b) => a.y - b.y);

            children.forEach(child => {
                steps.push({ type: 'line', id: `${nodeId}::${child.id}` });

                dfs(child.id);
            });
        };

        dfs(root.id);
        return steps;
    }, [nodes]);

    const startPlay = useCallback(() => {
        setIsPlaying(true);
        setCurrentStep(0);
        setVisibleNodeIds(new Set());
        setVisibleLineIds(new Set());

        setTimeout(() => {
            setCurrentStep(1);
        }, 100);
    }, []);

    const stopPlay = useCallback(() => {
        setIsPlaying(false);
        setVisibleNodeIds(new Set(nodes.map(n => n.id)));
        setVisibleLineIds(new Set(
            nodes.filter(n => n.parentId).map(n => `${n.parentId}::${n.id}`)
        ));
        setCurrentStep(sequence.length);
    }, [nodes, sequence]);

    const nextStep = useCallback(() => {
        if (currentStep < sequence.length) {
            setCurrentStep(p => p + 1);
        } else {
            stopPlay();
        }
    }, [currentStep, sequence.length, stopPlay]);

    useEffect(() => {
        if (!isPlaying) return;

        if (sequence.length === 0) {
            stopPlay();
            return;
        }

        const clampedStep = Math.min(currentStep, sequence.length);

        const newVisibleNodes = new Set<string>();
        const newVisibleLines = new Set<string>();

        for (let i = 0; i < clampedStep; i++) {
            const step = sequence[i];
            if (step.type === 'node') newVisibleNodes.add(step.id);
            if (step.type === 'line') newVisibleLines.add(step.id);
        }

        setVisibleNodeIds(newVisibleNodes);
        setVisibleLineIds(newVisibleLines);

        if (clampedStep >= sequence.length) {
            stopPlay();
            return;
        }

        if (clampedStep > 0) {
            const timer = setTimeout(() => {
                setCurrentStep(s => s + 1);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [currentStep, isPlaying, sequence, stopPlay]);

    return {
        isPlaying,
        visibleNodeIds: isPlaying ? visibleNodeIds : new Set<string>(nodes.map(n => n.id)),
        visibleLineIds: isPlaying ? visibleLineIds : undefined,
        startPlay,
        stopPlay,
        nextStep,
        currentStep,
        totalSteps: sequence.length
    };
};
 