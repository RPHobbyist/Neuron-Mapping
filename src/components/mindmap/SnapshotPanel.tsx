import { useState, useCallback } from 'react';
import { MindMapNode } from '@/types/mindmap';
import { History, Save, Trash2, RotateCcw, X, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Snapshot {
    id: string;
    name: string;
    timestamp: number;
    nodes: MindMapNode[];
}

interface SnapshotPanelProps {
    nodes: MindMapNode[];
    onRestore: (nodes: MindMapNode[]) => void;
    isOpen: boolean;
    onClose: () => void;
}

const STORAGE_KEY = 'mindmap_snapshots';

export const SnapshotPanel = ({ nodes, onRestore, isOpen, onClose }: SnapshotPanelProps) => {
    const [snapshots, setSnapshots] = useState<Snapshot[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [snapshotName, setSnapshotName] = useState('');

    const saveSnapshots = useCallback((newSnapshots: Snapshot[]) => {
        setSnapshots(newSnapshots);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSnapshots));
    }, []);

    const createSnapshot = useCallback(() => {
        const name = snapshotName.trim() || `Snapshot ${snapshots.length + 1}`;
        const newSnapshot: Snapshot = {
            id: Date.now().toString(),
            name,
            timestamp: Date.now(),
            nodes: JSON.parse(JSON.stringify(nodes)), // Deep clone
        };
        saveSnapshots([newSnapshot, ...snapshots].slice(0, 10)); // Keep max 10
        setSnapshotName('');
        toast.success(`Snapshot "${name}" saved`);
    }, [nodes, snapshotName, snapshots, saveSnapshots]);

    const deleteSnapshot = useCallback((id: string) => {
        saveSnapshots(snapshots.filter(s => s.id !== id));
        toast.success('Snapshot deleted');
    }, [snapshots, saveSnapshots]);

    const restoreSnapshot = useCallback((snapshot: Snapshot) => {
        // Auto-backup current state before restoring
        const currentBackup: Snapshot = {
            id: Date.now().toString(),
            name: `Auto-Backup: ${new Date().toLocaleTimeString()}`,
            timestamp: Date.now(),
            nodes: JSON.parse(JSON.stringify(nodes)),
        };

        // Add backup and ensure we don't exceed limit (keep backup + existing)
        const updatedSnapshots = [currentBackup, ...snapshots].slice(0, 10);
        saveSnapshots(updatedSnapshots);

        onRestore(snapshot.nodes);
        toast.success(`Restored to "${snapshot.name}" (Current state backed up)`);
        onClose();
    }, [nodes, snapshots, saveSnapshots, onRestore, onClose]);

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Version History
                </h2>
                <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-all hover:rotate-90 duration-300">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Create New Snapshot */}
            <div className="p-4 border-b">
                <div className="flex gap-2">
                    <input
                        id="snapshot-name-input"
                        name="snapshot-name"
                        type="text"
                        value={snapshotName}
                        onChange={(e) => setSnapshotName(e.target.value)}
                        placeholder="Snapshot name (optional)"
                        className="flex-1 px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        onKeyDown={(e) => e.key === 'Enter' && createSnapshot()}
                    />
                    <button
                        onClick={createSnapshot}
                        className="px-3 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                        title="Save Snapshot"
                    >
                        <Save className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Save the current state. Max 10 snapshots kept.
                </p>
            </div>

            {/* Snapshot List */}
            <div className="flex-1 overflow-y-auto p-2">
                {snapshots.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No snapshots yet</p>
                        <p className="text-xs mt-1">Save your first snapshot above</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {snapshots.map((snapshot) => (
                            <div
                                key={snapshot.id}
                                className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-medium text-sm">{snapshot.name}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {formatDate(snapshot.timestamp)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {snapshot.nodes.length} nodes
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => restoreSnapshot(snapshot)}
                                            className="p-1.5 hover:bg-green-100 text-green-600 rounded transition-colors"
                                            title="Restore this snapshot"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteSnapshot(snapshot.id)}
                                            className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                                            title="Delete snapshot"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
