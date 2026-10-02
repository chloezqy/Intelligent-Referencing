import React from 'react';
import { ToolMode, InferredReference } from '../types';
import { Sparkles, MousePointer2, Hand, ZoomIn, ZoomOut, Maximize2, Zap, HelpCircle } from 'lucide-react';

interface TopBarProps {
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  isTasksOpen: boolean;
  setIsTasksOpen: (open: boolean) => void;
  inferredRef: InferredReference | null;
  onShowHelp: () => void;
}

export default function TopBar({
  toolMode,
  setToolMode,
  scale,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  isTasksOpen,
  setIsTasksOpen,
  inferredRef,
  onShowHelp
}: TopBarProps) {
  return (
    <header className="h-12 w-full bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 text-xs select-none z-30">
      {/* Zone 1: Brand & Document Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white text-[11px] shadow-sm">
            SR
          </div>
          <span className="font-semibold text-zinc-100 text-sm tracking-tight">Smart Reference</span>
        </div>

        <span className="text-zinc-600">/</span>
        <span className="text-zinc-400 font-medium hidden sm:inline">Mobile Commerce Workspace · 6 Artboards</span>
      </div>

      {/* Zone 2: Tool Segmented Switch */}
      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
        <button
          onClick={() => setToolMode('pointer')}
          className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
            toolMode === 'pointer'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Select tool (V)"
        >
          <MousePointer2 className="w-3.5 h-3.5" />
          <span>Select (V)</span>
        </button>

        <button
          onClick={() => setToolMode('smart-ref')}
          className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors relative ${
            toolMode === 'smart-ref'
              ? 'bg-indigo-600 text-white shadow-sm font-semibold'
              : 'text-indigo-400 hover:bg-indigo-950/40'
          }`}
          title="Smart Reference tool (S) - Draw rough gestures or strike-through lines"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Smart Reference (S)</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
        </button>

        <button
          onClick={() => setToolMode('pan')}
          className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-colors ${
            toolMode === 'pan'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Hand tool (H) - Pan canvas"
        >
          <Hand className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Pan (H)</span>
        </button>
      </div>

      {/* Zone 3: Zoom Controls, HCI Study Drawer Toggle & Help */}
      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
        <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 text-zinc-400">
          <button
            onClick={onZoomOut}
            className="p-1 hover:text-zinc-200 hover:bg-zinc-800/60 rounded"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onZoomFit}
            className="px-2 py-0.5 text-[11px] font-mono hover:text-white"
            title="Zoom to fit all artboards"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            className="p-1 hover:text-zinc-200 hover:bg-zinc-800/60 rounded"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onZoomFit}
            className="p-1 hover:text-zinc-200 hover:bg-zinc-800/60 rounded border-l border-zinc-800 ml-0.5"
            title="Fit view"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Study Tasks Toggle */}
        <button
          onClick={() => setIsTasksOpen(!isTasksOpen)}
          className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors border ${
            isTasksOpen
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-zinc-800/70 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Research Tasks</span>
        </button>

        <button
          onClick={onShowHelp}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="How Smart Reference works"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
