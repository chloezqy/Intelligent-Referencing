import React, { useState, useCallback } from 'react';
import TopBar from './components/TopBar';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import PromptBar from './components/PromptBar';
import LayersPanel from './components/LayersPanel';
import PropertiesPanel from './components/PropertiesPanel';
import ResearchPanel from './components/ResearchPanel';
import HelpModal from './components/HelpModal';
import { ToolMode, SelectionState, InferredReference, UIElement, ResearchTask, ScopeLevel } from './types';
import { MOCK_NODES, RESEARCH_STUDY_TASKS, SCREEN_CONFIGS, SCREEN_W, SCREEN_GAP } from './data';
import { expandScope } from './utils';
import { Zap, ChevronDown, Sparkles } from 'lucide-react';

export default function App() {
  const [toolMode, setToolMode] = useState<ToolMode>('smart-ref');
  const [selectionState, setSelectionState] = useState<SelectionState>('idle');
  const [inferredRef, setInferredRef] = useState<InferredReference | null>(null);
  const [attachedRef, setAttachedRef] = useState<InferredReference | null>(null);

  // Dynamic canvas nodes (can be modified by AI actions)
  const [nodes, setNodes] = useState<UIElement[]>(MOCK_NODES);

  // Canvas pan & zoom state (set default to show screens nicely)
  const [transform, setTransform] = useState({ x: 30, y: 10, scale: 0.46 });

  // Sidebar Panels (collapsible, not distracting)
  const [activePanelTab, setActivePanelTab] = useState<'layers' | 'research' | 'properties'>('research');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(RESEARCH_STUDY_TASKS[0].id);
  const [isTasksOpen, setIsTasksOpen] = useState(false); // Collapsed by default to avoid distraction
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Active task for the compact floating widget
  const currentTask = RESEARCH_STUDY_TASKS.find(t => t.id === activeTaskId) || RESEARCH_STUDY_TASKS[0];

  // Zoom Helpers
  const handleZoomIn = () => {
    setTransform(prev => ({ ...prev, scale: Math.min(2.5, prev.scale * 1.2) }));
  };

  const handleZoomOut = () => {
    setTransform(prev => ({ ...prev, scale: Math.max(0.15, prev.scale * 0.8) }));
  };

  const handleZoomFit = () => {
    setTransform({ x: 30, y: 10, scale: 0.46 });
  };

  // Selection Acceptance -> Attach to prompt bar
  const handleAcceptReference = useCallback(() => {
    if (inferredRef) {
      setAttachedRef(inferredRef);
      setSelectionState('idle');
    }
  }, [inferredRef]);

  const handleClearAttachedRef = () => {
    setAttachedRef(null);
  };

  // Node selection from layers panel (Figma click style)
  const handleSelectNode = (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    
    setInferredRef({
      selectedIds: [id],
      exemplarIds: [id],
      label: node.label,
      matchingRole: node.role,
      matchingComponent: node.component,
      scope: 'exemplars',
      selectionMethod: 'conventional'
    });
    setSelectionState('preview');
  };

  // Benchmark Task Selection
  const handleSelectTask = (task: ResearchTask) => {
    setActiveTaskId(task.id);
    setActivePanelTab('research');
    setIsTasksOpen(true);
  };

  // Global Scope Change Handler (works from PropertiesPanel or anywhere)
  const handleGlobalScopeChange = (newScope: ScopeLevel) => {
    if (!inferredRef) return;
    const baseExemplars = inferredRef.exemplarIds?.length ? inferredRef.exemplarIds : inferredRef.selectedIds;
    if (baseExemplars.length === 0) return;

    const expandedIds = expandScope(
      nodes,
      baseExemplars,
      newScope,
      inferredRef.matchingRole,
      inferredRef.matchingComponent
    );

    const targetRole = inferredRef.matchingRole || nodes.find(n => baseExemplars.includes(n.id))?.role;
    const targetComp = inferredRef.matchingComponent || nodes.find(n => baseExemplars.includes(n.id))?.component;

    let newLabel = '';
    if (newScope === 'document') {
      newLabel = `All ${expandedIds.length} ${targetRole ? targetRole + 's' : (targetComp ? targetComp + 's' : 'layers')} across Catalog`;
    } else if (newScope === 'screen') {
      newLabel = `${expandedIds.length} layers in screen`;
    } else {
      newLabel = `${expandedIds.length} touched exemplars`;
    }

    setInferredRef({
      ...inferredRef,
      selectedIds: expandedIds,
      label: newLabel,
      scope: newScope
    });
  };

  // Batch Modification: Discount
  const handleBatchDiscount = (percentage: number) => {
    const targetIds = (attachedRef || inferredRef)?.selectedIds || [];
    if (targetIds.length === 0) return;

    setNodes(prev => prev.map(n => {
      if (targetIds.includes(n.id) && n.role === 'price' && n.text) {
        const numMatch = n.text.match(/\d+(\.\d+)?/);
        if (numMatch) {
          const val = parseFloat(numMatch[0]);
          const discounted = (val * (1 - percentage / 100)).toFixed(2);
          return {
            ...n,
            text: `$${discounted}`,
            color: '#dc2626',
            fontWeight: '800'
          };
        }
      }
      return n;
    }));
  };

  // Batch Modification: Color
  const handleBatchColor = (color: string) => {
    const targetIds = (attachedRef || inferredRef)?.selectedIds || [];
    if (targetIds.length === 0) return;

    setNodes(prev => prev.map(n => {
      if (targetIds.includes(n.id)) {
        return {
          ...n,
          bg: color,
          color: '#ffffff'
        };
      }
      return n;
    }));
  };

  // High-level AI Action execution
  const handleApplyAIAction = (actionKey: string) => {
    if (actionKey === 'discount') {
      handleBatchDiscount(20);
    } else if (actionKey === 'color_green') {
      handleBatchColor('#16a34a');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 overflow-hidden font-sans text-zinc-100 antialiased selection:bg-indigo-500/30">
      
      {/* Professional Top Bar */}
      <TopBar
        toolMode={toolMode}
        setToolMode={setToolMode}
        scale={transform.scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomFit={handleZoomFit}
        isTasksOpen={isTasksOpen}
        setIsTasksOpen={setIsTasksOpen}
        inferredRef={inferredRef}
        onShowHelp={() => setIsHelpOpen(true)}
      />

      <div className="flex-1 relative flex overflow-hidden">
        {/* Left Tool Rail */}
        <Toolbar
          toolMode={toolMode}
          setToolMode={setToolMode}
          activePanelTab={activePanelTab}
          setActivePanelTab={(tab) => {
            setActivePanelTab(tab);
            setIsTasksOpen(true);
          }}
        />

        {/* Central Infinite Design Canvas */}
        <div className="flex-1 relative flex items-center justify-center bg-zinc-950 overflow-hidden">
          <Canvas
            toolMode={toolMode}
            setToolMode={setToolMode}
            selectionState={selectionState}
            setSelectionState={setSelectionState}
            inferredRef={inferredRef}
            setInferredRef={setInferredRef}
            onAcceptReference={handleAcceptReference}
            nodes={nodes}
            transform={transform}
            setTransform={setTransform}
          />

          {/* Compact Floating HCI Benchmark Badge (when panel is collapsed) */}
          {!isTasksOpen && (
            <div className="absolute top-4 right-6 pointer-events-auto z-20">
              <button
                onClick={() => {
                  setActivePanelTab('research');
                  setIsTasksOpen(true);
                }}
                className="bg-zinc-900/90 hover:bg-zinc-850 backdrop-blur-md border border-zinc-700/80 text-zinc-200 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium transition-all group"
                title="Open HCI Benchmark Tasks Drawer"
              >
                <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                  🧪
                </span>
                <span className="font-semibold text-zinc-300">Level {currentTask.level}:</span>
                <span className="text-zinc-400 truncate max-w-[140px]">{currentTask.title}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors ml-0.5" />
              </button>
            </div>
          )}

          {/* Floating AI Prompt Bar at Bottom */}
          <PromptBar
            attachedRef={attachedRef}
            onClearRef={handleClearAttachedRef}
            onApplyAIAction={handleApplyAIAction}
          />
        </div>

        {/* Right Collapsible Inspector / Research Drawer */}
        {isTasksOpen && (
          <aside className="w-84 h-full bg-zinc-900 border-l border-zinc-800 flex flex-col z-20 shadow-xl">
            {/* Tab Header */}
            <div className="flex border-b border-zinc-800 bg-zinc-950 text-xs">
              <button
                onClick={() => setActivePanelTab('research')}
                className={`flex-1 py-2.5 font-semibold text-center transition-colors border-b-2 ${
                  activePanelTab === 'research'
                    ? 'border-amber-400 text-amber-300 bg-zinc-900/60'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                5 Tasks
              </button>
              <button
                onClick={() => setActivePanelTab('properties')}
                className={`flex-1 py-2.5 font-semibold text-center transition-colors border-b-2 ${
                  activePanelTab === 'properties'
                    ? 'border-indigo-500 text-indigo-300 bg-zinc-900/60'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Properties
              </button>
              <button
                onClick={() => setActivePanelTab('layers')}
                className={`flex-1 py-2.5 font-semibold text-center transition-colors border-b-2 ${
                  activePanelTab === 'layers'
                    ? 'border-indigo-500 text-indigo-300 bg-zinc-900/60'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Layers
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-hidden">
              {activePanelTab === 'research' && (
                <ResearchPanel
                  activeTaskId={activeTaskId}
                  onSelectTask={handleSelectTask}
                  inferredRef={inferredRef}
                  nodes={nodes}
                  toolMode={toolMode}
                  onClose={() => setIsTasksOpen(false)}
                />
              )}
              {activePanelTab === 'properties' && (
                <PropertiesPanel
                  inferredRef={inferredRef}
                  nodes={nodes}
                  onBatchColorChange={handleBatchColor}
                  onBatchDiscount={handleBatchDiscount}
                  onScopeChange={handleGlobalScopeChange}
                />
              )}
              {activePanelTab === 'layers' && (
                <LayersPanel
                  nodes={nodes}
                  inferredRef={inferredRef}
                  onSelectNode={handleSelectNode}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Instructional Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

    </div>
  );
}
