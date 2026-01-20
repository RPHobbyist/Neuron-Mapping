import { MindMapNode } from '@/types/mindmap';
import { Template } from '@/types/templates';

// Six Thinking Hats
const sixThinkingHatsNodes: MindMapNode[] = [
    { id: 'root', text: 'Topic', x: 0, y: 0, color: 'root', parentId: null },
    { id: 'white', text: 'White (Facts)', x: -250, y: -150, color: 'grey', parentId: 'root' },
    { id: 'red', text: 'Red (Feelings)', x: 0, y: -150, color: 'red', parentId: 'root' },
    { id: 'black', text: 'Black (Caution)', x: 250, y: -150, color: 'root', parentId: 'root' },
    { id: 'yellow', text: 'Yellow (Benefits)', x: -250, y: 150, color: 'yellow', parentId: 'root' },
    { id: 'green', text: 'Green (Ideas)', x: 0, y: 150, color: 'green', parentId: 'root' },
    { id: 'blue', text: 'Blue (Process)', x: 250, y: 150, color: 'blue', parentId: 'root' },
];

// Argument Map
const argumentMapNodes: MindMapNode[] = [
    { id: 'root', text: 'Main Contention', x: 0, y: -200, color: 'root', parentId: null },
    { id: 'r1', text: 'Reason 1', x: -200, y: -50, color: 'green', parentId: 'root' },
    { id: 'r2', text: 'Reason 2', x: 200, y: -50, color: 'green', parentId: 'root' },

    { id: 'obj1', text: 'Objection', x: 0, y: -50, color: 'red', parentId: 'root' },

    { id: 'ev1', text: 'Evidence', x: -300, y: 100, color: 'blue', parentId: 'r1' },
    { id: 'ev2', text: 'Evidence', x: 300, y: 100, color: 'blue', parentId: 'r2' },
    { id: 'reb', text: 'Rebuttal', x: 0, y: 100, color: 'orange', parentId: 'obj1' },
];

export const communicationTemplates: Template[] = [
    {
        id: 'six-thinking-hats',
        name: 'Six Thinking Hats',
        category: 'communication',
        description: 'Explore problems from multiple perspectives',
        nodes: sixThinkingHatsNodes,
        preview: 'sixThinkingHats',
    },
    {
        id: 'argument-map',
        name: 'Argument Map',
        category: 'communication',
        description: 'Structure arguments with reasons, evidence and objections',
        nodes: argumentMapNodes,
        preview: 'argumentMap',
    },
];
