/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { get, update } from 'idb-keyval';

import { appStore } from '@/lib/appStore';
import { DOCUMENT_SCHEMA_VERSION, parseCustomTemplate } from '@/lib/mapDocument';
import { recordId, toStoredList } from '@/lib/mapStore';
import { Template } from '@/types/templates';
import { MindMapNode, ConnectionStyle, Drawing, BoxArea } from '@/types/mindmap';
import { generateId } from '@/utils/common';

export const CUSTOM_TEMPLATES_KEY = 'neuron_custom_templates';
const LEGACY_STORAGE_KEY = 'neuron-custom-templates';
export const CUSTOM_TEMPLATE_CATEGORY = 'my-templates';

const readLegacy = (): unknown[] => {
  try {
    return toStoredList(localStorage.getItem(LEGACY_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

export async function readStoredTemplates(): Promise<unknown[]> {
  const stored = await get(CUSTOM_TEMPLATES_KEY, appStore);
  if (stored !== undefined) return toStoredList(stored);

  const legacy = readLegacy();
  if (legacy.length === 0) return [];
  let result = legacy;
  await update<unknown>(CUSTOM_TEMPLATES_KEY, (current) => {
    result = current === undefined ? legacy : toStoredList(current);
    return result;
  }, appStore);
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
  }
  return result;
}

export async function getCustomTemplates(): Promise<Template[]> {
  return (await readStoredTemplates()).flatMap((entry) => {
    const template = parseCustomTemplate(entry);
    return template ? [template] : [];
  });
}

export async function saveCustomTemplate(
  name: string,
  nodes: MindMapNode[],
  connectionStyle: ConnectionStyle,
  drawings?: Drawing[],
  boxAreas?: BoxArea[]
): Promise<Template> {
  const template: Template & { schemaVersion: number } = {
    id: `custom-${generateId()}`,
    name: name.trim() || 'Untitled Template',
    category: CUSTOM_TEMPLATE_CATEGORY,
    description: `Custom template with ${nodes.length} nodes`,
    nodes,
    connectionStyle,
    drawings,
    boxAreas,
    isCustom: true,
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
  };
  await readStoredTemplates();
  await update<unknown>(CUSTOM_TEMPLATES_KEY, (current) => [...toStoredList(current), template], appStore);
  return template;
}

export async function deleteCustomTemplate(id: string): Promise<void> {
  await readStoredTemplates();
  await update<unknown>(CUSTOM_TEMPLATES_KEY, (current) => toStoredList(current).filter(t => recordId(t) !== id), appStore);
}
