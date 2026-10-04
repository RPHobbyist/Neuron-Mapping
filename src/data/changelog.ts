/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

export type ChangelogIcon =
    | 'drawing' | 'add' | 'globe' | 'focus' | 'history' | 'speed' | 'line' | 'play' | 'palette' | 'video'
    | 'shield' | 'offline' | 'files' | 'export' | 'import' | 'moon' | 'notes' | 'layers' | 'keyboard' | 'tag'
    | 'text' | 'box';

export interface ChangelogEntry {
    title: string;
    description: string;
    icon: ChangelogIcon;
    tutorialsLink?: boolean;
}

export interface Release {
    version: string;
    summary: string;
    entries: ChangelogEntry[];
}

export const RELEASES: Release[] = [
    {
        version: '1.7.0',
        summary: 'Version 1.7.0 brings text formatting, tasks and new layouts, keeps your maps safer, and works offline.',
        entries: [
            {
                title: 'Text formatting in topics',
                description: 'Make words bold, italic, underlined or struck through, change their font and size, or turn a line into a heading, right inside a topic. Ctrl+B, Ctrl+I and Ctrl+U work as you\'d expect.',
                icon: 'text',
            },
            {
                title: 'Backups and safer storage',
                description: 'Back up every map, snapshot, template and unsaved change to one file, and restore it in any browser. Maps are stored one by one, and the browser is asked to keep them.',
                icon: 'shield',
            },
            {
                title: 'Works offline',
                description: 'Install Neuron Mapping as an app. Once opened, the editor loads and saves maps without a connection.',
                icon: 'offline',
            },
            {
                title: 'Tasks and due dates',
                description: 'Tick topics off as tasks, see how much of each branch is done, give topics a due date, and hide what is done.',
                icon: 'notes',
            },
            {
                title: 'More layouts',
                description: 'Logic chart, timeline and fishbone layouts, radial rings sized to their topics, and any layout applied to just the selected branch.',
                icon: 'layers',
            },
            {
                title: 'Copy, paste and the outline',
                description: 'Copy blocks into another tab, or into other apps as an indented list (bullets in word processors), paste any list as topics or a picture onto a block, and edit the map as an indented list in the Outline.',
                icon: 'files',
            },
            {
                title: 'Box areas',
                description: 'Draw a named box around a group of topics. Drag the box and everything inside moves with it.',
                icon: 'box',
            },
            {
                title: 'Command palette and right-click menu',
                description: 'Ctrl+K finds any command, topic or saved map by typing. Right-click a topic, or the empty canvas, for what you can do there.',
                icon: 'keyboard',
            },
            {
                title: 'Presentation mode',
                description: 'Present a map topic by topic, or a whole branch at a time like slides, with the view following along, arrow keys, pause, speed and full screen.',
                icon: 'play',
            },
            {
                title: 'Automatic version history',
                description: 'Every save keeps the version it replaces, with a thumbnail, next to the snapshots you take. A deleted map comes back with Undo.',
                icon: 'history',
            },
            {
                title: 'Dark mode',
                description: 'The editor can follow your system\'s dark theme, or you can pick one; exported images stay light.',
                icon: 'moon',
            },
            {
                title: 'Markdown notes',
                description: 'Notes are written in Markdown and shown formatted, with task lists, tables and links.',
                icon: 'notes',
            },
            {
                title: 'Collapse and expand branches',
                description: 'Fold a branch away with the chip under its topic or Ctrl+., show the map down to a level, and open everything again. Search opens the branch a hit is in.',
                icon: 'layers',
            },
            {
                title: 'One branch, Zen mode and the minimap',
                description: 'Show one branch alone with a trail back to the whole map, hide everything but the map, and find your way around with a minimap.',
                icon: 'focus',
            },
            {
                title: 'Edit several blocks at once',
                description: 'Select several blocks with Shift and change their color, shape, text style, priority or status together, in one undo step.',
                icon: 'layers',
            },
            {
                title: 'Rearrange in a keystroke',
                description: 'Ctrl+Enter puts a new parent above a topic, Shift+Tab moves it up a level, and a topic dropped on another becomes its child. Undo goes back 100 steps.',
                icon: 'layers',
            },
            {
                title: 'Keyboard and navigation',
                description: 'Enter adds a sibling, Ctrl+D duplicates, Ctrl+A selects everything, Ctrl+S saves and Alt+↑/↓ moves a branch among its siblings. P, E, B and F pick the pencil, eraser, box area and fit to screen, and toolbar tooltips show each shortcut. Scrolling pans, Ctrl+scroll or a pinch zooms at the pointer, and a map opens fitted to the window, or where you left it.',
                icon: 'keyboard',
            },
            {
                title: 'Tags, pictures and links',
                description: 'Tag blocks with chips, one or several at a time, and search by tag or by notes; Smart Add matches them too. Pictures can be pasted, dropped on a block or given by address, and pictures, links and icons can be changed or removed.',
                icon: 'tag',
            },
            {
                title: 'Copy style, status colors and numbering',
                description: 'Copy one block\'s look onto others with Ctrl+Alt+C and Ctrl+Alt+V. Done, overdue and urgent topics stand out, tags have colors and highlight their topics, and topics can be numbered 1, 1.1, 1.1.1.',
                icon: 'palette',
            },
            {
                title: 'Type shorthand',
                description: 'Typing [ ] makes a task, #word adds a tag and !! sets high priority, in a topic or in pasted text.',
                icon: 'keyboard',
            },
            {
                title: 'More ways to export',
                description: 'Copy the map as an image, export SVG, print PDFs on A4 or Letter, and export Markdown, OPML, text or CSV outlines that import back.',
                icon: 'export',
            },
            {
                title: 'Faster large maps',
                description: 'Maps of 10,000 topics stay usable: they open, zoom, pan, paste and lay out with far less waiting.',
                icon: 'speed',
            },
            {
                title: 'Unsaved changes, map by map',
                description: 'Each map keeps its own unsaved changes, so two maps never overwrite each other, and you are warned when a map is open in two tabs. Unsaved work can be picked up again, or thrown away, from the start page.',
                icon: 'files',
            },
            {
                title: 'A library for your maps',
                description: 'Search and sort your saved maps, pin the ones you use most to the top, and rename, duplicate, export or delete one from the menu on its card.',
                icon: 'files',
            },
            {
                title: 'Your own colors',
                description: 'Pick any color with the color picker, and it stays in your saved colors for next time.',
                icon: 'palette',
            },
            {
                title: 'Rounder lines and line tension',
                description: 'Step lines turn with rounded corners and find their way around topics. Set how far a curve bows out, or where a step line bends, from the line properties.',
                icon: 'line',
            },
            {
                title: 'Pencil colors and line gradients',
                description: 'Choose the pencil\'s color and width, and let a line blend from its parent block\'s color into its own.',
                icon: 'drawing',
            },
        ],
    },
    {
        version: '1.6.0',
        summary: 'Version 1.6.0 added drawing, Smart Add, the 3D view and snapshots.',
        entries: [
            {
                title: 'Drawing',
                description: 'Draw on the map with the pencil, and rub it out with the eraser.',
                icon: 'drawing',
            },
            {
                title: 'Smart Add',
                description: "Type anything, and it's added under the topic it matches best. Nothing leaves your device.",
                icon: 'add',
            },
            {
                title: '3D Galaxy View',
                description: 'See the whole map in 3D, laid out as a sphere, a grid, a force layout or a flat 2D projection.',
                icon: 'globe',
            },
            {
                title: 'Focus mode',
                description: 'Select a topic and turn on Focus mode to hide everything outside its branch.',
                icon: 'focus',
            },
            {
                title: 'Snapshots',
                description: 'Save a snapshot of a map, with a thumbnail, and go back to it later.',
                icon: 'history',
            },
            {
                title: 'Faster loading',
                description: 'The first load downloads about a third as much. Exports and the 3D view only load when you use them.',
                icon: 'speed',
            },
            {
                title: 'Moving lines',
                description: 'Lines can be animated as snake arrows, flowing dashes or crosses, in either direction.',
                icon: 'line',
            },
            {
                title: 'Play mode',
                description: 'Shows a map one topic at a time, for walking people through it.',
                icon: 'play',
            },
            {
                title: 'Line styles',
                description: 'Give each line its own color, thickness, label and tension.',
                icon: 'palette',
            },
            {
                title: 'Video tutorials',
                description: 'There are now short videos on YouTube showing how each part works.',
                icon: 'video', tutorialsLink: true,
            },
        ],
    },
];

const anchorOf = (heading: string) => heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');

const headingOf = (release: Release) => `What's new in version ${release.version}`;

export const readmeChangelogTocLine = (release: Release = RELEASES[0]) =>
    `- [${headingOf(release)}](#${anchorOf(headingOf(release))})`;

export const readmeChangelogSection = (release: Release = RELEASES[0]) => [
    `## ${headingOf(release)}`,
    '',
    release.summary,
    '',
    ...release.entries.map(entry => `- **${entry.title}**: ${entry.description}`),
].join('\n');
