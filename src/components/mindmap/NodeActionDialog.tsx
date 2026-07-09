import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link, Image as ImageIcon } from "lucide-react";
import { MAX_FILE_SIZE } from '@/lib/constants';
import { toast } from 'sonner';
import { sanitizeUrl } from '@/utils/common';

interface NodeActionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (value: string) => void;
    type: 'image' | 'link' | null;
    initialValue?: string;
}

export const NodeActionDialog = ({
    isOpen,
    onClose,
    onSubmit,
    type,
    initialValue = ''
}: NodeActionDialogProps) => {
    const [value, setValue] = useState(initialValue);
    const [fileName, setFileName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setValue(initialValue);
            setFileName('');
        }
    }, [isOpen, initialValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (type === 'link') {
            const safeUrl = sanitizeUrl(value);
            if (!safeUrl && value.trim()) {
                toast.error('Invalid URL. Only http, https, mailto, and tel links are allowed.');
                return;
            }
            onSubmit(safeUrl || '');
        } else {
            onSubmit(value);
        }
        onClose();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`File is too large. Maximum size is 5MB.`);
                return;
            }

            // Storage quota check using modern StorageManager API
            if (navigator.storage && navigator.storage.estimate) {
                try {
                    const { usage, quota } = await navigator.storage.estimate();
                    if (usage !== undefined && quota !== undefined) {
                        const remaining = quota - usage;
                        // Warning if remaining storage is less than 10MB or less than the file size + small buffer
                        if (remaining < Math.max(10 * 1024 * 1024, file.size * 2)) {
                            toast.warning('Warning: You are approaching the browser storage limit. Large images may not be saved permanently.', {
                                duration: 5000
                            });
                        }
                    }
                } catch (err) {
                    console.error('Failed to estimate storage quota:', err);
                }
            }

            setFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setValue(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const config = {
        image: {
            title: 'Add Image',
            icon: <ImageIcon className="w-5 h-5 mr-2" />,
            label: 'Upload Image',
            placeholder: 'Choose an image...',
            inputType: 'file'
        },
        link: {
            title: 'Add Link',
            icon: <Link className="w-5 h-5 mr-2" />,
            label: 'External URL',
            placeholder: 'https://example.com',
            inputType: 'text'
        }
    };

    const currentConfig = type ? config[type] : config.image;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        {currentConfig.icon}
                        {currentConfig.title}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="input-field">{currentConfig.label}</Label>
                        {currentConfig.inputType === 'file' ? (
                            <div className="flex flex-col gap-2">
                                <Input
                                    id="input-field"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="cursor-pointer"
                                />
                                {value && (
                                    <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                                        <img
                                            src={value}
                                            alt="Preview"
                                            className="h-full w-full object-contain"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Input
                                id="input-field"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder={currentConfig.placeholder}
                                autoFocus
                            />
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Add
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
