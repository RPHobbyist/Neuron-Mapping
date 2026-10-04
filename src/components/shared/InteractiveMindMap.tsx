/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */


import { useEffect, useRef, useState, memo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, animate, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  CircleCheck,
  Download,
  Eraser,
  Flag,
  GripVertical,
  FileJson,
  FileText,
  Focus,
  Box as BoxIcon,
  Image as ImageIcon,
  LayoutGrid,
  Maximize,
  Megaphone,
  Minus,
  Package,
  Pencil,
  Play,
  Plus,
  Redo2,
  Rocket,
  Save,
  Search,
  Spline,
  SquareDashed,
  Type,
  Palette as PaletteIcon,
  Shapes,
  X,
  Undo2,
  Users,
  type LucideIcon
} from "lucide-react";

import { colorStyles, statusOptions, NODE_SHADOW } from "@/utils/nodeStyles";

const W = 540;
const TOOLBAR_H = 40;
const CANVAS_H = 320;
const H = TOOLBAR_H + CANVAS_H;

const TEMPLATE_ID = "product-launch-radial";
const MAP_NAME = "Launch plan";

type Palette = "blue" | "orange" | "purple" | "green";

interface MapNode {
  id: string;
  parentId: string | null;
  label: string;
  x: number;
  y: number;
  color: Palette | "root";
  icon?: LucideIcon;
  status?: string;
}

const NODES: MapNode[] = [
  { id: "root", parentId: null, label: MAP_NAME, x: 270, y: 165, color: "root", icon: Rocket },
  { id: "product", parentId: "root", label: "Product", x: 170, y: 83, color: "blue", icon: Package },
  { id: "pricing", parentId: "product", label: "Pricing", x: 58, y: 48, color: "blue", status: "done" },
  { id: "specs", parentId: "product", label: "Specs", x: 58, y: 118, color: "blue", status: "in-progress" },
  { id: "promo", parentId: "root", label: "Promo", x: 370, y: 83, color: "orange", icon: Megaphone },
  { id: "ads", parentId: "promo", label: "Ads", x: 482, y: 48, color: "orange", status: "done" },
  { id: "social", parentId: "promo", label: "Social media", x: 482, y: 118, color: "orange", status: "planning" },
  { id: "kpis", parentId: "root", label: "KPIs", x: 170, y: 247, color: "purple", icon: BarChart3 },
  { id: "traffic", parentId: "kpis", label: "Traffic", x: 58, y: 212, color: "purple", status: "review" },
  { id: "sales", parentId: "kpis", label: "Sales", x: 58, y: 282, color: "purple" },
  { id: "stakeholders", parentId: "root", label: "Stakeholders", x: 370, y: 247, color: "green", icon: Users },
  { id: "investors", parentId: "stakeholders", label: "Investors", x: 482, y: 206, color: "green" },
  { id: "team", parentId: "stakeholders", label: "Team", x: 482, y: 262, color: "green" }
];

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
const ROOT_D = 76;
const BRANCH_W = 84;
const nodeWidth = (n: MapNode) => (n.id === "root" ? ROOT_D : n.icon ? BRANCH_W : Math.max(64, n.label.length * 6.4 + 26));

const GALAXY_COLORS: Record<MapNode["color"], { bg: string; text: string; border: string }> = {
  root: { bg: "#1e293b", text: "#ffffff", border: "#475569" },
  blue: { bg: "#bfdbfe", text: "#1e40af", border: "#3b82f6" },
  orange: { bg: "#fed7aa", text: "#9a3412", border: "#fb923c" },
  purple: { bg: "#e9d5ff", text: "#7e22ce", border: "#a855f7" },
  green: { bg: "#bbf7d0", text: "#15803d", border: "#22c55e" }
};

const PLAY_ORDER: string[] = (() => {
  const order: string[] = [];
  const walk = (id: string) => {
    order.push(id);
    NODES.filter((n) => n.parentId === id)
      .sort((a, b) => a.y - b.y)
      .forEach((child) => walk(child.id));
  };
  walk("root");
  return order;
})();

