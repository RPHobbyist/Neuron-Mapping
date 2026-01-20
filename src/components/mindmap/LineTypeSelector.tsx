import { ConnectionStyle } from '@/types/mindmap';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spline } from 'lucide-react';

export interface LineTypeSelectorProps {
    currentStyle: ConnectionStyle;
    onStyleChange: (style: ConnectionStyle) => void;
    label?: string;
    showSubtext?: boolean;
}

const lineTypes: { value: ConnectionStyle; label: string; icon: React.ReactNode }[] = [
    { value: 'curved', label: 'Curve', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20 Q 12 4, 20 20" /></svg> },
    { value: 'straight', label: 'Straight', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="20" x2="20" y2="4" /></svg> },
    { value: 'orthogonal', label: 'Step', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20 L 4 4 L 20 4" /></svg> },
    { value: 'dashed', label: 'Dashed', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2"><path d="M4 20 Q 12 4, 20 20" /></svg> },
    { value: 'dotted', label: 'Dotted', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2"><path d="M4 20 Q 12 4, 20 20" /></svg> },
    { value: 'arrow', label: 'Arrow', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20 L 20 4 M 16 4 L 20 4 L 20 8" /></svg> },
];

export const LineTypeSelector = ({
    currentStyle,
    onStyleChange,
    label = 'Canva Line Type',
    showSubtext = true
}: LineTypeSelectorProps) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                    title="Change line type"
                >
                    <Spline className="w-4 h-4" />
                    <span className="hidden sm:inline whitespace-nowrap">{label}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {showSubtext && (
                    <div className="px-2 py-1.5 text-[10px] text-muted-foreground border-b mb-1">
                        This changes all lines of canvas
                    </div>
                )}
                {lineTypes.map((type) => (
                    <DropdownMenuItem
                        key={type.value}
                        onClick={() => onStyleChange(type.value)}
                        className={`cursor-pointer flex items-center gap-3 ${currentStyle === type.value ? 'bg-muted' : ''}`}
                    >
                        <span className="text-muted-foreground">{type.icon}</span>
                        <span>{type.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
