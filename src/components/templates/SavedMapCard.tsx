/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { Copy, Download, MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import { differenceInDays, differenceInMinutes, format, formatDistanceToNowStrict, isSameYear } from 'date-fns';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SavedMapSummary } from '@/hooks/useSavedMaps';

interface SavedMapCardProps {
  map: SavedMapSummary;
  thumbnail?: string;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onDelete: () => void;
  pinned?: boolean;
  onTogglePin?: () => void;
}

const editedLabel = (date: Date) => {
  const now = new Date();
  if (differenceInMinutes(now, date) < 1) return 'Edited just now';
  if (differenceInDays(now, date) < 7) return `Edited ${formatDistanceToNowStrict(date, { addSuffix: true })}`;
  return `Edited ${format(date, isSameYear(date, now) ? 'MMM d' : 'MMM d, yyyy')}`;
};

export const SavedMapCard = ({ map, thumbnail, onOpen, onRename, onDuplicate, onExport, onDelete, pinned = false, onTogglePin }: SavedMapCardProps) => {
  const updatedAt = new Date(map.updatedAt);
  const hasDate = !Number.isNaN(updatedAt.getTime());
  const topics = `${map.nodeCount} ${map.nodeCount === 1 ? 'topic' : 'topics'}`;

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${map.name}`}
        className="w-full text-left bg-card rounded-lg border overflow-hidden transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <div className="aspect-[16/10] bg-muted/40 border-b flex items-center justify-center">
          {thumbnail ? (
            <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">{map.nodeCount === 0 ? 'Empty map' : 'No preview yet'}</span>
          )}
        </div>

        <div className="px-3 py-2.5 pr-10">
          <h3 className="text-sm font-medium text-foreground truncate" title={map.name}>
            {pinned && <Pin className="inline w-3 h-3 mr-1 -mt-0.5 text-muted-foreground" aria-label="Pinned" />}
            {map.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {hasDate ? `${editedLabel(updatedAt)} · ${topics}` : topics}
          </p>
        </div>
      </button>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="absolute bottom-3 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors data-[state=open]:bg-muted data-[state=open]:text-foreground"
            title="Rename, duplicate, export or delete"
            aria-label={`Actions for ${map.name}`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {onTogglePin && (
            <DropdownMenuItem onSelect={onTogglePin} className="gap-2 cursor-pointer">
              {pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />} {pinned ? 'Unpin' : 'Pin to the top'}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={onRename} className="gap-2 cursor-pointer">
            <Pencil className="w-4 h-4" /> Rename…
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onDuplicate} className="gap-2 cursor-pointer">
            <Copy className="w-4 h-4" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onExport} className="gap-2 cursor-pointer">
            <Download className="w-4 h-4" /> Export as a file
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onDelete} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
            <Trash2 className="w-4 h-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
