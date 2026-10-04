/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

export interface StorageStatus {
    persisted: boolean | null;
    usageBytes: number | null;
}

export const requestPersistentStorage = async (): Promise<boolean | null> => {
    try {
        if (!navigator.storage?.persist) return null;
        if (await navigator.storage.persisted()) return true;
        return await navigator.storage.persist();
    } catch {
        return null;
    }
};

export const getStorageStatus = async (): Promise<StorageStatus> => {
    try {
        const [persisted, estimate] = await Promise.all([
            navigator.storage?.persisted ? navigator.storage.persisted() : Promise.resolve(null),
            navigator.storage?.estimate ? navigator.storage.estimate() : Promise.resolve(null),
        ]);
        return { persisted, usageBytes: estimate?.usage ?? null };
    } catch {
        return { persisted: null, usageBytes: null };
    }
};

export const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const LAST_BACKUP_KEY = 'neuron-last-backup-at';
const REMINDER_SNOOZED_UNTIL_KEY = 'neuron-backup-reminder-snoozed-until';
export const BACKUP_REMINDER_DAYS = 14;
const SNOOZE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const readTime = (key: string): number | null => {
    try {
        const value = Number(localStorage.getItem(key));
        return Number.isFinite(value) && value > 0 ? value : null;
    } catch {
        return null;
    }
};

const writeTime = (key: string, time: number) => {
    try {
        localStorage.setItem(key, String(time));
    } catch {
    }
};

export const getLastBackupAt = (): number | null => readTime(LAST_BACKUP_KEY);

export const markBackupDone = (now = Date.now()) => writeTime(LAST_BACKUP_KEY, now);

export const snoozeBackupReminder = (now = Date.now()) => writeTime(REMINDER_SNOOZED_UNTIL_KEY, now + SNOOZE_DAYS * DAY_MS);

export const isBackupReminderDue = (mapCount: number, now = Date.now()): boolean => {
    if (mapCount === 0) return false;
    const snoozedUntil = readTime(REMINDER_SNOOZED_UNTIL_KEY);
    if (snoozedUntil !== null && snoozedUntil > now) return false;
    const last = getLastBackupAt();
    return last === null || now - last > BACKUP_REMINDER_DAYS * DAY_MS;
};
