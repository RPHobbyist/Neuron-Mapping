import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';

interface TemplateHeaderProps {
  onBack?: () => void;
}

export const TemplateHeader = ({ onBack }: TemplateHeaderProps) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border/40 glass-toolbar">
      {/* Logo */}
      <motion.div
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        onClick={onBack}
      >
        <div className="relative">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
            <img src="./logo.svg" alt="Neuron Mapping Logo" className="w-7 h-7" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-accent border-2 border-card flex items-center justify-center">
            <span className="text-[8px] font-bold text-accent-foreground">+</span>
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Neuron Mapping</h1>
          <p className="text-[10px] text-muted-foreground font-medium -mt-0.5">Create • Organize • Visualize</p>
        </div>
      </motion.div>

      {/* Right Actions */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <button className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
          Help
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
          <span className="text-sm font-bold text-primary">U</span>
        </div>
      </motion.div>
    </header>
  );
};
