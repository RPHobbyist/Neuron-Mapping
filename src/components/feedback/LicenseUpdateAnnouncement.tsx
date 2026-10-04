/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const LicenseUpdateAnnouncement = ({ onAcknowledge }: { onAcknowledge?: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        try {
            const hasSeen = localStorage.getItem("license-update-acknowledged-agplv3");
            if (!hasSeen) {
                setIsOpen(true);
            }
        } catch (e) {
            console.error("Failed to read license acknowledgement flag:", e);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        try {
            localStorage.setItem("license-update-acknowledged-agplv3", "true");
        } catch (e) {
            console.error("Failed to persist license acknowledgement:", e);
        }
        onAcknowledge?.();
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            handleClose();
        } else {
            setIsOpen(open);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Neuron Mapping is now under the AGPLv3</DialogTitle>
                </DialogHeader>
                <DialogDescription asChild className="text-left space-y-4">
                    <div className="text-foreground">
                        <p className="text-foreground">
                            The source code is now licensed under the GNU Affero General Public License, version 3.
                        </p>
                        <p className="text-foreground">
                            Nothing changes in how you use the app. If someone builds on the code, for a download or for a website, they have to share their changes under the same license.
                        </p>
                    </div>
                </DialogDescription>
                <DialogFooter>
                    <Button onClick={handleClose}>OK</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
 