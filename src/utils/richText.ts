/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { CSSProperties } from 'react';
import { MindMapNode, TextFont, TextHeading, TextRun } from '@/types/mindmap';

export type TextLine = TextRun[];

export type InlineFormatCommand = 'bold' | 'italic' | 'underline' | 'strikeThrough' | 'removeFormat';

type RunFormat = Omit<TextRun, 'text'>;

export const EDITOR_ATTRIBUTE = 'data-node-text-editor';

export const TEXT_FONTS: { value: TextFont; label: string; stack: string }[] = [
    { value: 'default', label: 'Default', stack: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
    { value: 'serif', label: 'Serif', stack: "Georgia, 'Times New Roman', serif" },
    { value: 'mono', label: 'Monospace', stack: "ui-monospace, 'Cascadia Code', Consolas, 'Courier New', monospace" },
    { value: 'hand', label: 'Handwriting', stack: "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive" },
    { value: 'display', label: 'Display', stack: "Impact, 'Arial Narrow Bold', 'Franklin Gothic Medium', sans-serif" },
];

export const TEXT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64];
export const DEFAULT_TEXT_SIZE = 16;
export const HEADING_SIZES: Record<TextHeading, number> = { h1: 24, h2: 20, h3: 18 };

export const isTextFont = (value: unknown): value is TextFont => TEXT_FONTS.some(f => f.value === value);

export const getFontStack = (font: unknown): string | undefined => TEXT_FONTS.find(f => f.value === font)?.stack;

export const clampTextSize = (size: number) => Math.min(96, Math.max(8, Math.round(size)));

export const stepTextSize = (current: number, direction: 1 | -1): number =>
    direction > 0
        ? TEXT_SIZES.find(s => s > current) ?? TEXT_SIZES[TEXT_SIZES.length - 1]
        : [...TEXT_SIZES].reverse().find(s => s < current) ?? TEXT_SIZES[0];

const NON_BREAKING_SPACE = new RegExp(String.fromCharCode(0xa0), 'g');

