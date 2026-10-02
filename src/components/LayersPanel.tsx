import React, { useState } from 'react';
import { UIElement, InferredReference } from '../types';
import { Layers, Image, Type, Square, ChevronRight, ChevronDown, CheckSquare, Sparkles } from 'lucide-react';

interface LayersPanelProps {
  nodes: UIElement[];
  inferredRef: InferredReference | null;
  onSelectNode: (id: string) => void;
}

export default function LayersPanel({ nodes, inferredRef, onSelectNode }: LayersPanelProps) {
  const [collapsedScreens, setCollapsedScreens] = useState<Record<string, boolean>>({
    'screen-favorites': true,
    'screen-cart': true,
    'screen-checkout': true
  });

  const toggleScreen = (screenId: string) => {
    setCollapsedScreens(prev => ({ ...prev, [screenId]: !prev[screenId] }));
  };

  const screens = nodes.filter(n => n.type === 'screen');

  const selectedIds = inferredRef?.selectedIds || [];
  const exemplarIds = inferredRef?.exemplarIds || [];

  return (
    <div className="flex flex-col h-full text-zinc-300 text-xs select-none">
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-white">
          <Layers className="w-4 h-4 text-zinc-400" />
          <span>Workspace Artboards</span>
        </div>
        <span className="font-mono text-[10px] text-zinc-500">6 Screens</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {screens.map(screen => {
          const isCollapsed = collapsedScreens[screen.id];
          const directChildren = nodes.filter(n => n.parent === screen.id);
          const hasSelectedChild = directChildren.some(c => selectedIds.includes(c.id));

          return (
            <div key={screen.id} className="flex flex-col rounded-lg overflow-hidden border border-zinc-800/60 bg-zinc-900/30">
              <button
                onClick={() => toggleScreen(screen.id)}
                className={`flex items-center justify-between px-2.5 py-2 text-left hover:bg-zinc-800/60 transition-colors ${
                  hasSelectedChild ? 'text-indigo-300 bg-indigo-950/20' : 'text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium truncate">
                  {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
                  <span className="truncate">{screen.label}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  {directChildren.length} items
                </span>
              </button>

              {!isCollapsed && (
                <div className="flex flex-col py-1 pl-4 pr-1 border-t border-zinc-800/50 bg-zinc-950/40">
                  {directChildren.map(child => {
                    const isExemplar = exemplarIds.includes(child.id);
                    const isSelected = selectedIds.includes(child.id);

                    return (
                      <button
                        key={child.id}
                        onClick={() => onSelectNode(child.id)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded text-left transition-colors ${
                          isExemplar
                            ? 'bg-indigo-600/30 text-indigo-200 font-semibold ring-1 ring-indigo-500/50'
                            : isSelected
                            ? 'bg-indigo-950/40 text-indigo-300'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {child.type === 'image' && <Image className="w-3 h-3 text-zinc-500 shrink-0" />}
                          {child.type === 'text' && <Type className="w-3 h-3 text-zinc-500 shrink-0" />}
                          {child.type === 'card' && <Square className="w-3 h-3 text-zinc-500 shrink-0" />}
                          {child.type !== 'image' && child.type !== 'text' && child.type !== 'card' && (
                            <span className="w-2 h-2 rounded-full bg-zinc-600 shrink-0" />
                          )}
                          <span className="truncate text-[11px]">{child.label}</span>
                        </div>

                        {isSelected && (
                          <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-indigo-900/60 text-indigo-300 shrink-0">
                            {isExemplar ? 'Exemplar' : 'Inferred'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
