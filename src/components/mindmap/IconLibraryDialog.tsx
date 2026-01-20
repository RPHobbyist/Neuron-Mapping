import { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { iconCategories, totalIconCount } from '@/utils/iconLibrary';
import { Smile, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface IconLibraryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (iconName: string, style: 'plain' | 'boxed') => void;
}

export const IconLibraryDialog = ({
    isOpen,
    onClose,
    onSubmit
}: IconLibraryDialogProps) => {
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>(Object.keys(iconCategories)[0] || 'development');
    const [iconStyle, setIconStyle] = useState<'plain' | 'boxed'>('plain');
    const [searchQuery, setSearchQuery] = useState('');

    const categoryKeys = Object.keys(iconCategories);

    // Filter icons based on search
    const filteredIcons = useMemo(() => {
        if (!searchQuery.trim()) {
            return iconCategories[activeCategory]?.icons || [];
        }

        // Search across all categories
        const query = searchQuery.toLowerCase();
        const results: typeof iconCategories[string]['icons'] = [];

        for (const category of Object.values(iconCategories)) {
            for (const icon of category.icons) {
                if (icon.name.includes(query) || icon.label.toLowerCase().includes(query)) {
                    results.push(icon);
                }
            }
        }
        return results.slice(0, 100); // Limit to 100 results for performance
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
                    {/* Icon Style Selection */}
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

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search icons..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="flex gap-4 h-[400px]">
                    {/* Category List */}
                    {!searchQuery && (
                        <ScrollArea className="w-40 shrink-0 border rounded-lg">
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
                        </ScrollArea>
                    )}

                    {/* Icon Grid */}
                    <ScrollArea className="flex-1 border rounded-lg">
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
                                                "flex flex-col items-center justify-center p-3 rounded-lg transition-all hover:bg-gray-100 border border-transparent",
                                                isSelected && "bg-blue-50 border-blue-500 shadow-sm"
                                            )}
                                            title={item.label}
                                        >
                                            <IconComponent className={cn(
                                                "w-6 h-6",
                                                isSelected ? "text-blue-600" : "text-gray-600"
                                            )} />
                                            <span className="text-[11px] text-center text-gray-500 mt-1">
                                                {item.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!selectedIcon}>
                        Insert Icon
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
