import React, { useState, useCallback, useRef, useEffect } from 'react';
import SharePopover from './components/SharePopover';
import { shareActionLabel } from './referencePresentation';
import ResearchPanel from './components/ResearchPanel';
import { useResearch } from './useResearch';
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
import { ReferenceDraft, ReferenceIntent, SharedReference } from './collaboration';
import { useCollaboration } from './useCollaboration';
import { ClipboardList, Layers, Share2, SlidersHorizontal, PanelLeftClose, MousePointer2, Sparkles, Hand } from 'lucide-react';
export default function App() {
  const nodes = MOCK_NODES;
  const [toolMode,setToolMode]=useState<ToolMode>('smart-ref');
  const [selectionState,setSelectionState]=useState<SelectionState>('idle');
  const [inferredRef,setInferredRef]=useState<InferredReference|null>(null);
  const [transform,setTransform]=useState({x:30,y:10,scale:.46});
  const [activePanelTab,setActivePanelTab]=useState<'layers'|'references'|'properties'|'tasks'>(()=>new URL(location.href).searchParams.has('room')?'references':'layers');
  const [panelOpen,setPanelOpen]=useState(()=>window.innerWidth>1000 || new URL(location.href).searchParams.has('room'));
  const [panelWidth,setPanelWidth]=useState(320);
  const [isHelpOpen,setIsHelpOpen]=useState(false);
  const [draft,setDraft]=useState<ReferenceDraft|null>(null),[draftNote,setDraftNote]=useState('');
  const [draftPopoverOpen,setDraftPopoverOpen]=useState(false);
  const [draftIntent,setDraftIntent]=useState<ReferenceIntent>('Review');
  const [activeSharedId,setActiveSharedId]=useState<string|null>(null);
  const [referenceOpenRevision,setReferenceOpenRevision]=useState(0);
  const [highlightedId,setHighlightedId]=useState<string|null>(null);
  const c=useCollaboration(),canvasHost=useRef<HTMLDivElement>(null);
  const research=useResearch(c.room,c.session);
  const updateSelection=useCallback((ref:InferredReference|null)=>{setInferredRef(ref);research.recordSelection(ref);},[research.recordSelection]);
  const zoomAtCenter=(factor:number)=>{const r=canvasHost.current?.getBoundingClientRect();if(r)setTransform(p=>zoomAtPoint(p,factor,r.width/2,r.height/2));};
  const handleZoomFit=useCallback(()=>{const r=canvasHost.current?.getBoundingClientRect();if(r)setTransform(fitWorkspace(r.width,r.height));},[]);
  useEffect(()=>{handleZoomFit();},[handleZoomFit]);
  const shareSelection=useCallback((note='',intent?:ReferenceIntent)=>{
    if(!inferredRef?.selectedIds.length)return;
    const ids=inferredRef.selectedIds.filter(id=>nodes.some(n=>n.id===id&&n.type!=='screen'));
    if(!ids.length)return;
    setDraft({elementIds:[...ids],exemplarIds:inferredRef.exemplarIds.filter(id=>ids.includes(id)),scope:inferredRef.scope,label:inferredRef.label,...(research.attempt&&!research.attempt.completedAt&&research.attempt.level>=4&&c.session?.userId==='A'?{research:{level:research.attempt.level as 4|5,attemptId:research.attempt.id}}:{})});
    setDraftIntent(intent??(research.attempt?.level===5?'Compare':'Review'));
    setDraftNote(note);setDraftPopoverOpen(true);
  },[inferredRef,research.attempt,c.session?.userId]);
  const replaceDraftTargets=useCallback((note:string,intent:ReferenceIntent)=>{
    if(!inferredRef)return;
    const ids=inferredRef.selectedIds.filter(id=>nodes.some(n=>n.id===id&&n.type!=='screen'));
    if(!ids.length)return;
    // Retain the draft's original attempt association and selected intent.
    setDraft(current=>current?{...current,elementIds:[...ids],exemplarIds:inferredRef.exemplarIds.filter(id=>ids.includes(id)),scope:inferredRef.scope,label:inferredRef.label}:current);
    setDraftIntent(intent);setDraftNote(note);
  },[inferredRef]);
  const selectNode=(id:string)=>{const node=nodes.find(n=>n.id===id);if(!node)return;updateSelection({selectedIds:[id],exemplarIds:[id],label:node.label,matchingRole:node.role,matchingComponent:node.component,scope:'exemplars',selectionMethod:'conventional'});setSelectionState('preview');};
  const changeScope=(scope:ScopeLevel)=>{
    if(!inferredRef)return;
    const exemplars=inferredRef.exemplarIds.length?inferredRef.exemplarIds:inferredRef.selectedIds;
    const ids=expandScope(nodes,exemplars,scope,inferredRef.matchingRole,inferredRef.matchingComponent);
    updateSelection({...inferredRef,selectedIds:ids,scope,label:`${ids.length} objects · ${scope}`,activeInterpretation:undefined});
  };
  const openSection=(tab:typeof activePanelTab)=>{setPanelOpen(open=>tab===activePanelTab?!open:true);setActivePanelTab(tab);};
  const resizePanel=(e:React.PointerEvent<HTMLDivElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);const start=e.clientX,width=panelWidth;e.currentTarget.onpointermove=event=>setPanelWidth(Math.max(280,Math.min(420,width+event.clientX-start)));const finish=()=>{e.currentTarget.onpointermove=null;};e.currentTarget.onpointerup=finish;e.currentTarget.onpointercancel=finish;};
  const openShared=(id:string)=>{setDraftPopoverOpen(false);setReferenceOpenRevision(v=>v+1);if(!c.room?.references.find(r=>r.id===id)?.archivedAt)void c.activity(id,'opened');setActiveSharedId(id);setHighlightedId(id);setActivePanelTab('references');setPanelOpen(true);};
  const locate=(ref:SharedReference)=>{if(ref.archivedAt)return;const box=getBoundingBox(ref.elementIds,nodes),r=canvasHost.current?.getBoundingClientRect();if(box&&r){setTransform(fitBounds(box,r.width,r.height));void c.activity(ref.id,'located',ref.elementIds);}setHighlightedId(ref.id);};
  const shareLabel=shareActionLabel(c.session?.userId);
  const pending=c.room?.references.filter(r=>r.targetUser===c.session?.userId&&r.status==='open'&&!r.archivedAt).length||0;
  return <div className="app-shell flex flex-col h-dvh w-full overflow-hidden text-zinc-800 bg-white font-sans">
    <TopBar scale={transform.scale} onZoomIn={()=>zoomAtCenter(1.2)} onZoomOut={()=>zoomAtCenter(1/1.2)} onZoomFit={handleZoomFit} onShowHelp={()=>setIsHelpOpen(true)} session={c.session} room={c.room} connected={c.connected} onOpenRoom={()=>{setActivePanelTab('references');setPanelOpen(true);}}/>
    <div className="flex flex-1 min-h-0 overflow-hidden relative">
      <nav aria-label="Workspace sections" className="navigation-rail"><div className="flex flex-col gap-2">{([{id:'layers',label:'Layers',icon:Layers},{id:'references',label:'References',icon:Share2},{id:'properties',label:'Selection',icon:SlidersHorizontal},{id:'tasks',label:'Tasks',icon:ClipboardList}] as const).map(item=><button key={item.id} title={item.label} aria-label={item.label} aria-pressed={panelOpen&&activePanelTab===item.id} className={`rail-button ${panelOpen&&activePanelTab===item.id?'active':''}`} onClick={()=>openSection(item.id)}><item.icon size={20}/><span>{item.label}</span>{item.id==='references'&&pending>0&&<span className="rail-badge" aria-label={`${pending} references to review`}>{pending}</span>}</button>)}</div></nav>
      <main className="workspace flex flex-col flex-1 min-w-0 relative overflow-hidden" aria-label="Design canvas">
        <div ref={canvasHost} className="canvas-surface relative flex-1 min-h-0"><Canvas shareLabel={shareLabel} sharing={!!draft&&draftPopoverOpen} toolMode={toolMode} setToolMode={setToolMode} selectionState={selectionState} setSelectionState={setSelectionState} inferredRef={inferredRef} setInferredRef={updateSelection} onResearchEvent={research.record} onAcceptReference={intent=>shareSelection('',intent)} nodes={nodes} transform={transform} setTransform={setTransform} sharedReferences={c.room?.references||[]} activeSharedId={highlightedId} onOpenShared={openShared}/>{draft&&<SharePopover draft={draft} nodes={nodes} camera={transform} collaboration={c} visible={draftPopoverOpen} onVisible={setDraftPopoverOpen} note={draftNote} intent={draftIntent} onNote={setDraftNote} onIntent={setDraftIntent} selectionCount={inferredRef?.selectedIds.length||0} onReplace={()=>replaceDraftTargets(draftNote,draftIntent)} onCancel={()=>{setDraft(null);setDraftPopoverOpen(false);}} onShared={id=>{setDraft(null);setDraftPopoverOpen(false);setActiveSharedId(id);setHighlightedId(id);}} onRoom={()=>{setDraftPopoverOpen(false);setActivePanelTab('references');setPanelOpen(true);}} onLocate={()=>{const box=getBoundingBox(draft.elementIds,nodes),r=canvasHost.current?.getBoundingClientRect();if(box&&r)setTransform(fitBounds(box,r.width,r.height));}}/>}</div>
        <div className="workspace-dock"><div className="floating-toolbar" role="toolbar" aria-label="Canvas tools">{([{mode:'pointer',name:'Select',key:'V',icon:MousePointer2},{mode:'smart-ref',name:'Smart Reference',key:'S',icon:Sparkles},{mode:'pan',name:'Pan',key:'H',icon:Hand}] as const).map(tool=><button key={tool.mode} title={`${tool.name} (${tool.key})`} aria-pressed={toolMode===tool.mode} onClick={()=>setToolMode(tool.mode)}><tool.icon size={18}/><span>{tool.name}</span><kbd>{tool.key}</kbd></button>)}</div><PromptBar shareLabel={shareLabel} count={inferredRef?.selectedIds.length||0} onShare={shareSelection}/></div>
      </main>
      <aside className={`right-sidebar research-sidebar ${panelOpen?'':'panel-hidden'}`} style={{width:panelOpen?panelWidth:0}} aria-label="Workspace panel" inert={!panelOpen}>
        <div className="panel-heading"><span>{activePanelTab==='references'?'Shared References':activePanelTab==='layers'?'Layers':activePanelTab==='tasks'?'Research Tasks':'Selection'}</span><button title="Close panel" aria-label="Close panel" onClick={()=>setPanelOpen(false)}><PanelLeftClose size={16}/></button></div>
        <div className="flex-1 min-h-0" hidden={activePanelTab!=='layers'}><LayersPanel nodes={nodes} inferredRef={inferredRef} onSelectNode={selectNode}/></div>
        <div className="flex-1 min-h-0" hidden={activePanelTab!=='properties'}><PropertiesPanel shareLabel={shareLabel} inferredRef={inferredRef} nodes={nodes} onScopeChange={changeScope} onShare={()=>shareSelection()}/></div>
        <div className="flex-1 min-h-0" hidden={activePanelTab!=='references'}><CollaborationPanel nodes={nodes} collaboration={c} hasDraft={!!draft} onResumeDraft={()=>setDraftPopoverOpen(true)} activeId={activeSharedId} openRevision={referenceOpenRevision} onOpen={openShared} onLocate={locate} onClear={()=>setHighlightedId(null)}/></div>
        <div className="flex-1 min-h-0" hidden={activePanelTab!=='tasks'}><ResearchPanel research={research} room={c.room} session={c.session} connected={c.connected} selection={inferredRef} onStart={()=>{research.start();setDraft(null);setInferredRef(null);setSelectionState('idle');}} onShare={()=>shareSelection(research.log.level===5?'Compare these related CTA components for design and wording consistency.':'Please review design consistency across these related elements.')} onRoom={()=>{setActivePanelTab('references');setPanelOpen(true);}} onLocateTargets={ids=>{const box=getBoundingBox(ids,nodes),r=canvasHost.current?.getBoundingClientRect();if(box&&r)setTransform(fitBounds(box,r.width,r.height));}}/></div>
        <div role="separator" aria-label="Resize workspace panel" aria-orientation="vertical" aria-valuenow={panelWidth} aria-valuemin={280} aria-valuemax={420} tabIndex={0} className="panel-resizer" onPointerDown={resizePanel} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();setPanelWidth(v=>Math.max(280,Math.min(420,v+(e.key==='ArrowRight'?10:-10))));}}}/>
      </aside>
    </div><HelpModal isOpen={isHelpOpen} onClose={()=>setIsHelpOpen(false)}/>
  </div>;
}
