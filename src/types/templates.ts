/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { MindMapNode, ConnectionStyle, Drawing, BoxArea } from './mindmap';

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  nodes: MindMapNode[];
  tags?: string[];
  connectionStyle?: ConnectionStyle;
  drawings?: Drawing[];
  boxAreas?: BoxArea[];
  isCustom?: boolean;
}

export type TemplateCategory = {
  id: string;
  name: string;
  isSection?: boolean;
};
 