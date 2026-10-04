/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Eraser, Download } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    backup: 'idle' | 'working' | 'done' | 'failed';
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        backup: 'idle',
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReset = () => {
        window.location.href = '/';
    };

    private handleDownloadBackup = async () => {
        this.setState({ backup: 'working' });
        try {
            const { downloadBackup } = await import("@/utils/backup");
            await downloadBackup();
            this.setState({ backup: 'done' });
        } catch (e) {
            console.error("Backup failed:", e);
            this.setState({ backup: 'failed' });
        }
    };

    private handleHardReset = async () => {
        if (confirm("This will clear your unsaved changes to fix the crash. Your saved maps will remain. To keep a copy of the unsaved changes, cancel and download a backup first. Proceed?")) {
            const { clearAllAutoSaves } = await import("@/hooks/useAutoSave");
            await clearAllAutoSaves();
            window.location.href = '/';
        }
    };

    public render() {
        if (this.state.hasError) {
            const { backup } = this.state;
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="max-w-md w-full space-y-6 text-center">
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold tracking-tight">Neuron Mapping crashed</h1>
                            <p className="text-muted-foreground">
                                Sorry about that. Download a backup first if you have work you don't want to lose, then reload.
                            </p>
                        </div>

                        {this.state.error && (
                            <div className="p-3 bg-muted rounded-md text-xs font-mono text-left overflow-auto max-h-32 opacity-70">
                                {this.state.error.message}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button
                                onClick={this.handleDownloadBackup}
                                variant="secondary"
                                className="gap-2 sm:col-span-2"
                                disabled={backup === 'working'}
                            >
                                <Download className="w-4 h-4" />
                                {backup === 'working' ? 'Preparing backup…' : 'Download backup'}
                            </Button>
                            <Button onClick={this.handleReset} variant="outline" className="gap-2">
                                <RefreshCcw className="w-4 h-4" />
                                Reload
                            </Button>
                            <Button onClick={this.handleHardReset} variant="destructive" className="gap-2">
                                <Eraser className="w-4 h-4" />
                                Clear unsaved changes
                            </Button>
                        </div>

                        {backup === 'done' && (
                            <p role="status" className="text-sm text-muted-foreground">
                                Backup downloaded. It holds your saved maps and unsaved changes; restore it from the workspace with "Restore…".
                            </p>
                        )}
                        {backup === 'failed' && (
                            <p role="alert" className="text-sm text-destructive">
                                The backup couldn't be created. Your maps are still stored in this browser.
                            </p>
                        )}

                        <p className="text-xs text-muted-foreground">
                            If it keeps crashing after a reload, clearing the unsaved changes usually fixes it. Your saved maps stay.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
