import { cn } from '@/lib/utils';
import { TemplateCategory } from '@/types/templates';
import { 
  FileText, 
  Brain, 
  Network, 
  Users, 
  Clock, 
  ListTree, 
  GanttChart,
  Globe,
  TrendingUp,
  Layers,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TemplateSidebarProps {
  categories: TemplateCategory[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  'quick-diagrams': Brain,
  'personal-life': Users,
  'planning': ListTree,
  'business': Network,
  'project-management': GanttChart,
  'communication': FileText,
  'goal-setting': TrendingUp,
  'business-analysis': Layers,
  'marketing': Globe,
  'education': FileText,
};

export const TemplateSidebar = ({
  categories,
  activeCategory,
  onCategoryChange,
}: TemplateSidebarProps) => {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-gradient-to-b from-card to-card/50 overflow-y-auto">
      <nav className="p-5 space-y-1">
        {categories.map((category, index) => {
          if (category.isSection) {
            return (
              <motion.div 
                key={category.id} 
                className="pt-8 pb-3 first:pt-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70 pl-3">
                  {category.name}
                </span>
              </motion.div>
            );
          }

          const Icon = categoryIcons[category.id] || FileText;
          const isActive = activeCategory === category.id;

          return (
            <motion.button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                'group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'sidebar-item-active text-primary-foreground'
                  : 'text-foreground/80 hover:bg-secondary/80 hover:text-foreground'
              )}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ x: isActive ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
                isActive 
                  ? 'bg-primary-foreground/20' 
                  : 'bg-secondary group-hover:bg-primary/10'
              )}>
                <Icon className={cn(
                  'w-4 h-4 transition-colors',
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                )} />
              </div>
              <span className="flex-1 text-left">{category.name}</span>
              <ChevronRight className={cn(
                'w-4 h-4 opacity-0 -translate-x-2 transition-all',
                isActive ? 'opacity-100 translate-x-0 text-primary-foreground/70' : 'group-hover:opacity-50 group-hover:translate-x-0'
              )} />
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
};
