import type {Positions} from './toolInteraction';
import ComparisonInspector from './components/ComparisonInspector';
import ReferenceConversation from './components/ReferenceConversation';
import {unreadMention,needsReferenceNotification} from './mentions';
import {nextAttention} from './referenceAttention';
import CollaboratorSelection from './components/CollaboratorSelection';
import CollaboratorCursors from './components/CollaboratorCursors';
import ReferenceConversationPopover from './components/ReferenceConversationPopover';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import SharePopover from './components/SharePopover';
import { shareActionLabel } from './referencePresentation';
import ResearchPanel from './components/ResearchPanel';
import { useResearch } from './useResearch';
import TopBar from './components/TopBar';
import Canvas from './components/Canvas';
import PromptBar from './components/PromptBar';
import LayersPanel from './components/LayersPanel';
import CollaborationPanel from './components/CollaborationPanel';
import HelpModal from './components/HelpModal';
import { ToolMode, SelectionState, InferredReference } from './types';
import { MOCK_NODES } from './data';
import { getBoundingBox } from './utils';
import { fitWorkspace, fitBounds, zoomAtPoint } from './workspace';
import { ReferenceDraft, ReferenceIntent, SharedReference, DESIGN_REFERENCE_PURPOSE } from './collaboration';
import { useCollaboration } from './useCollaboration';
import { ClipboardList, Layers, Share2, PanelLeftClose, MousePointer2, Sparkles, Hand } from 'lucide-react';
export default function App() {
  const [positions,setPositions]=useState<Positions>({});
  const nodes=React.useMemo(()=>MOCK_NODES.map(n=>positions[n.id]?{...n,...positions[n.id]}:n),[positions]);
  const [toolMode,setToolMode]=useState<ToolMode>('pointer');
  const [selectionState,setSelectionState]=useState<SelectionState>('idle');
  const [inferredRef,setInferredRef]=useState<InferredReference|null>(null);
  const [transform,setTransform]=useState({x:30,y:10,scale:.46});
  const [activePanelTab,setActivePanelTab]=useState<'layers'|'references'|'tasks'>(()=>new URL(location.href).searchParams.has('room')?'references':'layers');
  const [panelOpen,setPanelOpen]=useState(()=>window.innerWidth>1000 || new URL(location.href).searchParams.has('room'));
  const [panelWidth,setPanelWidth]=useState(320);
  const [isHelpOpen,setIsHelpOpen]=useState(false);
  const [draft,setDraft]=useState<ReferenceDraft|null>(null),[draftNote,setDraftNote]=useState('');
  const [draftPopoverOpen,setDraftPopoverOpen]=useState(false);
  const [draftIntent,setDraftIntent]=useState<ReferenceIntent>('Review');
  const [activeSharedId,setActiveSharedId]=useState<string|null>(null);
  const [dismissedAttention,setDismissedAttention]=useState<string[]>(()=>{try{return new URLSearchParams(location.search).get('mode')!=='realtime'&&!new URLSearchParams(location.search).has('room')?JSON.parse(localStorage.getItem('sr-demo-dismissed')||'[]'):[];}catch{return [];}});
  const [conversationOpen,setConversationOpen]=useState(false);
  const [referenceOpenRevision,setReferenceOpenRevision]=useState(0);
  const [highlightedId,setHighlightedId]=useState<string|null>(null);
  const c=useCollaboration(),canvasHost=useRef<HTMLDivElement>(null);
  const research=useResearch(c.room,c.session,c.mode);
  const cancelForSelection=useCallback(()=>{setDraft(null);setDraftNote('');setDraftPopoverOpen(false);setConversationOpen(false);setHighlightedId(null);},[]);
  const updateSelection=useCallback((ref:InferredReference|null)=>{cancelForSelection();setInferredRef(ref);research.recordSelection(ref);},[research.recordSelection,cancelForSelection]);
  const zoomAtCenter=(factor:number)=>{const r=canvasHost.current?.getBoundingClientRect();if(r)setTransform(p=>zoomAtPoint(p,factor,r.width/2,r.height/2));};
  const handleZoomFit=useCallback(()=>{const r=canvasHost.current?.getBoundingClientRect();if(r)setTransform(fitWorkspace(r.width,r.height));},[]);
  const demoViews=useRef<Record<string,{camera:typeof transform;selection:InferredReference|null}>>({});
  useEffect(()=>{if(c.mode==='demo')try{demoViews.current=JSON.parse(localStorage.getItem('sr-demo-views')||'{}');const saved=demoViews.current[c.session?.userId||'A'];if(saved){setTransform(saved.camera);setInferredRef(saved.selection);setSelectionState(saved.selection?'preview':'idle');return;}}catch{}handleZoomFit();},[handleZoomFit]);
  useEffect(()=>{if(c.mode!=='demo'||!c.session)return;demoViews.current[c.session.userId]={camera:transform,selection:inferredRef};try{localStorage.setItem('sr-demo-views',JSON.stringify(demoViews.current));localStorage.setItem('sr-demo-dismissed',JSON.stringify(dismissedAttention));}catch{}},[transform,inferredRef,dismissedAttention,c.mode,c.session?.userId]);
  const switchPerspective=(user:'A'|'B')=>{if(c.mode!=='demo'||user===c.session?.userId)return;cancelForSelection();const saved=demoViews.current[user];setTransform(saved?.camera||{x:30,y:10,scale:.46});setInferredRef(saved?.selection||null);setSelectionState(saved?.selection?'preview':'idle');setActiveSharedId(null);c.setPerspective?.(user);};
  const shareSelection=useCallback((note='',intent?:ReferenceIntent)=>{
    if(!inferredRef?.selectedIds.length)return;
    const ids=inferredRef.selectedIds.filter(id=>nodes.some(n=>n.id===id&&n.type!=='screen'));
    if(!ids.length)return;
    setDraft({elementIds:[...ids],exemplarIds:inferredRef.exemplarIds.filter(id=>ids.includes(id)),scope:inferredRef.scope,label:inferredRef.label,...(research.attempt&&!research.attempt.completedAt&&research.attempt.level>=4&&c.session?.userId==='A'?{research:{level:research.attempt.level as 4|5,attemptId:research.attempt.id}}:{})});
    setConversationOpen(false);
    setDraftIntent(intent??(research.attempt?.level===5?'Compare':'Review'));
    setDraftNote(note);setDraftPopoverOpen(true);
  },[inferredRef,research.attempt,c.session?.userId]);
  const selectNode=(id:string)=>{const node=nodes.find(n=>n.id===id);if(!node)return;updateSelection({selectedIds:[id],exemplarIds:[id],label:node.label,matchingRole:node.role,matchingComponent:node.component,scope:'exemplars',selectionMethod:'conventional'});setSelectionState('preview');};
  const openSection=(tab:typeof activePanelTab)=>{setPanelOpen(open=>tab===activePanelTab?!open:true);setActivePanelTab(tab);};
  const resizePanel=(e:React.PointerEvent<HTMLDivElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);const start=e.clientX,width=panelWidth;e.currentTarget.onpointermove=event=>setPanelWidth(Math.max(280,Math.min(420,width+event.clientX-start)));const finish=()=>{e.currentTarget.onpointermove=null;};e.currentTarget.onpointerup=finish;e.currentTarget.onpointercancel=finish;};
  const openShared=(id:string)=>{setDraftPopoverOpen(false);setReferenceOpenRevision(v=>v+1);if(!c.room?.references.find(r=>r.id===id)?.archivedAt)void c.activity(id,'opened');setActiveSharedId(id);setHighlightedId(id);setConversationOpen(true);};
  const locate=(ref:SharedReference)=>{if(ref.archivedAt)return false;const box=getBoundingBox(ref.elementIds,nodes),r=canvasHost.current?.getBoundingClientRect();if(box&&r){setTransform(fitBounds(box,r.width,r.height));void c.activity(ref.id,'located',ref.elementIds);}setHighlightedId(ref.id);return !!(box&&r);};
  const otherUser=c.session?.userId==='A'?'B':'A';
  const localSelectionSynced=!!(c.session&&inferredRef&&c.selections[c.session.userId]?.elementIds.length===inferredRef.selectedIds.length&&inferredRef.selectedIds.every(id=>c.selections[c.session!.userId]?.elementIds.includes(id)));
  const compareReady=!!(c.connected&&localSelectionSynced&&c.room?.members.some(m=>m.userId===otherUser&&m.online)&&c.selections[otherUser]?.elementIds.length&&inferredRef?.selectedIds.length&&c.session&&c.selections[c.session.userId]?.elementIds.length);
  const compareHint=!c.connected?'Connect to a room to compare':!c.room?.members.some(m=>m.userId===otherUser&&m.online)?`User ${otherUser} is offline`:!c.selections[otherUser]?.elementIds.length?`User ${otherUser} has no selection`:'Compare both users’ current selections';
  const compareSelections=async()=>{
    const context=await c.comparisonDraft();if(!context)return;
    research.record(draft?.comparison?'comparison_refreshed':'comparison_established',{ids:[...new Set([...context.selections.A.elementIds,...context.selections.B.elementIds])],method:'two-user-selection',step:true});
    const ids=[...new Set([...context.selections.A.elementIds,...context.selections.B.elementIds])];
    const exemplars=[...new Set([...context.selections.A.exemplarIds,...context.selections.B.exemplarIds])];
    setDraft(current=>({elementIds:ids,exemplarIds:exemplars,scope:'document',label:'Comparison of User A and User B selections',comparison:{...context,purpose:current?.comparison?.purpose||'Compare selected elements',...(current?.comparison?.designReference?{designReference:current.comparison.designReference}:{})},...(current?.comparison?current.research?{research:current.research}:{}:research.attempt&&!research.attempt.completedAt&&research.attempt.level>=4&&c.session?.userId==='A'?{research:{level:research.attempt.level as 4|5,attemptId:research.attempt.id}}:{})}));
    if(!draft?.comparison)setDraftNote('');
    setDraftIntent('Compare');setConversationOpen(false);setDraftPopoverOpen(true);
  };
  const [inspectorHost,setInspectorHost]=useState<HTMLDivElement|null>(null);
  const activeConversation=c.room?.references.find(r=>r.id===activeSharedId);
  const draftInInspector=!!draft&&(draftIntent==='Compare'||!!draft.comparison);
  const conversationInInspector=activeConversation?.intent==='Compare';
  const inspectorOpen=!!(draftInInspector&&draftPopoverOpen||conversationInInspector&&conversationOpen);
  const comparisonChanged=!!draft?.comparison&&(['A','B'] as const).some(id=>c.selections[id]?.revision!==draft.comparison!.selections[id].revision);
  const shareLabel=shareActionLabel(c.session?.userId);
  const attention=nextAttention(c.room?.references||[],c.session?.userId,dismissedAttention);
  const mentionNotification=c.room?.references.filter(r=>(c.mode==='demo'?r.targetUser===c.session?.userId&&!r.archivedAt&&!r.activity?.some(e=>e.userId===c.session?.userId&&e.kind==='opened'):unreadMention(r,c.session?.userId))&&!dismissedAttention.includes(`mention:${r.id}`)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
  const pending=c.room?.references.filter(r=>needsReferenceNotification(r,c.session?.userId)).length||0;
  return <div className="app-shell flex flex-col h-dvh w-full overflow-hidden text-zinc-800 bg-white font-sans">
    <TopBar onPerspective={switchPerspective} mode={c.mode} scale={transform.scale} onZoomIn={()=>zoomAtCenter(1.2)} onZoomOut={()=>zoomAtCenter(1/1.2)} onZoomFit={handleZoomFit} onShowHelp={()=>setIsHelpOpen(true)} session={c.session} room={c.room} connected={c.connected} onOpenRoom={()=>{setActivePanelTab('references');setPanelOpen(true);}}/>
    <div className="flex flex-1 min-h-0 overflow-hidden relative">
      <nav aria-label="Workspace sections" className="navigation-rail"><div className="flex flex-col gap-2">{([{id:'layers',label:'Layers',icon:Layers},{id:'references',label:'References',icon:Share2},{id:'tasks',label:'Tasks',icon:ClipboardList}] as const).map(item=><button key={item.id} title={item.label} aria-label={item.label} aria-pressed={panelOpen&&activePanelTab===item.id} className={`rail-button ${panelOpen&&activePanelTab===item.id?'active':''}`} onClick={()=>openSection(item.id)}><item.icon size={20}/><span>{item.label}</span>{item.id==='references'&&pending>0&&<span className="rail-badge" aria-label={`${pending} reference notifications`}>{pending}</span>}</button>)}</div></nav>
      <main className="workspace flex flex-col flex-1 min-w-0 relative overflow-hidden" aria-label="Design canvas">
        <div ref={canvasHost} className="canvas-surface relative flex-1 min-h-0"><CollaboratorSelection selection={inferredRef} nodes={nodes} camera={transform} collaboration={c}/><CollaboratorCursors camera={transform} collaboration={c}/><Canvas onMove={next=>setPositions(previous=>({...previous,...next}))} onSelectionStart={cancelForSelection} onCompare={()=>void compareSelections()} compareReady={compareReady} compareHint={compareHint} shareLabel={shareLabel} sharing={(!!draft&&draftPopoverOpen)||conversationOpen} toolMode={toolMode} setToolMode={setToolMode} selectionState={selectionState} setSelectionState={setSelectionState} inferredRef={inferredRef} setInferredRef={updateSelection} onResearchEvent={type=>{if(type==='gesture_attempt')cancelForSelection();research.record(type);}} onAcceptReference={intent=>shareSelection(intent==='Look at this'?'Please look at these selected elements.':'',intent)} nodes={nodes} transform={transform} setTransform={setTransform} sharedReferences={c.room?.references||[]} activeSharedId={highlightedId} onOpenShared={openShared}/>{draft&&<SharePopover inspector={draftInInspector} inspectorHost={inspectorHost} comparisonChanged={comparisonChanged} onRefreshComparison={()=>void compareSelections()} onDesignReference={designReference=>setDraft(current=>current?.comparison?{...current,comparison:{...current.comparison,designReference}}:current)} onComparisonPurpose={purpose=>setDraft(current=>current?.comparison?{...current,comparison:{...current.comparison,purpose,designReference:purpose===DESIGN_REFERENCE_PURPOSE?(current.comparison.designReference||{direction:{referenceUser:'A',targetUser:'B'},properties:[]}):undefined}}:current)} draft={draft} nodes={nodes} camera={transform} collaboration={c} visible={draftPopoverOpen} onVisible={setDraftPopoverOpen} note={draftNote} intent={draftIntent} onNote={setDraftNote} onIntent={setDraftIntent} onCancel={()=>{setDraft(null);setDraftPopoverOpen(false);}} onShared={id=>{setDraft(null);setDraftPopoverOpen(false);setActiveSharedId(id);setHighlightedId(id);}} onRoom={()=>{setDraftPopoverOpen(false);setActivePanelTab('references');setPanelOpen(true);}} onLocate={()=>{const box=getBoundingBox(draft.elementIds,nodes),r=canvasHost.current?.getBoundingClientRect();if(box&&r)setTransform(fitBounds(box,r.width,r.height));}}/>}{conversationOpen&&!conversationInInspector&&c.room?.references.find(r=>r.id===activeSharedId)&&<ReferenceConversationPopover reference={c.room.references.find(r=>r.id===activeSharedId)!} nodes={nodes} camera={transform} collaboration={c} onClose={()=>setConversationOpen(false)} onLocate={locate} onClear={()=>{setHighlightedId(null);setConversationOpen(false);}}/>}</div>
        {attention&&!conversationOpen&&!draftPopoverOpen&&<div className="attention-notice" role="status"><span className={`user-${attention.sourceUser}`}><strong>User {attention.sourceUser} wants you to look here</strong></span><button type="button" disabled={!c.connected} onClick={()=>{openShared(attention.reference.id);if(locate(attention.reference)&&attention.invitation)void c.viewAttention(attention.reference.id,attention.invitation.id);}}>{c.mode==='demo'?'View reference':'View'}</button><button type="button" onClick={()=>setDismissedAttention(ids=>[...ids,attention.key,...(c.mode==='demo'?[`mention:${attention.reference.id}`]:[])])}>Later</button></div>}
        {!attention&&mentionNotification&&!conversationOpen&&!draftPopoverOpen&&<div className="attention-notice" role="status"><span className={`user-${mentionNotification.sourceUser}`}><strong>User {mentionNotification.sourceUser} {c.mode==='demo'?'shared a reference':'mentioned you'}</strong></span><button type="button" disabled={!c.connected} onClick={()=>{openShared(mentionNotification.id);if(c.mode==='demo')locate(mentionNotification);}}>{c.mode==='demo'?'View reference':'Open reference'}</button><button type="button" onClick={()=>setDismissedAttention(ids=>[...ids,`mention:${mentionNotification.id}`])}>Later</button></div>}
        <div className="workspace-dock"><div className="floating-toolbar" role="toolbar" aria-label="Canvas tools">{([{mode:'pointer',name:'Select',key:'V',icon:MousePointer2},{mode:'reference',name:'Rough Reference',key:'R',icon:Sparkles},{mode:'pan',name:'Hand',key:'H',icon:Hand}] as const).map(tool=><button key={tool.mode} title={`${tool.name} (${tool.key})`} aria-pressed={toolMode===tool.mode} onClick={()=>setToolMode(tool.mode)}><tool.icon size={18}/><span>{tool.name}</span><kbd>{tool.key}</kbd></button>)}</div><PromptBar shareLabel={shareLabel} count={inferredRef?.selectedIds.length||0} onShare={shareSelection}/></div>
      </main>
      <aside className={`right-sidebar research-sidebar ${panelOpen?'':'panel-hidden'}`} style={{width:panelOpen?panelWidth:0}} aria-label="Workspace panel" inert={!panelOpen}>
        <div className="panel-heading"><span>{activePanelTab==='references'?'Shared References':activePanelTab==='layers'?'Layers':activePanelTab==='tasks'?'Research Tasks':'Selection'}</span><button title="Close panel" aria-label="Close panel" onClick={()=>setPanelOpen(false)}><PanelLeftClose size={16}/></button></div>
        <div className="flex-1 min-h-0" hidden={activePanelTab!=='layers'}><LayersPanel nodes={nodes} inferredRef={inferredRef} onSelectNode={selectNode}/></div>
        <div className="flex-1 min-h-0" hidden={activePanelTab!=='references'}><CollaborationPanel nodes={nodes} collaboration={c} hasDraft={!!draft} onResumeDraft={()=>{setConversationOpen(false);setDraftPopoverOpen(true);}} activeId={activeSharedId} openRevision={referenceOpenRevision} onOpen={openShared} onLocate={locate} onClear={()=>{setHighlightedId(null);setConversationOpen(false);}}/></div>
        <div className="flex-1 min-h-0" hidden={activePanelTab!=='tasks'}><ResearchPanel research={research} room={c.room} session={c.session} connected={c.connected} selection={inferredRef} onStart={()=>{research.start();setDraft(null);setInferredRef(null);setSelectionState('idle');}} onShare={()=>shareSelection(research.log.level===5?'Compare these related CTA components for design and wording consistency.':'Please review design consistency across these related elements.')} onRoom={()=>{setActivePanelTab('references');setPanelOpen(true);}} onLocateTargets={ids=>{const box=getBoundingBox(ids,nodes),r=canvasHost.current?.getBoundingClientRect();if(box&&r)setTransform(fitBounds(box,r.width,r.height));}}/></div>
        <div role="separator" aria-label="Resize workspace panel" aria-orientation="vertical" aria-valuenow={panelWidth} aria-valuemin={280} aria-valuemax={420} tabIndex={0} className="panel-resizer" onPointerDown={resizePanel} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();setPanelWidth(v=>Math.max(280,Math.min(420,v+(e.key==='ArrowRight'?10:-10))));}}}/>
      </aside>
      <ComparisonInspector count={draftInInspector?draft?.elementIds.length:activeConversation?.elementIds.length} open={inspectorOpen} contentRef={setInspectorHost} onClose={()=>{setDraftPopoverOpen(false);setConversationOpen(false);}}>{conversationOpen&&conversationInInspector&&activeConversation&&<div className="inspector-conversation collab-panel" role="region" aria-label="Comparison conversation" tabIndex={0}><ReferenceConversation key={activeConversation.id} active={activeConversation} nodes={nodes} collaboration={c} onLocate={locate} onClear={()=>{setHighlightedId(null);setConversationOpen(false);}}/>{c.error&&<p role="alert">{c.error}</p>}</div>}</ComparisonInspector>
    </div><HelpModal isOpen={isHelpOpen} onClose={()=>setIsHelpOpen(false)}/>
  </div>;
}
