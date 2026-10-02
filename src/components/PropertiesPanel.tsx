import React from 'react';
import { InferredReference, UIElement, ScopeLevel } from '../types';
import { Layers, Palette, Eye, Type, Sliders, Check, Sparkles } from 'lucide-react';

interface PropertiesPanelProps {
  inferredRef: InferredReference | null;
  nodes: UIElement[];
  onBatchColorChange: (color: string) => void;
  onBatchDiscount: (percentage: number) => void;
  onScopeChange: (scope: ScopeLevel) => void;
}

export default function PropertiesPanel({
  inferredRef,
  nodes,
  onBatchColorChange,
  onBatchDiscount,
  onScopeChange
}: PropertiesPanelProps) {
  const selectedNodes = React.useMemo(() => {
    if (!inferredRef) return [];
    return nodes.filter(n => inferredRef.selectedIds.includes(n.id));
  }, [inferredRef, nodes]);

  const exemplarNodes = React.useMemo(() => {
    if (!inferredRef) return [];
    return nodes.filter(n => inferredRef.exemplarIds.includes(n.id));
  }, [inferredRef, nodes]);

  if (!inferredRef || selectedNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-zinc-500 text-xs">
        <Sliders className="w-8 h-8 stroke-1 text-zinc-600 mb-2" />
        <span className="font-medium text-zinc-400">No Elements Selected</span>
        <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px]">
          Click or Shift+Click layers with the Select tool (V), or draw rough gestures with Smart Reference (S).
        </p>
      </div>
    );
  }

  const role = inferredRef.matchingRole || inferredRef.activeInterpretation?.matchingRole || selectedNodes[0]?.role;
  const comp = inferredRef.matchingComponent || inferredRef.activeInterpretation?.matchingComponent || selectedNodes[0]?.component;

  return (
    <div className="flex flex-col h-full text-zinc-300 text-xs overflow-y-auto">
      {/* Selection Header */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            {inferredRef.selectionMethod === 'smart-ref' ? 'Smart Reference' : 'Figma Selection'}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] uppercase font-mono">
            {inferredRef.selectionMethod || 'pointer'}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-white mt-1 truncate">{inferredRef.label}</h3>
        
        {/* Scope Switcher Inside Properties Panel */}
        <div className="mt-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Semantic Scope:</span>
            <span className="text-indigo-400 font-mono font-semibold">{selectedNodes.length} items</span>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => onScopeChange('exemplars')}
              className={`py-1 text-[11px] rounded font-medium transition-colors ${
                inferredRef.scope === 'exemplars'
                  ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Touched ({exemplarNodes.length})
            </button>

            <button
              onClick={() => onScopeChange('screen')}
              className={`py-1 text-[11px] rounded font-medium transition-colors ${
                inferredRef.scope === 'screen'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Screen
            </button>

            <button
              onClick={() => onScopeChange('document')}
              className={`py-1 text-[11px] rounded font-medium transition-colors flex items-center justify-center gap-1 ${
                inferredRef.scope === 'document'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-indigo-400 hover:bg-indigo-950/60'
              }`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>All Screens</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exemplar vs Inferred Breakdown */}
      <div className="p-3 border-b border-zinc-800">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Inference Breakdown</span>
        <div className="mt-2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-indigo-500/30" />
              <span>Direct Gestured / Clicked</span>
            </div>
            <span className="font-mono font-semibold text-white">{exemplarNodes.length}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2 h-2 rounded-full border border-dashed border-cyan-400" />
              <span>Inferred via Pattern</span>
            </div>
            <span className="font-mono font-semibold text-cyan-400">
              {Math.max(0, selectedNodes.length - exemplarNodes.length)}
            </span>
          </div>
        </div>
      </div>

      {/* Semantic Tags */}
      <div className="p-3 border-b border-zinc-800 flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Semantic Metadata</span>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-500 block text-[10px]">ROLE</span>
            <span className="font-mono text-zinc-200 mt-0.5 block truncate">{role || 'mixed'}</span>
          </div>
          <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-500 block text-[10px]">COMPONENT</span>
            <span className="font-mono text-zinc-200 mt-0.5 block truncate">{comp || 'mixed'}</span>
          </div>
        </div>
      </div>

      {/* Quick Batch Actions */}
      <div className="p-3 border-b border-zinc-800 flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Batch Design Actions</span>
        
        {role === 'price' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] text-zinc-400">Simulate Promotional Discount:</span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => onBatchDiscount(15)}
                className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded font-medium text-xs transition-colors"
              >
                -15% Off
              </button>
              <button 
                onClick={() => onBatchDiscount(25)}
                className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded font-medium text-xs transition-colors"
              >
                -25% Off
              </button>
            </div>
          </div>
        )}

        {(role === 'primaryCTA' || role === 'button' || role === 'favorite') && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] text-zinc-400">Batch Button Color:</span>
            <div className="flex gap-2">
              {[
                { name: 'Indigo', hex: '#4f46e5' },
                { name: 'Emerald', hex: '#16a34a' },
                { name: 'Rose', hex: '#e11d48' },
                { name: 'Black', hex: '#09090b' }
              ].map(c => (
                <button
                  key={c.name}
                  onClick={() => onBatchColorChange(c.hex)}
                  title={c.name}
                  className="w-6 h-6 rounded-full border border-zinc-700 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Items List */}
      <div className="p-3 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Selected Layers ({selectedNodes.length})</span>
        <div className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
          {selectedNodes.map(node => (
            <div key={node.id} className="p-1.5 rounded bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between text-[11px]">
              <span className="truncate text-zinc-300 font-medium">{node.label}</span>
              <span className="text-[10px] font-mono text-zinc-500">{node.screen}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
