import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Lightbulb,
  Target,
  TrendingUp,
  Layers
} from "lucide-react";

interface NodeData {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  textColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}

const DISPLAY_FPS = 60;

export const InteractiveMindMap = memo(() => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [nodeCount] = useState(5);
  const [selectedStyle, setSelectedStyle] = useState<"curved" | "straight" | "step">("curved");

  const branchNodes: NodeData[] = [
    {
      id: "swot",
      label: "SWOT Analysis",
      x: 18,
      y: 24,
      color: "bg-amber-50 dark:bg-amber-950/20",
      textColor: "text-amber-700 dark:text-amber-400",
      borderColor: "border-amber-200 dark:border-amber-800",
      icon: Target,
      desc: "Structured business frameworks"
    },
    {
      id: "brainstorm",
      label: "Brainstorming",
      x: 82,
      y: 26,
      color: "bg-blue-50 dark:bg-blue-950/20",
      textColor: "text-blue-700 dark:text-blue-400",
      borderColor: "border-blue-200 dark:border-blue-800",
      icon: Lightbulb,
      desc: "Capture raw thoughts instantly"
    },
    {
      id: "marketing",
      label: "GTM Campaign",
      x: 16,
      y: 74,
      color: "bg-purple-50 dark:bg-purple-950/20",
      textColor: "text-purple-700 dark:text-purple-400",
      borderColor: "border-purple-200 dark:border-purple-800",
      icon: TrendingUp,
      desc: "Map campaign workflows"
    },
    {
      id: "product",
      label: "Product Roadmap",
      x: 80,
      y: 72,
      color: "bg-emerald-50 dark:bg-emerald-950/20",
      textColor: "text-emerald-700 dark:text-emerald-400",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      icon: Layers,
      desc: "Visualize releases & milestones"
    }
  ];

  const getConnectionPath = (startX: number, startY: number, endX: number, endY: number) => {
    if (selectedStyle === "straight") {
      return `M ${startX} ${startY} L ${endX} ${endY}`;
    }
    if (selectedStyle === "step") {
      const midX = startX + (endX - startX) / 2;
      return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
    }
    const controlX1 = startX + (endX - startX) * 0.5;
    const controlY1 = startY;
    const controlX2 = startX + (endX - startX) * 0.5;
    const controlY2 = endY;
    return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
  };

  const activeNodeInfo = branchNodes.find(n => n.id === hoveredNode);

  return (
    <div className="relative w-full max-w-[540px] mx-auto select-none group font-sans">
      
      <div className="relative bg-white border-[5px] border-slate-200/80 rounded-[3.8rem] p-3 shadow-2xl overflow-hidden">
        <div className="absolute top-10 right-14 flex items-center gap-2 opacity-25 group-hover:opacity-60 transition-opacity">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
          <span className="font-mono text-[8px] font-black tracking-[0.2em] text-slate-500 uppercase">GPU_HARDWARE_ACCELERATED</span>
        </div>

        <div className="relative bg-gradient-to-br from-[#fbfcfd] to-[#f6f8fa] rounded-[3.4rem] p-4 h-[340px] flex items-center justify-center overflow-hidden">
          
          <div 
            className="absolute inset-0 opacity-[0.07] dark:opacity-[0.03]" 
            style={{ 
              backgroundImage: "radial-gradient(circle, #3b82f6 1px, transparent 1px)", 
              backgroundSize: "20px 20px" 
            }} 
          />

          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            {branchNodes.map((node) => {
              const isHovered = hoveredNode === node.id;
              const path = getConnectionPath(50, 50, node.x, node.y);
              return (
                <g key={node.id}>
                  <motion.path
                    d={path}
                    stroke={isHovered ? "#6366f1" : "#cbd5e1"}
                    strokeWidth={isHovered ? 1.5 : 0.8}
                    strokeOpacity={isHovered ? 0.6 : 0.3}
                    fill="none"
                    strokeLinecap="round"
                    animate={isHovered ? { strokeWidth: [1.5, 2.2, 1.5] } : undefined}
                    transition={isHovered ? { repeat: Infinity, duration: 1.5 } : undefined}
                  />
                  <path
                    d={path}
                    stroke={isHovered ? "#4f46e5" : "#6366f1"}
                    strokeWidth={isHovered ? 0.6 : 0.4}
                    strokeOpacity={isHovered ? 0.9 : 0.5}
                    fill="none"
                    strokeDasharray="2, 2"
                    className="flow"
                  />
                </g>
              );
            })}
          </svg>

          <motion.div
            className="absolute z-20 flex flex-col items-center justify-center cursor-pointer"
            style={{ left: "50%", top: "50%", x: "-50%", y: "-50%" }}
            animate={{ 
              scale: hoveredNode ? 1.02 : 1,
              y: hoveredNode ? "-50%" : ["-50%", "-52%", "-50%"]
            }}
            transition={{ 
              y: { repeat: Infinity, duration: 3.5, ease: "easeInOut" }
            }}
          >
            <div className="w-20 h-20 rounded-full border-4 border-indigo-600 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 relative">
              <Brain className="w-9 h-9" />
              <div className="absolute -inset-2 border-2 border-indigo-500/30 rounded-full animate-ping [animation-duration:2.5s]" />
              <div className="absolute -inset-4 border border-indigo-500/10 rounded-full animate-pulse" />
            </div>
            <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mt-2 bg-white/95 px-2 py-0.5 rounded-full border border-indigo-100 shadow-sm">
              Root
            </span>
          </motion.div>

          {branchNodes.map((node) => {
            const isHovered = hoveredNode === node.id;
            const Icon = node.icon;
            return (
              <motion.div
                key={node.id}
                className="absolute z-30 cursor-pointer"
                style={{ left: `${node.x}%`, top: `${node.y}%`, x: "-50%", y: "-50%" }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                whileHover={{ scale: 1.08 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <div className={`px-3 py-2 rounded-2xl border ${node.borderColor} ${node.color} flex items-center gap-2 shadow-sm transition-all duration-300 ${isHovered ? 'shadow-md border-indigo-300 dark:border-indigo-700 bg-white' : ''}`}>
                  <div className={`w-6 h-6 rounded-lg bg-white flex items-center justify-center border border-slate-100 shadow-sm shrink-0 ${node.textColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[10px] font-extrabold text-slate-800 tracking-tight">
                    {node.label}
                  </div>
                </div>
              </motion.div>
            );
          })}

        </div>

        <div className="mx-4 mb-4 mt-3 p-5 bg-slate-50/80 border border-slate-100 rounded-[2.5rem] relative overflow-hidden shadow-sm">
          <div className="relative z-10 flex flex-col gap-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/50">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black text-slate-900 tracking-tight">NEURON</span>
                  <span className="text-[11px] font-black text-indigo-600 tracking-tight">MAPPING</span>
                  <span className="text-[9px] font-black text-slate-400/80 ml-2 tracking-widest">LOCAL_SYS</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[8px] font-bold text-slate-400 tracking-wider uppercase">Active Canvas Workspace</span>
                </div>
              </div>
              
              <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-slate-200/60 shadow-inner">
                {(["curved", "straight", "step"] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg transition-all ${
                      selectedStyle === style 
                        ? "bg-indigo-600 text-white shadow-sm" 
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              
              <div className="col-span-6 grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200/60 p-2.5 rounded-2xl flex flex-col shadow-sm">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide">FPS</span>
                  <span className="text-sm font-black text-slate-800 tabular-nums">{DISPLAY_FPS}</span>
                </div>
                <div className="bg-white border border-slate-200/60 p-2.5 rounded-2xl flex flex-col shadow-sm">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide">Nodes</span>
                  <span className="text-sm font-black text-slate-800 tabular-nums">{nodeCount}</span>
                </div>
              </div>

              <div className="col-span-6 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {hoveredNode && activeNodeInfo ? (
                    <motion.div
                      key={activeNodeInfo.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col"
                    >
                      <span className="text-[8px] font-black text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                        Highlighted Node
                      </span>
                      <span className="text-[11px] font-bold text-slate-800 truncate mt-0.5">
                        {activeNodeInfo.label}
                      </span>
                      <span className="text-[9px] text-slate-500 line-clamp-1 leading-snug">
                        {activeNodeInfo.desc}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="default"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col"
                    >
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Storage Engine</span>
                      <span className="text-[11px] font-bold text-slate-800 mt-0.5">IndexedDB Sandbox</span>
                      <span className="text-[9px] text-slate-500">100% Client-Side Storage</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
});

InteractiveMindMap.displayName = "InteractiveMindMap";
