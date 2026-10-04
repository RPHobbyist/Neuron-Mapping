/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useEffect, useRef } from 'react';
import { Save } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName?: string;
  isSaving?: boolean;
}

export const SaveDialog = ({ isOpen, onClose, onSave, defaultName = '', isSaving = false }: SaveDialogProps) => {
  const [name, setName] = useState(defaultName);
  const defaultNameRef = useRef(defaultName);
  defaultNameRef.current = defaultName;

  useEffect(() => {
    if (isOpen) setName(defaultNameRef.current);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isSaving) {
      onSave(name.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md sm:rounded-2xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Save Mind Map</DialogTitle>
          <DialogDescription>Saved maps are kept in this browser, on this device.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="mapName" className="block text-sm font-medium text-foreground mb-2">
              Name
            </label>
            <input
              id="mapName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="Enter a name for your mind map"
              className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
