/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useMemo, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { iconCategories, totalIconCount } from '@/utils/iconLibrary';
import { Smile, Search, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface IconLibraryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (iconName: string | undefined, style: 'plain' | 'boxed') => void;
    initialIcon?: string;
    initialStyle?: 'plain' | 'boxed';
}

const categoryKeys = Object.keys(iconCategories);
const categoryOf = (iconName: string | undefined) =>
    categoryKeys.find(key => iconCategories[key].icons.some(icon => icon.name === iconName));

export const IconLibraryDialog = ({
    isOpen,
    onClose,
    onSubmit,
    initialIcon,
    initialStyle,
}: IconLibraryDialogProps) => {
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>(categoryKeys[0] || 'development');
    const [iconStyle, setIconStyle] = useState<'plain' | 'boxed'>('plain');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setSelectedIcon(initialIcon ?? null);
        setIconStyle(initialStyle ?? 'plain');
        setActiveCategory(categoryOf(initialIcon) ?? categoryKeys[0] ?? 'development');
        setSearchQuery('');
    }, [isOpen, initialIcon, initialStyle]);

    const filteredIcons = useMemo(() => {
        if (!searchQuery.trim()) {
            return iconCategories[activeCategory]?.icons || [];
        }

        const query = searchQuery.toLowerCase();
        const results: typeof iconCategories[string]['icons'] = [];

        for (const category of Object.values(iconCategories)) {
            for (const icon of category.icons) {
                if (icon.name.includes(query) || icon.label.toLowerCase().includes(query)) {
                    results.push(icon);
                }
            }
        }
        return results.slice(0, 100);
    }, [activeCategory, searchQuery]);

    const handleIconSelect = (iconName: string) => {
        setSelectedIcon(iconName);
    };

    const handleSubmit = () => {
        if (selectedIcon) {
            onSubmit(selectedIcon, iconStyle);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Smile className="w-5 h-5" />
                        Icon Library
                        <span className="text-xs text-muted-foreground ml-2">({totalIconCount} icons)</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="py-2 space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Icon Style</Label>
                        <RadioGroup
                            value={iconStyle}
                            onValueChange={(v) => setIconStyle(v as 'plain' | 'boxed')}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="plain" id="style-plain" />
                                <Label htmlFor="style-plain" className="cursor-pointer text-sm">Only Icon</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="boxed" id="style-boxed" />
                                <Label htmlFor="style-boxed" className="cursor-pointer text-sm">Icon with Box</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="icon-search-input"
                            name="icon-search"
                            placeholder="Search icons..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="flex gap-4 h-[400px]">
                    {!searchQuery && (
                        <div className="w-40 shrink-0 border rounded-lg overflow-y-auto">
                            <div className="p-2 space-y-1">
                                {categoryKeys.map(key => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveCategory(key)}
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                                            activeCategory === key
                                                ? "bg-primary text-primary-foreground"
                                                : "hover:bg-muted"
                                        )}
                                    >
                                        {iconCategories[key].label}
                                        <span className="text-xs opacity-60 ml-1">
                                            ({iconCategories[key].icons.length})
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 border rounded-lg overflow-y-auto">
                        <div className="p-4">
                            {searchQuery && (
                                <p className="text-sm text-muted-foreground mb-3">
                                    {filteredIcons.length} results for "{searchQuery}"
                                </p>
                            )}
                            <div className="grid grid-cols-4 gap-3">
                                {filteredIcons.map((item) => {
                                    const IconComponent = item.component;
                                    const isSelected = selectedIcon === item.name;

                                    return (
                                        <button
                                            key={item.name}
                                            onClick={() => handleIconSelect(item.name)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-3 rounded-lg transition-all hover:bg-muted border border-transparent",
                                                isSelected && "bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-sm"
                                            )}
                                            title={item.label}
                                        >
                                            <IconComponent className={cn(
                                                "w-6 h-6",
                                                isSelected ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                                            )} />
                                            <span className="text-[11px] text-center text-muted-foreground mt-1">
                                                {item.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between gap-2">
                    {initialIcon ? (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                onSubmit(undefined, iconStyle);
                                onClose();
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Remove Icon
                        </Button>
                    ) : <span />}
                    <div className="flex flex-col-reverse sm:flex-row gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={!selectedIcon}>
                            {initialIcon ? 'Save' : 'Insert Icon'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
 