import { motion } from 'framer-motion';
import { Minus, Plus, Maximize, Focus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const ZoomControls = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) => {
  const zoomPercentage = Math.round(zoom * 100);

  return (
    <motion.div
      className="absolute bottom-12 right-6 z-40"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-center gap-1 p-1.5 glass-toolbar rounded-xl shadow-xl">
        {/* Zoom Out */}
        <button
          onClick={onZoomOut}
          disabled={zoom <= 0.25}
          className={cn(
            "p-2 rounded-lg text-foreground transition-all",
            "hover:bg-secondary hover:scale-105",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          )}
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Zoom Percentage */}
        <div className="flex items-center justify-center px-2 min-w-[50px]">
          <span className="text-xs font-semibold text-foreground tabular-nums">
            {zoomPercentage}%
          </span>
        </div>

        {/* Zoom In */}
        <button
          onClick={onZoomIn}
          disabled={zoom >= 2}
          className={cn(
            "p-2 rounded-lg text-foreground transition-all",
            "hover:bg-secondary hover:scale-105",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          )}
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border/50 mx-0.5" />

        {/* Fit to Screen */}
        <button
          onClick={onReset}
          className="p-2 rounded-lg text-foreground hover:bg-secondary hover:scale-105 transition-all"
          title="Fit to Screen"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
