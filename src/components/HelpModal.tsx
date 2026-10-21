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
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-lg max-w-lg w-full overflow-hidden text-zinc-700 text-xs">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-zinc-900">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">HCI Research: Smart Reference by Example</h3>
              <p className="text-[11px] text-zinc-600">Rough Gestures as Indications of Intent</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close help"
            className="p-1 hover:bg-zinc-100 rounded-lg text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Core Concepts */}
        <div className="p-5 flex flex-col gap-4 leading-relaxed">
          <div className="p-3 rounded-xl bg-indigo-50/40 border border-indigo-700/40 text-indigo-800">
            <strong className="text-zinc-900 block mb-1">The Core Research Hypothesis:</strong>
            Users do not want to draw meticulous pixel-perfect lassos or shift-click 13 individual labels across 6 artboards. Instead, users provide a rough spatial gesture across a few <em>exemplars</em>, and AI infers the intended semantic pattern, granularity, and scope.
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="font-bold text-zinc-800 uppercase tracking-wider text-[10px]">
              How to Test the Prototype:
            </span>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
              <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                1
              </span>
              <div>
                <strong className="text-zinc-900 block">Switch to Smart Reference (S)</strong>
                <span>Click the Smart Reference tool in the bottom toolbar or press the <kbd className="px-1 py-0.5 bg-zinc-100 rounded text-[10px]">S</kbd> key.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
              <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                2
              </span>
              <div>
                <strong className="text-zinc-900 block">Provide a rough gesture or strike-through</strong>
                <span>Drag a quick scribble or rough loop touching 2 price tags, 2 buttons, or 2 product cards. You do <em>not</em> need to enclose them completely!</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
              <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                3
              </span>
              <div>
                <strong className="text-zinc-900 block">Inspect Inferred Pattern & Scope</strong>
                <span>Notice how the AI immediately detects the repeating role (e.g. Price tags) and lets you expand scope to the screen or all 6 artboards with 1 click!</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
              <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                4
              </span>
              <div>
                <strong className="text-zinc-900 block">Try the HCI Benchmark Tasks</strong>
                <span>Open the <strong>Research Tasks</strong> drawer to compare conventional manual selection effort against Smart Reference.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-zinc-900 rounded-xl font-semibold text-xs transition-colors"
          >
            Start Exploring
          </button>
        </div>

      </div>
    </div>
  );
}
