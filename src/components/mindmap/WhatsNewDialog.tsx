import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Zap, Play, Boxes, RefreshCw, Palette, Video, Globe, Droplet, Rocket, Wand2, Focus, History } from 'lucide-react';

interface WhatsNewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function WhatsNewDialog({ open, onOpenChange }: WhatsNewDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] p-0 gap-0 border shadow-lg bg-white rounded-xl">
                {/* Simple Header */}
                <div className="p-6 pb-2 relative">
                    <div className="mb-4">
                        <div className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-medium mb-3">
                            Update 1.5.0
                        </div>
                        <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight">What's New</DialogTitle>
                        <DialogDescription className="text-gray-500 text-sm mt-1">
                            Latest tools to power up your mind mapping.
                        </DialogDescription>
                    </div>
                </div>

                {/* Content Section */}
                <div className="px-6 py-2 space-y-5 max-h-[400px] overflow-y-auto">
                    {/* NEW: Drawing Canvas */}
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                            <Zap className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-semibold text-sm text-gray-900">Drawing Canvas</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Freehand drawing support! Use the pencil and eraser tools to annotate your mind maps directly.
                            </p>
                        </div>
                    </div>

                    {/* NEW: Smart Add */}
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                            <Wand2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-semibold text-sm text-gray-900">Smart Add</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Type anything, and our intelligent algorithm finds the best spot for it in your map automatically.
                            </p>
                        </div>
                    </div>

                    {/* NEW: 3D Galaxy View */}
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                            <Globe className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-semibold text-sm text-gray-900">3D Galaxy View</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Visualize your mind maps in immersive 3D with multiple layouts: 2D Projection, Sphere, Grid, and Force.
                            </p>
                        </div>
                    </div>

                    {/* NEW: Focus Mode */}
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                            <Focus className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-semibold text-sm text-gray-900">Focus Mode</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Select a node and enter Focus Mode to hide everything else and concentrate on one branch.
                            </p>
                        </div>
                    </div>

                    {/* NEW: History Snapshots */}
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                            <History className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-semibold text-sm text-gray-900">History Snapshots</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Travel back in time. View and restore previous versions of your mind map with visual snapshots.
                            </p>
                        </div>
                    </div>

                    {/* NEW: Performance */}
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0 border border-green-100">
                            <Rocket className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-semibold text-sm text-gray-900">Faster Loading</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                3x smaller initial bundle with lazy loading. Exports and 3D load on-demand.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                            <Zap className="w-4 h-4 text-gray-700" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-semibold text-sm text-gray-900">Line Animations</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Snake Arrows, Flow Dashes, and Cross patterns with direction control.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                            <Play className="w-4 h-4 text-gray-700" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-semibold text-sm text-gray-900">Node Loop & Play Mode</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Presentation mode reveals nodes step-by-step for walkthroughs.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                            <Palette className="w-4 h-4 text-gray-700" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-semibold text-sm text-gray-900">Advanced Line Styling</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Customize connections with colors, thickness, labels, and tension.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                            <Video className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-semibold text-sm text-gray-900">YouTube Tutorials</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Watch our <a href="https://www.youtube.com/playlist?list=PLwLQ_Xr7StXi2H1R3ZEGeMu5MX3V3ZXqD" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-700 underline">video tutorials</a> to master all features.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="p-6 pt-6 flex justify-end">
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
}

