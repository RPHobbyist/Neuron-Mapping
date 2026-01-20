import { Trash2, Clock } from 'lucide-react';
import { SavedMindMap } from '@/types/mindmap';
import { formatDistanceToNow } from 'date-fns';

interface SavedMapCardProps {
  map: SavedMindMap;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const SavedMapCard = ({ map, onClick, onDelete }: SavedMapCardProps) => {
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl border p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer relative"
    >
      <div className="aspect-[4/3] bg-gray-50 rounded-lg mb-4 flex items-center justify-center border border-gray-100 group-hover:bg-blue-50/30 overflow-hidden relative">
        {map.thumbnail ? (
          <img
            src={map.thumbnail}
            alt={map.name}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="text-center">
            <div className="text-gray-400 font-medium text-xs">{map.nodes.length} nodes</div>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between">
        <div className="w-full">
          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight" title={map.name}>
            {map.name}
          </h3>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(map.updatedAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(e);
        }}
        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
        title="Delete map"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
