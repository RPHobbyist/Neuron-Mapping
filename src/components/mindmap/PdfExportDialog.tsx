/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DEFAULT_PDF_LAYOUT, PdfLayout, planPdfPages } from '@/utils/exportUtils';

const STORAGE_KEY = 'neuron-pdf-layout';

const PAGES: { value: PdfLayout['page']; label: string }[] = [
  { value: 'fit', label: 'Map size' },
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
];
const SCALES: { value: PdfLayout['scale']; label: string }[] = [
  { value: 'fit', label: 'Fit on one page' },
  { value: 'actual', label: 'Actual size' },
];
const ORIENTATIONS: { value: PdfLayout['orientation']; label: string }[] = [
  { value: 'auto', label: 'Automatic' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
];

const readLayout = (): PdfLayout => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<PdfLayout> | null;
    return {
      page: PAGES.some(p => p.value === stored?.page) ? stored!.page! : DEFAULT_PDF_LAYOUT.page,
      scale: SCALES.some(s => s.value === stored?.scale) ? stored!.scale! : DEFAULT_PDF_LAYOUT.scale,
      orientation: ORIENTATIONS.some(o => o.value === stored?.orientation) ? stored!.orientation! : DEFAULT_PDF_LAYOUT.orientation,
    };
  } catch {
    return DEFAULT_PDF_LAYOUT;
  }
};

const Choice = <T extends string>({ name, label, options, value, onChange }: {
  name: string;
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) => (
  <fieldset>
    <legend className="text-xs font-medium text-muted-foreground mb-1.5">{label}</legend>
    <div className="grid grid-flow-col auto-cols-fr gap-1">
      {options.map(option => (
        <label
          key={option.value}
          className={cn(
            'px-2 py-1.5 text-xs text-center rounded border transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-ring',
            value === option.value
              ? 'bg-primary text-primary-foreground border-primary font-medium'
              : 'bg-background hover:bg-muted text-muted-foreground'
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  </fieldset>
);

interface PdfExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapSize: { width: number; height: number } | null;
  onExport: (layout: PdfLayout) => void;
}

export function PdfExportDialog({ open, onOpenChange, mapSize, onExport }: PdfExportDialogProps) {
  const [layout, setLayout] = useState<PdfLayout>(readLayout);
  const update = (changes: Partial<PdfLayout>) => setLayout(prev => ({ ...prev, ...changes }));
  const plan = mapSize ? planPdfPages(mapSize.width, mapSize.height, layout) : null;
  const pageCount = plan ? plan.columns * plan.rows : 0;

  const handleExport = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
    }
    onOpenChange(false);
    onExport(layout);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export as PDF</DialogTitle>
          <DialogDescription>
            The whole map as a picture in a PDF, on one page the size of the map or on paper to print.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Choice name="pdf-page" label="Page size" options={PAGES} value={layout.page} onChange={page => update({ page })} />
          {layout.page !== 'fit' && (
            <>
              <Choice name="pdf-scale" label="Scale" options={SCALES} value={layout.scale} onChange={scale => update({ scale })} />
              <Choice name="pdf-orientation" label="Orientation" options={ORIENTATIONS} value={layout.orientation} onChange={orientation => update({ orientation })} />
            </>
          )}
          {plan && layout.page !== 'fit' && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {pageCount === 1
                ? `One ${plan.landscape ? 'landscape' : 'portrait'} page.`
                : `${pageCount} ${plan.landscape ? 'landscape' : 'portrait'} pages, ${plan.rows} ${plan.rows === 1 ? 'row' : 'rows'} of ${plan.columns}, each labelled with its place.`}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExport} disabled={!mapSize}>Export PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
