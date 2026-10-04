/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

export const colorThemes: Record<string, { from: string; to: string; border: string; text: string; shadow: string }> = {
    teal: { from: '#f0fdfa', to: '#ccfbf1', border: '#14b8a6', text: '#0f766e', shadow: 'rgba(20, 184, 166, 0.15)' },
    purple: { from: '#faf5ff', to: '#f3e8ff', border: '#a855f7', text: '#7c3aed', shadow: 'rgba(168, 85, 247, 0.15)' },
    orange: { from: '#fff7ed', to: '#ffedd5', border: '#f97316', text: '#c2410c', shadow: 'rgba(249, 115, 22, 0.15)' },
    pink: { from: '#fdf2f8', to: '#fce7f3', border: '#ec4899', text: '#be185d', shadow: 'rgba(236, 72, 153, 0.15)' },
    blue: { from: '#eff6ff', to: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', shadow: 'rgba(59, 130, 246, 0.15)' },
    green: { from: '#f0fdf4', to: '#dcfce7', border: '#22c55e', text: '#15803d', shadow: 'rgba(34, 197, 94, 0.15)' },
    yellow: { from: '#fefce8', to: '#fef3c7', border: '#eab308', text: '#a16207', shadow: 'rgba(234, 179, 8, 0.15)' },
    cyan: { from: '#ecfeff', to: '#cffafe', border: '#06b6d4', text: '#0e7490', shadow: 'rgba(6, 182, 212, 0.15)' },
    grey: { from: '#f9fafb', to: '#f3f4f6', border: '#6b7280', text: '#374151', shadow: 'rgba(107, 114, 128, 0.15)' },
    red: { from: '#fef2f2', to: '#fee2e2', border: '#ef4444', text: '#b91c1c', shadow: 'rgba(239, 68, 68, 0.15)' },
    lime: { from: '#f7fee7', to: '#ecfccb', border: '#84cc16', text: '#4d7c0f', shadow: 'rgba(132, 204, 22, 0.15)' },
    indigo: { from: '#eef2ff', to: '#e0e7ff', border: '#6366f1', text: '#4338ca', shadow: 'rgba(99, 102, 241, 0.15)' },
    root: { from: '#1f2937', to: '#111827', border: '#374151', text: '#ffffff', shadow: 'rgba(0, 0, 0, 0.2)' },
};
