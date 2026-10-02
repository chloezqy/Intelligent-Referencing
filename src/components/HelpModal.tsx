import React from 'react';
import { Sparkles, X, MousePointer2, CheckCircle2, ArrowRight } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-zinc-300 text-xs">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">HCI Research: Smart Reference by Example</h3>
              <p className="text-[11px] text-zinc-400">Rough Gestures as Indications of Intent</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Core Concepts */}
        <div className="p-5 flex flex-col gap-4 leading-relaxed">
          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-700/40 text-indigo-200">
            <strong className="text-white block mb-1">The Core Research Hypothesis:</strong>
            Users do not want to draw meticulous pixel-perfect lassos or shift-click 13 individual labels across 6 artboards. Instead, users provide a rough spatial gesture across a few <em>exemplars</em>, and AI infers the intended semantic pattern, granularity, and scope.
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="font-bold text-zinc-200 uppercase tracking-wider text-[10px]">
              How to Test the Prototype:
            </span>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                1
              </span>
              <div>
                <strong className="text-zinc-100 block">Switch to Smart Reference (S)</strong>
                <span>Click the Smart Reference tool in the top bar or press the <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-[10px]">S</kbd> key.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                2
              </span>
              <div>
                <strong className="text-zinc-100 block">Provide a rough gesture or strike-through</strong>
                <span>Drag a quick scribble or rough loop touching 2 price tags, 2 buttons, or 2 product cards. You do <em>not</em> need to enclose them completely!</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                3
              </span>
              <div>
                <strong className="text-zinc-100 block">Inspect Inferred Pattern & Scope</strong>
                <span>Notice how the AI immediately detects the repeating role (e.g. Price tags) and lets you expand scope to the screen or all 6 artboards with 1 click!</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                4
              </span>
              <div>
                <strong className="text-zinc-100 block">Try the HCI Benchmark Tasks</strong>
                <span>Open the <strong>Research Tasks</strong> drawer to compare conventional manual selection effort against Smart Reference.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs transition-colors"
          >
            Start Exploring
          </button>
        </div>

      </div>
    </div>
  );
}