const BLOCK_TAGS = new Set(['DIV', 'P', 'LI', 'UL', 'OL', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE']);

export const linesToPlainText = (lines: TextLine[]): string =>
    lines.map(line => line.map(run => run.text).join('')).join('\n');

export const plainTextToLines = (text: string): TextLine[] =>
    text.split('\n').map(line => (line ? [{ text: line }] : []));

const hasFormat = (run: RunFormat) =>
    run.bold !== undefined || run.italic !== undefined || !!run.underline || !!run.strike ||
    run.size !== undefined || run.font !== undefined;

export const linesHaveFormatting = (lines: TextLine[]) => lines.some(line => line.some(hasFormat));

export const getNodeRichLines = (node: MindMapNode): TextLine[] | null => {
    if (!node.textRuns || linesToPlainText(node.textRuns) !== node.text) return null;
    return node.textRuns;
};

export const getRunStyle = (run: TextRun): CSSProperties | undefined => {
    if (!hasFormat(run)) return undefined;
    const decorations = [run.underline && 'underline', run.strike && 'line-through'].filter(Boolean).join(' ');
    const fontStack = getFontStack(run.font);
    return {
        ...(run.bold !== undefined ? { fontWeight: run.bold ? 700 : 500 } : {}),
        ...(run.italic !== undefined ? { fontStyle: run.italic ? 'italic' : 'normal' } : {}),
        ...(decorations ? { textDecorationLine: decorations } : {}),
        ...(run.size !== undefined ? { fontSize: `${clampTextSize(run.size)}px` } : {}),
        ...(fontStack ? { fontFamily: fontStack } : {}),
    };
};

const sameFormat = (a: RunFormat, b: RunFormat) =>
    a.bold === b.bold && a.italic === b.italic && !!a.underline === !!b.underline && !!a.strike === !!b.strike &&
    a.size === b.size && a.font === b.font;

const cleanRun = (run: TextRun): TextRun => ({
    text: run.text,
    ...(run.bold !== undefined ? { bold: run.bold } : {}),
    ...(run.italic !== undefined ? { italic: run.italic } : {}),
    ...(run.underline ? { underline: true } : {}),
    ...(run.strike ? { strike: true } : {}),
    ...(typeof run.size === 'number' && Number.isFinite(run.size) ? { size: clampTextSize(run.size) } : {}),
    ...(isTextFont(run.font) ? { font: run.font } : {}),
});

const normalizeLine = (line: TextLine): TextLine => {
    const merged: TextLine = [];
    for (const run of line) {
        if (!run.text) continue;
        const clean = cleanRun(run);
        const prev = merged[merged.length - 1];
        if (prev && sameFormat(prev, clean)) prev.text += clean.text;
        else merged.push(clean);
    }
    return merged;
};

const readFontKey = (el: HTMLElement): TextFont | undefined => {
    const font = el.dataset.font;
    return isTextFont(font) && el.style.fontFamily ? font : undefined;
};

const readFormat = (el: HTMLElement, inherited: RunFormat): RunFormat => {
    const format = { ...inherited };

    switch (el.tagName) {
        case 'B':
        case 'STRONG':
            format.bold = true;
            break;
        case 'I':
        case 'EM':
            format.italic = true;
            break;
        case 'U':
        case 'INS':
            format.underline = true;
            break;
        case 'S':
        case 'STRIKE':
        case 'DEL':
            format.strike = true;
            break;
    }

    const { fontWeight, fontStyle, textDecorationLine, textDecoration, fontSize } = el.style;
    if (fontWeight) format.bold = fontWeight === 'bold' || fontWeight === 'bolder' || Number(fontWeight) >= 600;
    if (fontStyle) format.italic = fontStyle === 'italic' || fontStyle === 'oblique';
    const decoration = textDecorationLine || textDecoration;
    if (decoration.includes('underline')) format.underline = true;
    if (decoration.includes('line-through')) format.strike = true;
    if (fontSize.endsWith('px')) format.size = clampTextSize(parseFloat(fontSize));
    const font = readFontKey(el);
    if (font) format.font = font;

    return format;
};

export const parseEditorContent = (root: HTMLElement): TextLine[] => {
    const lines: TextLine[] = [[]];
    const current = () => lines[lines.length - 1];
    const newLine = () => lines.push([]);

    const walk = (parent: Node, format: RunFormat) => {
        parent.childNodes.forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
                const parts = (child.textContent || '').replace(NON_BREAKING_SPACE, ' ').split('\n');
                parts.forEach((part, i) => {
                    if (i > 0) newLine();
                    if (part) current().push({ text: part, ...format });
                });
                return;
            }
            if (!(child instanceof HTMLElement)) return;

            if (child.tagName === 'BR') {
                const parentIsBlock = parent === root || (parent instanceof HTMLElement && BLOCK_TAGS.has(parent.tagName));
                const isPlaceholder = parentIsBlock && !child.nextSibling && !!child.previousSibling;
                if (!isPlaceholder) newLine();
                return;
            }

            const isBlock = BLOCK_TAGS.has(child.tagName);
            if (isBlock && current().length > 0) newLine();
            walk(child, readFormat(child, format));
            if (isBlock && current().length > 0) newLine();
        });
    };

    walk(root, {});

    while (lines.length > 1 && current().length === 0) lines.pop();
    return lines.map(normalizeLine);
};

const escapeHtml = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const runToHtml = (run: TextRun) => {
    let html = escapeHtml(run.text);
    if (run.strike) html = `<s>${html}</s>`;
    if (run.underline) html = `<u>${html}</u>`;
    if (run.italic === true) html = `<i>${html}</i>`;
    else if (run.italic === false) html = `<span style="font-style: normal">${html}</span>`;
    if (run.bold === true) html = `<b>${html}</b>`;
    else if (run.bold === false) html = `<span style="font-weight: 500">${html}</span>`;

    const fontStack = getFontStack(run.font);
    const css = [
        run.size !== undefined && `font-size: ${clampTextSize(run.size)}px`,
        fontStack && `font-family: ${fontStack}`,
    ].filter(Boolean).join('; ');
    if (css) html = `<span${fontStack ? ` data-font="${run.font}"` : ''} style="${css}">${html}</span>`;

    return html;
};

