/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState } from "react";
import { SYSTEM_CONFIG } from "@/lib/core/core-system";
import { LicenseDialog } from "@/components/feedback/LicenseDialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export const Footer = () => {
    const [storageInfoOpen, setStorageInfoOpen] = useState(false);

    return (
        <footer className="bg-card border-t px-6 py-2 flex items-center justify-between gap-4 flex-shrink-0 text-xs">
            <div className="flex items-center gap-4 text-muted-foreground">
                <span>
                    Made by <a href={SYSTEM_CONFIG.vendorLink} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{SYSTEM_CONFIG.vendor}</a>
                </span>
                <LicenseDialog />
                <a
                    href={SYSTEM_CONFIG.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors whitespace-nowrap"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Desktop app
                </a>
                <a
                    href={SYSTEM_CONFIG.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors whitespace-nowrap"
                >
                    GitHub
                </a>
                <a
                    href={SYSTEM_CONFIG.youtubePlaylistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors whitespace-nowrap"
                >
                    Tutorials
                </a>
            </div>

            <HoverCard open={storageInfoOpen} onOpenChange={setStorageInfoOpen} openDelay={150}>
                <HoverCardTrigger asChild>
                    <button
                        type="button"
                        onClick={() => setStorageInfoOpen((open) => !open)}
                        className="text-muted-foreground hover:text-primary transition-colors bg-transparent border-0 p-0 underline decoration-dotted underline-offset-4 whitespace-nowrap"
                    >
                        Where are my maps saved?
                    </button>
                </HoverCardTrigger>
                <HoverCardContent side="top" align="end" className="w-72 text-sm leading-relaxed">
                    <p>
                        The app runs on this website, but your maps are saved in your
                        browser. They never get sent to our servers.
                    </p>
                    <p className="mt-2 text-muted-foreground">
                        Clearing your browser data deletes them too, so export anything
                        you want to keep.
                    </p>
                </HoverCardContent>
            </HoverCard>
        </footer>
    );
};
