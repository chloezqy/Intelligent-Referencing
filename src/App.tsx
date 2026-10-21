import React, { useState, useCallback, useRef, useEffect } from 'react';
import TopBar from './components/TopBar';
import Canvas from './components/Canvas';
import PromptBar, { PromptMessage } from './components/PromptBar';
import LayersPanel from './components/LayersPanel';
import PropertiesPanel from './components/PropertiesPanel';
import ResearchPanel from './components/ResearchPanel';
import HelpModal from './components/HelpModal';
import { ToolMode, SelectionState, InferredReference, UIElement, ResearchTask, ScopeLevel } from './types';
import { MOCK_NODES, RESEARCH_STUDY_TASKS } from './data';
import { expandScope } from './utils';
import { fitWorkspace, zoomAtPoint } from './workspace';
import { Layers, Zap, SlidersHorizontal, PanelLeftClose, MousePointer2, Sparkles, Hand } from 'lucide-react';

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


  const canvasHost = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<PromptMessage[]>([]);
  const zoomAtCenter = (factor: number) => {
    const rect = canvasHost.current?.getBoundingClientRect();
    if (!rect) return;
    setTransform(prev => zoomAtPoint(prev, factor, rect.width / 2, rect.height / 2));
  };
  const handleZoomIn = () => zoomAtCenter(1.2);
  const handleZoomOut = () => zoomAtCenter(1 / 1.2);
  const handleZoomFit = useCallback(() => {
    const rect = canvasHost.current?.getBoundingClientRect();
    if (!rect) return;
    setTransform(fitWorkspace(rect.width, rect.height));
  }, []);
  useEffect(() => { handleZoomFit(); }, [handleZoomFit]);

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

  const [panelWidth, setPanelWidth] = useState(300);
  const openSection = (tab: 'layers' | 'research' | 'properties') => {
    setIsTasksOpen(open => tab === activePanelTab ? !open : true);
    setActivePanelTab(tab);
  };
  const resizePanel = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const startX = e.clientX, width = panelWidth;
    e.currentTarget.onpointermove = event => setPanelWidth(Math.max(260, Math.min(380, width + event.clientX - startX)));
    const finish = () => { e.currentTarget.onpointermove = null; };
    e.currentTarget.onpointerup = finish;
    e.currentTarget.onpointercancel = finish;
  };
  const receiveMessages = (next: PromptMessage[]) => {
    setMessages(prev => [...prev, ...next]);
    setActivePanelTab('properties');
    setIsTasksOpen(true);
  };

  return (
    <div className="app-shell flex flex-col h-dvh w-full overflow-hidden text-zinc-800 bg-white font-sans">
      <TopBar toolMode={toolMode} setToolMode={setToolMode} scale={transform.scale}
        onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onZoomFit={handleZoomFit}
        isTasksOpen={isTasksOpen && activePanelTab === 'research'}
        setIsTasksOpen={() => openSection('research')}
        inferredRef={inferredRef} onShowHelp={() => setIsHelpOpen(true)} />
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <nav aria-label="Workspace sections" className="navigation-rail">
          <div className="flex flex-col gap-2">
            {([{ id: 'layers', label: 'Layers', icon: Layers }, { id: 'research', label: 'Research Tasks', icon: Zap }, { id: 'properties', label: 'Properties', icon: SlidersHorizontal }] as const).map(item => (
              <button key={item.id} title={item.label} aria-label={item.label} aria-pressed={isTasksOpen && activePanelTab === item.id}
                onClick={() => openSection(item.id)} className={`rail-button ${(isTasksOpen && activePanelTab === item.id) ? 'active' : ''}`}>
                <item.icon size={20} /><span>{item.id === 'research' ? 'Tasks' : item.label}</span>
              </button>
            ))}
          </div>
        </nav>
        <main className="workspace flex flex-col flex-1 min-w-0 relative overflow-hidden" aria-label="Design canvas">
          <div ref={canvasHost} className="canvas-surface relative flex-1 min-h-0">
          <Canvas toolMode={toolMode} setToolMode={setToolMode} selectionState={selectionState} setSelectionState={setSelectionState} inferredRef={inferredRef} setInferredRef={setInferredRef} onAcceptReference={handleAcceptReference} nodes={nodes} transform={transform} setTransform={setTransform} />
          </div>
          <div className="workspace-dock">
          <div className="floating-toolbar" role="toolbar" aria-label="Canvas tools">
            {([{ mode: 'pointer', name: 'Select', key: 'V', icon: MousePointer2 }, { mode: 'smart-ref', name: 'Smart Reference', key: 'S', icon: Sparkles }, { mode: 'pan', name: 'Pan', key: 'H', icon: Hand }] as const).map(tool => <button key={tool.mode} title={`${tool.name} (${tool.key})`} aria-pressed={toolMode === tool.mode} onClick={() => setToolMode(tool.mode)}><tool.icon size={18} /><span>{tool.name}</span><kbd>{tool.key}</kbd></button>)}
          </div>
          <PromptBar attachedRef={attachedRef} onClearRef={handleClearAttachedRef} onApplyAIAction={handleApplyAIAction} onMessages={receiveMessages} />
          </div>
        </main>
        <aside className={`right-sidebar research-sidebar ${isTasksOpen ? '' : 'panel-hidden'}`} style={{ width: isTasksOpen ? panelWidth : 0 }} aria-label="Workspace panel" inert={!isTasksOpen}>
          <div className="panel-heading"><span>{activePanelTab === 'research' ? 'Research Tasks' : activePanelTab === 'layers' ? 'Layers' : 'Properties'}</span><button title="Close panel" aria-label="Close panel" onClick={() => setIsTasksOpen(false)}><PanelLeftClose size={16} /></button></div>
          <div className="flex-1 min-h-0" hidden={activePanelTab !== 'layers'}><LayersPanel nodes={nodes} inferredRef={inferredRef} onSelectNode={handleSelectNode} /></div>
          <div className="flex-1 min-h-0" hidden={activePanelTab !== 'research'}><ResearchPanel activeTaskId={activeTaskId} onSelectTask={handleSelectTask} inferredRef={inferredRef} nodes={nodes} toolMode={toolMode} onClose={() => setIsTasksOpen(false)} /></div>
          <div className="flex flex-col flex-1 min-h-0" hidden={activePanelTab !== 'properties'}>
            <div className="flex-1 min-h-0"><PropertiesPanel inferredRef={inferredRef} nodes={nodes} onBatchColorChange={handleBatchColor} onBatchDiscount={handleBatchDiscount} onScopeChange={handleGlobalScopeChange} /></div>
            {messages.length > 0 && <section className="reference-results" aria-label="Reference conversation" aria-live="polite"><h3>Reference conversation</h3>{messages.map((message, index) => <div key={index} className={`reference-message ${message.role}`}><span>{message.role === 'user' ? 'You' : 'Smart Reference'}</span><p>{message.text}</p></div>)}</section>}
          </div>
          <div role="separator" aria-label="Resize workspace panel" aria-orientation="vertical" aria-valuenow={panelWidth} aria-valuemin={260} aria-valuemax={380} tabIndex={0} className="panel-resizer" onPointerDown={resizePanel} onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setPanelWidth(v => Math.max(260, Math.min(380, v + (e.key === 'ArrowRight' ? 10 : -10)))); } }} />
        </aside>
      </div>
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
