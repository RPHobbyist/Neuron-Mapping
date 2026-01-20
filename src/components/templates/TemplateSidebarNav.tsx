import { motion } from 'framer-motion';
import {
    LayoutGrid,
    Users,
    Target,
    TrendingUp,
    Calendar,
    MessageSquare,
    GraduationCap,
    Briefcase,
    Clock,
    Plus,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateSidebarNavProps {
    activeCategory: string | null;
    onCategoryChange: (category: string | null) => void;
    savedMapsCount?: number;
    onCreateNew?: () => void;
}

const categories = [
    { id: null, name: 'All Templates', icon: LayoutGrid, color: 'primary' },
    { id: 'quick-diagrams', name: 'Quick Diagrams', icon: Sparkles, color: 'teal' },
    { id: 'business-analysis', name: 'Business Analysis', icon: Briefcase, color: 'purple' },
    { id: 'project-management', name: 'Project Management', icon: Target, color: 'blue' },
    { id: 'planning', name: 'Planning', icon: Calendar, color: 'green' },
    { id: 'marketing', name: 'Marketing', icon: TrendingUp, color: 'orange' },
    { id: 'communication', name: 'Communication', icon: MessageSquare, color: 'pink' },
];

const colorClasses: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    teal: 'text-node-teal bg-node-teal/10',
    purple: 'text-node-purple bg-node-purple/10',
    blue: 'text-node-blue bg-node-blue/10',
    green: 'text-node-green bg-node-green/10',
    orange: 'text-node-orange bg-node-orange/10',
    pink: 'text-node-pink bg-node-pink/10',
};

export const TemplateSidebarNav = ({
    activeCategory,
    onCategoryChange,
    savedMapsCount = 0,
    onCreateNew,
}: TemplateSidebarNavProps) => {
    return (
        <motion.aside
            className="w-64 h-full flex flex-col bg-card/50 border-r border-border/40 backdrop-blur-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Create New Button */}
            <div className="p-4">
                <button
                    onClick={onCreateNew}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create New Map</span>
                </button>
            </div>

            {/* Categories */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
                <div className="space-y-1">
                    <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Categories
                    </p>

                    {categories.map((category) => {
                        const Icon = category.icon;
                        const isActive = activeCategory === category.id;

                        return (
                            <button
                                key={category.id ?? 'all'}
                                onClick={() => onCategoryChange(category.id)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                                    isActive
                                        ? 'bg-primary/15 text-primary shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                                )}
                            >
                                <div className={cn(
                                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                                    isActive ? colorClasses[category.color] : 'bg-secondary/50'
                                )}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span className="flex-1 text-left">{category.name}</span>
                                {isActive && (
                                    <ChevronRight className="w-4 h-4 text-primary" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Divider */}
                <div className="my-4 h-px bg-border/50" />

                {/* Quick Access */}
                <div className="space-y-1">
                    <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Quick Access
                    </p>

                    <button
                        onClick={() => onCategoryChange('recent')}
                        className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                            activeCategory === 'recent'
                                ? 'bg-primary/15 text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        )}
                    >
                        <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            activeCategory === 'recent' ? 'bg-primary/10 text-primary' : 'bg-secondary/50'
                        )}>
                            <Clock className="w-4 h-4" />
                        </div>
                        <span className="flex-1 text-left">Recent Maps</span>
                        {savedMapsCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                {savedMapsCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Footer with Stats */}
            <div className="p-4 border-t border-border/40">
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-secondary/30">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-foreground">Pro Tip</p>
                        <p className="text-[10px] text-muted-foreground">Press Tab to add nodes quickly</p>
                    </div>
                </div>
            </div>
        </motion.aside>
    );
};
