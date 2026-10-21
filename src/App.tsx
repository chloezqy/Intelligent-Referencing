import React, { useState, useCallback, useRef, useEffect } from 'react';
import TopBar from './components/TopBar';
import Canvas from './components/Canvas';
import PromptBar from './components/PromptBar';
import LayersPanel from './components/LayersPanel';
import PropertiesPanel from './components/PropertiesPanel';
import CollaborationPanel from './components/CollaborationPanel';
import HelpModal from './components/HelpModal';
import { ToolMode, SelectionState, InferredReference, ScopeLevel } from './types';
import { MOCK_NODES } from './data';
import { expandScope, getBoundingBox } from './utils';
import { fitWorkspace, fitBounds, zoomAtPoint } from './workspace';
import { ReferenceDraft, SharedReference } from './collaboration';
import { useCollaboration } from './useCollaboration';
import { Layers, Share2, SlidersHorizontal, PanelLeftClose, MousePointer2, Sparkles, Hand } from 'lucide-react';
export default function App() {
  const nodes = MOCK_NODES;
  const [toolMode,setToolMode]=useState<ToolMode>('smart-ref');
  const [selectionState,setSelectionState]=useState<SelectionState>('idle');
  const [inferredRef,setInferredRef]=useState<InferredReference|null>(null);
  const [transform,setTransform]=useState({x:30,y:10,scale:.46});
  const [activePanelTab,setActivePanelTab]=useState<'layers'|'references'|'properties'>(()=>new URL(location.href).searchParams.has('room')?'references':'layers');
  const [panelOpen,setPanelOpen]=useState(()=>window.innerWidth>1000 || new URL(location.href).searchParams.has('room'));
  const [panelWidth,setPanelWidth]=useState(320);
  const [isHelpOpen,setIsHelpOpen]=useState(false);
  const [draft,setDraft]=useState<ReferenceDraft|null>(null),[draftNote,setDraftNote]=useState('');
  const [activeSharedId,setActiveSharedId]=useState<string|null>(null);
  const [highlightedId,setHighlightedId]=useState<string|null>(null);
  const c=useCollaboration(),canvasHost=useRef<HTMLDivElement>(null);
  const zoomAtCenter=(factor:number)=>{const r=canvasHost.current?.getBoundingClientRect();if(r)setTransform(p=>zoomAtPoint(p,factor,r.width/2,r.height/2));};
  const handleZoomFit=useCallback(()=>{const r=canvasHost.current?.getBoundingClientRect();if(r)setTransform(fitWorkspace(r.width,r.height));},[]);
  useEffect(()=>{handleZoomFit();},[handleZoomFit]);
  const shareSelection=useCallback((note='')=>{
    if(!inferredRef?.selectedIds.length)return;
    const ids=inferredRef.selectedIds.filter(id=>nodes.some(n=>n.id===id&&n.type!=='screen'));
    if(!ids.length)return;
    setDraft({elementIds:[...ids],exemplarIds:inferredRef.exemplarIds.filter(id=>ids.includes(id)),scope:inferredRef.scope,label:inferredRef.label});
    setDraftNote(note);setActivePanelTab('references');setPanelOpen(true);
  },[inferredRef]);
  const selectNode=(id:string)=>{const node=nodes.find(n=>n.id===id);if(!node)return;setInferredRef({selectedIds:[id],exemplarIds:[id],label:node.label,matchingRole:node.role,matchingComponent:node.component,scope:'exemplars',selectionMethod:'conventional'});setSelectionState('preview');};
  const changeScope=(scope:ScopeLevel)=>{
    if(!inferredRef)return;
    const exemplars=inferredRef.exemplarIds.length?inferredRef.exemplarIds:inferredRef.selectedIds;
    const ids=expandScope(nodes,exemplars,scope,inferredRef.matchingRole,inferredRef.matchingComponent);
    setInferredRef({...inferredRef,selectedIds:ids,scope,label:`${ids.length} objects · ${scope}`,activeInterpretation:undefined});
  };
  const openSection=(tab:typeof activePanelTab)=>{setPanelOpen(open=>tab===activePanelTab?!open:true);setActivePanelTab(tab);};
  const resizePanel=(e:React.PointerEvent<HTMLDivElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);const start=e.clientX,width=panelWidth;e.currentTarget.onpointermove=event=>setPanelWidth(Math.max(280,Math.min(420,width+event.clientX-start)));const finish=()=>{e.currentTarget.onpointermove=null;};e.currentTarget.onpointerup=finish;e.currentTarget.onpointercancel=finish;};
  const openShared=(id:string)=>{setActiveSharedId(id);setHighlightedId(id);setActivePanelTab('references');setPanelOpen(true);};
  const locate=(ref:SharedReference)=>{const box=getBoundingBox(ref.elementIds,nodes),r=canvasHost.current?.getBoundingClientRect();if(box&&r)setTransform(fitBounds(box,r.width,r.height));setHighlightedId(ref.id);};
  const pending=c.room?.references.filter(r=>r.targetUser===c.session?.userId&&r.status==='open').length||0;
  return <div className="app-shell flex flex-col h-dvh w-full overflow-hidden text-zinc-800 bg-white font-sans">
    <TopBar scale={transform.scale} onZoomIn={()=>zoomAtCenter(1.2)} onZoomOut={()=>zoomAtCenter(1/1.2)} onZoomFit={handleZoomFit} onShowHelp={()=>setIsHelpOpen(true)} session={c.session} room={c.room} connected={c.connected} onOpenRoom={()=>{setActivePanelTab('references');setPanelOpen(true);}}/>
    <div className="flex flex-1 min-h-0 overflow-hidden relative">
      <nav aria-label="Workspace sections" className="navigation-rail"><div className="flex flex-col gap-2">{([{id:'layers',label:'Layers',icon:Layers},{id:'references',label:'References',icon:Share2},{id:'properties',label:'Selection',icon:SlidersHorizontal}] as const).map(item=><button key={item.id} title={item.label} aria-label={item.label} aria-pressed={panelOpen&&activePanelTab===item.id} className={`rail-button ${panelOpen&&activePanelTab===item.id?'active':''}`} onClick={()=>openSection(item.id)}><item.icon size={20}/><span>{item.label}</span>{item.id==='references'&&pending>0&&<span className="rail-badge" aria-label={`${pending} references to review`}>{pending}</span>}</button>)}</div></nav>
      <main className="workspace flex flex-col flex-1 min-w-0 relative overflow-hidden" aria-label="Design canvas">
        <div ref={canvasHost} className="canvas-surface relative flex-1 min-h-0"><Canvas toolMode={toolMode} setToolMode={setToolMode} selectionState={selectionState} setSelectionState={setSelectionState} inferredRef={inferredRef} setInferredRef={setInferredRef} onAcceptReference={()=>shareSelection()} nodes={nodes} transform={transform} setTransform={setTransform} sharedReferences={c.room?.references||[]} activeSharedId={highlightedId} onOpenShared={openShared}/></div>
        <div className="workspace-dock"><div className="floating-toolbar" role="toolbar" aria-label="Canvas tools">{([{mode:'pointer',name:'Select',key:'V',icon:MousePointer2},{mode:'smart-ref',name:'Smart Reference',key:'S',icon:Sparkles},{mode:'pan',name:'Pan',key:'H',icon:Hand}] as const).map(tool=><button key={tool.mode} title={`${tool.name} (${tool.key})`} aria-pressed={toolMode===tool.mode} onClick={()=>setToolMode(tool.mode)}><tool.icon size={18}/><span>{tool.name}</span><kbd>{tool.key}</kbd></button>)}</div><PromptBar count={inferredRef?.selectedIds.length||0} onShare={shareSelection}/></div>
      </main>
      <aside className={`right-sidebar research-sidebar ${panelOpen?'':'panel-hidden'}`} style={{width:panelOpen?panelWidth:0}} aria-label="Workspace panel" inert={!panelOpen}>
        <div className="panel-heading"><span>{activePanelTab==='references'?'Shared References':activePanelTab==='layers'?'Layers':'Selection'}</span><button title="Close panel" aria-label="Close panel" onClick={()=>setPanelOpen(false)}><PanelLeftClose size={16}/></button></div>
        <div className="flex-1 min-h-0" hidden={activePanelTab!=='layers'}><LayersPanel nodes={nodes} inferredRef={inferredRef} onSelectNode={selectNode}/></div>
        <div className="flex-1 min-h-0" hidden={activePanelTab!=='properties'}><PropertiesPanel inferredRef={inferredRef} nodes={nodes} onScopeChange={changeScope} onShare={()=>shareSelection()}/></div>
        <div className="flex-1 min-h-0" hidden={activePanelTab!=='references'}><CollaborationPanel nodes={nodes} collaboration={c} draft={draft} initialNote={draftNote} onUseSelection={shareSelection} currentSelectionCount={inferredRef?.selectedIds.length||0} onCancelDraft={()=>setDraft(null)} onShared={id=>{setDraft(null);openShared(id);}} activeId={activeSharedId} onOpen={openShared} onLocate={locate} onClear={()=>setHighlightedId(null)}/></div>
        <div role="separator" aria-label="Resize workspace panel" aria-orientation="vertical" aria-valuenow={panelWidth} aria-valuemin={280} aria-valuemax={420} tabIndex={0} className="panel-resizer" onPointerDown={resizePanel} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();setPanelWidth(v=>Math.max(280,Math.min(420,v+(e.key==='ArrowRight'?10:-10))));}}}/>
      </aside>
    </div><HelpModal isOpen={isHelpOpen} onClose={()=>setIsHelpOpen(false)}/>
  </div>;
}
