import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName?: string;
}

export const SaveDialog = ({ isOpen, onClose, onSave, defaultName = '' }: SaveDialogProps) => {
  const [name, setName] = useState(defaultName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <div className="bg-card rounded-2xl shadow-2xl border border-border p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Save Mind Map</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all hover:rotate-90 duration-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="mapName" className="block text-sm font-medium text-foreground mb-2">
                    Name
                  </label>
                  <input
                    id="mapName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter a name for your mind map"
                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!name.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
