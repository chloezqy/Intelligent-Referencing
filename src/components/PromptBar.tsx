import React, { useState } from 'react';
import { Sparkles, Send, X } from 'lucide-react';
import { InferredReference } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export interface PromptMessage { role: 'user' | 'assistant'; text: string; actionTaken?: string }

interface PromptBarProps {
  onMessages: (messages: PromptMessage[]) => void;
  attachedRef: InferredReference | null;
  onClearRef: () => void;
  onApplyAIAction: (actionType: string) => void;
}

export default function PromptBar({ attachedRef, onClearRef, onApplyAIAction, onMessages }: PromptBarProps) {
  const [prompt, setPrompt] = useState('');

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

    onMessages([
      { role: 'user', text: query },
      { role: 'assistant', text: reply, actionTaken: actionKey }
    ]);

    if (actionKey) {
      onApplyAIAction(actionKey);
    }
  };

  return (
    <div className="ai-input w-full min-w-0 max-w-lg">
      
      {/* Main Input Box */}
      <div className="bg-white border border-zinc-200 rounded-lg p-1.5">
        
        {/* Attached Reference Chip */}
        <AnimatePresence>
          {attachedRef && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pb-2 px-1"
            >
              <div className="flex items-center gap-2 bg-indigo-50 text-indigo-800 px-2 py-1 rounded text-[11px] min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className="truncate flex-1">{attachedRef.label}</span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-100 font-mono text-[10px] text-indigo-700 uppercase">
                  {attachedRef.selectedIds.length} items · {attachedRef.scope}
                </span>

                <button
                  onClick={onClearRef}
                  className="ml-1 p-0.5 hover:bg-indigo-800 rounded-md text-indigo-600 hover:text-zinc-900 transition-colors"
                  title="Remove reference"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={e => handleSubmit(e)} className="flex items-center gap-2 px-2">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <input
            type="text" aria-label="AI prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={
              attachedRef 
                ? `Prompt AI with referenced ${attachedRef.label}...` 
                : "Ask about your selection…"
            }
            className="min-w-0 flex-1 bg-transparent border-none outline-none text-zinc-900 placeholder:text-zinc-500 py-1.5 text-xs font-medium"
          />

          <button
            type="submit" aria-label="Send prompt"
            disabled={!prompt.trim()}
            className="w-7 h-7 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
