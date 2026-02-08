import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const LicenseUpdateAnnouncement = ({ onAcknowledge }: { onAcknowledge?: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const hasSeen = localStorage.getItem("license-update-acknowledged-agplv3");
        if (!hasSeen) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem("license-update-acknowledged-agplv3", "true");
        onAcknowledge?.();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
