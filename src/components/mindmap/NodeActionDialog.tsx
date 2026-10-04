/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link, Image as ImageIcon, Upload, Trash2 } from "lucide-react";
import { toast } from 'sonner';
import { sanitizeUrl, sanitizeImageUrl } from '@/utils/common';
import { MAX_IMAGE_UPLOAD_SIZE, imageFileIn, isHttpsUrl, pictureFromUrl, prepareNodeImage } from '@/utils/imageUtils';

interface NodeActionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (value: string | undefined) => void;
    type: 'image' | 'link' | null;
    initialValue?: string;
}

const LINKED_PICTURE_NOTICE = "That site doesn't let its pictures be copied, so the map links to this one. "
    + 'It needs a connection to show, and is left out of exported images.';

export const NodeActionDialog = ({
    isOpen,
    onClose,
    onSubmit,
    type,
    initialValue = ''
}: NodeActionDialogProps) => {
    const [value, setValue] = useState(initialValue);
    const [address, setAddress] = useState('');
    const [fileName, setFileName] = useState('');
    const [isBusy, setIsBusy] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setValue(initialValue);
            setAddress(type === 'image' && isHttpsUrl(initialValue) ? initialValue : '');
            setFileName('');
            setIsBusy(false);
        }
    }, [isOpen, initialValue, type]);

    const finish = (result: string | undefined) => {
        if (result !== (initialValue || undefined)) onSubmit(result);
        onClose();
    };

    const submitImage = async () => {
        const typed = address.trim();
        if (!typed || typed === initialValue) {
            const safeImage = sanitizeImageUrl(value);
            if (safeImage) finish(safeImage);
            else toast.error('Choose a picture, paste one, or enter its address.');
            return;
        }
        if (!isHttpsUrl(typed)) {
            toast.error('Enter the address of a picture, starting with https://');
            return;
        }
        setIsBusy(true);
        try {
            const picture = await pictureFromUrl(typed);
            if (picture.linked) toast.warning(LINKED_PICTURE_NOTICE, { duration: 8000 });
            finish(picture.image);
        } catch {
            toast.error('No picture could be loaded from that address.');
        } finally {
            setIsBusy(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isBusy) return;
        if (type === 'image') {
            void submitImage();
            return;
        }
        const safeUrl = sanitizeUrl(value);
        if (!safeUrl && value.trim()) {
            toast.error('Invalid URL. Only http, https, mailto, and tel links are allowed.');
            return;
        }
        finish(safeUrl);
    };

    const loadFile = async (file: File) => {
        if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
            toast.error(`File is too large. Maximum size is ${MAX_IMAGE_UPLOAD_SIZE / (1024 * 1024)}MB.`);
            return;
        }

        if (navigator.storage && navigator.storage.estimate) {
            try {
                const { usage, quota } = await navigator.storage.estimate();
                if (usage !== undefined && quota !== undefined) {
                    const remaining = quota - usage;
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
        setIsBusy(true);
        try {
            setValue(await prepareNodeImage(file));
            setAddress('');
        } catch (error) {
            console.error('Failed to read image:', error);
            toast.error('Failed to read image file. Please try another file.');
            setFileName('');
        } finally {
            setIsBusy(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) void loadFile(file);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        if (type !== 'image') return;
        const file = imageFileIn(e.clipboardData.files);
        if (!file) return;
        e.preventDefault();
        void loadFile(file);
    };

    const isImage = type !== 'link';
    const hasCurrent = !!initialValue;
    const title = isImage
        ? (hasCurrent ? 'Change Image' : 'Add Image')
        : (hasCurrent ? 'Edit Link' : 'Add Link');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md" onPaste={handlePaste}>
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        {isImage ? <ImageIcon className="w-5 h-5 mr-2" /> : <Link className="w-5 h-5 mr-2" />}
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {isImage
                            ? 'Upload a picture, paste one with Ctrl+V, or give its address.'
                            : 'Shown under the text, and opened in a new tab.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {isImage ? (
                        <div className="flex flex-col gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="image-file">Upload Image</Label>
                                <input
                                    id="image-file"
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors"
                                >
                                    <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span className={fileName ? "text-foreground truncate" : "text-muted-foreground"}>
                                        {fileName || 'Choose an image...'}
                                    </span>
                                </button>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="image-address">Image Address</Label>
                                <Input
                                    id="image-address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="https://example.com/picture.png"
                                    inputMode="url"
                                />
                            </div>
                            {value && (
                                <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                                    <img
                                        src={value}
                                        alt="Preview"
                                        className="h-full w-full object-contain"
                                        referrerPolicy="no-referrer"
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="link-url">External URL</Label>
                            <Input
                                id="link-url"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="https://example.com"
                                autoFocus
                            />
                        </div>
                    )}
                    <DialogFooter className="sm:justify-between gap-2">
                        {hasCurrent ? (
                            <Button type="button" variant="ghost" onClick={() => finish(undefined)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4 mr-1.5" />
                                {isImage ? 'Remove Image' : 'Remove Link'}
                            </Button>
                        ) : <span />}
                        <div className="flex flex-col-reverse sm:flex-row gap-2">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isBusy}>
                                {isBusy ? 'Loading…' : hasCurrent ? 'Save' : 'Add'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
