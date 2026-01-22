import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartAddPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (text: string) => void;
}

export const SmartAddPanel = ({ isOpen, onClose, onAdd }: SmartAddPanelProps) => {
    const [text, setText] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setText(''); // Reset on close
        }
    }, [isOpen]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!text.trim()) return;

        onAdd(text.trim());
        setText('');
        // We don't close automatically to allow rapid entry, or we could? 
        // Let's keep it open for multi-add, or close? 
        // Usually "Smart Add" implies quick fire. Let's keep open but clear text.
        // If user wants to close they can hit ESC or Close button.
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="fixed bottom-6 right-6 z-50 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">Smart Add</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-muted-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-4 flex flex-col gap-3">
                        <p className="text-xs text-muted-foreground">
                            Type anything. We'll find the best place to add it to your map automatically.
                        </p>
                        <div className="relative">
                            <textarea
                                ref={inputRef}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="E.g., 'Project Timeline' or 'Budget Constraints'"
                                className="w-full min-h-[80px] p-3 text-sm bg-slate-50 dark:bg-slate-950 border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-all font-medium"
                            />
                            <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-white/50 dark:bg-black/50 px-1 rounded pointer-events-none">
                                Press Enter
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
