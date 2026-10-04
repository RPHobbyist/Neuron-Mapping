/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { motion } from 'framer-motion';
import { Minus, Plus, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MIN_ZOOM, MAX_ZOOM } from '@/lib/constants';
import { MOD_KEY, withShortcut } from '@/utils/shortcuts';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
}

export const ZoomControls = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  children
}: ZoomControlsProps & { children?: React.ReactNode }) => {
  const zoomPercentage = Math.round(zoom * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-center gap-1 p-1.5 glass-toolbar rounded-xl shadow-xl bg-card border border-border">
        <button
          onClick={onZoomOut}
          disabled={zoom <= MIN_ZOOM}
          className={cn(
            "p-2 rounded-lg text-foreground transition-all",
            "hover:bg-muted hover:scale-105",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          )}
          title={withShortcut("Zoom Out", MOD_KEY, "−")}
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center px-2 min-w-[50px]">
          <span className="text-xs font-semibold text-foreground tabular-nums">
            {zoomPercentage}%
          </span>
        </div>

        <button
          onClick={onZoomIn}
          disabled={zoom >= MAX_ZOOM}
          className={cn(
            "p-2 rounded-lg text-foreground transition-all",
            "hover:bg-muted hover:scale-105",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          )}
          title={withShortcut("Zoom In", MOD_KEY, "+")}
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-0.5" />

        <button
          onClick={onFitToScreen}
          className="p-2 rounded-lg text-foreground hover:bg-muted hover:scale-105 transition-all"
          title="Fit to Screen (F)"
        >
          <Maximize className="w-4 h-4" />
        </button>

        {children && (
          <>
            <div className="w-px h-6 bg-border mx-0.5" />
            {children}
          </>
        )}
      </div>
    </motion.div>
  );
};
 