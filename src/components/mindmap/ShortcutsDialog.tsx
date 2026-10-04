/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { SHORTCUT_LIST } from "@/lib/shortcuts";

interface ShortcutsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ShortcutsDialog = ({ open, onOpenChange }: ShortcutsDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] p-0 gap-0 border shadow-lg bg-card rounded-xl">
                <div className="p-6 pb-2 relative">


                    <div className="mb-2">
                        <div className="flex items-center gap-3 mb-2">
                            <DialogTitle className="text-xl font-bold text-foreground tracking-tight">Keyboard Shortcuts</DialogTitle>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Essential keys for a faster workflow.
                        </p>
                    </div>
                </div>

                <div className="px-6 py-2 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-2">
                        {SHORTCUT_LIST.map((shortcut) => (
                            <div
                                key={shortcut.keys}
                                className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors group"
                            >
                                <span className="text-sm font-medium text-foreground group-hover:text-foreground">
                                    {shortcut.action}
                                </span>
                                <kbd className="px-2 py-1 text-[10px] font-sans font-semibold text-muted-foreground bg-muted border border-border rounded min-w-[24px] text-center">
                                    {shortcut.keys}
                                </kbd>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 pt-4 flex justify-end">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-all text-xs font-medium flex items-center gap-2"
                    >
                        Got it
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
 