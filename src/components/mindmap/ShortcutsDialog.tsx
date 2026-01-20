import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard, X } from "lucide-react";

interface ShortcutsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ShortcutsDialog = ({ open, onOpenChange }: ShortcutsDialogProps) => {
    const shortcuts = [
        { key: "Tab", action: "Add Child Node" },
        { key: "Space / F2", action: "Edit Node Text" },
        { key: "Backsp / Del", action: "Delete Node" },
        { key: "Arrow Keys", action: "Navigate" },
        { key: "Ctrl + Z", action: "Undo" },
        { key: "Ctrl + Y", action: "Redo" },
        { key: "Shift + Click", action: "Select Multiple Nodes" },
        { key: "Shift + Drag", action: "Box Selection" },
        { key: "Shift + ?", action: "Show Shortcuts" },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] p-0 gap-0 border shadow-lg bg-white rounded-xl">
                {/* Header */}
                <div className="p-6 pb-2 relative">


                    <div className="mb-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                                <Keyboard className="w-4 h-4 text-gray-700" />
                            </div>
                            <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight">Keyboard Shortcuts</DialogTitle>
                        </div>
                        <p className="text-gray-500 text-sm ml-11">
                            Essential keys for a faster workflow.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-2">
                    <div className="grid grid-cols-1 gap-2">
                        {shortcuts.map((shortcut) => (
                            <div
                                key={shortcut.key}
                                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors group"
                            >
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                    {shortcut.action}
                                </span>
                                <kbd className="px-2 py-1 text-[10px] font-sans font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded min-w-[24px] text-center">
                                    {shortcut.key}
                                </kbd>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 flex justify-end">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-all text-xs font-medium flex items-center gap-2"
                    >
                        Got it
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
