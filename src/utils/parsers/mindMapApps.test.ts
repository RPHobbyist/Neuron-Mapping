/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// @vitest-environment jsdom
import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';

import { DETACHED_PARENT_ID } from '@/lib/constants';
import { MindMapNode } from '@/types/mindmap';

import { parseFile } from '.';
import { parseFreeMind } from './freemindParser';
import { parseXMind } from './xmindParser';

const u8 = (text: string) => new Uint8Array(strToU8(text));
const byText = (nodes: MindMapNode[], text: string) => nodes.find(n => n.text === text)!;
const childTexts = (nodes: MindMapNode[], text: string) => nodes.filter(n => n.parentId === byText(nodes, text).id).map(n => n.text);

describe('FreeMind and Freeplane (.mm)', () => {
    const map = `<map version="1.0.1">
<node TEXT="Plan" ID="ID_root">
  <richcontent TYPE="NOTE"><html><head><title>x</title></head><body><p>Why we plan.</p><p>Second   paragraph.</p></body></html></richcontent>
  <node TEXT="Research" ID="ID_research" POSITION="right" LINK="https://example.com/research">
    <arrowlink DESTINATION="ID_build" MIDDLE_LABEL="feeds"/>
    <node ID="ID_rich"><richcontent TYPE="NODE"><html><body><p>Rich</p><p>text</p></body></html></richcontent></node>
  </node>
  <node TEXT="Build" ID="ID_build" POSITION="left" LINK="javascript:alert(1)">
    <attribute NAME="Owner" VALUE="Ana"/>
    <hook NAME="accessories/plugins/NodeNote.properties"><text>Old note</text></hook>
  </node>
</node>
</map>`;

    it('reads topics, notes, links, attributes and arrow links', () => {
        const nodes = parseFreeMind(map, 'file');
        expect(nodes.find(n => n.parentId === null)?.text).toBe('Plan');
        expect(childTexts(nodes, 'Plan')).toEqual(['Research', 'Build']);
        expect(childTexts(nodes, 'Research')).toEqual(['Rich\ntext']);
        expect(byText(nodes, 'Plan').notes).toBe('Why we plan.\n\nSecond paragraph.');
        expect(byText(nodes, 'Research').link).toBe('https://example.com/research');
        expect(byText(nodes, 'Build').link).toBeUndefined();
        expect(byText(nodes, 'Build').notes).toBe('Old note\n\nOwner: Ana');
        expect(byText(nodes, 'Research').relations).toEqual([{ targetId: byText(nodes, 'Build').id, label: 'feeds' }]);
    });

    it('reads nothing from other XML', () => {
        expect(parseFreeMind('<opml><body/></opml>')).toEqual([]);
        expect(parseFreeMind('not xml <')).toEqual([]);
    });

    it('keeps folded topics collapsed', () => {
        const nodes = parseFreeMind(`<map version="1.0.1">
<node TEXT="Plan">
  <node TEXT="Folded" FOLDED="true"><node TEXT="Inside"/></node>
  <node TEXT="Open" FOLDED="false"><node TEXT="Shown"/></node>
  <node TEXT="Leaf" FOLDED="true"/>
</node>
</map>`);
        expect(byText(nodes, 'Folded').collapsed).toBe(true);
        expect(byText(nodes, 'Open').collapsed).toBeUndefined();
        expect(byText(nodes, 'Leaf').collapsed).toBeUndefined();
    });
});

