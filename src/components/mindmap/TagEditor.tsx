/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useId, useState } from 'react';
import { X } from 'lucide-react';

import { normalizeTag, sameTag } from '@/utils/tags';

interface TagEditorProps {
    tags: string[];
    suggestions?: string[];
    onAdd: (tag: string) => void;
    onRemove: (tag: string) => void;
}

export const TagEditor = ({ tags, suggestions = [], onAdd, onRemove }: TagEditorProps) => {
    const [draft, setDraft] = useState('');
    const suggestionsId = useId();

    const commit = (text: string) => {
        text.split(',').map(normalizeTag).filter(Boolean).forEach(onAdd);
        setDraft('');
    };

    return (
        <div className="flex flex-wrap items-center gap-1 rounded border bg-background px-1.5 py-1 focus-within:ring-1 focus-within:ring-primary">
            {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-0.5 rounded bg-muted pl-1.5 pr-0.5 py-0.5 text-[11px] text-foreground">
                    #{tag}
                    <button
                        type="button"
                        onClick={() => onRemove(tag)}
                        aria-label={`Remove tag ${tag}`}
                        title="Remove tag"
                        className="rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
                    >
                        <X className="w-2.5 h-2.5" />
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={draft}
                onChange={(e) => (e.target.value.includes(',') ? commit(e.target.value) : setDraft(e.target.value))}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        commit(draft);
                    } else if (e.key === 'Backspace' && !draft && tags.length > 0) {
                        onRemove(tags[tags.length - 1]);
                    }
                }}
                onBlur={() => commit(draft)}
                list={suggestionsId}
                placeholder={tags.length === 0 ? 'Add a tag…' : ''}
                aria-label="Add a tag"
                className="flex-1 min-w-[64px] bg-transparent py-0.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground"
            />
            <datalist id={suggestionsId}>
                {suggestions.filter(suggestion => !tags.some(tag => sameTag(tag, suggestion))).map(suggestion => (
                    <option key={suggestion} value={suggestion} />
                ))}
            </datalist>
        </div>
    );
};
