/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import {
  Code, Terminal, GitBranch, GitCommit, GitMerge, GitPullRequest, Bug, Binary, Braces, FileCode,
  FileJson, FileCog, Blocks, Component, Package, Puzzle, Webhook, Workflow, Cpu, Microchip,

  Database, Server, HardDrive, ServerCog, DatabaseBackup, Archive, Folder, FolderOpen, FolderTree, File,
  FileText, Files, Save, Download, Upload, CloudDownload, CloudUpload,

  Network, Wifi, WifiOff, Bluetooth, Signal, Globe, Globe2, Cloud, CloudOff,
  Antenna, Satellite, Radio, Rss, Router, Cast, Share, ExternalLink,

  Laptop, Monitor, Smartphone, Tablet, Keyboard, Mouse,
  Printer, Camera, Video, Webcam, Tv, Watch, Headphones, Speaker,

  Lock, LockOpen, Unlock, Key, KeyRound, Shield, ShieldCheck, ShieldAlert,
  Fingerprint, Scan, ScanLine, ScanFace, Eye, EyeOff, Verified, BadgeCheck,

  BarChart, BarChart2, BarChart3, LineChart, PieChart, TrendingUp, TrendingDown, Activity, Gauge,
  Calculator, Percent, Hash, Table, Sigma,

  Layout, LayoutDashboard, LayoutGrid, LayoutList, Grid, List, ListOrdered,
  ListTree, Menu, Sidebar, PanelLeft, PanelRight,

  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  MoveUp, MoveDown, Maximize, Minimize,

  Circle, CircleDot, Square, Hexagon, Pentagon, Octagon, Triangle, Diamond,
  Star, Heart, Box, Cylinder, Gem,

  Play, Pause, PlayCircle, StopCircle, SkipForward, SkipBack,
  Volume, Volume2, VolumeX, Music, Music2, Image, ImagePlus,

  Mail, MailOpen, MailPlus, Inbox, Send, MessageCircle, MessageSquare,
  Phone, PhoneCall, AtSign, Bell, BellRing,

  Briefcase, Building, Building2, Landmark, DollarSign, Euro, Coins, CreditCard, Wallet,
  Receipt, Banknote, Calendar, CalendarDays, Clock, Timer,

  User, UserCircle, UserSquare, UserPlus, UserMinus, UserX, Users, Users2, Contact,
  Crown, Handshake,

  Sun, Moon, CloudSun, CloudRain, CloudSnow, CloudLightning, Wind, Snowflake,
  Thermometer, Umbrella, Droplet, Waves, Mountain, Trees,

  Car, CarFront, Bus, Train, Plane, PlaneTakeoff, PlaneLanding, Ship, Anchor,
  Bike, Rocket, Navigation, Map, MapPin, Compass,

  Check, CheckCircle, CheckSquare, X, XCircle, Plus, PlusCircle,
  Minus, MinusCircle, Edit, Edit2, Trash, Trash2, Copy,
  Undo, Redo, RefreshCw,

  AlertCircle, AlertTriangle, AlertOctagon, Info, HelpCircle, Loader, Loader2,
  Zap, ZapOff, Flame,

  Wrench, Settings, Settings2, Cog, SlidersHorizontal, Palette, Paintbrush,
  Pipette, Ruler, Scissors, Plug, Power,

  Bookmark, Tag, Tags, Flag, Pin, Link, Link2,
  QrCode, Search, ZoomIn, ZoomOut,
  Home, Store, ShoppingCart, Gift, Award, Trophy, Target,
  Lightbulb, Sparkles, Wand2, Bot, Brain, Atom, Dna, Microscope,

  type LucideIcon
} from 'lucide-react';

