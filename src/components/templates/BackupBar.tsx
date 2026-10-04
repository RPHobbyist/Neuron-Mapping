/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, HardDrive, ShieldAlert, ShieldCheck, Upload } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

import { describeRestore, downloadBackup, parseBackup, restoreBackup } from '@/utils/backup';
import {
  StorageStatus,
  formatBytes,
  getLastBackupAt,
  getStorageStatus,
  isBackupReminderDue,
  snoozeBackupReminder,
} from '@/utils/storageHealth';

interface BackupBarProps {
  mapCount: number;
  onRestored: () => void;
}

const describeStorage = (status: StorageStatus | null): string => {
  const parts = ['Stored only in this browser'];
  if (status?.usageBytes) parts.push(`${formatBytes(status.usageBytes)} used`);
  if (status?.persisted === true) parts.push('protected from automatic cleanup');
  if (status?.persisted === false) parts.push('the browser may clear it when space runs low');
  return parts.join(' · ');
};

export const BackupBar = ({ mapCount, onRestored }: BackupBarProps) => {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [reminderDue, setReminderDue] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    getStorageStatus().then(setStatus);
    setReminderDue(isBackupReminderDue(mapCount));
  }, [mapCount]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleBackup = async () => {
    setIsBusy(true);
    try {
      const count = await downloadBackup();
      toast.success(count === 1 ? 'Backed up 1 map' : `Backed up ${count} maps`);
      setReminderDue(false);
    } catch (e) {
      console.error('Backup failed:', e);
      toast.error('Backup failed');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsBusy(true);
    try {
      const result = await restoreBackup(parseBackup(await file.text()));
      toast.success(describeRestore(result));
      onRestored();
      refresh();
    } catch (error) {
      console.error('Restore failed:', error);
      toast.error(error instanceof Error ? error.message : 'Restore failed');
    } finally {
      setIsBusy(false);
    }
  };

  const lastBackupAt = getLastBackupAt();
  const lastBackupText = lastBackupAt === null
    ? "You haven't backed up your maps yet."
    : `Your last backup was ${formatDistanceToNow(new Date(lastBackupAt), { addSuffix: true })}.`;

  return (
    <section className="mb-12 space-y-3" aria-label="Backups">
      {reminderDue && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">Back up your maps</h2>
              <p className="text-xs text-muted-foreground">
                {lastBackupText} They are stored only in this browser, so clearing site data or switching browsers loses them.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                snoozeBackupReminder();
                setReminderDue(false);
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-foreground hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleBackup}
              disabled={isBusy}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Back up now
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {status?.persisted
            ? <ShieldCheck className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" />
            : <HardDrive className="w-3.5 h-3.5 shrink-0" />}
          {describeStorage(status)}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleBackup}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
            title="Download every map, snapshot and custom template as one backup file"
          >
            <Download className="w-3.5 h-3.5" /> Back up all
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
            title="Add the maps from a backup file; maps that are newer in this browser are kept"
          >
            <Upload className="w-3.5 h-3.5" /> Restore…
          </button>
          <input
            ref={fileInputRef}
            id="backup-file-input"
            name="backup-file"
            type="file"
            accept=".nmmbackup,.json"
            className="hidden"
            onChange={handleRestoreFile}
          />
        </div>
      </div>
    </section>
  );
};