export const linesToEditorHtml = (lines: TextLine[]): string =>
    lines.map(line => line.map(runToHtml).join('')).join('<br>');

const getSelectionEditor = (): HTMLElement | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const anchor = selection.anchorNode;
    const el = anchor instanceof Element ? anchor : anchor?.parentElement;
    return el?.closest<HTMLElement>(`[${EDITOR_ATTRIBUTE}]`) ?? null;
};

export const isSelectionInEditor = (): boolean => {
    const selection = window.getSelection();
    return !!selection && !selection.isCollapsed && !!getSelectionEditor();
};

export const applyInlineFormat = (command: InlineFormatCommand) => {
    document.execCommand('styleWithCSS', false, 'false');
    document.execCommand(command);
};

export const queryInlineFormat = (command: Exclude<InlineFormatCommand, 'removeFormat'>): boolean => {
    try {
        return document.queryCommandState(command);
    } catch {
        return false;
    }
};

const FONT_MARKER = 'nexus-font-marker';

const wrapSelection = (
    command: 'fontSize' | 'fontName',
    value: string,
    selector: string,
    restyle: (el: HTMLElement) => void,
    clearNested: (el: HTMLElement) => void,
) => {
    const editor = getSelectionEditor();
    if (!editor) return;
    document.execCommand('styleWithCSS', false, 'false');
    document.execCommand(command, false, value);
    editor.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        restyle(el);
        el.querySelectorAll<HTMLElement>('*').forEach(clearNested);
    });
    editor.dispatchEvent(new Event('input', { bubbles: true }));
};

export const applySelectionSize = (size: number | null) => wrapSelection(
    'fontSize', '7', 'font[size="7"]',
    (el) => {
        el.removeAttribute('size');
        if (size !== null) el.style.fontSize = `${clampTextSize(size)}px`;
    },
    (el) => el.style.removeProperty('font-size'),
);

export const applySelectionFont = (font: TextFont | null) => wrapSelection(
    'fontName', FONT_MARKER, `font[face="${FONT_MARKER}"]`,
    (el) => {
        el.removeAttribute('face');
        const stack = getFontStack(font);
        if (font && stack) {
            el.dataset.font = font;
            el.style.fontFamily = stack;
        }
    },
    (el) => {
        delete el.dataset.font;
        el.style.removeProperty('font-family');
    },
);

export const applySelectionHeading = (heading: TextHeading | null) => {
    applySelectionSize(heading ? HEADING_SIZES[heading] : null);
    if (heading && !queryInlineFormat('bold')) applyInlineFormat('bold');
};

export const clearSelectionFormatting = () => {
    applyInlineFormat('removeFormat');
    applySelectionSize(null);
    applySelectionFont(null);
};

export interface SelectionFormat {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    size: number;
    font: TextFont | null;
}

const firstSelectedText = (range: Range): Node | null => {
    const root = range.commonAncestorContainer;
    if (root.nodeType === Node.TEXT_NODE) return root;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const length = n.textContent?.length ?? 0;
        if (!length || !range.intersectsNode(n)) continue;
        if (n === range.startContainer && range.startOffset >= length) continue;
        return n;
    }
    return null;
};

export const readSelectionFormat = (): SelectionFormat | null => {
    if (!isSelectionInEditor()) return null;
    const editor = getSelectionEditor()!;
    const range = window.getSelection()!.getRangeAt(0);

    let el = firstSelectedText(range)?.parentElement ?? null;
    if (!el || !editor.contains(el)) el = editor;

    let font: TextFont | null = null;
    for (let node: HTMLElement | null = el; node && node !== editor; node = node.parentElement) {
        const key = readFontKey(node);
        if (key) { font = key; break; }
    }

    return {
        bold: queryInlineFormat('bold'),
        italic: queryInlineFormat('italic'),
        underline: queryInlineFormat('underline'),
        strike: queryInlineFormat('strikeThrough'),
        size: Math.round(parseFloat(getComputedStyle(el).fontSize)),
        font,
    };
};
