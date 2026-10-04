/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useEffect } from 'react';
import { SelectionFormat, readSelectionFormat } from '@/utils/richText';

const sameFormat = (a: SelectionFormat | null, b: SelectionFormat | null) =>
    a === b || (!!a && !!b &&
        a.bold === b.bold && a.italic === b.italic && a.underline === b.underline &&
        a.strike === b.strike && a.size === b.size && a.font === b.font);

export const useEditorSelectionFormat = (): SelectionFormat | null => {
    const [format, setFormat] = useState<SelectionFormat | null>(null);

    useEffect(() => {
        const update = () => {
            const next = readSelectionFormat();
            setFormat(prev => (sameFormat(prev, next) ? prev : next));
        };
        update();
        document.addEventListener('selectionchange', update);
        document.addEventListener('input', update);
        return () => {
            document.removeEventListener('selectionchange', update);
            document.removeEventListener('input', update);
        };
    }, []);

    return format;
};