const CHAPTERS = [
  {
    tab: "Templates",
    title: "Start from a template",
    body: "Pick one of 30+ templates, like this product launch plan, or import a Markdown, OPML or CSV outline.",
    duration: 3400,
    steps: [450, 1200]
  },
  {
    tab: "Styling",
    title: "Change how any block or line looks",
    body: "Click a block to change its font, colour, shape, priority and status. Click a line to change its type, arrowheads, thickness and colour.",
    duration: 8400,
    steps: [700, 1100, 1700, 2000, 2600, 2900, 3500, 3800, 4400, 4800, 5400, 5800, 6400, 6700, 7300]
  },
  {
    tab: "Status",
    title: "Track progress on the map itself",
    body: "Give nodes a status like Planning, In Progress or Done, then filter by status in search.",
    duration: 3200,
    steps: []
  },
  {
    tab: "Box areas",
    title: "Group nodes in box areas",
    body: "Draw a labelled box around nodes that belong together. Move the box and they move with it.",
    duration: 3200,
    steps: []
  },
  {
    tab: "Drawing",
    title: "Draw on the canvas",
    body: "Circle, underline or point at things with the pen. The eraser takes it off again.",
    duration: 3200,
    steps: []
  },
  {
    tab: "Play Mode",
    title: "Present it with Play Mode",
    body: "Play Mode reveals the map one node at a time, which works well for lessons, pitches and walkthroughs.",
    duration: 5400,
    steps: [700, 1300]
  },
  {
    tab: "3D view",
    title: "Step back and see it in 3D",
    body: "Galaxy View lays the map out in space. Rotate it, zoom in, and switch between Force Field, Sphere, Grid and 2D Projection layouts.",
    duration: 5400,
    steps: [700, 1300]
  },
  {
    tab: "Export",
    title: "Export or save",
    body: "Save a PDF or PNG for slides and reports, or a .nmm file so you can keep editing later.",
    duration: 4000,
    steps: [700, 1300, 2000]
  }
];

const CH = { template: 0, styling: 1, status: 2, boxes: 3, drawing: 4, play: 5, galaxy: 6, export: 7 };

const PANEL = { x: 334, y: TOOLBAR_H + 6, w: 198, h: 300 };
const SWATCH = (row: number, col: number, top: number) => ({ x: 10 + col * 19 + 7, y: top + row * 19 + 7 });
const GRID3 = (row: number, col: number, top: number) => ({ x: 10 + col * 61 + 28.5, y: top + row * 22 + 9 });
const GRID4 = (col: number, top: number) => ({ x: 10 + col * 45.5 + 20.75, y: top + 9 });
const inPanel = (p: { x: number; y: number }) => ({ x: PANEL.x + p.x, y: PANEL.y + p.y });
const STYLING_TARGETS = [
  { x: 176, y: TOOLBAR_H + 89 },
  inPanel({ x: 20, y: 60 }),
  inPanel(SWATCH(1, 1, 116)),
  inPanel(GRID3(0, 2, 174)),
  inPanel(GRID4(0, 236)),
  { x: 223, y: TOOLBAR_H + 126 },
  inPanel(GRID3(1, 0, 50)),
  inPanel(SWATCH(1, 1, 204))
];

const BADGE_CLASS =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-white/90 px-1.5 py-px text-[9px] font-medium leading-4 text-slate-700 ring-1 ring-inset ring-black/10";
const ROOT_SHADOW = "shadow-[0_2px_4px_rgba(20,24,40,0.10),0_12px_28px_-10px_rgba(20,24,40,0.45)]";

const penLoop = (cx: number, cy: number, rx: number, ry: number) => {
  const points: string[] = [];
  for (let t = -0.6; t <= Math.PI * 2 + 0.5; t += 0.12) {
    const r = 1 + 0.05 * Math.sin(t * 3) + 0.07 * (t / (Math.PI * 2));
    points.push(`${(cx + rx * r * Math.cos(t)).toFixed(1)} ${(cy + ry * r * Math.sin(t)).toFixed(1)}`);
  }
  return `M ${points.join(" L ")}`;
};

