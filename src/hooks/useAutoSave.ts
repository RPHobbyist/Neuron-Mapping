/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useEffect, useRef } from 'react';
import { del, get, getMany, keys, set } from 'idb-keyval';

import { AutoSaveData, DOCUMENT_SCHEMA_VERSION, parseAutoSave } from '@/lib/mapDocument';
import { generateId } from '@/utils/common';

import { MindMapNode, ConnectionStyle, Drawing, BoxArea, Viewport } from '@/types/mindmap';

export type { AutoSaveData } from '@/lib/mapDocument';

export const SESSION_KEY_PREFIX = 'neuron-mapping-autosave:';
const LEGACY_SESSION_KEY = 'neuron-mapping-autosave';
const AUTOSAVE_DELAY = 2000;
const AUTOSAVE_MAX_WAIT = 15000;
const SYNC_COPY_MAX_NODES = 2000;

export interface PendingSession extends AutoSaveData {
  sessionId: string;
}

export const mapSessionId = (mapId: string) => `map:${mapId}`;
export const newSessionId = () => `new:${generateId()}`;

export const sessionTitle = (session: AutoSaveData): string =>
  session.name || session.nodes.find(n => n.parentId === null)?.text.split('\n')[0] || 'Untitled map';
const sessionKey = (sessionId: string) => `${SESSION_KEY_PREFIX}${sessionId}`;

export const clearAutoSave = async (sessionId: string) => {
  try {
    await del(sessionKey(sessionId));
    localStorage.removeItem(sessionKey(sessionId));
  } catch (e) {
    console.error('Failed to clear auto-save', e);
  }
};

const readSession = (raw: unknown): AutoSaveData | null => {
  if (!raw) return null;
  try {
    const session = parseAutoSave(typeof raw === 'string' ? JSON.parse(raw) : raw);
    return session && session.nodes.length > 0 ? session : null;
  } catch (e) {
    console.error('Failed to parse auto-save data:', e);
    return null;
  }
};

const newer = (a: AutoSaveData | null, b: AutoSaveData | null) =>
  (a && b ? (b.lastModified > a.lastModified ? b : a) : a ?? b);

const readLocalSession = (key: string): AutoSaveData | null => {
  try {
    return readSession(localStorage.getItem(key));
  } catch (e) {
    console.error('Failed to read auto-save fallback:', e);
    return null;
  }
};

const migrateLegacySession = async () => {
  const legacy = newer(readSession(await get(LEGACY_SESSION_KEY)), readLocalSession(LEGACY_SESSION_KEY));
  if (legacy) {
    const key = sessionKey(legacy.mapId ? mapSessionId(legacy.mapId) : 'new:earlier-session');
    if (newer(readSession(await get(key)), legacy) === legacy) await set(key, legacy);
  }
  await del(LEGACY_SESSION_KEY);
  localStorage.removeItem(LEGACY_SESSION_KEY);
};

export const readPendingSessions = async (): Promise<PendingSession[]> => {
  try {
    await migrateLegacySession();
  } catch (e) {
    console.error('Failed to move the earlier unsaved session:', e);
  }

  const sessions = new Map<string, AutoSaveData>();
  try {
    const idbKeys = (await keys()).filter(
      (key): key is string => typeof key === 'string' && key.startsWith(SESSION_KEY_PREFIX)
    );
    const values = await getMany(idbKeys);
    idbKeys.forEach((key, i) => {
      const session = readSession(values[i]);
      if (session) sessions.set(key.slice(SESSION_KEY_PREFIX.length), session);
    });
  } catch (e) {
    console.error('Failed to read auto-saves:', e);
  }

  const localKeys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(SESSION_KEY_PREFIX)) localKeys.push(key);
    }
  } catch (e) {
    console.error('Failed to list auto-save fallbacks:', e);
  }
  for (const key of localKeys) {
    const sessionId = key.slice(SESSION_KEY_PREFIX.length);
    const local = readLocalSession(key);
    try {
      if (local && newer(sessions.get(sessionId) ?? null, local) === local) {
        await set(key, local);
        sessions.set(sessionId, local);
      }
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to move auto-save fallback into IndexedDB:', e);
    }
  }

  return [...sessions]
    .map(([sessionId, session]) => ({ ...session, sessionId }))
    .sort((a, b) => b.lastModified - a.lastModified);
};

export const readPendingSession = async (sessionId: string): Promise<PendingSession | null> => {
  const key = sessionKey(sessionId);
  let stored: AutoSaveData | null = null;
  try {
    stored = readSession(await get(key));
  } catch (e) {
    console.error('Failed to read auto-save:', e);
  }
  const session = newer(stored, readLocalSession(key));
  return session ? { ...session, sessionId } : null;
};

export const renamePendingSession = async (sessionId: string, name: string) => {
  const pending = await readPendingSession(sessionId);
  if (!pending) return;
  const { sessionId: _, ...session } = pending;
  await set(sessionKey(sessionId), { ...session, name });
};

export const clearAllAutoSaves = async () => {
  const sessions = await readPendingSessions();
  await Promise.all(sessions.map(session => clearAutoSave(session.sessionId)));
};

interface AutoSaveOptions {
  enabled: boolean;
  sessionId: string;
  mapId?: string;
  name?: string;
  templateId?: string;
  viewport?: Viewport;
}

export const useAutoSave = (
  nodes: MindMapNode[],
  connectionStyle: ConnectionStyle,
  drawings: Drawing[],
  boxAreas: BoxArea[],
  { enabled, sessionId, mapId, name, templateId, viewport }: AutoSaveOptions
) => {
  const pendingSaveRef = useRef<{ key: string; data: AutoSaveData } | null>(null);
  const unsavedSinceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || nodes.length === 0) {
      pendingSaveRef.current = null;
      unsavedSinceRef.current = null;
      return;
    }

    const pending = {
      key: sessionKey(sessionId),
      data: {
        nodes,
        connectionStyle,
        drawings,
        boxAreas,
        viewport,
        lastModified: Date.now(),
        mapId,
        name,
        templateId,
        schemaVersion: DOCUMENT_SCHEMA_VERSION,
      },
    };
    pendingSaveRef.current = pending;
    const unsavedSince = unsavedSinceRef.current ?? Date.now();
    unsavedSinceRef.current = unsavedSince;

    const handler = setTimeout(() => {
      unsavedSinceRef.current = null;
      set(pending.key, pending.data)
        .then(() => {
          if (pendingSaveRef.current === pending) pendingSaveRef.current = null;
        })
        .catch(e => console.error('AutoSave failed:', e));
    }, Math.max(0, Math.min(AUTOSAVE_DELAY, unsavedSince + AUTOSAVE_MAX_WAIT - Date.now())));

    return () => clearTimeout(handler);
  }, [nodes, connectionStyle, drawings, boxAreas, viewport, enabled, sessionId, mapId, name, templateId]);

  useEffect(() => {
    const flush = () => {
      const pending = pendingSaveRef.current;
      if (!pending) return;
      pendingSaveRef.current = null;
      unsavedSinceRef.current = null;
      set(pending.key, pending.data).catch(e => console.error('AutoSave flush failed:', e));
    };
    const flushSync = () => {
      const pending = pendingSaveRef.current;
      if (pending && pending.data.nodes.length <= SYNC_COPY_MAX_NODES) {
        try {
          localStorage.setItem(pending.key, JSON.stringify(pending.data));
        } catch (e) {
          console.error('AutoSave sync flush failed:', e);
        }
      }
      flush();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('beforeunload', flushSync);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      flush();
      window.removeEventListener('beforeunload', flushSync);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
};
