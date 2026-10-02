import React, { useState } from 'react';
import { Sparkles, Send, X, ArrowUpRight, Check, Bot } from 'lucide-react';
import { InferredReference } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface PromptBarProps {
  attachedRef: InferredReference | null;
  onClearRef: () => void;
  onApplyAIAction: (actionType: string) => void;
}

export default function PromptBar({ attachedRef, onClearRef, onApplyAIAction }: PromptBarProps) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string; actionTaken?: string }[]>([]);

  // Dynamically tailor prompt suggestions based on attached reference role & active scope
  const suggestions = React.useMemo(() => {
    if (!attachedRef) {
      return [
        "Select all product prices across screens",
        "Select primary CTA buttons in checkout flow",
        "Inspect visual consistency of cards"
      ];
    }

    const role = attachedRef.matchingRole || attachedRef.activeInterpretation?.matchingRole;
    const scope = attachedRef.scope;
    const count = attachedRef.selectedIds.length;

    // Scope 1: Touched Exemplars only
    if (scope === 'exemplars') {
      if (role === 'price') {
        return [
          `Compare these ${count} specific prices`,
          `Apply 15% discount to these ${count} selected prices`,
          `Inspect difference in formatting between these ${count}`
        ];
      }
      if (role === 'primaryCTA' || role === 'button') {
        return [
          `Change these ${count} buttons to emerald green`,
          `Compare padding between these ${count} buttons`,
          `Swap labels between these ${count} buttons`
        ];
      }
      return [
        `Compare these ${count} touched instances`,
        `Inspect style differences between these elements`,
        `Swap values of these ${count} elements`
      ];
    }

    // Scope 2: Screen Scope
    if (scope === 'screen') {
      const screenName = attachedRef.activeInterpretation?.targetScreen || 'active screen';
      if (role === 'price') {
        return [
          `Apply 15% discount to all ${count} prices in ${screenName}`,
          `Convert all prices in ${screenName} to bold tabular numerals`,
          `Align price tags vertically in ${screenName}`
        ];
      }
      if (role === 'primaryCTA' || role === 'button') {
        return [
          `Change all ${count} buttons in ${screenName} to emerald green`,
          `Standardize button height to 44px in ${screenName}`,
          `Check CTA contrast in ${screenName}`
        ];
      }
      return [
        `Align spacing across ${screenName}`,
        `Standardize typography in ${screenName}`,
        `Check contrast in this artboard`
      ];
    }

    // Scope 3: Document / All Screens Scope
    if (role === 'price') {
      return [
        `Apply 20% summer discount to all ${count} prices across Catalog`,
        `Convert all prices across catalog to bold tabular numerals`,
        `Standardize price currency formatting across all 6 screens`
      ];
    }

    if (role === 'primaryCTA' || role === 'button') {
      return [
        `Change all ${count} CTA buttons across Catalog to emerald green`,
        `Standardize all button corner radii across catalog to 12px`,
        `Audit checkout flow action buttons across all screens`
      ];
    }

    if (role === 'favorite') {
      return [
        `Align all ${count} wishlist heart icons across screens`,
        `Make inactive hearts subtle outline across catalog`,
        `Verify wishlist count consistency across flow`
      ];
    }

    return [
      `Standardize typography across all ${count} elements in catalog`,
      `Check design system token consistency across all 6 screens`,
      `Verify component padding and margins across flow`
    ];
  }, [attachedRef]);

  const handleSubmit = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const query = customText || prompt;
    if (!query.trim()) return;

    setPrompt('');

    // Determine simulated action
    let reply = '';
    let actionKey = '';

    if (query.toLowerCase().includes('discount') || query.toLowerCase().includes('sale') || query.toLowerCase().includes('price')) {
      reply = `Applied a 20% promotional discount and updated the ${attachedRef ? attachedRef.selectedIds.length : 'referenced'} price tags across your screens.`;
      actionKey = 'discount';
    } else if (query.toLowerCase().includes('button') || query.toLowerCase().includes('green') || query.toLowerCase().includes('cta') || query.toLowerCase().includes('color')) {
      reply = `Updated the primary action color to Emerald (#16a34a) for all ${attachedRef ? attachedRef.selectedIds.length : 'referenced'} CTA buttons.`;
      actionKey = 'color_green';
    } else {
      reply = `Analyzed the ${attachedRef ? attachedRef.selectedIds.length : 'selected'} elements. Semantic alignment and component tokens verified.`;
      actionKey = 'verify';
    }

    setMessages(prev => [
      ...prev,
      { role: 'user', text: query },
      { role: 'assistant', text: reply, actionTaken: actionKey }
    ]);

    if (actionKey) {
      onApplyAIAction(actionKey);
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40 pointer-events-none flex flex-col gap-2.5">
      
      {/* Response Bubbles */}
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto no-scrollbar pointer-events-auto px-1">
        {messages.slice(-2).map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-2xl text-xs max-w-[85%] shadow-xl backdrop-blur-md flex items-start gap-2.5 ${
              msg.role === 'user'
                ? 'self-end bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'self-start bg-zinc-900/95 text-zinc-200 border border-indigo-500/40 ring-1 ring-indigo-500/20'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            )}
            <div>
              <p className="leading-relaxed">{msg.text}</p>
              {msg.actionTaken && (
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-400">
                  <Check className="w-3 h-3" /> Canvas updated in real-time
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto px-1">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSubmit(undefined, s)}
            className="px-3 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 text-[11px] font-medium whitespace-nowrap shadow-md transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>{s}</span>
          </button>
        ))}
      </div>

      {/* Main Input Box */}
      <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-700/90 rounded-2xl shadow-2xl p-2 pointer-events-auto ring-1 ring-zinc-800">
        
        {/* Attached Reference Chip */}
        <AnimatePresence>
          {attachedRef && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pb-2 px-1"
            >
              <div className="inline-flex items-center gap-2 bg-indigo-950/70 border border-indigo-700/80 text-indigo-200 px-3 py-1 rounded-xl text-xs font-semibold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>{attachedRef.label}</span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-900 font-mono text-[10px] text-indigo-300 uppercase">
                  {attachedRef.selectedIds.length} items · {attachedRef.scope}
                </span>

                <button
                  onClick={onClearRef}
                  className="ml-1 p-0.5 hover:bg-indigo-800 rounded-md text-indigo-400 hover:text-white transition-colors"
                  title="Remove reference"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={e => handleSubmit(e)} className="flex items-center gap-2 px-2">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={
              attachedRef 
                ? `Prompt AI with referenced ${attachedRef.label}...` 
                : "Ask AI to reference, inspect, or modify elements..."
            }
            className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-500 py-1.5 text-xs font-medium"
          />

          <button
            type="submit"
            disabled={!prompt.trim()}
            className="w-7 h-7 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
