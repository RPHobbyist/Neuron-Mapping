import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const LicenseUpdateAnnouncement = ({ onAcknowledge }: { onAcknowledge?: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Some environments (storage blocked, hardened privacy settings)
        // throw on property access rather than just returning null — this
        // component is mounted on every route inside the app-wide
        // ErrorBoundary, so an uncaught throw here used to blank the entire
        // app with "Something went wrong" instead of just skipping the notice.
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

    // Escape / overlay-click also needs to go through handleClose — routing
    // it straight to setIsOpen(false) let the dialog be dismissed without
    // ever writing the acknowledged flag, so it reappeared on every load.
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
                    <DialogTitle>License Update: GNU AGPLv3</DialogTitle>
                </DialogHeader>
                <DialogDescription asChild className="text-left space-y-4">
                    <div className="text-foreground">
                        <p className="text-justify text-foreground">
                            We have updated our license to the <strong className="text-foreground">GNU Affero General Public License v3 (AGPLv3)</strong>.
                        </p>
                        <p className="text-justify text-foreground">
                            This change ensures that the project remains open and free forever.
                            It guarantees that anyone who builds upon this project, whether as a downloadable tool or a web service, must also share their improvements with the community.
                        </p>
                    </div>
                </DialogDescription>
                <DialogFooter>
                    <Button onClick={handleClose}>I Understand</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
