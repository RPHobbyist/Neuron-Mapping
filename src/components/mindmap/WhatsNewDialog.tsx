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
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Gauge, Spline, Play, Palette, Video, Globe, ListPlus, Focus, History, PenTool, ShieldCheck, WifiOff, Files,
    Download, Upload, Moon, NotebookPen, Layers, Keyboard, Tag, Type, SquareDashed, type LucideIcon,
} from 'lucide-react';
import { SYSTEM_CONFIG } from '@/lib/core/core-system';
import { ChangelogEntry, ChangelogIcon, RELEASES } from '@/data/changelog';

interface WhatsNewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ICONS: Record<ChangelogIcon, LucideIcon> = {
    drawing: PenTool, add: ListPlus, globe: Globe, focus: Focus, history: History, speed: Gauge, line: Spline,
    play: Play, palette: Palette, video: Video, shield: ShieldCheck, offline: WifiOff, files: Files,
    export: Download, import: Upload, moon: Moon, notes: NotebookPen, layers: Layers, keyboard: Keyboard,
    tag: Tag, text: Type, box: SquareDashed,
};

const Entry = ({ entry }: { entry: ChangelogEntry }) => {
    const Icon = ICONS[entry.icon];
    return (
        <div className="flex gap-3 items-start">
            <Icon className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            <div className="space-y-0.5">
                <h3 className="font-semibold text-sm text-foreground">{entry.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {entry.description}
                    {entry.tutorialsLink && (
                        <>
                            {' '}
                            <a href={SYSTEM_CONFIG.youtubePlaylistUrl} target="_blank" rel="noopener noreferrer" className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline">
                                Watch the tutorials
                            </a>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
};

export function WhatsNewDialog({ open, onOpenChange }: WhatsNewDialogProps) {
    const current = RELEASES.find(release => release.version === __APP_VERSION__) ?? RELEASES[0];
    const earlier = RELEASES.filter(release => release !== current);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] p-0 gap-0 border shadow-lg bg-card rounded-xl">
                <DialogHeader className="p-6 pb-2 relative text-left">
                    <p className="text-xs text-muted-foreground mb-1">Version {__APP_VERSION__}</p>
                    <DialogTitle className="text-xl font-semibold text-foreground">What's new</DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm mt-1">
                        {current.summary}
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 pt-2 pb-6 space-y-5 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {current.entries.map(entry => <Entry key={entry.title} entry={entry} />)}
                    {earlier.map(release => (
                        <section key={release.version} className="space-y-5 pt-2" aria-label={`Version ${release.version}`}>
                            <h2 className="text-sm font-medium text-muted-foreground border-t pt-4">Earlier, in {release.version}</h2>
                            {release.entries.map(entry => <Entry key={entry.title} entry={entry} />)}
                        </section>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