const linePath = (parent: MapNode, child: MapNode) => {
  const dir = child.x < parent.x ? -1 : 1;
  const x1 = parent.x + (dir * nodeWidth(parent)) / 2;
  const x2 = child.x - (dir * nodeWidth(child)) / 2;
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${parent.y} C ${mid} ${parent.y}, ${mid} ${child.y}, ${x2} ${child.y}`;
};

const project = (x: number, y: number, z: number, theta: number) => {
  const tilt = 0.32;
  const xr = x * Math.cos(theta) + z * Math.sin(theta);
  const zr = -x * Math.sin(theta) + z * Math.cos(theta);
  const yt = y * Math.cos(tilt) - zr * Math.sin(tilt);
  const zt = y * Math.sin(tilt) + zr * Math.cos(tilt);
  const p = 640 / (640 + zt);
  return { x: W / 2 + xr * p, y: CANVAS_H / 2 + 18 - yt * p, p, depth: zt };
};

const toSpace = (n: MapNode) => ({ x: (n.x - 270) * 0.8, y: -(n.y - 165) * 0.78, z: 0 });

export const InteractiveMindMap = memo(() => {
  const reducedMotion = !!useReducedMotion();
  const [still, setStill] = useState(false);
  useEffect(() => setStill(reducedMotion), [reducedMotion]);
  const outerRef = useRef<HTMLDivElement>(null);
  const viewModeRef = useRef<HTMLSpanElement>(null);
  const exportRef = useRef<HTMLSpanElement>(null);

  const [scale, setScale] = useState(1);
  const [anchors, setAnchors] = useState({ view: { x: 0, w: 0 }, export: { x: 0, w: 0 } });
  const [loop, setLoop] = useState(0);
  const [chapter, setChapter] = useState(0);
  const [sub, setSub] = useState(0);
  const [fading, setFading] = useState(false);
  const [playStep, setPlayStep] = useState(0);
  const [theta, setTheta] = useState(-0.55);

  const done = (c: number) => still || chapter > c;
  const live = (c: number) => !still && chapter === c;

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / W)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const v = viewModeRef.current;
    const e = exportRef.current;
    if (v && e) setAnchors({ view: { x: v.offsetLeft, w: v.offsetWidth }, export: { x: e.offsetLeft, w: e.offsetWidth } });
  }, [scale]);

  useEffect(() => {
    if (still) return;
    const current = CHAPTERS[chapter];
    setSub(0);
    setPlayStep(0);
    setTheta(-0.55);

    let restart: number | undefined;
    const timers = current.steps.map((ms, i) => window.setTimeout(() => setSub(i + 1), ms));
    timers.push(
      window.setTimeout(() => {
        if (chapter < CHAPTERS.length - 1) {
          setChapter(chapter + 1);
          return;
        }
        setFading(true);
        restart = window.setTimeout(() => {
          setFading(false);
          setChapter(0);
          setLoop((n) => n + 1);
        }, 600);
      }, current.duration)
    );
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(restart);
    };
  }, [chapter, loop, still]);

  useEffect(() => {
    if (still || chapter !== CH.play || sub < 2) return;
    const timer = window.setInterval(() => setPlayStep((n) => Math.min(n + 1, PLAY_ORDER.length)), 230);
    return () => window.clearInterval(timer);
  }, [chapter, sub, still]);

  useEffect(() => {
    if (still || chapter !== CH.galaxy || sub < 2) return;
    const controls = animate(-0.55, 0.45, { duration: 4, ease: "easeInOut", onUpdate: setTheta });
    return () => controls.stop();
  }, [chapter, sub, still]);

  const building = live(CH.template);
  const galaxy = live(CH.galaxy) && sub >= 2;
  const playing = live(CH.play) && sub >= 2;

  const nodeVisible = (n: MapNode) => {
    if (playing) return PLAY_ORDER.indexOf(n.id) < playStep;
    if (!building) return true;
    if (n.id === "root") return true;
    return n.icon ? sub >= 1 : sub >= 2;
  };
  const visible = NODES.filter(nodeVisible);

  const showStatus = done(CH.status) || live(CH.status);
  const showBox = done(CH.boxes) || live(CH.boxes);
  const showPen = done(CH.drawing) || live(CH.drawing);
  const styled = still || chapter > CH.styling ? 99 : live(CH.styling) ? sub : -1;
  const productLook = { bold: styled >= 3, color: styled >= 5 ? "pink" : undefined, pill: styled >= 7, high: styled >= 9 };
  const productLine = { selected: live(CH.styling) && sub >= 11, dashed: styled >= 13, color: styled >= 15 ? "#6366f1" : undefined };
  const panelMode = live(CH.styling) && sub >= 1 ? (sub >= 11 ? "line" : "block") : null;
  const selectedId = live(CH.styling) && sub >= 1 && sub < 11 ? "product" : null;

  const viewMenuOpen = (live(CH.play) || live(CH.galaxy)) && sub === 1;
  const exportMenuOpen = live(CH.export) && (sub === 1 || sub === 2);
  const exportDone = live(CH.export) && sub === 3;

  const viewRight = anchors.view.x + anchors.view.w;
  const exportRight = anchors.export.x + anchors.export.w;
  let cursor: { x: number; y: number } | null = null;
  if (!still && !fading) {
    if (live(CH.styling)) cursor = STYLING_TARGETS[Math.min(Math.floor(sub / 2), STYLING_TARGETS.length - 1)];
    if (live(CH.play) || live(CH.galaxy)) {
      const item = live(CH.play) ? 1 : 2;
      cursor = sub === 0 ? { x: anchors.view.x + anchors.view.w / 2, y: TOOLBAR_H / 2 + 4 } : { x: viewRight - 110, y: TOOLBAR_H + 8 + item * 28 + 14 };
      if (galaxy || playing) cursor = null;
    }
    if (live(CH.export)) {
      cursor = sub === 0 ? { x: anchors.export.x + anchors.export.w / 2, y: TOOLBAR_H / 2 + 4 } : { x: exportRight - 150, y: sub === 1 ? TOOLBAR_H + 30 : TOOLBAR_H + 132 };
    }
  }
  const clicking = (live(CH.styling) && sub % 2 === 1) || ((live(CH.play) || live(CH.galaxy)) && (sub === 1 || sub === 2)) || (live(CH.export) && (sub === 1 || sub === 3));

  const box = { x: 6, y: 151, w: 216, h: 156, color: "#a855f7", label: "Review weekly" };

  const toolbarButton = (active: boolean) =>
    `flex items-center gap-1 px-1.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
      active ? "bg-slate-100 text-slate-900" : "text-slate-500"
    }`;

  const caption = still
    ? {
        title: "A launch plan made from a template",
        body: "Styled blocks and lines, statuses, a box area and a pen drawing. You can also present it with Play Mode, view it in 3D and export it as a PNG or PDF."
      }
    : CHAPTERS[chapter];

  return (
    <div className="relative w-full max-w-[540px] mx-auto select-none font-sans">
      <div className="bg-white rounded-2xl ring-1 ring-slate-900/10 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] overflow-hidden">
        <div ref={outerRef} className="relative overflow-hidden" style={{ height: H * scale }} aria-hidden="true">
          <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${scale})` }}>
            <div className="relative z-30 flex items-center gap-0.5 px-2 border-b border-slate-200 bg-white" style={{ height: TOOLBAR_H }}>
              <span className="p-1.5 text-slate-500"><ArrowLeft className="w-3.5 h-3.5" /></span>
              <span className="p-1.5 text-slate-500 opacity-50"><Undo2 className="w-3.5 h-3.5" /></span>
              <span className="p-1.5 text-slate-500 opacity-50"><Redo2 className="w-3.5 h-3.5" /></span>
              <span className="w-px h-4 bg-slate-200 mx-1" />
              <span className={toolbarButton(live(CH.boxes))}><SquareDashed className="w-3.5 h-3.5" />Box Area</span>
              <span className={toolbarButton(false)}><LayoutGrid className="w-3.5 h-3.5" />Layout</span>
              <span className={toolbarButton(false)}><Search className="w-3.5 h-3.5" />Search</span>
              <span ref={viewModeRef} className={`relative ${toolbarButton(viewMenuOpen)}`}>
                View Mode
                <ChevronDown className="w-3 h-3 opacity-50" />
              </span>
              <span className="w-px h-4 bg-slate-200 mx-1" />
              <span className={toolbarButton(false)}><Save className="w-3.5 h-3.5" />Save</span>
              <span ref={exportRef} className={toolbarButton(exportMenuOpen)}><Download className="w-3.5 h-3.5" />Export</span>
            </div>

            <AnimatePresence>
              {viewMenuOpen && (
                <motion.div
                  className="absolute z-40 w-40 p-1 rounded-md bg-white border border-slate-200 shadow-md text-[12px] text-slate-700"
                  style={{ left: viewRight - 160, top: TOOLBAR_H + 4 }}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                >
                  <div className="h-7 px-3 rounded-sm flex items-center gap-2"><Focus className="w-3.5 h-3.5 opacity-70" />Focus Mode</div>
                  <div className={`h-7 px-3 rounded-sm flex items-center gap-2 ${live(CH.play) ? "bg-slate-100" : ""}`}><Play className="w-3.5 h-3.5 opacity-70" />Play Mode</div>
                  <div className={`h-7 px-3 rounded-sm flex items-center gap-2 ${live(CH.galaxy) ? "bg-slate-100" : ""}`}><BoxIcon className="w-3.5 h-3.5 opacity-70" />3D View</div>
                </motion.div>
              )}
              {exportMenuOpen && (
                <motion.div
                  className="absolute z-40 w-56 p-1 rounded-md bg-white border border-slate-200 shadow-md text-[12px] text-slate-700"
                  style={{ left: exportRight - 224, top: TOOLBAR_H + 4 }}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                >
                  <div className="px-2 py-1.5 rounded-sm flex items-center gap-2">
                    <FileJson className="w-3.5 h-3.5" />
                    <div className="flex flex-col"><span>Save to File</span><span className="text-[10px] text-slate-400">.nmm format (re-editable)</span></div>
                  </div>
                  <div className="h-px my-1 -mx-1 bg-slate-100" />
                  <div className="px-2 py-1.5 rounded-sm flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <div className="flex flex-col"><span>Export as PNG</span><span className="text-[10px] text-slate-400">High-quality image</span></div>
                  </div>
                  <div className={`px-2 py-1.5 rounded-sm flex items-center gap-2 ${sub === 2 ? "bg-slate-100" : ""}`}>
                    <FileText className="w-3.5 h-3.5" />
                    <div className="flex flex-col"><span>Export as PDF</span><span className="text-[10px] text-slate-400">Print-ready document</span></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute left-0 overflow-hidden" style={{ top: TOOLBAR_H, width: W, height: CANVAS_H }}>
              <motion.div className="absolute inset-0" animate={{ opacity: fading ? 0 : 1 }} transition={{ duration: 0.5 }}>
                <AnimatePresence initial={false}>
                  {galaxy ? (
                    <motion.div key="galaxy" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                      <GalaxyScene theta={theta} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`flat-${loop}`}
                      className="absolute inset-0 bg-[#f6f6f4]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{ backgroundImage: "radial-gradient(circle, #d4d4d0 1px, transparent 1.2px)", backgroundSize: "20px 20px" }}
                      />

                      {showBox && (
                        <motion.div
                          className="absolute rounded-2xl"
                          style={{ left: box.x, top: box.y, width: box.w, height: box.h, border: `1.5px solid ${box.color}99`, backgroundColor: `${box.color}10` }}
                          initial={{ opacity: done(CH.boxes) ? 1 : 0, scale: done(CH.boxes) ? 1 : 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.45, ease: "easeOut" }}
                        >
                          <span
                            className="absolute left-2.5 top-2 rounded-lg px-2 py-0.5 text-[11px] font-semibold"
                            style={{ backgroundColor: `${box.color}26`, color: "#7e22ce" }}
                          >
                            {box.label}
                          </span>
                        </motion.div>
                      )}

                      <svg width={W} height={CANVAS_H} className="absolute inset-0" fill="none" strokeLinecap="round">
                        {visible
                          .filter((n) => n.parentId && visible.some((v) => v.id === n.parentId))
                          .map((n, i) =>
                            n.id === "product" && productLine.dashed ? (
                              <path
                                key={`${loop}-${n.id}-dashed`}
                                d={linePath(byId[n.parentId!], n)}
                                stroke={productLine.color ?? "#475569"}
                                strokeWidth={2.5}
                                strokeDasharray="6 5"
                              />
                            ) : (
                            <motion.path
                              key={`${loop}-${n.id}`}
                              d={linePath(byId[n.parentId!], n)}
                              stroke={n.id === "product" ? (productLine.color ?? (productLine.selected ? "#475569" : "#a3a3a3")) : "#a3a3a3"}
                              strokeWidth={n.id === "product" && (productLine.selected || productLine.color) ? 2.5 : 1.5}
                              strokeDasharray={n.id === "product" && productLine.dashed ? "6 5" : undefined}
                              initial={{ pathLength: building || playing ? 0 : 1 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: playing ? 0.2 : 0.45, delay: building ? (n.icon ? i * 0.08 : 0.1 + i * 0.03) : 0, ease: "easeOut" }}
                            />
                            )
                          )}
                        {showPen && (
                          <motion.path
                            d={penLoop(482, 48, 52, 33)}
                            stroke="#ef4444"
                            strokeWidth={2.5}
                            initial={{ pathLength: done(CH.drawing) ? 1 : 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.1, ease: "easeInOut", delay: 0.3 }}
                          />
                        )}
                      </svg>

                      {visible.map((n, i) => (
                        <FlatNode
                          key={`${loop}-${n.id}`}
                          node={n}
                          delay={building ? (n.id === "root" ? 0 : n.icon ? 0.15 + i * 0.05 : 0.1 + i * 0.03) : 0}
                          animateIn={building || playing}
                          showStatus={showStatus}
                          statusDelay={done(CH.status) ? 0 : 0.2 + i * 0.07}
                          selected={selectedId === n.id}
                          look={n.id === "product" ? productLook : undefined}
                        />
                      ))}

                      <div className="absolute left-0 bottom-0 px-2.5 py-1 bg-white border-t border-r border-slate-200 rounded-tr-md text-[11px] font-semibold text-slate-800">
                        {MAP_NAME}
                      </div>
                      <div className="absolute right-2.5 bottom-2 flex items-center gap-0.5 px-1.5 py-1 rounded-xl bg-white border border-slate-200 shadow-md text-slate-600">
                        <span className="p-1"><Minus className="w-3 h-3" /></span>
                        <span className="px-1 text-[10px] font-medium tabular-nums">68%</span>
                        <span className="p-1"><Plus className="w-3 h-3" /></span>
                        <span className="w-px h-3.5 bg-slate-200 mx-0.5" />
                        <span className="p-1"><Maximize className="w-3 h-3" /></span>
                        <span className="w-px h-3.5 bg-slate-200 mx-0.5" />
                        <span className={`p-1 rounded-md transition-colors ${live(CH.drawing) ? "bg-indigo-100 text-indigo-700" : ""}`}><Pencil className="w-3 h-3" /></span>
                        <span className="p-1"><Eraser className="w-3 h-3" /></span>
                      </div>

                      <AnimatePresence>
                        {panelMode && (
                          <motion.div
                            className="absolute z-40"
                            style={{ left: PANEL.x, top: PANEL.y - TOOLBAR_H }}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 16 }}
                            transition={{ duration: 0.2 }}
                          >
                            <PropertiesPanel mode={panelMode} styled={styled} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {galaxy && (
                  <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
                    <span className="flex items-center gap-1.5 bg-black/60 text-white text-[11px] px-2.5 py-1.5 rounded-lg border border-white/10">
                      2D Projection <ChevronDown className="w-3 h-3 opacity-70" />
                    </span>
                    <span className="bg-white/10 text-white text-[12px] px-3.5 py-1.5 rounded-full border border-white/10">Exit 3D View</span>
                  </div>
                )}

                <AnimatePresence>
                  {exportDone && (
                    <motion.div
                      className="absolute z-40 right-3 bottom-12 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-slate-200 shadow-lg text-[12px] font-medium text-slate-800"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                    >
                      <CircleCheck className="w-4 h-4 text-white fill-emerald-600" />
                      Exported as PDF
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            <AnimatePresence>
              {cursor && (
                <motion.div
                  key={`cursor-${loop}-${chapter}`}
                  className="absolute z-50"
                  initial={{ left: W + 20, top: H + 20 }}
                  animate={{ left: cursor.x, top: cursor.y }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: live(CH.styling) ? 0.42 : 0.65, ease: "easeInOut" }}
                >
                  {clicking && (
                    <motion.span
                      key={sub}
                      className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-indigo-400"
                      initial={{ scale: 0.3, opacity: 0.55 }}
                      animate={{ scale: 1.7, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                  <svg width="16" height="20" viewBox="0 0 14 20" className="drop-shadow">
                    <path d="M1 1 L1 16 L5 12.5 L8 19 L10.5 18 L7.6 11.5 L13 11.5 Z" fill="#0f172a" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="px-5 pt-4 pb-5 border-t border-slate-200">
          <div className="flex gap-1.5" aria-hidden="true">
            {CHAPTERS.map((c, i) => {
              const past = still || i < chapter;
              const active = !still && i === chapter;
              return (
                <div key={c.tab} className="flex-1 min-w-0 py-1">
                  <span className="block h-1 rounded-full bg-slate-200 overflow-hidden">
                    {past && <span className="block h-full w-full bg-indigo-600" />}
                    {active && (
                      <motion.span
                        key={`${loop}-${i}`}
                        className="block h-full bg-indigo-600"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: c.duration / 1000, ease: "linear" }}
                      />
                    )}
                  </span>
                  <span className={`hidden sm:block mt-1.5 text-[10.5px] truncate transition-colors ${active ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
                    {c.tab}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 min-h-[4.75rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={caption.title}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-base font-semibold text-slate-900">{caption.title}</p>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{caption.body}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-3">
            <Link
              to={`/workspace?template=${TEMPLATE_ID}`}
              className="h-9 px-4 inline-flex items-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
            >
              Open this template
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});

InteractiveMindMap.displayName = "InteractiveMindMap";

interface FlatNodeProps {
  node: MapNode;
  delay: number;
  animateIn: boolean;
  showStatus: boolean;
  statusDelay: number;
  selected: boolean;
  look?: { bold: boolean; color?: string; pill: boolean; high: boolean };
}

const FlatNode = ({ node, delay, animateIn, showStatus, statusDelay, selected, look }: FlatNodeProps) => {
  const styles = colorStyles[look?.color ?? node.color];
  const status = showStatus && node.status ? statusOptions.find((s) => s.value === node.status) : undefined;
  const Icon = node.icon;
  const isRoot = node.id === "root";
  const width = nodeWidth(node);

  return (
    <motion.div
      className={`absolute z-20 flex flex-col items-center justify-center text-center border ${styles.bg} ${styles.text} ${styles.border} ${
        isRoot ? `rounded-full ${ROOT_SHADOW}` : `${look?.pill ? "rounded-full" : "rounded-lg"} ${NODE_SHADOW}`
      } transition-colors duration-300 ${selected ? "ring-2 ring-offset-2 ring-indigo-500 ring-offset-[#f6f6f4]" : ""}`}
      style={{
        left: node.x,
        top: node.y,
        x: "-50%",
        y: "-50%",
        width: node.icon ? width : undefined,
        minWidth: width,
        height: isRoot ? ROOT_D : undefined,
        padding: isRoot ? 0 : Icon ? "7px 6px" : "5px 8px"
      }}
      initial={animateIn ? { opacity: 0, scale: 0.6 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 24, delay }}
    >
      {look?.high && (
        <motion.span
          className={`${BADGE_CLASS} mb-1`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 26 }}
        >
          <Flag className="w-2.5 h-2.5 fill-current text-red-600" />
          High
        </motion.span>
      )}
      {status && (
        <motion.span
          className={`${BADGE_CLASS} mb-1`}
          initial={{ scale: 0, height: 0 }}
          animate={{ scale: 1, height: "auto" }}
          transition={{ type: "spring", stiffness: 500, damping: 26, delay: statusDelay }}
        >
          <status.icon className={`w-2.5 h-2.5 ${status.color}`} />
          {status.label}
        </motion.span>
      )}
      {Icon && <Icon className={isRoot ? "w-4 h-4 mb-0.5" : "w-4 h-4 mb-1"} />}
      <span
        className={`leading-tight ${
          isRoot ? "text-[11px] font-bold w-14 whitespace-normal" : `text-[11px] whitespace-nowrap ${look?.bold ? "font-bold" : Icon ? "font-medium" : ""}`
        }`}
      >
        {node.label}
      </span>
    </motion.div>
  );
};

const BLOCK_COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#94a3b8"];
const LINE_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#a855f7", "#d946ef", "#ec4899", "#92400e", "#9ca3af", "#6b7280", "#1a1a1a"];

const sectionLabel = "absolute left-2.5 flex items-center gap-1 text-[8.5px] font-semibold uppercase tracking-wide text-slate-500";
const optionClass = (active: boolean) =>
  `absolute flex items-center justify-center rounded text-[9px] transition-colors ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`;

const PropertiesPanel = ({ mode, styled }: { mode: "block" | "line"; styled: number }) => {
  const swatches = (colors: string[], top: number, perRow: number, selected?: string) =>
    colors.map((c, i) => {
      const { x, y } = SWATCH(Math.floor(i / perRow), i % perRow, top);
      return (
        <span
          key={c}
          className={`absolute rounded-full ${selected === c ? "ring-2 ring-offset-1 ring-slate-900" : ""}`}
          style={{ left: x - 7, top: y - 7, width: 14, height: 14, backgroundColor: c }}
        />
      );
    });
  const grid3 = (labels: string[], top: number, active: string) =>
    labels.map((l, i) => {
      const { x, y } = GRID3(Math.floor(i / 3), i % 3, top);
      return (
        <span key={l} className={optionClass(l === active)} style={{ left: x - 28.5, top: y - 9, width: 57, height: 18 }}>
          {l}
        </span>
      );
    });
  const grid4 = (labels: string[], top: number, active: string) =>
    labels.map((l, i) => {
      const { x, y } = GRID4(i, top);
      return (
        <span key={l} className={optionClass(l === active)} style={{ left: x - 20.75, top: y - 9, width: 41.5, height: 18 }}>
          {l}
        </span>
      );
    });

  return (
    <div className="relative rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden" style={{ width: PANEL.w, height: PANEL.h }}>
      <div className="absolute inset-x-0 top-0 h-7 px-2 flex items-center gap-1 border-b border-slate-100">
        <GripVertical className="w-3 h-3 text-slate-400" />
        <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-700">{mode === "line" ? "Line Properties" : "Block Properties"}</span>
        <X className="w-3 h-3 ml-auto text-slate-400" />
      </div>

      {mode === "block" ? (
        <>
          <span className={sectionLabel} style={{ top: 36 }}><Type className="w-2.5 h-2.5" />Text</span>
          {["B", "I", "U", "S"].map((l, i) => (
            <span
              key={l}
              className={`${optionClass(l === "B" && styled >= 3)} ${l === "B" ? "font-bold" : l === "I" ? "italic" : l === "U" ? "underline" : "line-through"}`}
              style={{ left: 10 + i * 23, top: 50, width: 20, height: 20 }}
            >
              {l}
            </span>
          ))}
          {(["start", "center", "end"] as const).map((align, i) => (
            <span key={align} className={`${optionClass(align === "center")} flex-col gap-[2px]`} style={{ left: 110 + i * 23, top: 50, width: 20, height: 20, alignItems: align === "start" ? "flex-start" : align === "end" ? "flex-end" : "center", padding: "0 5px" }}>
              <span className="block h-px w-2.5 bg-current" />
              <span className="block h-px w-1.5 bg-current" />
              <span className="block h-px w-2.5 bg-current" />
            </span>
          ))}
          <span className="absolute flex items-center justify-between px-2 rounded border border-slate-200 text-[9px] text-slate-700" style={{ left: 10, top: 74, width: 110, height: 20 }}>
            Default <ChevronDown className="w-2.5 h-2.5 opacity-50" />
          </span>
          <span className="absolute flex items-center justify-between px-2 rounded border border-slate-200 text-[9px] text-slate-700" style={{ left: 124, top: 74, width: 40, height: 20 }}>
            16 <ChevronDown className="w-2.5 h-2.5 opacity-50" />
          </span>

          <span className={sectionLabel} style={{ top: 102 }}><PaletteIcon className="w-2.5 h-2.5" />Color</span>
          {swatches(BLOCK_COLORS, 116, 9, styled >= 5 ? "#ec4899" : "#3b82f6")}

          <span className={sectionLabel} style={{ top: 160 }}><Shapes className="w-2.5 h-2.5" />Shape</span>
          {grid3(["Rounded", "Rectangle", "Pill", "Circle", "Diamond", "Hexagon"], 174, styled >= 7 ? "Pill" : "Rounded")}

          <span className={sectionLabel} style={{ top: 222 }}><Flag className="w-2.5 h-2.5" />Priority</span>
          {grid4(["High", "Medium", "Low", "None"], 236, styled >= 9 ? "High" : "None")}

          <span className={sectionLabel} style={{ top: 264 }}>Status</span>
          {grid3(["Backlog", "Planning", "Discussion"], 278, "")}
        </>
      ) : (
        <>
          <span className={sectionLabel} style={{ top: 36 }}><Spline className="w-2.5 h-2.5" />Type</span>
          {grid3(["Curve", "Step", "Straight", "Dashed", "Dotted", "Arrow"], 50, styled >= 13 ? "Dashed" : "Curve")}

          <span className={sectionLabel} style={{ top: 106 }}>Arrowheads</span>
          {grid4(["None", "End", "Start", "Both"], 120, "None")}

          <span className={sectionLabel} style={{ top: 148 }}>Thickness</span>
          {grid3(["Thin", "Medium", "Thick"], 162, "Medium")}

          <span className={sectionLabel} style={{ top: 190 }}><PaletteIcon className="w-2.5 h-2.5" />Color</span>
          {swatches(LINE_COLORS, 204, 9, styled >= 15 ? "#6366f1" : undefined)}

          <span className={sectionLabel} style={{ top: 250 }}>Label</span>
          <span className="absolute flex items-center px-2 rounded border border-slate-200 text-[9px] text-slate-400" style={{ left: 10, top: 264, width: 178, height: 20 }}>
            None
          </span>
        </>
      )}
      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
};

const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 197) % W,
  y: (i * 89 + (i % 7) * 31) % CANVAS_H,
  r: i % 9 === 0 ? 1.4 : 0.8,
  twinkle: i % 6 === 0
}));

const GalaxyScene = ({ theta }: { theta: number }) => {
  const pos = Object.fromEntries(
    NODES.map((n) => {
      const s = toSpace(n);
      return [n.id, project(s.x, s.y, s.z, theta)];
    })
  );

  const lines = NODES.filter((n) => n.parentId).map((n) => {
    const a = toSpace(byId[n.parentId!]);
    const b = toSpace(n);
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const m = Math.hypot(mid.x, mid.y) || 1;
    const c = { x: mid.x + (mid.x / m) * len * 0.25, y: mid.y + (mid.y / m) * len * 0.25 };
    const pa = project(a.x, a.y, 0, theta);
    const pb = project(b.x, b.y, 0, theta);
    const pc = project(c.x, c.y, 0, theta);
    const dots = Array.from({ length: 8 }, (_, i) => {
      const t = (i + 0.5) / 8;
      const u = 1 - t;
      return { x: u * u * pa.x + 2 * u * t * pc.x + t * t * pb.x, y: u * u * pa.y + 2 * u * t * pc.y + t * t * pb.y };
    });
    return { id: n.id, d: `M ${pa.x} ${pa.y} Q ${pc.x} ${pc.y} ${pb.x} ${pb.y}`, dots };
  });

  const ordered = [...NODES].sort((a, b) => pos[b.id].depth - pos[a.id].depth);

  return (
    <div className="absolute inset-0 bg-[#020617] overflow-hidden">
      <svg width={W} height={CANVAS_H} className="absolute inset-0">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.twinkle ? undefined : 0.45} className={s.twinkle ? "animate-pulse" : undefined} />
        ))}
        {lines.map((l) => (
          <g key={l.id}>
            <path d={l.d} stroke="#9ca3af" strokeOpacity={0.18} strokeWidth={1} fill="none" />
            {l.dots.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={1.3} fill="#9ca3af" />
            ))}
          </g>
        ))}
      </svg>

      {ordered.map((n) => {
        const p = pos[n.id];
        const c = GALAXY_COLORS[n.color];
        const isRoot = n.id === "root";
        const r = (isRoot ? 22 : 11) * p.p;
        return (
          <div key={n.id} className="absolute" style={{ left: p.x, top: p.y }}>
            <div
              className="absolute rounded-full"
              style={{
                width: r * 2,
                height: r * 2,
                left: -r,
                top: -r,
                background: `radial-gradient(circle at 35% 30%, ${c.border}, ${c.border} 45%, color-mix(in srgb, ${c.border} 55%, #000) 100%)`,
                boxShadow: `0 0 ${14 * p.p}px ${c.border}66`
              }}
            />
            <div
              className="absolute whitespace-nowrap rounded-md border shadow-lg"
              style={{
                left: 0,
                top: -r - 4,
                transform: `translate(-50%, -100%) scale(${p.p})`,
                transformOrigin: "50% 100%",
                backgroundColor: c.bg,
                borderColor: c.border,
                color: c.text,
                fontSize: isRoot ? 14 : 10,
                fontWeight: isRoot ? 700 : 600,
                padding: isRoot ? "4px 10px" : "2px 7px"
              }}
            >
              {n.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
