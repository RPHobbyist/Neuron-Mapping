/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useEffect, useRef, useState } from 'react';
import { Pipette, Plus } from 'lucide-react';

interface Hsv {
  h: number;
  s: number;
  v: number;
}

const HEX_RE = /^#?[0-9a-f]{6}$/i;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function hexToHsv(hex: string): Hsv {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

function hsvToHex({ h, s, v }: Hsv): string {
  const channel = (n: number) => {
    const k = (n + h / 60) % 6;
    const c = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, '0');
  };
  return `#${channel(5)}${channel(3)}${channel(1)}`;
}

function dragHandlers(update: (x: number, y: number) => void) {
  const apply = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    update(clamp01((e.clientX - r.left) / r.width), clamp01((e.clientY - r.top) / r.height));
  };
  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.focus();
      apply(e);
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) apply(e);
    },
  };
}

const ARROW_STEPS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

function arrowKeyHandler(update: (dx: number, dy: number) => void) {
  return (e: React.KeyboardEvent) => {
    const step = ARROW_STEPS[e.key];
    if (!step) return;
    e.preventDefault();
    e.stopPropagation();
    const size = e.shiftKey ? 10 : 1;
    update(step[0] * size, step[1] * size);
  };
}

type EyeDropperConstructor = new () => { open: () => Promise<{ sRGBHex: string }> };

interface ColorPickerProps {
  id: string;
  value: string;
  onChange: (color: string) => void;
  onAdd: (color: string) => void;
  onClose: () => void;
}

export const ColorPicker = ({ id, value, onChange, onAdd, onClose }: ColorPickerProps) => {
  const [hsv, setHsv] = useState(() => hexToHsv(HEX_RE.test(value) ? value : '#6366f1'));
  const [hexDraft, setHexDraft] = useState<string | null>(null);
  const hex = hsvToHex(hsv);

  const lastHexRef = useRef(value.toLowerCase());
  useEffect(() => {
    const next = value.toLowerCase();
    if (next !== lastHexRef.current && HEX_RE.test(next)) {
      lastHexRef.current = next;
      setHsv(hexToHsv(next));
    }
  }, [value]);

  const update = (next: Hsv) => {
    setHsv(next);
    const nextHex = hsvToHex(next);
    if (nextHex !== lastHexRef.current) {
      lastHexRef.current = nextHex;
      onChange(nextHex);
    }
  };

  const EyeDropper = (window as unknown as { EyeDropper?: EyeDropperConstructor }).EyeDropper;
  const pickFromScreen = async () => {
    if (!EyeDropper) return;
    try {
      const { sRGBHex } = await new EyeDropper().open();
      if (HEX_RE.test(sRGBHex)) update(hexToHsv(sRGBHex));
    } catch {
    }
  };

  const thumbClass = 'absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.3)] pointer-events-none';
  const focusClass = 'outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1';

  return (
    <div
      className="basis-full mt-1 p-2 rounded-lg border bg-background space-y-2 animate-in fade-in slide-in-from-top-1 duration-150"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness"
        aria-valuetext={hex}
        className={`relative h-32 rounded-md cursor-crosshair touch-none ${focusClass}`}
        style={{
          backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
          backgroundImage: 'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
        }}
        {...dragHandlers((x, y) => update({ ...hsv, s: x, v: 1 - y }))}
        onKeyDown={arrowKeyHandler((dx, dy) => update({ ...hsv, s: clamp01(hsv.s + dx / 100), v: clamp01(hsv.v + dy / 100) }))}
      >
        <div className={thumbClass} style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: hex }} />
      </div>

      <div className="flex items-center gap-2">
        {EyeDropper && (
          <button
            onClick={pickFromScreen}
            className="w-7 h-7 shrink-0 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Pick a color from the screen"
            aria-label="Pick a color from the screen"
          >
            <Pipette className="w-4 h-4" />
          </button>
        )}
        <div className="w-7 h-7 shrink-0 rounded-full ring-1 ring-border" style={{ backgroundColor: hex }} />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Hue"
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(hsv.h)}
          className={`relative flex-1 h-3 mx-1.5 rounded-full cursor-pointer touch-none ${focusClass}`}
          style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
          {...dragHandlers((x) => update({ ...hsv, h: x * 360 }))}
          onKeyDown={arrowKeyHandler((dx, dy) => update({ ...hsv, h: Math.min(360, Math.max(0, hsv.h + dx + dy)) }))}
        >
          <div className={`${thumbClass} top-1/2`} style={{ left: `${(hsv.h / 360) * 100}%`, backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center flex-1 h-7 px-2 border rounded bg-background focus-within:ring-1 focus-within:ring-primary">
          <span className="text-xs text-muted-foreground">#</span>
          <input
            id={id}
            name={id}
            value={hexDraft ?? hex.slice(1)}
            maxLength={7}
            spellCheck={false}
            autoComplete="off"
            aria-label="Hex color"
            onChange={(e) => {
              const text = e.target.value.trim();
              setHexDraft(text);
              if (HEX_RE.test(text)) update(hexToHsv(text));
            }}
            onBlur={() => setHexDraft(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) onAdd(hex);
            }}
            className="w-full pl-1 bg-transparent text-xs font-mono uppercase outline-none"
          />
        </label>
        <button
          onClick={() => onAdd(hex)}
          className="h-7 px-2.5 shrink-0 rounded bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1 hover:bg-primary/90 transition-colors"
          title="Save this color to your swatches"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Add
        </button>
      </div>
    </div>
  );
};
