import React from 'react';
import { MousePointer2, Sparkles, Hand, Zap, Layers, Sliders } from 'lucide-react';
import { ToolMode } from '../types';

interface ToolbarProps {
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  activePanelTab: 'layers' | 'research' | 'properties';
  setActivePanelTab: (tab: 'layers' | 'research' | 'properties') => void;
}

export default function Toolbar({
  toolMode,
  setToolMode,
  activePanelTab,
  setActivePanelTab
}: ToolbarProps) {
  return (
    <aside className="w-13 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-3 justify-between select-none z-20">
      {/* Primary Interaction Tools */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => setToolMode('pointer')}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            toolMode === 'pointer'
              ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
          title="Selection Tool (V) - Click or box marquee"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => setToolMode('smart-ref')}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative ${
            toolMode === 'smart-ref'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-500/50'
              : 'text-indigo-400 hover:bg-indigo-950/40 hover:text-indigo-300'
          }`}
          title="Smart Reference (S) - Rough gesture or strike-through selection"
        >
          <Sparkles className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-2 ring-zinc-900" />
        </button>

        <button
          onClick={() => setToolMode('pan')}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            toolMode === 'pan'
              ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
          title="Pan Canvas (H) or hold Space / Middle-click"
        >
          <Hand className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Toggles */}
      <div className="flex flex-col items-center gap-2 border-t border-zinc-800 pt-3">
        <button
          onClick={() => setActivePanelTab('layers')}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            activePanelTab === 'layers'
              ? 'bg-zinc-800 text-white ring-1 ring-zinc-700'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
          }`}
          title="Layers Tree"
        >
          <Layers className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActivePanelTab('research')}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            activePanelTab === 'research'
              ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
              : 'text-zinc-500 hover:text-amber-300 hover:bg-zinc-800/40'
          }`}
          title="HCI Research Tasks"
        >
          <Zap className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActivePanelTab('properties')}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            activePanelTab === 'properties'
              ? 'bg-zinc-800 text-white ring-1 ring-zinc-700'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
          }`}
          title="Properties & Actions"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