describe('XMind (.xmind)', () => {
    const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const sheet = (id: string, title: string, extra: Record<string, unknown> = {}) => ({
        id: `sheet-${id}`,
        rootTopic: { id, title, ...extra },
    });
    const xmindFile = (content: unknown, more: Record<string, Uint8Array> = {}) => zipSync({
        'content.json': u8(JSON.stringify(content)),
        'content.xml': u8('<xmap-content/>'),
        ...more,
    });

    it('reads topics with notes, links, labels, markers, pictures, floating topics and relationships', async () => {
        const nodes = await parseXMind(xmindFile([{
            ...sheet('root', 'Plan', {
                notes: { plain: { content: 'Root notes' } },
                children: {
                    attached: [
                        {
                            id: 'a', title: 'Research', href: 'https://example.com', labels: ['urgent'],
                            markers: [{ markerId: 'priority-1' }, { markerId: 'task-done' }],
                            image: { src: 'xap:resources/pic.png' },
                        },
                        { id: 'b', title: 'Build' },
                    ],
                    detached: [{ id: 'f', title: 'Floating' }],
                },
            }),
            relationships: [{ id: 'r', end1Id: 'a', end2Id: 'b', title: 'feeds' }],
        }], { 'resources/pic.png': PNG }), 'file');

        expect(nodes.find(n => n.parentId === null)?.text).toBe('Plan');
        expect(childTexts(nodes, 'Plan')).toEqual(['Research', 'Build']);
        expect(byText(nodes, 'Plan').notes).toBe('Root notes');
        expect(byText(nodes, 'Research')).toMatchObject({
            link: 'https://example.com',
            tags: ['urgent'],
            priority: 'high',
            status: 'done',
            relations: [{ targetId: byText(nodes, 'Build').id, label: 'feeds' }],
        });
        expect(byText(nodes, 'Research').image).toMatch(/^data:image\/png;base64,/);
        expect(byText(nodes, 'Floating').parentId).toBe(DETACHED_PARENT_ID);
    });

    it('keeps folded topics collapsed', async () => {
        const nodes = await parseXMind(xmindFile([sheet('root', 'Plan', {
            children: { attached: [
                { id: 'a', title: 'Folded', branch: 'folded', children: { attached: [{ id: 'a1', title: 'Inside' }] } },
                { id: 'b', title: 'Open', children: { attached: [{ id: 'b1', title: 'Shown' }] } },
            ] },
        })]));
        expect(byText(nodes, 'Folded').collapsed).toBe(true);
        expect(byText(nodes, 'Open').collapsed).toBeUndefined();
    });

    it('puts several sheets under a root named after the file', async () => {
        const nodes = await parseXMind(xmindFile([sheet('one', 'First'), sheet('two', 'Second')]), 'Workbook');
        expect(nodes.find(n => n.parentId === null)?.text).toBe('Workbook');
        expect(childTexts(nodes, 'Workbook')).toEqual(['First', 'Second']);
    });

    it('reads files from XMind 8', async () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<xmap-content xmlns="urn:xmind:xmap:xmlns:content:2.0" xmlns:xlink="http://www.w3.org/1999/xlink" version="2.0">
  <sheet id="s1">
    <topic id="root"><title>Plan</title>
      <notes><plain>Root notes</plain></notes>
      <children><topics type="attached">
        <topic id="a" xlink:href="https://example.com"><title>Research</title>
          <labels><label>urgent</label></labels>
          <marker-refs><marker-ref marker-id="priority-2"/></marker-refs>
        </topic>
        <topic id="b"><title>Build</title></topic>
      </topics></children>
    </topic>
    <relationships><relationship id="r" end1="a" end2="b"><title>feeds</title></relationship></relationships>
    <title>Sheet 1</title>
  </sheet>
</xmap-content>`;
        const nodes = await parseXMind(zipSync({ 'content.xml': u8(xml) }), 'file');
        expect(childTexts(nodes, 'Plan')).toEqual(['Research', 'Build']);
        expect(byText(nodes, 'Plan').notes).toBe('Root notes');
        expect(byText(nodes, 'Research')).toMatchObject({
            link: 'https://example.com',
            tags: ['urgent'],
            priority: 'medium',
            relations: [{ targetId: byText(nodes, 'Build').id, label: 'feeds' }],
        });
    });

    it('refuses a file that is not a zip archive', async () => {
        await expect(parseXMind(u8('plain text'))).rejects.toThrow('not a valid XMind file');
    });

    it('is read from a file by its extension', async () => {
        const file = new File([xmindFile([sheet('root', 'From a file')])], 'map.xmind');
        expect((await parseFile(file)).map(n => n.text)).toEqual(['From a file']);
    });
});
