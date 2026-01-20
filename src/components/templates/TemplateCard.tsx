import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Template } from '@/types/templates';
import { DynamicTemplatePreview } from './DynamicTemplatePreview';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  template: Template;
  onClick: () => void;
}

export const TemplateCard = ({ template, onClick }: TemplateCardProps) => {
  return (
    <motion.button
      onClick={onClick}
      className="group w-full text-left focus:outline-none"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="floating-card rounded-2xl overflow-hidden hover-glow">
        {/* Preview */}
        <div className="aspect-[4/3] relative bg-gradient-to-b from-card to-background/50 p-6">
          <div className="w-full h-full flex items-center justify-center">
            <DynamicTemplatePreview nodes={template.nodes} />
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Start button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="px-4 py-2 rounded-full bg-primary text-white text-sm font-medium flex items-center gap-2 shadow-lg">
              Use template <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 border-t border-border/50">
          <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
            {template.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {template.description}
          </p>
        </div>
      </div>
    </motion.button>
  );
};
