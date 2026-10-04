/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { generateId } from '@/utils/common';

type PresenceMessage =
  | { type: 'opened'; mapId: string; tabId: string }
  | { type: 'also-open'; mapId: string; tabId: string; to: string }
  | { type: 'saved'; mapId: string; tabId: string };

const CHANNEL_NAME = 'neuron-mapping-open-maps';
const BOTH_TABS_SAVE = 'If you save in both tabs, the last save replaces the other.';

export const useMapPresence = (mapId: string | undefined) => {
  const tabIdRef = useRef(generateId());
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (!mapId || typeof BroadcastChannel === 'undefined') return;
    const tabId = tabIdRef.current;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<PresenceMessage>) => {
      const message = event.data;
      if (!message || message.mapId !== mapId || message.tabId === tabId) return;
      if (message.type === 'opened') {
        channel.postMessage({ type: 'also-open', mapId, tabId, to: message.tabId } satisfies PresenceMessage);
        toast.warning('This map was just opened in another tab', { description: BOTH_TABS_SAVE });
      } else if (message.type === 'also-open' && message.to === tabId) {
        toast.warning('This map is already open in another tab', { description: BOTH_TABS_SAVE });
      } else if (message.type === 'saved') {
        toast.info('This map was saved in another tab', { description: 'Saving here will replace that version.' });
      }
    };
    channel.postMessage({ type: 'opened', mapId, tabId } satisfies PresenceMessage);

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [mapId]);

  return useCallback(() => {
    if (mapId) channelRef.current?.postMessage({ type: 'saved', mapId, tabId: tabIdRef.current } satisfies PresenceMessage);
  }, [mapId]);
};
