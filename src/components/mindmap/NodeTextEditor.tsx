/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useLayoutEffect, useRef, CSSProperties } from 'react';
import { TextRun } from '@/types/mindmap';
import { cn, isComposing } from '@/lib/utils';
import { editorHtml } from '@/lib/trustedTypes';
import {
    TextLine,
    InlineFormatCommand,
    applyInlineFormat,
    linesHaveFormatting,
    linesToEditorHtml,
    linesToPlainText,
    parseEditorContent,
} from '@/utils/richText';

interface NodeTextEditorProps {
    initialLines: TextLine[];
    className?: string;
    style?: CSSProperties;
    onChange: (text: string, textRuns: TextRun[][] | undefined) => void;
    onDone: () => void;
    onCancel?: (changed: boolean) => void;
}

const shortcutCommand = (e: React.KeyboardEvent): InlineFormatCommand | null => {
    if (!(e.ctrlKey || e.metaKey)) return null;
    const key = e.key.toLowerCase();
    if (key === 'b') return 'bold';
    if (key === 'i') return 'italic';
    if (key === 'u') return 'underline';
    if (key === 'x' && e.shiftKey) return 'strikeThrough';
    return null;
};

export const NodeTextEditor = ({ initialLines, className, style, onChange, onDone, onCancel }: NodeTextEditorProps) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const initialLinesRef = useRef(initialLines);
    const changedRef = useRef(false);

    useLayoutEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        el.innerHTML = editorHtml(linesToEditorHtml(initialLinesRef.current));
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        return () => {
            const current = window.getSelection();
            if (current?.anchorNode && el.contains(current.anchorNode)) current.removeAllRanges();
        };
    }, []);

    const handleInput = () => {
        if (!editorRef.current) return;
        const lines = parseEditorContent(editorRef.current);
        changedRef.current = true;
        onChange(linesToPlainText(lines), linesHaveFormatting(lines) ? lines : undefined);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isComposing(e)) return;
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onDone();
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            if (onCancel) onCancel(changedRef.current);
            else onDone();
            return;
        }
        const command = shortcutCommand(e);
        if (command) {
            e.preventDefault();
            applyInlineFormat(command);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
    };

    return (
        <div
            ref={editorRef}
            data-node-text-editor=""
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            className={cn(
                'w-full min-w-[50px] min-h-[1.5em] outline-none whitespace-pre-wrap break-words cursor-text select-text text-inherit',
                className
            )}
            style={style}
            onInput={handleInput}
            onBlur={onDone}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onDrop={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
        />
    );
};
