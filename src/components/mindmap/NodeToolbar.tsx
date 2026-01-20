import { Image, Link, FileText, Smile, Trash, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';

interface NodeToolbarProps {
    onAddImage: () => void;
    onAddLink: () => void;
    onAddNotes?: () => void;
    onAddIcon?: () => void; // New prop
    className?: string;
}

export const NodeToolbar = ({
    onAddImage,
    onAddLink,
    onAddNotes,
    onAddIcon,
    className
}: NodeToolbarProps) => {
    return (
        <div className={cn(
            "absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1",
            "bg-white rounded-lg shadow-md border px-1 py-1 z-50",
            "animate-in fade-in slide-in-from-bottom-2 duration-200",
            className
        )}
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag/select when clicking toolbar
        >
            <button
                onClick={onAddIcon}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-blue-600 transition-colors"
                title="Add Icon"
            >
                <Smile className="w-4 h-4" />
            </button>
            <button
                onClick={onAddImage}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-blue-600 transition-colors"
                title="Add Image"
            >
                <Image className="w-4 h-4" />
            </button>
            <button
                onClick={onAddLink}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-blue-600 transition-colors"
                title="Add Link"
            >
                <Link className="w-4 h-4" />
            </button>

            {onAddNotes && (
                <button
                    onClick={onAddNotes}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-blue-600 transition-colors"
                    title="Edit Notes"
                >
                    <FileText className="w-4 h-4" />
                </button>
            )}
            {/* 
      // Future:
      <button className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-blue-600">
        <Smile className="w-4 h-4" />
      </button>
        <FileText className="w-4 h-4" />
      </button>
      */}
        </div>
    );
};
