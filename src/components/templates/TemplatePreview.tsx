import { Template } from '@/types/templates';

interface TemplatePreviewProps {
  type: Template['preview'];
}

export const TemplatePreview = ({ type }: TemplatePreviewProps) => {
  // Blank Mind Map - Simple central node with branches
  const renderMindMap = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      {/* Center node */}
      <ellipse cx="100" cy="70" rx="35" ry="18" fill="#14b8a6" />
      <text x="100" y="74" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">Central Idea</text>
      {/* Branches */}
      <path d="M65 70 Q40 50 30 40" fill="none" stroke="#f97316" strokeWidth="2.5" />
      <path d="M65 70 Q40 90 30 100" fill="none" stroke="#a855f7" strokeWidth="2.5" />
      <path d="M135 70 Q160 50 170 40" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
      <path d="M135 70 Q160 90 170 100" fill="none" stroke="#ec4899" strokeWidth="2.5" />
      {/* Child nodes */}
      <ellipse cx="25" cy="35" rx="22" ry="11" fill="#ffedd5" stroke="#f97316" strokeWidth="1.5" />
      <ellipse cx="25" cy="105" rx="22" ry="11" fill="#f3e8ff" stroke="#a855f7" strokeWidth="1.5" />
      <ellipse cx="175" cy="35" rx="22" ry="11" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <ellipse cx="175" cy="105" rx="22" ry="11" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.5" />
    </svg>
  );

  // Order Fulfillment / Gantt - Horizontal flowchart
  const renderGantt = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <text x="100" y="15" textAnchor="middle" fontSize="8" fill="#374151" fontWeight="bold">PROCESS FLOW</text>
      {/* Flow arrows */}
      <path d="M30 50 L170 50" stroke="#e5e7eb" strokeWidth="3" />
      <path d="M30 90 L170 90" stroke="#e5e7eb" strokeWidth="3" />
      {/* Process boxes row 1 */}
      <rect x="15" y="38" width="35" height="24" rx="4" fill="#ccfbf1" stroke="#14b8a6" strokeWidth="1.5" />
      <rect x="60" y="38" width="35" height="24" rx="4" fill="#f3e8ff" stroke="#a855f7" strokeWidth="1.5" />
      <rect x="105" y="38" width="35" height="24" rx="4" fill="#f3e8ff" stroke="#a855f7" strokeWidth="1.5" />
      <rect x="150" y="38" width="35" height="24" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      {/* Process boxes row 2 */}
      <rect x="15" y="78" width="35" height="24" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <rect x="60" y="78" width="35" height="24" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <rect x="105" y="78" width="35" height="24" rx="4" fill="#f3e8ff" stroke="#a855f7" strokeWidth="1.5" />
      <rect x="150" y="78" width="35" height="24" rx="4" fill="#ccfbf1" stroke="#14b8a6" strokeWidth="1.5" />
      {/* Connecting arrows */}
      <path d="M32 62 L32 78" stroke="#9ca3af" strokeWidth="1.5" />
      <path d="M167 62 L167 78" stroke="#9ca3af" strokeWidth="1.5" />
    </svg>
  );

  // Business Analyst / Concept - Radial branches
  const renderConcept = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      {/* Center */}
      <circle cx="100" cy="70" r="22" fill="#374151" />
      <text x="100" y="74" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">Core</text>
      {/* Radial branches */}
      <line x1="100" y1="48" x2="100" y2="20" stroke="#3b82f6" strokeWidth="2" />
      <line x1="122" y1="70" x2="155" y2="70" stroke="#10b981" strokeWidth="2" />
      <line x1="100" y1="92" x2="100" y2="120" stroke="#f59e0b" strokeWidth="2" />
      <line x1="78" y1="70" x2="45" y2="70" stroke="#ec4899" strokeWidth="2" />
      <line x1="115" y1="55" x2="140" y2="30" stroke="#8b5cf6" strokeWidth="2" />
      <line x1="85" y1="85" x2="60" y2="110" stroke="#06b6d4" strokeWidth="2" />
      {/* End nodes */}
      <circle cx="100" cy="15" r="10" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <circle cx="160" cy="70" r="10" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
      <circle cx="100" cy="125" r="10" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      <circle cx="40" cy="70" r="10" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.5" />
      <circle cx="145" cy="25" r="10" fill="#ede9fe" stroke="#8b5cf6" strokeWidth="1.5" />
      <circle cx="55" cy="115" r="10" fill="#cffafe" stroke="#06b6d4" strokeWidth="1.5" />
    </svg>
  );

  // Organigram - Hierarchy tree
  const renderOrganigram = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      {/* Top node */}
      <rect x="70" y="10" width="60" height="22" rx="4" fill="#374151" />
      <text x="100" y="24" textAnchor="middle" fontSize="7" fill="white">Director</text>
      {/* Lines */}
      <path d="M100 32 L100 45" stroke="#9ca3af" strokeWidth="2" />
      <path d="M40 45 L160 45" stroke="#9ca3af" strokeWidth="2" />
      <path d="M40 45 L40 55" stroke="#9ca3af" strokeWidth="2" />
      <path d="M100 45 L100 55" stroke="#9ca3af" strokeWidth="2" />
      <path d="M160 45 L160 55" stroke="#9ca3af" strokeWidth="2" />
      {/* Level 2 */}
      <rect x="15" y="55" width="50" height="20" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <rect x="75" y="55" width="50" height="20" rx="4" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
      <rect x="135" y="55" width="50" height="20" rx="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      {/* Lines to level 3 */}
      <path d="M40 75 L40 85" stroke="#9ca3af" strokeWidth="1.5" />
      <path d="M100 75 L100 85" stroke="#9ca3af" strokeWidth="1.5" />
      <path d="M160 75 L160 85" stroke="#9ca3af" strokeWidth="1.5" />
      {/* Level 3 */}
      <rect x="20" y="85" width="40" height="16" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
      <rect x="80" y="85" width="40" height="16" rx="4" fill="#d1fae5" stroke="#10b981" strokeWidth="1" />
      <rect x="140" y="85" width="40" height="16" rx="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
      {/* Level 4 */}
      <rect x="20" y="105" width="40" height="16" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
      <rect x="80" y="105" width="40" height="16" rx="4" fill="#d1fae5" stroke="#10b981" strokeWidth="1" />
      <rect x="140" y="105" width="40" height="16" rx="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
    </svg>
  );

  // Fishbone / Cause-Effect
  const renderFishbone = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      {/* Main spine */}
      <path d="M20 70 L180 70" stroke="#374151" strokeWidth="3" />
      {/* Head */}
      <rect x="160" y="55" width="35" height="30" rx="4" fill="#374151" />
      <text x="177" y="74" textAnchor="middle" fontSize="7" fill="white">Effect</text>
      {/* Upper bones */}
      <path d="M50 70 L35 35" stroke="#3b82f6" strokeWidth="2" />
      <path d="M90 70 L75 35" stroke="#10b981" strokeWidth="2" />
      <path d="M130 70 L115 35" stroke="#f59e0b" strokeWidth="2" />
      {/* Lower bones */}
      <path d="M50 70 L35 105" stroke="#ec4899" strokeWidth="2" />
      <path d="M90 70 L75 105" stroke="#8b5cf6" strokeWidth="2" />
      <path d="M130 70 L115 105" stroke="#06b6d4" strokeWidth="2" />
      {/* Cause nodes */}
      <ellipse cx="30" cy="28" rx="18" ry="10" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <ellipse cx="70" cy="28" rx="18" ry="10" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
      <ellipse cx="110" cy="28" rx="18" ry="10" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      <ellipse cx="30" cy="112" rx="18" ry="10" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.5" />
      <ellipse cx="70" cy="112" rx="18" ry="10" fill="#ede9fe" stroke="#8b5cf6" strokeWidth="1.5" />
      <ellipse cx="110" cy="112" rx="18" ry="10" fill="#cffafe" stroke="#06b6d4" strokeWidth="1.5" />
    </svg>
  );

  // Timeline / Customer Journey
  const renderTimeline = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <text x="100" y="15" textAnchor="middle" fontSize="8" fill="#374151" fontWeight="bold">JOURNEY</text>
      {/* Timeline line */}
      <path d="M20 75 L180 75" stroke="#e5e7eb" strokeWidth="4" />
      {/* Stage nodes */}
      <circle cx="35" cy="75" r="18" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
      <text x="35" y="79" textAnchor="middle" fontSize="6" fill="#1e40af">Aware</text>
      <circle cx="80" cy="75" r="18" fill="#d1fae5" stroke="#10b981" strokeWidth="2" />
      <text x="80" y="79" textAnchor="middle" fontSize="6" fill="#065f46">Consider</text>
      <circle cx="125" cy="75" r="18" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
      <text x="125" y="79" textAnchor="middle" fontSize="6" fill="#92400e">Buy</text>
      <circle cx="170" cy="75" r="18" fill="#fce7f3" stroke="#ec4899" strokeWidth="2" />
      <text x="170" y="79" textAnchor="middle" fontSize="6" fill="#9d174d">Advocate</text>
    </svg>
  );

  // Outline - List structure
  const renderOutline = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      {/* Main items */}
      <rect x="20" y="15" width="160" height="22" rx="4" fill="#374151" />
      <text x="30" y="30" fontSize="9" fill="white">Topic</text>
      <rect x="35" y="45" width="140" height="18" rx="3" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
      <rect x="35" y="68" width="140" height="18" rx="3" fill="#d1fae5" stroke="#10b981" strokeWidth="1" />
      <rect x="50" y="91" width="120" height="16" rx="3" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
      <rect x="50" y="112" width="120" height="16" rx="3" fill="#fce7f3" stroke="#ec4899" strokeWidth="1" />
      {/* Bullets */}
      <circle cx="28" cy="54" r="3" fill="#3b82f6" />
      <circle cx="28" cy="77" r="3" fill="#10b981" />
      <circle cx="43" cy="99" r="2.5" fill="#f59e0b" />
      <circle cx="43" cy="120" r="2.5" fill="#ec4899" />
    </svg>
  );

  // SWOT Analysis - 4 quadrants
  const renderSwot = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <text x="100" y="12" textAnchor="middle" fontSize="8" fill="#374151" fontWeight="bold">SWOT</text>
      {/* Quadrants */}
      <rect x="15" y="20" width="82" height="50" rx="4" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
      <text x="56" y="35" textAnchor="middle" fontSize="8" fill="#065f46" fontWeight="bold">Strengths</text>
      <rect x="103" y="20" width="82" height="50" rx="4" fill="#fee2e2" stroke="#ef4444" strokeWidth="1.5" />
      <text x="144" y="35" textAnchor="middle" fontSize="8" fill="#dc2626" fontWeight="bold">Weaknesses</text>
      <rect x="15" y="76" width="82" height="50" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="56" y="91" textAnchor="middle" fontSize="8" fill="#1e40af" fontWeight="bold">Opportunities</text>
      <rect x="103" y="76" width="82" height="50" rx="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="144" y="91" textAnchor="middle" fontSize="8" fill="#92400e" fontWeight="bold">Threats</text>
    </svg>
  );

  // Eisenhower Box - 2x2 matrix
  const renderEisenhowerBox = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <text x="100" y="12" textAnchor="middle" fontSize="7" fill="#374151" fontWeight="bold">EISENHOWER</text>
      {/* Quadrants */}
      <rect x="15" y="20" width="82" height="50" rx="4" fill="#fee2e2" stroke="#ef4444" strokeWidth="2" />
      <text x="56" y="40" textAnchor="middle" fontSize="6" fill="#dc2626" fontWeight="bold">DO FIRST</text>
      <text x="56" y="52" textAnchor="middle" fontSize="5" fill="#dc2626">Urgent + Important</text>
      <rect x="103" y="20" width="82" height="50" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
      <text x="144" y="40" textAnchor="middle" fontSize="6" fill="#1e40af" fontWeight="bold">SCHEDULE</text>
      <text x="144" y="52" textAnchor="middle" fontSize="5" fill="#1e40af">Important</text>
      <rect x="15" y="76" width="82" height="50" rx="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
      <text x="56" y="96" textAnchor="middle" fontSize="6" fill="#92400e" fontWeight="bold">DELEGATE</text>
      <text x="56" y="108" textAnchor="middle" fontSize="5" fill="#92400e">Urgent</text>
      <rect x="103" y="76" width="82" height="50" rx="4" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="2" />
      <text x="144" y="96" textAnchor="middle" fontSize="6" fill="#4b5563" fontWeight="bold">ELIMINATE</text>
      <text x="144" y="108" textAnchor="middle" fontSize="5" fill="#6b7280">Neither</text>
    </svg>
  );

  // Product Launch Checklist - Central with 6 branches
  const renderProductLaunchChecklist = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      {/* Center */}
      <ellipse cx="100" cy="70" rx="28" ry="16" fill="#14b8a6" />
      <text x="100" y="74" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">Launch</text>
      {/* Left branches */}
      <path d="M72 60 L40 35" stroke="#f97316" strokeWidth="2" />
      <path d="M72 70 L30 70" stroke="#a855f7" strokeWidth="2" />
      <path d="M72 80 L40 105" stroke="#a855f7" strokeWidth="2" />
      {/* Right branches */}
      <path d="M128 60 L160 35" stroke="#14b8a6" strokeWidth="2" />
      <path d="M128 70 L170 70" stroke="#3b82f6" strokeWidth="2" />
      <path d="M128 80 L160 105" stroke="#f97316" strokeWidth="2" />
      {/* Branch nodes */}
      <ellipse cx="32" cy="30" rx="22" ry="12" fill="#ffedd5" stroke="#f97316" strokeWidth="1.5" />
      <text x="32" y="34" textAnchor="middle" fontSize="6" fill="#c2410c">Legal</text>
      <ellipse cx="22" cy="70" rx="22" ry="12" fill="#f3e8ff" stroke="#a855f7" strokeWidth="1.5" />
      <text x="22" y="74" textAnchor="middle" fontSize="6" fill="#7c3aed">Landing</text>
      <ellipse cx="32" cy="110" rx="22" ry="12" fill="#f3e8ff" stroke="#a855f7" strokeWidth="1.5" />
      <text x="32" y="114" textAnchor="middle" fontSize="6" fill="#7c3aed">Marketing</text>
      <ellipse cx="168" cy="30" rx="22" ry="12" fill="#ccfbf1" stroke="#14b8a6" strokeWidth="1.5" />
      <text x="168" y="34" textAnchor="middle" fontSize="6" fill="#0f766e">Design</text>
      <ellipse cx="178" cy="70" rx="22" ry="12" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="178" y="74" textAnchor="middle" fontSize="6" fill="#1d4ed8">IT/DevOps</text>
      <ellipse cx="168" cy="110" rx="22" ry="12" fill="#ffedd5" stroke="#f97316" strokeWidth="1.5" />
      <text x="168" y="114" textAnchor="middle" fontSize="6" fill="#c2410c">Support</text>
    </svg>
  );

  // Product Launch Radial - Star pattern
  const renderProductLaunchRadial = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      {/* Center */}
      <circle cx="100" cy="70" r="22" fill="#14b8a6" />
      <text x="100" y="67" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">PRODUCT</text>
      <text x="100" y="76" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">LAUNCH</text>
      {/* Radial lines */}
      <line x1="100" y1="48" x2="100" y2="18" stroke="#f97316" strokeWidth="2" />
      <line x1="120" y1="55" x2="150" y2="25" stroke="#ec4899" strokeWidth="2" />
      <line x1="122" y1="70" x2="165" y2="70" stroke="#22c55e" strokeWidth="2" />
      <line x1="120" y1="85" x2="150" y2="115" stroke="#f97316" strokeWidth="2" />
      <line x1="100" y1="92" x2="100" y2="122" stroke="#3b82f6" strokeWidth="2" />
      <line x1="80" y1="85" x2="50" y2="115" stroke="#ec4899" strokeWidth="2" />
      <line x1="78" y1="70" x2="35" y2="70" stroke="#f97316" strokeWidth="2" />
      {/* End nodes */}
      <circle cx="100" cy="12" r="10" fill="#ffedd5" stroke="#f97316" strokeWidth="1.5" />
      <circle cx="156" cy="20" r="10" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.5" />
      <circle cx="172" cy="70" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
      <circle cx="156" cy="120" r="10" fill="#ffedd5" stroke="#f97316" strokeWidth="1.5" />
      <circle cx="100" cy="128" r="10" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <circle cx="44" cy="120" r="10" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.5" />
      <circle cx="28" cy="70" r="10" fill="#ffedd5" stroke="#f97316" strokeWidth="1.5" />
    </svg>
  );

  // Product Development - Horizontal phases
  const renderProductDevelopment = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <text x="100" y="15" textAnchor="middle" fontSize="7" fill="#374151" fontWeight="bold">LIFECYCLE</text>
      {/* Phase boxes */}
      <rect x="10" y="35" width="35" height="28" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="27" y="52" textAnchor="middle" fontSize="6" fill="#1e40af">Concept</text>
      <rect x="50" y="35" width="35" height="28" rx="4" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
      <text x="67" y="52" textAnchor="middle" fontSize="6" fill="#065f46">Design</text>
      <rect x="90" y="35" width="35" height="28" rx="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="107" y="52" textAnchor="middle" fontSize="6" fill="#92400e">Develop</text>
      <rect x="130" y="35" width="30" height="28" rx="4" fill="#ede9fe" stroke="#8b5cf6" strokeWidth="1.5" />
      <text x="145" y="52" textAnchor="middle" fontSize="6" fill="#6d28d9">Test</text>
      <rect x="165" y="35" width="30" height="28" rx="4" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.5" />
      <text x="180" y="52" textAnchor="middle" fontSize="6" fill="#9d174d">Launch</text>
      {/* Arrows */}
      <path d="M45 49 L50 49" stroke="#9ca3af" strokeWidth="2" markerEnd="url(#arrow)" />
      <path d="M85 49 L90 49" stroke="#9ca3af" strokeWidth="2" />
      <path d="M125 49 L130 49" stroke="#9ca3af" strokeWidth="2" />
      <path d="M160 49 L165 49" stroke="#9ca3af" strokeWidth="2" />
    </svg>
  );

  // Market Research - Central with 4 branches
  const renderMarketResearch = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <text x="100" y="12" textAnchor="middle" fontSize="7" fill="#374151" fontWeight="bold">RESEARCH</text>
      {/* Center */}
      <rect x="70" y="55" width="60" height="30" rx="4" fill="#374151" />
      <text x="100" y="74" textAnchor="middle" fontSize="8" fill="white">Market</text>
      {/* Branches */}
      <path d="M75 60 L40 35" stroke="#3b82f6" strokeWidth="2" />
      <path d="M125 60 L160 35" stroke="#10b981" strokeWidth="2" />
      <path d="M75 80 L40 105" stroke="#f59e0b" strokeWidth="2" />
      <path d="M125 80 L160 105" stroke="#ec4899" strokeWidth="2" />
      {/* End nodes */}
      <ellipse cx="32" cy="28" rx="25" ry="13" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="32" y="32" textAnchor="middle" fontSize="6" fill="#1e40af">Competitors</text>
      <ellipse cx="168" cy="28" rx="25" ry="13" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
      <text x="168" y="32" textAnchor="middle" fontSize="6" fill="#065f46">Customers</text>
      <ellipse cx="32" cy="112" rx="25" ry="13" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="32" y="116" textAnchor="middle" fontSize="6" fill="#92400e">Trends</text>
      <ellipse cx="168" cy="112" rx="25" ry="13" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.5" />
      <text x="168" y="116" textAnchor="middle" fontSize="6" fill="#9d174d">Pricing</text>
    </svg>
  );

  // Porter's Five Forces
  const renderPortersForces = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <text x="100" y="10" textAnchor="middle" fontSize="6" fill="#374151" fontWeight="bold">PORTER'S 5 FORCES</text>
      {/* Center */}
      <rect x="65" y="55" width="70" height="30" rx="4" fill="#374151" />
      <text x="100" y="74" textAnchor="middle" fontSize="7" fill="white">Industry Rivalry</text>
      {/* Forces */}
      <rect x="65" y="15" width="70" height="22" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="100" y="30" textAnchor="middle" fontSize="6" fill="#1e40af">New Entrants</text>
      <rect x="65" y="103" width="70" height="22" rx="4" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
      <text x="100" y="118" textAnchor="middle" fontSize="6" fill="#065f46">Substitutes</text>
      <rect x="5" y="55" width="50" height="30" rx="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="30" y="74" textAnchor="middle" fontSize="6" fill="#92400e">Suppliers</text>
      <rect x="145" y="55" width="50" height="30" rx="4" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.5" />
      <text x="170" y="74" textAnchor="middle" fontSize="6" fill="#9d174d">Buyers</text>
      {/* Arrows */}
      <path d="M100 37 L100 55" stroke="#3b82f6" strokeWidth="2" />
      <path d="M100 85 L100 103" stroke="#10b981" strokeWidth="2" />
      <path d="M55 70 L65 70" stroke="#f59e0b" strokeWidth="2" />
      <path d="M135 70 L145 70" stroke="#ec4899" strokeWidth="2" />
    </svg>
  );

  // Supplier Evaluation
  const renderSupplierEvaluation = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <text x="100" y="12" textAnchor="middle" fontSize="7" fill="#374151" fontWeight="bold">SUPPLIER EVAL</text>
      {/* Center */}
      <rect x="65" y="55" width="70" height="30" rx="4" fill="#374151" />
      <text x="100" y="74" textAnchor="middle" fontSize="8" fill="white">Supplier</text>
      {/* Branches */}
      <path d="M70 60 L35 30" stroke="#3b82f6" strokeWidth="2" />
      <path d="M130 60 L165 30" stroke="#10b981" strokeWidth="2" />
      <path d="M70 80 L35 110" stroke="#f59e0b" strokeWidth="2" />
      <path d="M130 80 L165 110" stroke="#ec4899" strokeWidth="2" />
      {/* End nodes */}
      <rect x="10" y="18" width="45" height="22" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="32" y="33" textAnchor="middle" fontSize="6" fill="#1e40af">Evaluation</text>
      <rect x="145" y="18" width="50" height="22" rx="4" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
      <text x="170" y="33" textAnchor="middle" fontSize="6" fill="#065f46">Requirements</text>
      <rect x="10" y="100" width="45" height="22" rx="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="32" y="115" textAnchor="middle" fontSize="6" fill="#92400e">Strategic</text>
      <rect x="145" y="100" width="50" height="22" rx="4" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.5" />
      <text x="170" y="115" textAnchor="middle" fontSize="6" fill="#9d174d">Monitoring</text>
    </svg>
  );

  // Customer Journey
  const renderCustomerJourney = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <text x="100" y="15" textAnchor="middle" fontSize="7" fill="#374151" fontWeight="bold">CUSTOMER JOURNEY</text>
      {/* Timeline */}
      <path d="M20 70 L180 70" stroke="#e5e7eb" strokeWidth="4" />
      {/* Stages */}
      <circle cx="35" cy="70" r="16" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
      <text x="35" y="74" textAnchor="middle" fontSize="5" fill="#1e40af">Aware</text>
      <circle cx="75" cy="70" r="16" fill="#d1fae5" stroke="#10b981" strokeWidth="2" />
      <text x="75" y="74" textAnchor="middle" fontSize="5" fill="#065f46">Consider</text>
      <circle cx="115" cy="70" r="16" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
      <text x="115" y="74" textAnchor="middle" fontSize="5" fill="#92400e">Purchase</text>
      <circle cx="155" cy="70" r="16" fill="#fce7f3" stroke="#ec4899" strokeWidth="2" />
      <text x="155" y="74" textAnchor="middle" fontSize="5" fill="#9d174d">Advocate</text>
    </svg>
  );

  // Venn Diagram
  const renderVennDiagram = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <text x="100" y="12" textAnchor="middle" fontSize="7" fill="#374151" fontWeight="bold">VENN DIAGRAM</text>
      {/* Circles */}
      <circle cx="75" cy="75" r="40" fill="#dbeafe" fillOpacity="0.6" stroke="#3b82f6" strokeWidth="2" />
      <circle cx="125" cy="75" r="40" fill="#fce7f3" fillOpacity="0.6" stroke="#ec4899" strokeWidth="2" />
      {/* Labels */}
      <text x="55" y="75" textAnchor="middle" fontSize="8" fill="#1e40af" fontWeight="bold">A</text>
      <text x="100" y="75" textAnchor="middle" fontSize="7" fill="#374151" fontWeight="bold">A∩B</text>
      <text x="145" y="75" textAnchor="middle" fontSize="8" fill="#9d174d" fontWeight="bold">B</text>
    </svg>
  );

  // Cycle Diagram
  const renderCycleDiagram = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <text x="100" y="12" textAnchor="middle" fontSize="7" fill="#374151" fontWeight="bold">CYCLE</text>
      {/* Circular path */}
      <path d="M100 25 A45 45 0 0 1 145 70" fill="none" stroke="#3b82f6" strokeWidth="3" />
      <path d="M145 70 A45 45 0 0 1 100 115" fill="none" stroke="#10b981" strokeWidth="3" />
      <path d="M100 115 A45 45 0 0 1 55 70" fill="none" stroke="#f59e0b" strokeWidth="3" />
      <path d="M55 70 A45 45 0 0 1 100 25" fill="none" stroke="#ec4899" strokeWidth="3" />
      {/* Nodes */}
      <circle cx="100" cy="25" r="14" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
      <text x="100" y="29" textAnchor="middle" fontSize="6" fill="#1e40af">Plan</text>
      <circle cx="145" cy="70" r="14" fill="#d1fae5" stroke="#10b981" strokeWidth="2" />
      <text x="145" y="74" textAnchor="middle" fontSize="6" fill="#065f46">Do</text>
      <circle cx="100" cy="115" r="14" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
      <text x="100" y="119" textAnchor="middle" fontSize="6" fill="#92400e">Check</text>
      <circle cx="55" cy="70" r="14" fill="#fce7f3" stroke="#ec4899" strokeWidth="2" />
      <text x="55" y="74" textAnchor="middle" fontSize="6" fill="#9d174d">Act</text>
    </svg>
  );

  // Six Thinking Hats
  const renderSixThinkingHats = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <text x="100" y="12" textAnchor="middle" fontSize="6" fill="#374151" fontWeight="bold">SIX THINKING HATS</text>
      {/* Hat boxes - 2 rows of 3 */}
      <rect x="15" y="25" width="50" height="35" rx="4" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="1.5" />
      <text x="40" y="47" textAnchor="middle" fontSize="7" fill="#374151">White</text>
      <rect x="75" y="25" width="50" height="35" rx="4" fill="#fee2e2" stroke="#ef4444" strokeWidth="1.5" />
      <text x="100" y="47" textAnchor="middle" fontSize="7" fill="#dc2626">Red</text>
      <rect x="135" y="25" width="50" height="35" rx="4" fill="#374151" stroke="#1f2937" strokeWidth="1.5" />
      <text x="160" y="47" textAnchor="middle" fontSize="7" fill="white">Black</text>
      <rect x="15" y="70" width="50" height="35" rx="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="40" y="92" textAnchor="middle" fontSize="7" fill="#92400e">Yellow</text>
      <rect x="75" y="70" width="50" height="35" rx="4" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
      <text x="100" y="92" textAnchor="middle" fontSize="7" fill="#065f46">Green</text>
      <rect x="135" y="70" width="50" height="35" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="160" y="92" textAnchor="middle" fontSize="7" fill="#1e40af">Blue</text>
    </svg>
  );

  // Argument Map
  const renderArgumentMap = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      {/* Main argument */}
      <rect x="60" y="10" width="80" height="28" rx="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
      <text x="100" y="28" textAnchor="middle" fontSize="7" fill="#92400e" fontWeight="bold">Argument</text>
      {/* Support lines */}
      <path d="M70 38 L45 55" stroke="#10b981" strokeWidth="2" />
      <path d="M130 38 L155 55" stroke="#10b981" strokeWidth="2" />
      {/* Reasons */}
      <rect x="15" y="55" width="60" height="24" rx="4" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
      <text x="45" y="71" textAnchor="middle" fontSize="6" fill="#065f46">Reason 1</text>
      <rect x="125" y="55" width="60" height="24" rx="4" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
      <text x="155" y="71" textAnchor="middle" fontSize="6" fill="#065f46">Reason 2</text>
      {/* Objection */}
      <path d="M100 38 L100 95" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2" />
      <rect x="55" y="95" width="90" height="24" rx="4" fill="#fee2e2" stroke="#ef4444" strokeWidth="1.5" />
      <text x="100" y="111" textAnchor="middle" fontSize="6" fill="#dc2626">Objection / Counter</text>
    </svg>
  );

  // Fallback
  const renderDefault = () => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <ellipse cx="100" cy="70" rx="35" ry="18" fill="#374151" />
      <text x="100" y="74" textAnchor="middle" fontSize="9" fill="white">Template</text>
      <path d="M65 70 Q40 50 25 40" fill="none" stroke="#3b82f6" strokeWidth="2" />
      <path d="M65 70 Q40 90 25 100" fill="none" stroke="#f59e0b" strokeWidth="2" />
      <path d="M135 70 Q160 50 175 40" fill="none" stroke="#ec4899" strokeWidth="2" />
      <path d="M135 70 Q160 90 175 100" fill="none" stroke="#10b981" strokeWidth="2" />
      <ellipse cx="20" cy="35" rx="18" ry="10" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <ellipse cx="20" cy="105" rx="18" ry="10" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      <ellipse cx="180" cy="35" rx="18" ry="10" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.5" />
      <ellipse cx="180" cy="105" rx="18" ry="10" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
    </svg>
  );

  const previews: Record<Template['preview'], () => JSX.Element> = {
    mindmap: renderMindMap,
    concept: renderConcept,
    organigram: renderOrganigram,
    fishbone: renderFishbone,
    timeline: renderTimeline,
    outline: renderOutline,
    gantt: renderGantt,
    swot: renderSwot,
    eisenhowerBox: renderEisenhowerBox,
    websitePlanning: renderMindMap,
    marketingPlan: renderConcept,
    businessAnalyst: renderConcept,
    marketResearch: renderMarketResearch,
    portersForces: renderPortersForces,
    supplierEvaluation: renderSupplierEvaluation,
    productLaunchChecklist: renderProductLaunchChecklist,
    productLaunchRadial: renderProductLaunchRadial,
    productDevelopment: renderProductDevelopment,
    customerJourney: renderCustomerJourney,
    cycleDiagram: renderCycleDiagram,
    sixThinkingHats: renderSixThinkingHats,
    argumentMap: renderArgumentMap,
    vennDiagram: renderVennDiagram,
  };

  return previews[type]?.() || renderDefault();
};
