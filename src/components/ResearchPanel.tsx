import React, { useState } from 'react';
import { ResearchTask, InferredReference, UIElement, ToolMode } from '../types';
import { RESEARCH_STUDY_TASKS } from '../data';
import { Sparkles, CheckCircle2, MousePointer, Play, Award, Zap, ChevronDown, ChevronUp, ChevronRight, X, RotateCcw } from 'lucide-react';

interface ResearchPanelProps {
  activeTaskId: string | null;
  onSelectTask: (task: ResearchTask) => void;
  inferredRef: InferredReference | null;
  nodes: UIElement[];
  toolMode: ToolMode;
  onClose: () => void;
}

export default function ResearchPanel({
  activeTaskId,
  onSelectTask,
  inferredRef,
  nodes,
  toolMode,
  onClose
}: ResearchPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  const currentTask = RESEARCH_STUDY_TASKS.find(t => t.id === activeTaskId) || RESEARCH_STUDY_TASKS[0];

  // Smart Detection: Evaluate if current reference matches the active task's goal
  const evaluation = React.useMemo(() => {
    if (!currentTask || !inferredRef) {
      return { isCompleted: false, hits: 0, total: currentTask.expectedCount, method: toolMode };
    }

    const selectedSet = new Set(inferredRef.selectedIds);
    const targetSet = new Set(currentTask.targetIds);
    
    // Count exact hits
    let hits = 0;
    targetSet.forEach(id => {
      if (selectedSet.has(id)) hits++;
    });

    // Check if at least 75% of target items are matched
    const isCompleted = hits >= Math.ceil(currentTask.expectedCount * 0.75);

    // Technique detection
    const method = inferredRef.selectionMethod || (toolMode === 'smart-ref' ? 'smart-ref' : 'conventional');

    return {
      isCompleted,
      hits,
      total: currentTask.expectedCount,
      method,
      actionsTaken: method === 'smart-ref' ? 2 : (inferredRef.clicksCount || hits || 1)
    };
  }, [currentTask, inferredRef, toolMode]);

  // Mark completed tasks
  React.useEffect(() => {
    if (evaluation.isCompleted && !completedTaskIds.includes(currentTask.id)) {
      setCompletedTaskIds(prev => [...prev, currentTask.id]);
    }
  }, [evaluation.isCompleted, currentTask.id, completedTaskIds]);

  const currentIndex = RESEARCH_STUDY_TASKS.findIndex(t => t.id === currentTask.id);
  const nextTask = currentIndex < RESEARCH_STUDY_TASKS.length - 1 ? RESEARCH_STUDY_TASKS[currentIndex + 1] : null;

  // Render Collapsed Pill
  if (isCollapsed) {
    return (
      <div className="p-2 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
            L{currentTask.level}
          </div>
          <div className="flex items-center gap-1.5 text-zinc-200 font-semibold truncate max-w-[160px]">
            <span>Task {currentTask.level}/5:</span>
            <span className="text-zinc-400 font-normal truncate">{currentTask.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {evaluation.isCompleted && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> Done
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
            title="Expand task drawer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-zinc-300 text-xs select-none">
      {/* Drawer Header with Collapse & Close Controls */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
            🧪
          </div>
          <div>
            <h3 className="font-bold text-white text-xs">HCI Benchmark Tasks</h3>
            <p className="text-[10px] text-zinc-400">5 Progressive Levels (Easy → Expert)</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
            title="Minimize drawer"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
            title="Close panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Level Selector Tabs (1 to 5) */}
      <div className="grid grid-cols-5 p-2 gap-1 border-b border-zinc-800 bg-zinc-900/60">
        {RESEARCH_STUDY_TASKS.map(task => {
          const isCurrent = task.id === currentTask.id;
          const isDone = completedTaskIds.includes(task.id);

          return (
            <button
              key={task.id}
              onClick={() => onSelectTask(task)}
              className={`py-1 px-1 rounded-md text-center transition-all ${
                isCurrent
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : isDone
                  ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/60'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <div className="text-[10px] flex items-center justify-center gap-0.5">
                {isDone ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> : null}
                <span>L{task.level}</span>
              </div>
              <div className="text-[8px] font-mono opacity-70 truncate">{task.difficulty}</div>
            </button>
          );
        })}
      </div>

      {/* Active Task Details & Live Detection */}
      <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
        {/* Task Objective Card */}
        <div className={`p-3 rounded-xl border transition-all ${
          evaluation.isCompleted
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100 shadow-md shadow-emerald-950/30'
            : 'bg-zinc-900/90 border-zinc-800 text-zinc-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
              Level {currentTask.level} · {currentTask.difficulty}
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
              Target: {currentTask.expectedCount} items
            </span>
          </div>

          <h4 className="text-xs font-bold text-white mt-1.5 leading-snug">{currentTask.title}</h4>
          <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{currentTask.description}</p>

          {/* Smart Succeeded Banner */}
          {evaluation.isCompleted ? (
            <div className="mt-3 p-2.5 rounded-lg bg-emerald-900/40 border border-emerald-700/60 text-emerald-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Success: {evaluation.hits}/{currentTask.expectedCount} Items Matched!</span>
              </div>

              <div className="text-[10px] text-emerald-300/90 mt-0.5">
                {evaluation.method === 'smart-ref' ? (
                  <span>
                    ⚡ <strong>Smart Reference:</strong> 1 gesture + 1 scope click ({evaluation.actionsTaken} actions). Saved ~{Math.round((1 - 2 / currentTask.conventionalClicksNeeded) * 100)}% effort!
                  </span>
                ) : (
                  <span>
                    🖱️ <strong>Conventional Selection:</strong> Completed manually using Shift+Click / Marquee ({evaluation.actionsTaken} actions).
                  </span>
                )}
              </div>

              {nextTask && (
                <button
                  onClick={() => onSelectTask(nextTask)}
                  className="mt-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-sm"
                >
                  <span>Proceed to Level {nextTask.level} ({nextTask.difficulty})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
              <span>Current Matches: <strong className="text-white font-mono">{evaluation.hits}/{currentTask.expectedCount}</strong></span>
              <span className="text-zinc-500">Awaiting selection...</span>
            </div>
          )}
        </div>

        {/* How to complete instructions for BOTH modes */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Compare Both Interaction Techniques:
          </span>

          {/* Scenario A: Conventional Selection */}
          <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-200 font-semibold text-[11px]">
              <span className="flex items-center gap-1.5">
                <MousePointer className="w-3.5 h-3.5 text-zinc-400" />
                <span>1. Conventional Figma Selection (V)</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500">{currentTask.conventionalClicksNeeded} clicks</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              {currentTask.hintConventional}
            </p>
          </div>

          {/* Scenario B: Smart Reference */}
          <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-800/50">
            <div className="flex items-center justify-between text-indigo-200 font-semibold text-[11px]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>2. Smart Reference by Example (S)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">1–2 actions</span>
            </div>
            <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
              {currentTask.hintSmartRef}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Footer */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-[11px] text-zinc-400">
        <span>Completed: <strong className="text-white">{completedTaskIds.length}/5</strong> tasks</span>
        <button
          onClick={() => setCompletedTaskIds([])}
          className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 text-[10px]"
          title="Reset task completion"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
