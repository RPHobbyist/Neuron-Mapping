import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { MindMapNode, NodeColor, NodePriority } from '@/types/mindmap';

interface SearchBarProps {
    nodes: MindMapNode[];
    onNodeSelect: (nodeId: string) => void;
    onHighlight: (nodeIds: string[]) => void;
}

const colorOptions: { value: NodeColor | 'all'; label: string; color: string }[] = [
    { value: 'all', label: 'All Colors', color: '#888' },
    { value: 'orange', label: 'Orange', color: '#f97316' },
    { value: 'blue', label: 'Blue', color: '#3b82f6' },
    { value: 'cyan', label: 'Cyan', color: '#06b6d4' },
    { value: 'yellow', label: 'Yellow', color: '#eab308' },
    { value: 'purple', label: 'Purple', color: '#a855f7' },
    { value: 'green', label: 'Green', color: '#22c55e' },
    { value: 'red', label: 'Red', color: '#ef4444' },
    { value: 'grey', label: 'Grey', color: '#6b7280' },
];

const priorityOptions: { value: NodePriority | 'all'; label: string }[] = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: '🔴 High' },
    { value: 'medium', label: '🟡 Medium' },
    { value: 'low', label: '🟢 Low' },
];

export const SearchBar = ({ nodes, onNodeSelect, onHighlight }: SearchBarProps) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<MindMapNode[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [colorFilter, setColorFilter] = useState<NodeColor | 'all'>('all');
    const [priorityFilter, setPriorityFilter] = useState<NodePriority | 'all'>('all');
    const [showFilters, setShowFilters] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);



    // Keyboard shortcut Ctrl+F
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                setIsOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const getPath = useCallback((node: MindMapNode): string => {
        const path: string[] = [];
        let current: MindMapNode | undefined = node;
        while (current && current.parentId) {
            const parent = nodes.find(n => n.id === current?.parentId);
            if (parent) {
                path.unshift(parent.text.replace(/\n/g, ' '));
                current = parent;
            } else {
                break;
            }
        }
        return path.join(' > ');
    }, [nodes]);

    const applyFilters = useCallback((searchQuery: string, color: NodeColor | 'all', priority: NodePriority | 'all') => {
        let matches = nodes;

        // Text filter
        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            matches = matches.filter(node =>
                node.text.toLowerCase().includes(lowerQuery)
            );
        }

        // Color filter
        if (color !== 'all') {
            matches = matches.filter(node => node.color === color);
        }

        // Priority filter
        if (priority !== 'all') {
            matches = matches.filter(node => node.priority === priority);
        }

        setResults(matches);
        setSelectedIndex(0);

        // Highlight logic
        if (searchQuery.trim() || color !== 'all' || priority !== 'all') {
            onHighlight(matches.map(n => n.id));
        } else {
            onHighlight([]);
        }
    }, [nodes, onHighlight]);

    // Re-run filters when nodes change (keep results in sync)
    useEffect(() => {
        if (isOpen && (query || colorFilter !== 'all' || priorityFilter !== 'all')) {
            applyFilters(query, colorFilter, priorityFilter);
        }
    }, [nodes, isOpen, query, colorFilter, priorityFilter, applyFilters]);


    const handleSearch = useCallback((searchQuery: string) => {
        setQuery(searchQuery);
        // applyFilters called via useEffect dependency on query
    }, []);

    const handleColorFilter = (color: NodeColor | 'all') => {
        setColorFilter(color);
    };

    const handlePriorityFilter = (priority: NodePriority | 'all') => {
        setPriorityFilter(priority);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation(); // Stop propagation to prevent canvas events

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && results.length > 0) {
            e.preventDefault();
            e.stopPropagation(); // Double ensure
            onNodeSelect(results[selectedIndex].id);
            onHighlight([]); // Clear highlight on select
            setIsOpen(false);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
            setQuery('');
            onHighlight([]);
        }
    };

    const clearSearch = useCallback(() => {
        setQuery('');
        setColorFilter('all');
        setPriorityFilter('all');
        setResults([]);
        onHighlight([]);
    }, [onHighlight]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                if (isOpen) {
                    clearSearch();
                    setIsOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, clearSearch]);

    const hasActiveFilters = colorFilter !== 'all' || priorityFilter !== 'all';

    return (
        <div ref={searchRef} className="relative">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => {
                        if (isOpen) {
                            clearSearch();
                            setIsOpen(false);
                        } else {
                            setIsOpen(true);
                        }
                    }}
                    className={`flex items-center gap-2 px-2 py-1.5 text-xs font-medium hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors ${isOpen ? 'bg-muted text-foreground' : ''}`}
                    title="Search nodes (Ctrl+F)"
                >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                </button>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-[60]">
                    <div className="p-2 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search nodes..."
                                className="w-full pl-9 pr-16 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                autoFocus
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`p-1 rounded transition-colors ${hasActiveFilters ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
                                    title="Filters"
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                                {(query || hasActiveFilters) && (
                                    <button
                                        onClick={clearSearch}
                                        className="text-muted-foreground hover:text-foreground transition-all hover:rotate-90 duration-300"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter Panel */}
                        {showFilters && (
                            <div className="mt-2 p-2 bg-muted/50 rounded-lg space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground w-14">Color:</span>
                                    <select
                                        value={colorFilter}
                                        onChange={(e) => handleColorFilter(e.target.value as NodeColor | 'all')}
                                        className="flex-1 text-xs px-2 py-1 border rounded"
                                    >
                                        {colorOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground w-14">Priority:</span>
                                    <select
                                        value={priorityFilter || 'all'}
                                        onChange={(e) => handlePriorityFilter(e.target.value === 'all' ? 'all' : e.target.value as NodePriority)}
                                        className="flex-1 text-xs px-2 py-1 border rounded"
                                    >
                                        {priorityOptions.map(opt => (
                                            <option key={opt.value || 'all'} value={opt.value || 'all'}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {results.length > 0 && (
                        <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
                            {results.map((node, index) => {
                                const path = getPath(node);
                                return (
                                    <button
                                        key={node.id}
                                        onClick={() => {
                                            onNodeSelect(node.id);
                                            onHighlight([]);
                                            setIsOpen(false);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onNodeSelect(node.id);
                                                onHighlight([]);
                                                setIsOpen(false);
                                            }
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 ${index === selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                            }`}
                                    >
                                        <span
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: colorOptions.find(c => c.value === node.color)?.color || '#888' }}
                                        />
                                        <div className="flex flex-col overflow-hidden text-left flex-1 min-w-0">
                                            <span className="font-medium truncate">{node.text.replace(/\n/g, ' ')}</span>
                                            {path && <span className="text-[10px] text-muted-foreground truncate">{path}</span>}
                                        </div>
                                        {node.priority && (
                                            <span className="text-xs opacity-70 flex-shrink-0" title={`Priority: ${node.priority}`}>
                                                {node.priority === 'high' ? '🔴' : node.priority === 'medium' ? '🟡' : '🟢'}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {(query || hasActiveFilters) && results.length === 0 && (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                            No nodes found
                        </div>
                    )}

                    <div className="p-2 border-t text-xs text-muted-foreground flex justify-between bg-muted/20">
                        <span>↑↓ Navigate • Enter Select • Esc Close</span>
                        <span>{results.length} results</span>
                    </div>
                </div>
            )}
        </div>
    );
};
