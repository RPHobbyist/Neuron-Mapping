/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { Box } from 'lucide-react';

interface Props {
  children: ReactNode;
  onExit: () => void;
}

interface State {
  failed: boolean;
}

export class GalaxyErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('The 3D view failed:', error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="flex-1 flex flex-col items-center justify-center gap-4 bg-black text-white p-6 text-center">
        <Box className="w-10 h-10 opacity-60" />
        <div className="space-y-1">
          <p className="font-semibold">The 3D view couldn't start</p>
          <p className="text-sm text-white/70 max-w-sm">
            It needs WebGL, which may be turned off or unsupported in this browser. Your map is unchanged.
          </p>
        </div>
        <button
          onClick={this.props.onExit}
          className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full border border-white/20 text-sm transition-colors"
        >
          Back to 2D
        </button>
      </div>
    );
  }
}
