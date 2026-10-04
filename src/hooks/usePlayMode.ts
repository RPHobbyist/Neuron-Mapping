/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { MindMapNode } from '@/types/mindmap';
import { buildOutline, OutlineItem, walkOutline } from '@/utils/exporters/outline';

export type PlaySpeed = 'slow' | 'normal' | 'fast';

export const PLAY_SPEEDS: { value: PlaySpeed; label: string; delay: number }[] = [
    { value: 'slow', label: 'Slow', delay: 2000 },
    { value: 'normal', label: 'Normal', delay: 1000 },
    { value: 'fast', label: 'Fast', delay: 500 },
];

const SPEED_KEY = 'neuron-presentation-speed';

export type PlayStep = 'topic' | 'branch';
const STEP_KEY = 'neuron-presentation-step';

const readStep = (): PlayStep => {
    try {
        return localStorage.getItem(STEP_KEY) === 'branch' ? 'branch' : 'topic';
    } catch {
        return 'topic';
    }
};

const readSpeed = (): PlaySpeed => {
    try {
        const stored = localStorage.getItem(SPEED_KEY);
        return PLAY_SPEEDS.some(s => s.value === stored) ? (stored as PlaySpeed) : 'normal';
    } catch {
        return 'normal';
    }
};

interface UsePlayModeReturn {
    isPlaying: boolean;
    isPaused: boolean;
    isFinished: boolean;
    visibleNodeIds: Set<string>;
    visibleLineIds: Set<string> | undefined;
    currentNodeId: string | null;
    currentStepIds: string[];
    step: PlayStep;
    setStep: (step: PlayStep) => void;
    startPlay: () => void;
    stopPlay: () => void;
    nextStep: () => void;
    previousStep: () => void;
    togglePause: () => void;
    speed: PlaySpeed;
    setSpeed: (speed: PlaySpeed) => void;
    currentStep: number;
    totalSteps: number;
}

export const usePlayMode = (nodes: MindMapNode[]): UsePlayModeReturn => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [speed, setSpeedState] = useState<PlaySpeed>(readSpeed);
    const [step, setStepState] = useState<PlayStep>(readStep);

    const sequence = useMemo(() => {
        const outline = buildOutline(nodes);
        const steps: string[][] = [];
        if (step === 'topic') {
            walkOutline(outline, item => steps.push([item.node.id]));
        } else {
            const idsOf = (items: OutlineItem[]) => {
                const ids: string[] = [];
                walkOutline(items, item => ids.push(item.node.id));
                return ids;
            };
            outline.forEach((tree) => {
                if (tree.node.parentId === null) {
                    steps.push([tree.node.id]);
                    tree.children.forEach(branch => steps.push(idsOf([branch])));
                } else {
                    steps.push(idsOf([tree]));
                }
            });
        }
        const listed = new Set(steps.flat());
        nodes.forEach(n => { if (!listed.has(n.id)) steps.push([n.id]); });
        return steps;
    }, [nodes, step]);

    const totalSteps = sequence.length;
    const shownSteps = Math.min(currentStep, totalSteps);
    const isFinished = isPlaying && shownSteps >= totalSteps;

    const startPlay = useCallback(() => {
        if (sequence.length === 0) return;
        setIsPlaying(true);
        setIsPaused(false);
        setCurrentStep(1);
    }, [sequence.length]);

    const stopPlay = useCallback(() => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentStep(0);
    }, []);

    const nextStep = useCallback(() => setCurrentStep(step => Math.min(step + 1, totalSteps)), [totalSteps]);
    const previousStep = useCallback(() => setCurrentStep(step => Math.max(Math.min(step, totalSteps) - 1, 1)), [totalSteps]);
    const togglePause = useCallback(() => setIsPaused(paused => !paused), []);

    const setStep = useCallback((next: PlayStep) => {
        setStepState(next);
        setCurrentStep(1);
        try {
            localStorage.setItem(STEP_KEY, next);
        } catch {
        }
    }, []);

    const setSpeed = useCallback((next: PlaySpeed) => {
        setSpeedState(next);
        try {
            localStorage.setItem(SPEED_KEY, next);
        } catch {
        }
    }, []);

    useEffect(() => {
        if (!isPlaying || isPaused || isFinished) return;
        const delay = PLAY_SPEEDS.find(s => s.value === speed)!.delay;
        const timer = setTimeout(() => setCurrentStep(step => Math.min(step + 1, totalSteps)), delay);
        return () => clearTimeout(timer);
    }, [isPlaying, isPaused, isFinished, currentStep, speed, totalSteps]);

    const visibleNodeIds = useMemo(
        () => new Set(isPlaying ? sequence.slice(0, shownSteps).flat() : nodes.map(n => n.id)),
        [isPlaying, sequence, shownSteps, nodes]
    );

    const visibleLineIds = useMemo(() => {
        if (!isPlaying) return undefined;
        const lines = new Set<string>();
        nodes.forEach((n) => {
            if (!visibleNodeIds.has(n.id)) return;
            if (n.parentId && visibleNodeIds.has(n.parentId)) lines.add(`${n.parentId}::${n.id}`);
            n.relations?.forEach((r) => {
                if (visibleNodeIds.has(r.targetId)) lines.add(`rel::${n.id}::${r.targetId}`);
            });
        });
        return lines;
    }, [isPlaying, nodes, visibleNodeIds]);

    return {
        isPlaying,
        isPaused,
        isFinished,
        visibleNodeIds,
        visibleLineIds,
        currentNodeId: isPlaying && shownSteps > 0 ? sequence[shownSteps - 1][0] : null,
        currentStepIds: isPlaying && shownSteps > 0 ? sequence[shownSteps - 1] : [],
        step,
        setStep,
        startPlay,
        stopPlay,
        nextStep,
        previousStep,
        togglePause,
        speed,
        setSpeed,
        currentStep: shownSteps,
        totalSteps,
    };
};