export const iconCategories: Record<string, { label: string; icons: { name: string; component: LucideIcon; label: string }[] }> = {
  development: {
    label: 'Development',
    icons: [
      { name: 'code', component: Code, label: 'Code' },
      { name: 'terminal', component: Terminal, label: 'Terminal' },
      { name: 'gitbranch', component: GitBranch, label: 'Git Branch' },
      { name: 'gitcommit', component: GitCommit, label: 'Git Commit' },
      { name: 'gitmerge', component: GitMerge, label: 'Git Merge' },
      { name: 'gitpullrequest', component: GitPullRequest, label: 'Pull Request' },
      { name: 'bug', component: Bug, label: 'Bug' },
      { name: 'binary', component: Binary, label: 'Binary' },
      { name: 'braces', component: Braces, label: 'Braces' },
      { name: 'filecode', component: FileCode, label: 'File Code' },
      { name: 'filejson', component: FileJson, label: 'JSON' },
      { name: 'filecog', component: FileCog, label: 'Config' },
      { name: 'blocks', component: Blocks, label: 'Blocks' },
      { name: 'component', component: Component, label: 'Component' },
      { name: 'package', component: Package, label: 'Package' },
      { name: 'puzzle', component: Puzzle, label: 'Puzzle' },
      { name: 'webhook', component: Webhook, label: 'Webhook' },
      { name: 'workflow', component: Workflow, label: 'Workflow' },
      { name: 'cpu', component: Cpu, label: 'CPU' },
      { name: 'microchip', component: Microchip, label: 'Chip' },
    ]
  },
  database: {
    label: 'Database',
    icons: [
      { name: 'database', component: Database, label: 'Database' },
      { name: 'server', component: Server, label: 'Server' },
      { name: 'harddrive', component: HardDrive, label: 'Hard Drive' },
      { name: 'servercog', component: ServerCog, label: 'Server Cog' },
      { name: 'databasebackup', component: DatabaseBackup, label: 'Backup' },
      { name: 'archive', component: Archive, label: 'Archive' },
      { name: 'folder', component: Folder, label: 'Folder' },
      { name: 'folderopen', component: FolderOpen, label: 'Folder Open' },
      { name: 'foldertree', component: FolderTree, label: 'Folder Tree' },
      { name: 'file', component: File, label: 'File' },
      { name: 'filetext', component: FileText, label: 'File Text' },
      { name: 'files', component: Files, label: 'Files' },
      { name: 'save', component: Save, label: 'Save' },
      { name: 'download', component: Download, label: 'Download' },
      { name: 'upload', component: Upload, label: 'Upload' },
      { name: 'clouddownload', component: CloudDownload, label: 'Cloud Down' },
      { name: 'cloudupload', component: CloudUpload, label: 'Cloud Up' },
    ]
  },
  network: {
    label: 'Network',
    icons: [
      { name: 'network', component: Network, label: 'Network' },
      { name: 'wifi', component: Wifi, label: 'WiFi' },
      { name: 'wifioff', component: WifiOff, label: 'WiFi Off' },
      { name: 'bluetooth', component: Bluetooth, label: 'Bluetooth' },
      { name: 'signal', component: Signal, label: 'Signal' },
      { name: 'globe', component: Globe, label: 'Globe' },
      { name: 'globe2', component: Globe2, label: 'Globe 2' },
      { name: 'cloud', component: Cloud, label: 'Cloud' },
      { name: 'cloudoff', component: CloudOff, label: 'Cloud Off' },
      { name: 'antenna', component: Antenna, label: 'Antenna' },
      { name: 'satellite', component: Satellite, label: 'Satellite' },
      { name: 'radio', component: Radio, label: 'Radio' },
      { name: 'rss', component: Rss, label: 'RSS' },
      { name: 'router', component: Router, label: 'Router' },
      { name: 'cast', component: Cast, label: 'Cast' },
      { name: 'share', component: Share, label: 'Share' },
      { name: 'externallink', component: ExternalLink, label: 'External' },
    ]
  },
  devices: {
    label: 'Devices',
    icons: [
      { name: 'laptop', component: Laptop, label: 'Laptop' },
      { name: 'monitor', component: Monitor, label: 'Monitor' },
      { name: 'smartphone', component: Smartphone, label: 'Phone' },
      { name: 'tablet', component: Tablet, label: 'Tablet' },
      { name: 'keyboard', component: Keyboard, label: 'Keyboard' },
      { name: 'mouse', component: Mouse, label: 'Mouse' },
      { name: 'printer', component: Printer, label: 'Printer' },
      { name: 'camera', component: Camera, label: 'Camera' },
      { name: 'video', component: Video, label: 'Video' },
      { name: 'webcam', component: Webcam, label: 'Webcam' },
      { name: 'tv', component: Tv, label: 'TV' },
      { name: 'watch', component: Watch, label: 'Watch' },
      { name: 'headphones', component: Headphones, label: 'Headphones' },
      { name: 'speaker', component: Speaker, label: 'Speaker' },
    ]
  },
  security: {
    label: 'Security',
    icons: [
      { name: 'lock', component: Lock, label: 'Lock' },
      { name: 'lockopen', component: LockOpen, label: 'Lock Open' },
      { name: 'unlock', component: Unlock, label: 'Unlock' },
      { name: 'key', component: Key, label: 'Key' },
      { name: 'keyround', component: KeyRound, label: 'Key Round' },
      { name: 'shield', component: Shield, label: 'Shield' },
      { name: 'shieldcheck', component: ShieldCheck, label: 'Shield Check' },
      { name: 'shieldalert', component: ShieldAlert, label: 'Shield Alert' },
      { name: 'fingerprint', component: Fingerprint, label: 'Fingerprint' },
      { name: 'scan', component: Scan, label: 'Scan' },
      { name: 'scanline', component: ScanLine, label: 'Scan Line' },
      { name: 'scanface', component: ScanFace, label: 'Face Scan' },
      { name: 'eye', component: Eye, label: 'Eye' },
      { name: 'eyeoff', component: EyeOff, label: 'Eye Off' },
      { name: 'verified', component: Verified, label: 'Verified' },
      { name: 'badgecheck', component: BadgeCheck, label: 'Badge Check' },
    ]
  },
  charts: {
    label: 'Charts',
    icons: [
      { name: 'barchart', component: BarChart, label: 'Bar Chart' },
      { name: 'barchart2', component: BarChart2, label: 'Bar Chart 2' },
      { name: 'barchart3', component: BarChart3, label: 'Bar Chart 3' },
      { name: 'linechart', component: LineChart, label: 'Line Chart' },
      { name: 'piechart', component: PieChart, label: 'Pie Chart' },
      { name: 'trendingup', component: TrendingUp, label: 'Trending Up' },
      { name: 'trendingdown', component: TrendingDown, label: 'Trending Down' },
      { name: 'activity', component: Activity, label: 'Activity' },
      { name: 'gauge', component: Gauge, label: 'Gauge' },
      { name: 'calculator', component: Calculator, label: 'Calculator' },
      { name: 'percent', component: Percent, label: 'Percent' },
      { name: 'hash', component: Hash, label: 'Hash' },
      { name: 'table', component: Table, label: 'Table' },
      { name: 'sigma', component: Sigma, label: 'Sigma' },
    ]
  },
  ui: {
    label: 'UI',
    icons: [
      { name: 'layout', component: Layout, label: 'Layout' },
      { name: 'layoutdashboard', component: LayoutDashboard, label: 'Dashboard' },
      { name: 'layoutgrid', component: LayoutGrid, label: 'Grid Layout' },
      { name: 'layoutlist', component: LayoutList, label: 'List Layout' },
      { name: 'grid', component: Grid, label: 'Grid' },
      { name: 'list', component: List, label: 'List' },
      { name: 'listordered', component: ListOrdered, label: 'Ordered List' },
      { name: 'listtree', component: ListTree, label: 'Tree List' },
      { name: 'menu', component: Menu, label: 'Menu' },
      { name: 'sidebar', component: Sidebar, label: 'Sidebar' },
      { name: 'panelleft', component: PanelLeft, label: 'Panel Left' },
      { name: 'panelright', component: PanelRight, label: 'Panel Right' },
    ]
  },
  arrows: {
    label: 'Arrows',
    icons: [
      { name: 'arrowup', component: ArrowUp, label: 'Arrow Up' },
      { name: 'arrowdown', component: ArrowDown, label: 'Arrow Down' },
      { name: 'arrowleft', component: ArrowLeft, label: 'Arrow Left' },
      { name: 'arrowright', component: ArrowRight, label: 'Arrow Right' },
      { name: 'chevronup', component: ChevronUp, label: 'Chevron Up' },
      { name: 'chevrondown', component: ChevronDown, label: 'Chevron Down' },
      { name: 'chevronleft', component: ChevronLeft, label: 'Chevron Left' },
      { name: 'chevronright', component: ChevronRight, label: 'Chevron Right' },
      { name: 'moveup', component: MoveUp, label: 'Move Up' },
      { name: 'movedown', component: MoveDown, label: 'Move Down' },
      { name: 'maximize', component: Maximize, label: 'Maximize' },
      { name: 'minimize', component: Minimize, label: 'Minimize' },
    ]
  },
  shapes: {
    label: 'Shapes',
    icons: [
      { name: 'circle', component: Circle, label: 'Circle' },
      { name: 'circledot', component: CircleDot, label: 'Circle Dot' },
      { name: 'square', component: Square, label: 'Square' },
      { name: 'hexagon', component: Hexagon, label: 'Hexagon' },
      { name: 'pentagon', component: Pentagon, label: 'Pentagon' },
      { name: 'octagon', component: Octagon, label: 'Octagon' },
      { name: 'triangle', component: Triangle, label: 'Triangle' },
      { name: 'diamond', component: Diamond, label: 'Diamond' },
      { name: 'star', component: Star, label: 'Star' },
      { name: 'heart', component: Heart, label: 'Heart' },
      { name: 'box', component: Box, label: 'Box' },
      { name: 'cylinder', component: Cylinder, label: 'Cylinder' },
      { name: 'gem', component: Gem, label: 'Gem' },
    ]
  },
  media: {
    label: 'Media',
    icons: [
      { name: 'play', component: Play, label: 'Play' },
      { name: 'pause', component: Pause, label: 'Pause' },
      { name: 'playcircle', component: PlayCircle, label: 'Play Circle' },
      { name: 'stopcircle', component: StopCircle, label: 'Stop' },
      { name: 'skipforward', component: SkipForward, label: 'Skip Forward' },
      { name: 'skipback', component: SkipBack, label: 'Skip Back' },
      { name: 'volume', component: Volume, label: 'Volume' },
      { name: 'volume2', component: Volume2, label: 'Volume 2' },
      { name: 'volumex', component: VolumeX, label: 'Mute' },
      { name: 'music', component: Music, label: 'Music' },
      { name: 'music2', component: Music2, label: 'Music 2' },
      { name: 'image', component: Image, label: 'Image' },
      { name: 'imageplus', component: ImagePlus, label: 'Image Plus' },
    ]
  },
  communication: {
    label: 'Communication',
    icons: [
      { name: 'mail', component: Mail, label: 'Mail' },
      { name: 'mailopen', component: MailOpen, label: 'Mail Open' },
      { name: 'mailplus', component: MailPlus, label: 'Mail Plus' },
      { name: 'inbox', component: Inbox, label: 'Inbox' },
      { name: 'send', component: Send, label: 'Send' },
      { name: 'messagecircle', component: MessageCircle, label: 'Message' },
      { name: 'messagesquare', component: MessageSquare, label: 'Chat' },
      { name: 'phone', component: Phone, label: 'Phone' },
      { name: 'phonecall', component: PhoneCall, label: 'Phone Call' },
      { name: 'atsign', component: AtSign, label: 'At Sign' },
      { name: 'bell', component: Bell, label: 'Bell' },
      { name: 'bellring', component: BellRing, label: 'Bell Ring' },
    ]
  },
  business: {
    label: 'Business',
    icons: [
      { name: 'briefcase', component: Briefcase, label: 'Briefcase' },
      { name: 'building', component: Building, label: 'Building' },
      { name: 'building2', component: Building2, label: 'Building 2' },
      { name: 'landmark', component: Landmark, label: 'Landmark' },
      { name: 'dollarsign', component: DollarSign, label: 'Dollar' },
      { name: 'euro', component: Euro, label: 'Euro' },
      { name: 'coins', component: Coins, label: 'Coins' },
      { name: 'creditcard', component: CreditCard, label: 'Credit Card' },
      { name: 'wallet', component: Wallet, label: 'Wallet' },
      { name: 'receipt', component: Receipt, label: 'Receipt' },
      { name: 'banknote', component: Banknote, label: 'Banknote' },
      { name: 'calendar', component: Calendar, label: 'Calendar' },
      { name: 'calendardays', component: CalendarDays, label: 'Calendar Days' },
      { name: 'clock', component: Clock, label: 'Clock' },
      { name: 'timer', component: Timer, label: 'Timer' },
    ]
  },
  people: {
    label: 'People',
    icons: [
      { name: 'user', component: User, label: 'User' },
      { name: 'usercircle', component: UserCircle, label: 'User Circle' },
      { name: 'usersquare', component: UserSquare, label: 'User Square' },
      { name: 'userplus', component: UserPlus, label: 'User Plus' },
      { name: 'userminus', component: UserMinus, label: 'User Minus' },
      { name: 'userx', component: UserX, label: 'User X' },
      { name: 'users', component: Users, label: 'Users' },
      { name: 'users2', component: Users2, label: 'Users 2' },
      { name: 'contact', component: Contact, label: 'Contact' },
      { name: 'crown', component: Crown, label: 'Crown' },
      { name: 'handshake', component: Handshake, label: 'Handshake' },
    ]
  },
  nature: {
    label: 'Nature',
    icons: [
      { name: 'sun', component: Sun, label: 'Sun' },
      { name: 'moon', component: Moon, label: 'Moon' },
      { name: 'cloudsun', component: CloudSun, label: 'Cloudy' },
      { name: 'cloudrain', component: CloudRain, label: 'Rain' },
      { name: 'cloudsnow', component: CloudSnow, label: 'Snow' },
      { name: 'cloudlightning', component: CloudLightning, label: 'Lightning' },
      { name: 'wind', component: Wind, label: 'Wind' },
      { name: 'snowflake', component: Snowflake, label: 'Snowflake' },
      { name: 'thermometer', component: Thermometer, label: 'Thermometer' },
      { name: 'umbrella', component: Umbrella, label: 'Umbrella' },
      { name: 'droplet', component: Droplet, label: 'Droplet' },
      { name: 'waves', component: Waves, label: 'Waves' },
      { name: 'mountain', component: Mountain, label: 'Mountain' },
      { name: 'trees', component: Trees, label: 'Trees' },
    ]
  },
  transport: {
    label: 'Transport',
    icons: [
      { name: 'car', component: Car, label: 'Car' },
      { name: 'carfront', component: CarFront, label: 'Car Front' },
      { name: 'bus', component: Bus, label: 'Bus' },
      { name: 'train', component: Train, label: 'Train' },
      { name: 'plane', component: Plane, label: 'Plane' },
      { name: 'planetakeoff', component: PlaneTakeoff, label: 'Takeoff' },
      { name: 'planelanding', component: PlaneLanding, label: 'Landing' },
      { name: 'ship', component: Ship, label: 'Ship' },
      { name: 'anchor', component: Anchor, label: 'Anchor' },
      { name: 'bike', component: Bike, label: 'Bike' },
      { name: 'rocket', component: Rocket, label: 'Rocket' },
      { name: 'navigation', component: Navigation, label: 'Navigation' },
      { name: 'map', component: Map, label: 'Map' },
      { name: 'mappin', component: MapPin, label: 'Map Pin' },
      { name: 'compass', component: Compass, label: 'Compass' },
    ]
  },
  actions: {
    label: 'Actions',
    icons: [
      { name: 'check', component: Check, label: 'Check' },
      { name: 'checkcircle', component: CheckCircle, label: 'Check Circle' },
      { name: 'checksquare', component: CheckSquare, label: 'Check Square' },
      { name: 'x', component: X, label: 'X' },
      { name: 'xcircle', component: XCircle, label: 'X Circle' },
      { name: 'plus', component: Plus, label: 'Plus' },
      { name: 'pluscircle', component: PlusCircle, label: 'Plus Circle' },
      { name: 'minus', component: Minus, label: 'Minus' },
      { name: 'minuscircle', component: MinusCircle, label: 'Minus Circle' },
      { name: 'edit', component: Edit, label: 'Edit' },
      { name: 'edit2', component: Edit2, label: 'Edit 2' },
      { name: 'trash', component: Trash, label: 'Trash' },
      { name: 'trash2', component: Trash2, label: 'Trash 2' },
      { name: 'copy', component: Copy, label: 'Copy' },
      { name: 'undo', component: Undo, label: 'Undo' },
      { name: 'redo', component: Redo, label: 'Redo' },
      { name: 'refreshcw', component: RefreshCw, label: 'Refresh' },
    ]
  },
  status: {
    label: 'Status',
    icons: [
      { name: 'alertcircle', component: AlertCircle, label: 'Alert Circle' },
      { name: 'alerttriangle', component: AlertTriangle, label: 'Warning' },
      { name: 'alertoctagon', component: AlertOctagon, label: 'Alert Octagon' },
      { name: 'info', component: Info, label: 'Info' },
      { name: 'helpcircle', component: HelpCircle, label: 'Help' },
      { name: 'loader', component: Loader, label: 'Loader' },
      { name: 'loader2', component: Loader2, label: 'Loader 2' },
      { name: 'zap', component: Zap, label: 'Zap' },
      { name: 'zapoff', component: ZapOff, label: 'Zap Off' },
      { name: 'flame', component: Flame, label: 'Flame' },
    ]
  },
  tools: {
    label: 'Tools',
    icons: [
      { name: 'wrench', component: Wrench, label: 'Wrench' },
      { name: 'settings', component: Settings, label: 'Settings' },
      { name: 'settings2', component: Settings2, label: 'Settings 2' },
      { name: 'cog', component: Cog, label: 'Cog' },
      { name: 'sliders', component: SlidersHorizontal, label: 'Sliders' },
      { name: 'palette', component: Palette, label: 'Palette' },
      { name: 'paintbrush', component: Paintbrush, label: 'Paintbrush' },
      { name: 'pipette', component: Pipette, label: 'Pipette' },
      { name: 'ruler', component: Ruler, label: 'Ruler' },
      { name: 'scissors', component: Scissors, label: 'Scissors' },
      { name: 'plug', component: Plug, label: 'Plug' },
      { name: 'power', component: Power, label: 'Power' },
    ]
  },
  misc: {
    label: 'Misc',
    icons: [
      { name: 'bookmark', component: Bookmark, label: 'Bookmark' },
      { name: 'tag', component: Tag, label: 'Tag' },
      { name: 'tags', component: Tags, label: 'Tags' },
      { name: 'flag', component: Flag, label: 'Flag' },
      { name: 'pin', component: Pin, label: 'Pin' },
      { name: 'link', component: Link, label: 'Link' },
      { name: 'link2', component: Link2, label: 'Link 2' },
      { name: 'qrcode', component: QrCode, label: 'QR Code' },
      { name: 'search', component: Search, label: 'Search' },
      { name: 'zoomin', component: ZoomIn, label: 'Zoom In' },
      { name: 'zoomout', component: ZoomOut, label: 'Zoom Out' },
      { name: 'home', component: Home, label: 'Home' },
      { name: 'store', component: Store, label: 'Store' },
      { name: 'shoppingcart', component: ShoppingCart, label: 'Cart' },
      { name: 'gift', component: Gift, label: 'Gift' },
      { name: 'award', component: Award, label: 'Award' },
      { name: 'trophy', component: Trophy, label: 'Trophy' },
      { name: 'target', component: Target, label: 'Target' },
      { name: 'lightbulb', component: Lightbulb, label: 'Lightbulb' },
      { name: 'sparkles', component: Sparkles, label: 'Sparkles' },
      { name: 'wand2', component: Wand2, label: 'Magic Wand' },
      { name: 'bot', component: Bot, label: 'Bot' },
      { name: 'brain', component: Brain, label: 'Brain' },
      { name: 'atom', component: Atom, label: 'Atom' },
      { name: 'dna', component: Dna, label: 'DNA' },
      { name: 'microscope', component: Microscope, label: 'Microscope' },
    ]
  }
};

export const iconMap: Record<string, LucideIcon> = {};
for (const category of Object.values(iconCategories)) {
  for (const icon of category.icons) {
    iconMap[icon.name] = icon.component;
  }
}

export const totalIconCount = Object.keys(iconMap).length;
 