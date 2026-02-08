import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Eraser } from "lucide-react";
import { clearAutoSave } from "@/hooks/useAutoSave";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReset = () => {
        window.location.href = '/';
    };

    private handleHardReset = () => {
        if (confirm("This will clear your current unsaved session to fix the crash. Your saved maps will remain. Proceed?")) {
            clearAutoSave();
            window.location.href = '/';
        }
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="max-w-md w-full space-y-6 text-center animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-center">
                            <div className="p-4 bg-destructive/10 rounded-full">
                                <AlertTriangle className="w-12 h-12 text-destructive" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
                            <p className="text-muted-foreground">
                                The application encountered an unexpected error. This can sometimes happen due to corrupted map data or complex layouts.
                            </p>
                        </div>

                        {this.state.error && (
                            <div className="p-3 bg-muted rounded-md text-xs font-mono text-left overflow-auto max-h-32 opacity-70">
                                {this.state.error.message}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button onClick={this.handleReset} variant="outline" className="gap-2">
                                <RefreshCcw className="w-4 h-4" />
                                Reload App
                            </Button>
                            <Button onClick={this.handleHardReset} variant="destructive" className="gap-2">
                                <Eraser className="w-4 h-4" />
                                Fix & Reset
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            If the problem persists, please try reloading with a different browser or clearing your cache.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
