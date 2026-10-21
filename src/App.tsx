import React, { useState, useCallback } from 'react';
import TopBar from './components/TopBar';
import Canvas from './components/Canvas';
import PromptBar from './components/PromptBar';
import LayersPanel from './components/LayersPanel';
import PropertiesPanel from './components/PropertiesPanel';
import ResearchPanel from './components/ResearchPanel';
import HelpModal from './components/HelpModal';
import { ToolMode, SelectionState, InferredReference, UIElement, ResearchTask, ScopeLevel } from './types';
import { MOCK_NODES, RESEARCH_STUDY_TASKS } from './data';
import { expandScope } from './utils';
import { Layers, Zap, SlidersHorizontal, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, MousePointer2, Sparkles, Hand } from 'lucide-react';

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
  const [activePanelTab, setActivePanelTab] = useState<'layers' | 'research' | 'properties'>('layers');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(RESEARCH_STUDY_TASKS[0].id);
  const [isTasksOpen, setIsTasksOpen] = useState(() => window.innerWidth > 1000);
  const [isHelpOpen, setIsHelpOpen] = useState(false);


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
    setLeftOpen(true);
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

  const [leftOpen, setLeftOpen] = useState(() => window.innerWidth > 1000);
  const [leftWidth, setLeftWidth] = useState(260);
  const leftTab = activePanelTab === 'research' ? 'research' : 'layers';
  const openSection = (tab: 'layers' | 'research' | 'properties') => {
    if (tab === 'properties') { setIsTasksOpen(v => !v); if (window.innerWidth < 1000) setLeftOpen(false); return; }
    setActivePanelTab(tab);
    { setLeftOpen(v => activePanelTab === tab ? !v : true); if (window.innerWidth < 1000) setIsTasksOpen(false); }
  };
  const resizeLeft = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const startX = e.clientX, width = leftWidth;
    e.currentTarget.onpointermove = event => setLeftWidth(Math.max(230, Math.min(360, width + event.clientX - startX)));
    e.currentTarget.onpointerup = () => { e.currentTarget.onpointermove = null; };
  };

  return (
    <div className="app-shell flex flex-col h-dvh w-full overflow-hidden text-zinc-800 bg-white font-sans">
      <TopBar toolMode={toolMode} setToolMode={setToolMode} scale={transform.scale}
        onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onZoomFit={handleZoomFit}
        isTasksOpen={leftOpen && leftTab === 'research'}
        setIsTasksOpen={() => { setActivePanelTab('research'); setLeftOpen(v => leftTab === 'research' ? !v : true); }}
        inferredRef={inferredRef} onShowHelp={() => setIsHelpOpen(true)} />
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <nav aria-label="Workspace sections" className="navigation-rail">
          <div className="flex flex-col gap-2">
            {([{ id: 'layers', label: 'Layers', icon: Layers }, { id: 'research', label: 'Research Tasks', icon: Zap }, { id: 'properties', label: 'Properties', icon: SlidersHorizontal }] as const).map(item => (
              <button key={item.id} title={item.label} aria-label={item.label} aria-pressed={item.id === 'properties' ? isTasksOpen : leftOpen && leftTab === item.id}
                onClick={() => openSection(item.id)} className={`rail-button ${(item.id === 'properties' ? isTasksOpen : leftOpen && leftTab === item.id) ? 'active' : ''}`}>
                <item.icon size={20} /><span>{item.id === 'research' ? 'Tasks' : item.label}</span>
              </button>
            ))}
          </div>
          <button className="rail-button" title={leftOpen ? 'Collapse left sidebar' : 'Expand left sidebar'} aria-label={leftOpen ? 'Collapse left sidebar' : 'Expand left sidebar'} onClick={() => { setLeftOpen(v => !v); if (window.innerWidth < 1000) setIsTasksOpen(false); }}>{leftOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}</button>
        </nav>
        <aside className={`left-sidebar ${leftOpen ? '' : 'panel-hidden'}`} style={{ width: leftOpen ? leftWidth : 0 }} aria-label="Workspace navigation" inert={!leftOpen}>
          <div className="panel-heading"><span>Mobile Commerce</span><button title="Collapse left sidebar" aria-label="Collapse left sidebar" onClick={() => setLeftOpen(false)}><PanelLeftClose size={16} /></button></div>
          <div className="panel-tabs" role="tablist" aria-label="Navigation panels">
            <button role="tab" aria-selected={leftTab === 'layers'} onClick={() => setActivePanelTab('layers')}>Layers</button>
            <button role="tab" aria-selected={leftTab === 'research'} onClick={() => setActivePanelTab('research')}>Research Tasks <span>5</span></button>
          </div>
          <div className="flex-1 min-h-0" hidden={leftTab !== 'layers'}><LayersPanel nodes={nodes} inferredRef={inferredRef} onSelectNode={handleSelectNode} /></div>
          <div className="flex-1 min-h-0" hidden={leftTab !== 'research'}><ResearchPanel activeTaskId={activeTaskId} onSelectTask={handleSelectTask} inferredRef={inferredRef} nodes={nodes} toolMode={toolMode} onClose={() => setLeftOpen(false)} /></div>
          <div role="separator" aria-label="Resize left sidebar" aria-orientation="vertical" aria-valuenow={leftWidth} aria-valuemin={230} aria-valuemax={360} tabIndex={0} className="panel-resizer" onPointerDown={resizeLeft} onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setLeftWidth(v => Math.max(230, Math.min(360, v + (e.key === 'ArrowRight' ? 10 : -10)))); } }} />
        </aside>
        <main className="workspace flex-1 min-w-0 relative overflow-hidden" aria-label="Design canvas">
          <div className="workspace-caption"><span>Mobile Commerce Workspace</span><span>6 artboards</span></div>
          <Canvas toolMode={toolMode} setToolMode={setToolMode} selectionState={selectionState} setSelectionState={setSelectionState} inferredRef={inferredRef} setInferredRef={setInferredRef} onAcceptReference={handleAcceptReference} nodes={nodes} transform={transform} setTransform={setTransform} />
          <PromptBar attachedRef={attachedRef} onClearRef={handleClearAttachedRef} onApplyAIAction={handleApplyAIAction} />
          <div className="floating-toolbar" role="toolbar" aria-label="Canvas tools">
            {([{ mode: 'pointer', name: 'Select', key: 'V', icon: MousePointer2 }, { mode: 'smart-ref', name: 'Smart Reference', key: 'S', icon: Sparkles }, { mode: 'pan', name: 'Pan', key: 'H', icon: Hand }] as const).map(tool => <button key={tool.mode} title={`${tool.name} (${tool.key})`} aria-pressed={toolMode === tool.mode} onClick={() => setToolMode(tool.mode)}><tool.icon size={18} /><span>{tool.name}</span><kbd>{tool.key}</kbd></button>)}
          </div>
          {!isTasksOpen && <button className="inspector-toggle" title="Open Properties" aria-label="Open Properties" onClick={() => { setIsTasksOpen(true); if (window.innerWidth < 1000) setLeftOpen(false); }}><PanelRightOpen size={18} /></button>}
        </main>
        <aside className={`right-sidebar ${isTasksOpen ? '' : 'panel-hidden'}`} aria-label="Properties" inert={!isTasksOpen}>
          <div className="panel-heading"><span>Properties</span><button title="Collapse Properties" aria-label="Collapse Properties" onClick={() => setIsTasksOpen(false)}><PanelRightClose size={16} /></button></div>
          <div className="inspector-document"><span className="document-eyebrow">WORKSPACE</span><strong>Mobile Commerce</strong><span>6 screens · Smart Reference Prototype</span></div>
          <div className="flex-1 min-h-0"><PropertiesPanel inferredRef={inferredRef} nodes={nodes} onBatchColorChange={handleBatchColor} onBatchDiscount={handleBatchDiscount} onScopeChange={handleGlobalScopeChange} /></div>
          <div className="panel-footer"><Sparkles size={14} /><span>{inferredRef ? `${inferredRef.selectedIds.length} layers selected` : 'Select an element to inspect'}</span></div>
        </aside>
      </div>
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
