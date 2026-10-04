/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const TAG_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#64748b'];

export const tagColor = (tag: string): string => {
    let hash = 0;
    for (const char of tag.toLowerCase()) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
    return TAG_COLORS[hash % TAG_COLORS.length];
};
