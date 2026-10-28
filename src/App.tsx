import {collaboratorReferenceIds} from './comparisonSides';
import SelectionSharing from './components/SelectionSharing';
import SelectionDetails from './components/SelectionDetails';
import {inspectorTargets} from './inspectorEditing';
import {comparisonSides,sideDirection,referenceSides,localComparison} from './comparisonSides';
import {useDocument} from './useDocument';
import EditingToolbar from './components/EditingToolbar';
import {EditProposal,Patch} from './editing';
import type {Positions} from './toolInteraction';
import ComparisonInspector from './components/ComparisonInspector';
import ReferenceConversation from './components/ReferenceConversation';
import {needsReferenceNotification} from './mentions';
import {nextAttention,NUDGE_DISMISSALS_KEY,nudgeScope,parseNudgeDismissals,dismissedReferenceKeys} from './referenceAttention';
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
  const document=useDocument();
  const nodes=document.visibleNodes;
  const [sourceId,setSourceId]=useState<string|null>(null),[pickingSource,setPickingSource]=useState(false),[editStage,setEditStage]=useState('Reference Confirmed');
  const pickSource=(id:string)=>{if(nodes.find(n=>n.id===id)?.type==='screen')return;setSourceId(id);setPickingSource(false);research.record('style_source_chosen',{ids:[id],step:true});};
  const [toolMode,setToolMode]=useState<ToolMode>('pointer');
  const [selectionState,setSelectionState]=useState<SelectionState>('idle');
  const [inspectorMode,setInspectorMode]=useState<'edit'|'compare'>('edit');
  const [selectionIntent,setSelectionIntent]=useState<ReferenceIntent>('Review');
  const [selectionInspectorOpen,setSelectionInspectorOpen]=useState(false);
  const [selectionFooterHost,setSelectionFooterHost]=useState<HTMLDivElement|null>(null);
  const [choosingSecond,setChoosingSecond]=useState<string[]|null>(null);
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
  const [dismissedByUser,setDismissedByUser]=useState<Record<string,string[]>>(()=>{try{
   const saved=parseNudgeDismissals(localStorage.getItem(NUDGE_DISMISSALS_KEY));
   // Carry forward old demo dismissals once, scoped to the perspective that saved them.
   const user=localStorage.getItem('sr-demo-perspective')==='B'?'B':'A',scope=nudgeScope('demo','demo',user);
   if(!saved[scope]){const legacy=JSON.parse(localStorage.getItem('sr-demo-dismissed')||'[]');if(Array.isArray(legacy)&&legacy.every(id=>typeof id==='string'))saved[scope]=legacy;}
   return saved;
  }catch{return {};}});
  const [conversationOpen,setConversationOpen]=useState(false);
  const [referenceOpenRevision,setReferenceOpenRevision]=useState(0);
  const [highlightedId,setHighlightedId]=useState<string|null>(null);
  const c=useCollaboration(),canvasHost=useRef<HTMLDivElement>(null);
  const research=useResearch(c.room,c.session,c.mode,document.nodes);
  const dismissalIdentity=c.session?nudgeScope(c.mode,c.session.code,c.session.userId):'';
  const dismissedAttention=dismissedByUser[dismissalIdentity]||[];
  useEffect(()=>{const sync=(event:StorageEvent)=>{if(event.key===NUDGE_DISMISSALS_KEY)setDismissedByUser(parseNudgeDismissals(event.newValue));};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
  const dismissReferenceBanner=(ref:SharedReference)=>{
   let stored=dismissedByUser;try{stored={...stored,...parseNudgeDismissals(localStorage.getItem(NUDGE_DISMISSALS_KEY))};}catch{}
   const next={...stored,[dismissalIdentity]:[...new Set([...(stored[dismissalIdentity]||[]),...dismissedReferenceKeys(ref,c.session?.userId)])]};
   try{localStorage.setItem(NUDGE_DISMISSALS_KEY,JSON.stringify(next));}catch{}
   setDismissedByUser(next);
  };

  const cancelForSelection=useCallback(()=>{setInspectorMode('edit');setSelectionInspectorOpen(false);setReviewTokens(false);document.setPreview([]);setPickingSource(false);setSourceId(null);setDraft(null);setDraftNote('');setDraftPopoverOpen(false);setConversationOpen(false);setHighlightedId(null);},[]);
  const updateSelection=useCallback((ref:InferredReference|null)=>{cancelForSelection();setEditStage('Reference Confirmed');setInferredRef(ref);research.recordSelection(ref);},[research.recordSelection,cancelForSelection]);
  useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(!(event.metaKey||event.ctrlKey)||event.key.toLowerCase()!=='z'||(event.target as HTMLElement).closest('input,textarea,[contenteditable=true]'))return;event.preventDefault();if(event.shiftKey){document.redo();research.record('redo',{step:true});}else{document.undo();research.record('undo',{step:true});}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[document.undo,document.redo,research.record]);
  const zoomAtCenter=(factor:number)=>{const r=canvasHost.current?.getBoundingClientRect();if(r)setTransform(p=>zoomAtPoint(p,factor,r.width/2,r.height/2));};
  const handleZoomFit=useCallback(()=>{const r=canvasHost.current?.getBoundingClientRect();if(r)setTransform(fitWorkspace(r.width,r.height));},[]);
  const demoViews=useRef<Record<string,{camera:typeof transform;selection:InferredReference|null}>>({});
  useEffect(()=>{if(c.mode==='demo')try{demoViews.current=JSON.parse(localStorage.getItem('sr-demo-views')||'{}');const saved=demoViews.current[c.session?.userId||'A'];if(saved){setTransform(saved.camera);setInferredRef(saved.selection);setSelectionInspectorOpen(false);setSelectionState(saved.selection?'preview':'idle');return;}}catch{}handleZoomFit();},[handleZoomFit]);
  useEffect(()=>{if(c.mode!=='demo'||!c.session)return;demoViews.current[c.session.userId]={camera:transform,selection:inferredRef};try{localStorage.setItem('sr-demo-views',JSON.stringify(demoViews.current));}catch{}},[transform,inferredRef,c.mode,c.session?.userId]);
  const switchPerspective=(user:'A'|'B')=>{if(c.mode!=='demo'||user===c.session?.userId)return;cancelForSelection();const saved=demoViews.current[user];setTransform(saved?.camera||{x:30,y:10,scale:.46});setInferredRef(saved?.selection||null);setSelectionInspectorOpen(false);setSelectionState(saved?.selection?'preview':'idle');setActiveSharedId(null);c.setPerspective?.(user);};
  const shareSelection=useCallback((note='',intent?:ReferenceIntent)=>{
    if(!inferredRef?.selectedIds.length)return;
    const ids=inferredRef.selectedIds.filter(id=>nodes.some(n=>n.id===id&&n.type!=='screen'));
    if(!ids.length)return;
    setDraft({elementIds:[...ids],exemplarIds:inferredRef.exemplarIds.filter(id=>ids.includes(id)),scope:inferredRef.scope,label:inferredRef.label,...(research.attempt&&!research.attempt.completedAt&&research.attempt.level>=4&&c.session?.userId==='A'?{research:{level:research.attempt.level as 4|5,attemptId:research.attempt.id}}:{})});
    setConversationOpen(false);
    setSelectionInspectorOpen(false);setDraftIntent(intent??(research.attempt?.level===5?'Compare':'Review'));
    setDraftNote(note);setDraftPopoverOpen(true);
  },[inferredRef,research.attempt,c.session?.userId]);
  const selectNode=(id:string,shift=false)=>{if(pickingSource){pickSource(id);return;}const node=nodes.find(n=>n.id===id);if(!node)return;const ids=shift?(inferredRef?.selectedIds.includes(id)?inferredRef.selectedIds.filter(n=>n!==id):[...(inferredRef?.selectedIds||[]),id]):[id];if(!ids.length){updateSelection(null);setSelectionState('idle');return;}updateSelection({selectedIds:ids,exemplarIds:ids,label:ids.length===1?node.label:`${ids.length} layers selected`,matchingRole:node.role,matchingComponent:node.component,scope:'exemplars',selectionMethod:'conventional'});setSelectionState('preview');};
  const openSection=(tab:typeof activePanelTab)=>{setPanelOpen(open=>tab===activePanelTab?!open:true);setActivePanelTab(tab);};
  const resizePanel=(e:React.PointerEvent<HTMLDivElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);const start=e.clientX,width=panelWidth;e.currentTarget.onpointermove=event=>setPanelWidth(Math.max(280,Math.min(420,width+event.clientX-start)));const finish=()=>{e.currentTarget.onpointermove=null;};e.currentTarget.onpointerup=finish;e.currentTarget.onpointercancel=finish;};
  const openShared=(id:string)=>{setSelectionInspectorOpen(false);setDraftPopoverOpen(false);setReferenceOpenRevision(v=>v+1);const ref=c.room?.references.find(r=>r.id===id);if(ref&&!ref.archivedAt){void c.activity(id,'opened');for(const invitation of ref.attention||[])if(invitation.targetUser===c.session?.userId&&!invitation.viewedAt)void c.viewAttention(ref.id,invitation.id);}setActiveSharedId(id);setHighlightedId(id);setConversationOpen(true);};
  const locate=(ref:SharedReference)=>{if(ref.archivedAt)return false;const box=getBoundingBox(ref.elementIds,nodes),r=canvasHost.current?.getBoundingClientRect();if(box&&r){setTransform(fitBounds(box,r.width,r.height));void c.activity(ref.id,'located',ref.elementIds);}setHighlightedId(ref.id);return !!(box&&r);};
  const viewSharedRequest=(ref:SharedReference)=>{openShared(ref.id);requestAnimationFrame(()=>locate(ref));};
  const otherUser=c.session?.userId==='A'?'B':'A';
  const localSelectionSynced=!!(c.session&&inferredRef&&c.selections[c.session.userId]?.elementIds.length===inferredRef.selectedIds.length&&inferredRef.selectedIds.every(id=>c.selections[c.session!.userId]?.elementIds.includes(id)));
  const peerCompareReady=!!(c.connected&&localSelectionSynced&&c.room?.members.some(m=>m.userId===otherUser&&m.online)&&c.selections[otherUser]?.elementIds.length);
  const localCompareReady=!!inferredRef?.selectedIds.length&&(inferredRef.selectedIds.length===2||!peerCompareReady);
  const compareReady=localCompareReady||!!(c.connected&&localSelectionSynced&&c.room?.members.some(m=>m.userId===otherUser&&m.online)&&c.selections[otherUser]?.elementIds.length&&inferredRef?.selectedIds.length&&c.session&&c.selections[c.session.userId]?.elementIds.length);
  const compareHint=!c.connected?'Connect to a room to compare':!c.room?.members.some(m=>m.userId===otherUser&&m.online)?`User ${otherUser} is offline`:!c.selections[otherUser]?.elementIds.length?`User ${otherUser} has no selection`:'Compare both users’ current selections';
  const compareSelections=async(chosen?:InferredReference,refresh=false)=>{
    document.setPreview([]);setPickingSource(false);
    if(!chosen&&!refresh&&draft?.comparison&&!comparisonChanged){setInspectorMode('compare');setSelectionInspectorOpen(false);setDraftPopoverOpen(true);setConversationOpen(false);return;}
    const own=!!chosen||localCompareReady,chosenIds=chosen?.selectedIds||inferredRef?.selectedIds||[];
    const context=!chosen&&chosenIds.length===1&&!peerCompareReady&&referenceForComparison?await c.comparisonDraft([...chosenIds],referenceForComparison.id):own&&!c.connected?localComparison(c.session?.userId||'A',[...chosenIds],crypto.randomUUID(),document.nodes):await c.comparisonDraft(own?[...chosenIds]:undefined);if(!context)return;
    if(!context.sides)research.record(draft?.comparison?'comparison_refreshed':'comparison_established',{ids:[...new Set([...context.selections.A.elementIds,...context.selections.B.elementIds])],method:'two-user-selection',step:true});
    const ids=[...new Set([...context.selections.A.elementIds,...context.selections.B.elementIds])];
    const exemplars=[...new Set([...context.selections.A.exemplarIds,...context.selections.B.exemplarIds])];
    setDraft(current=>{
      const evidence=!context.sides?(current?.research||(research.attempt&&!research.attempt.completedAt&&research.attempt.level>=4&&c.session?.userId==='A'?{level:research.attempt.level as 4|5,attemptId:research.attempt.id}:undefined)):undefined;
      return {elementIds:ids,exemplarIds:exemplars,scope:'document',label:context.sides?'Comparison of selected objects':'Comparison of User A and User B selections',comparison:{...context,purpose:current?.comparison?.purpose||'Compare differences',...(current?.comparison?.designReference?{designReference:{direction:sideDirection(context),properties:current.comparison.designReference.properties}}:{})},...(evidence?{research:evidence}:{})};
    });
    setInspectorMode('compare');setSelectionInspectorOpen(false);setDraftIntent('Compare');setConversationOpen(false);setDraftPopoverOpen(true);
  };
  const [inspectorHost,setInspectorHost]=useState<HTMLDivElement|null>(null);
  const [revealSharing,setRevealSharing]=useState(false);
  const activeConversation=c.room?.references.find(r=>r.id===activeSharedId);
  const draftInInspector=!!draft?.comparison;
  const conversationInInspector=activeConversation?.intent==='Compare';
  const selectionMode=inspectorMode==='edit'&&!(conversationInInspector&&conversationOpen);
  const activeCompareDraft=!selectionMode&&draftInInspector;
  const compareInspectorOpen=!!(activeCompareDraft&&draftPopoverOpen||conversationInInspector&&conversationOpen);
  const referenceForComparison=c.room?.references.find(reference=>reference.id===activeSharedId&&collaboratorReferenceIds(reference,c.session?.userId||'A',document.nodes).length>0);
  const compareModeAvailable=!!inferredRef&&(inferredRef.selectedIds.length>=2||peerCompareReady||!!referenceForComparison);
  const changeInspectorMode=(mode:'edit'|'compare')=>{if(mode==='compare'){if(compareModeAvailable)void compareSelections();}else{document.setPreview([]);setPickingSource(false);setInspectorMode('edit');setSelectionInspectorOpen(true);setDraftPopoverOpen(false);setConversationOpen(false);}};
  const inspectorOpen=compareInspectorOpen||!!(selectionInspectorOpen&&inferredRef&&!draftPopoverOpen&&!conversationOpen);
  useEffect(()=>{if(!choosingSecond||!inferredRef)return;const additions=inferredRef.selectedIds.filter(id=>!choosingSecond.includes(id));if(!additions.length)return;const ids=[...new Set([...choosingSecond,...additions])],selection={...inferredRef,selectedIds:ids,exemplarIds:ids};setChoosingSecond(null);updateSelection(selection);void compareSelections(selection);},[inferredRef,choosingSecond]);
  const editingIds=activeCompareDraft&&draft?inspectorTargets(draft.comparison,draft.elementIds):inferredRef?.selectedIds||[];
  const editingSelection:InferredReference|null=activeCompareDraft&&draft?{selectedIds:editingIds,exemplarIds:editingIds,label:draft.label,scope:draft.scope,selectionMethod:inferredRef?.selectionMethod||'conventional'}:inferredRef;
  const [reviewTokens,setReviewTokens]=useState(false);
  const inspectorEditor=editingSelection&&<EditingToolbar selectionInspector={selectionMode} reviewTokens={reviewTokens} onTokenChanges={tokenSuggestions=>setDraft(current=>activeCompareDraft&&current?.comparison?{...current,comparison:{...current.comparison,tokenSuggestions}}:current)} inline context={activeCompareDraft?draft?.comparison:undefined} onEvent={type=>research.record(type,{step:true})} selection={editingSelection} nodes={document.nodes} onPreview={document.setPreview} onApply={(proposal,patches)=>{document.commit(patches,proposal.targetIds);setDraft(current=>current?.comparison?{...current,comparison:{...current.comparison,tokenSuggestions:undefined,...(current.comparison.designReference?{designReference:{...current.comparison.designReference,proposedChanges:undefined}}:{})}}:current);research.record('action_applied',{ids:[...proposal.targetIds],method:editingSelection.selectionMethod,step:true,action:proposal.title});}} onUndo={()=>{document.undo();research.record('undo',{step:true});}} onRedo={()=>{document.redo();research.record('redo',{step:true});}} canUndo={document.canUndo} canRedo={document.canRedo} sourceId={sourceId||(activeCompareDraft&&draft?.comparison?.purpose===DESIGN_REFERENCE_PURPOSE?referenceSides(draft.comparison).reference.elementIds[0]||null:null)} onSource={id=>{setSourceId(id);if(id)research.record('style_source_chosen',{ids:[id],step:true});}} picking={pickingSource} onPicking={setPickingSource} onState={setEditStage}/>;
  useEffect(()=>{if(revealSharing&&inspectorOpen&&inspectorHost){inspectorHost.querySelector('.selection-inspector-sharing')?.scrollIntoView({block:'start'});setRevealSharing(false);}},[revealSharing,inspectorOpen,inspectorHost]);
  useEffect(()=>{if(!inspectorOpen){document.setPreview([]);setPickingSource(false);}},[inspectorOpen]);
  const comparisonChanged=!!draft?.comparison&&(draft.comparison.sides?JSON.stringify(inferredRef?.selectedIds||[])!==JSON.stringify([...new Set(Object.values(comparisonSides(draft.comparison)).filter(side=>side.selectedBy===(c.session?.userId||'A')).flatMap(side=>side.elementIds))]):(['A','B'] as const).some(id=>c.selections[id]?.revision!==draft.comparison!.selections[id].revision));
  const shareLabel=shareActionLabel(c.session?.userId);
  const attention=nextAttention(c.room?.references||[],c.session?.userId,dismissedAttention);
  const mentionNotification=c.room?.references.filter(r=>needsReferenceNotification(r,c.session?.userId)&&!dismissedAttention.includes(`mention:${r.id}`)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
  const pending=c.room?.references.filter(r=>needsReferenceNotification(r,c.session?.userId)).length||0;
  return <div className="app-shell flex flex-col h-dvh w-full overflow-hidden text-zinc-800 bg-white font-sans">
    <TopBar onPerspective={switchPerspective} mode={c.mode} scale={transform.scale} onZoomIn={()=>zoomAtCenter(1.2)} onZoomOut={()=>zoomAtCenter(1/1.2)} onZoomFit={handleZoomFit} onShowHelp={()=>setIsHelpOpen(true)} session={c.session} room={c.room} connected={c.connected} onOpenRoom={()=>{setActivePanelTab('references');setPanelOpen(true);}}/>
    <div className="flex flex-1 min-h-0 overflow-hidden relative">
      <nav aria-label="Workspace sections" className="navigation-rail"><div className="flex flex-col gap-2">{([{id:'layers',label:'Layers',icon:Layers},{id:'references',label:'References',icon:Share2},{id:'tasks',label:'Tasks',icon:ClipboardList}] as const).map(item=><button key={item.id} title={item.label} aria-label={item.label} aria-pressed={panelOpen&&activePanelTab===item.id} className={`rail-button ${panelOpen&&activePanelTab===item.id?'active':''}`} onClick={()=>openSection(item.id)}><item.icon size={20}/><span>{item.label}</span>{item.id==='references'&&pending>0&&<span className="rail-badge" aria-label={`${pending} unread reference ${pending===1?'request':'requests'}`}>{pending}</span>}</button>)}</div></nav>
      <main className="workspace flex flex-col flex-1 min-w-0 relative overflow-hidden" aria-label="Design canvas">
        <div ref={canvasHost} className="canvas-surface relative flex-1 min-h-0"><CollaboratorSelection selection={inferredRef} nodes={nodes} camera={transform} collaboration={c}/><CollaboratorCursors camera={transform} collaboration={c}/><Canvas pickingSource={pickingSource} sourceId={sourceId} onPickSource={pickSource} onMoveEnd={()=>document.finishMove()} onMove={document.move} onInterpretationConfirmed={()=>changeInspectorMode('edit')} onSelectionStart={cancelForSelection} onCompare={()=>{setChoosingSecond(null);setReviewTokens(false);void compareSelections();}} compareOwn={localCompareReady} compareReady={compareModeAvailable} compareHint={compareHint} shareLabel={shareLabel} inspectorOpen={inspectorOpen} sharing={(!!draft&&draftPopoverOpen)||conversationOpen} toolMode={toolMode} setToolMode={setToolMode} selectionState={selectionState} setSelectionState={setSelectionState} inferredRef={inferredRef} setInferredRef={updateSelection} onResearchEvent={type=>{if(type==='gesture_attempt')cancelForSelection();research.record(type);}} onAcceptReference={intent=>{setSelectionIntent(intent||'Review');changeInspectorMode('edit');setRevealSharing(true);}} nodes={nodes} transform={transform} setTransform={setTransform} sharedReferences={c.room?.references||[]} activeSharedId={highlightedId} onOpenShared={openShared}/>{choosingSecond&&<div className="second-object-prompt">Select another object to compare.<button type="button" onClick={()=>setChoosingSecond(null)}>Cancel</button></div>}<div className="interaction-status" role="status">{pickingSource?'Choosing style source':selectionState==='drawing'?'Gesturing':selectionState==='interpreting'?'AI Interpreting':selectionState==='disambiguating'?'Reviewing Interpretations':inferredRef?editStage:'Idle · Select (V) or Rough Reference (R)'}{document.storageError&&` · ${document.storageError}`}</div>{draft&&<SharePopover onPickSecond={()=>{setChoosingSecond(draft.elementIds);setDraft(null);setDraftPopoverOpen(false);setSelectionInspectorOpen(false);}} documentNodes={document.nodes} editingContent={inspectorEditor} inspector={draftInInspector} inspectorHost={inspectorHost} comparisonChanged={comparisonChanged} onRefreshComparison={()=>void compareSelections(undefined,true)} onDesignReference={designReference=>setDraft(current=>current?.comparison?{...current,comparison:{...current.comparison,tokenSuggestions:undefined,designReference:JSON.stringify([current.comparison.designReference?.properties.slice().sort(),current.comparison.designReference?.direction])===JSON.stringify([designReference.properties.slice().sort(),designReference.direction])?designReference:{...designReference,proposedChanges:undefined}}}:current)} onComparisonPurpose={purpose=>setDraft(current=>current?.comparison?{...current,comparison:{...current.comparison,purpose,tokenSuggestions:undefined,designReference:purpose===DESIGN_REFERENCE_PURPOSE?(current.comparison.designReference||{direction:sideDirection(current.comparison),properties:[]}):undefined}}:current)} draft={draft} nodes={nodes} camera={transform} collaboration={c} visible={draftPopoverOpen} onVisible={setDraftPopoverOpen} note={draftNote} intent={draftIntent} onNote={setDraftNote} onIntent={setDraftIntent} onCancel={()=>{setDraft(null);setDraftPopoverOpen(false);}} onShared={id=>{setDraft(null);setDraftPopoverOpen(false);setActiveSharedId(id);setHighlightedId(id);}} onRoom={()=>{setDraftPopoverOpen(false);setActivePanelTab('references');setPanelOpen(true);}} onLocate={()=>{const box=getBoundingBox(draft.elementIds,nodes),r=canvasHost.current?.getBoundingClientRect();if(box&&r)setTransform(fitBounds(box,r.width,r.height));}}/>}{conversationOpen&&!conversationInInspector&&c.room?.references.find(r=>r.id===activeSharedId)&&<ReferenceConversationPopover reference={c.room.references.find(r=>r.id===activeSharedId)!} nodes={nodes} camera={transform} collaboration={c} onClose={()=>setConversationOpen(false)} onLocate={locate} onClear={()=>{setHighlightedId(null);setConversationOpen(false);}}/>}</div>
        {attention&&!conversationOpen&&!draftPopoverOpen&&<div className="attention-notice" role="status"><span className={`user-${attention.sourceUser}`}><strong>User {attention.sourceUser} wants you to look here</strong></span><button type="button" disabled={!c.connected} onClick={()=>viewSharedRequest(attention.reference)}>{c.mode==='demo'?'View reference':'View'}</button><button type="button" onClick={()=>dismissReferenceBanner(attention.reference)}>Later</button></div>}
        {!attention&&mentionNotification&&!conversationOpen&&!draftPopoverOpen&&<div className="attention-notice" role="status"><span className={`user-${mentionNotification.sourceUser}`}><strong>User {mentionNotification.sourceUser} {c.mode==='demo'?'shared a reference':'mentioned you'}</strong></span><button type="button" disabled={!c.connected} onClick={()=>{openShared(mentionNotification.id);if(c.mode==='demo')locate(mentionNotification);}}>{c.mode==='demo'?'View reference':'Open reference'}</button><button type="button" onClick={()=>dismissReferenceBanner(mentionNotification)}>Later</button></div>}
        <div className="workspace-dock"><div className="floating-toolbar" role="toolbar" aria-label="Canvas tools">{([{mode:'pointer',name:'Select',key:'V',icon:MousePointer2},{mode:'reference',name:'Rough Reference',key:'R',icon:Sparkles},{mode:'pan',name:'Hand',key:'H',icon:Hand}] as const).map(tool=><button key={tool.mode} title={`${tool.name} (${tool.key})`} aria-pressed={toolMode===tool.mode} onClick={()=>setToolMode(tool.mode)}><tool.icon size={18}/><span>{tool.name}</span><kbd>{tool.key}</kbd></button>)}</div>{!inspectorOpen&&<PromptBar shareLabel={shareLabel} count={inferredRef?.selectedIds.length||0} onShare={shareSelection}/>}</div>
      </main>
      <aside className={`right-sidebar research-sidebar ${panelOpen?'':'panel-hidden'}`} style={{width:panelOpen?panelWidth:0}} aria-label="Workspace panel" inert={!panelOpen}>
        <div className="panel-heading"><span>{activePanelTab==='references'?'Shared References':activePanelTab==='layers'?'Layers':activePanelTab==='tasks'?'Research Tasks':'Selection'}</span><button title="Close panel" aria-label="Close panel" onClick={()=>setPanelOpen(false)}><PanelLeftClose size={16}/></button></div>
        <div className="flex-1 min-h-0" hidden={activePanelTab!=='layers'}><LayersPanel onLocate={ids=>{const box=getBoundingBox(ids,nodes),r=canvasHost.current?.getBoundingClientRect();if(box&&r)setTransform(fitBounds(box,r.width,r.height));}} nodes={nodes} inferredRef={inferredRef} onSelectNode={selectNode}/></div>
        <div className="flex-1 min-h-0" hidden={activePanelTab!=='references'}><CollaborationPanel visible={panelOpen&&activePanelTab==='references'} nodes={nodes} collaboration={c} hasDraft={!!draft} onResumeDraft={()=>{setConversationOpen(false);setDraftPopoverOpen(true);}} activeId={activeSharedId} openRevision={referenceOpenRevision} onOpen={id=>{const ref=c.room?.references.find(r=>r.id===id);if(ref&&needsReferenceNotification(ref,c.session?.userId))viewSharedRequest(ref);else openShared(id);}} onLocate={locate} onClear={()=>{setHighlightedId(null);setConversationOpen(false);}}/></div>
        <div className="flex-1 min-h-0" hidden={activePanelTab!=='tasks'}><ResearchPanel research={research} room={c.room} session={c.session} connected={c.connected} selection={inferredRef} onStart={()=>{research.start();setDraft(null);setInferredRef(null);setSelectionState('idle');}} onShare={()=>shareSelection(research.log.level===5?'Compare these related CTA components for design and wording consistency.':'Please review design consistency across these related elements.')} onRoom={()=>{setActivePanelTab('references');setPanelOpen(true);}} onLocateTargets={ids=>{const box=getBoundingBox(ids,nodes),r=canvasHost.current?.getBoundingClientRect();if(box&&r)setTransform(fitBounds(box,r.width,r.height));}}/></div>
        <div role="separator" aria-label="Resize workspace panel" aria-orientation="vertical" aria-valuenow={panelWidth} aria-valuemin={280} aria-valuemax={420} tabIndex={0} className="panel-resizer" onPointerDown={resizePanel} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();setPanelWidth(v=>Math.max(280,Math.min(420,v+(e.key==='ArrowRight'?10:-10))));}}}/>
      </aside>
      <ComparisonInspector workMode={conversationOpen?undefined:selectionMode?'edit':'compare'} onModeChange={changeInspectorMode} compareAvailable={compareModeAvailable} footer={selectionMode&&inferredRef?<div ref={setSelectionFooterHost} className="selection-footer-host"/>:undefined} mode={selectionMode?'selection':'compare'} count={selectionMode?inferredRef?.selectedIds.length:draftInInspector?draft?.elementIds.length:activeConversation?.elementIds.length} open={inspectorOpen} contentRef={setInspectorHost} onClose={()=>{setInspectorMode('edit');setChoosingSecond(null);setSelectionInspectorOpen(false);setDraftPopoverOpen(false);setConversationOpen(false);}}>{selectionMode&&inferredRef&&<div className="selection-inspector-body"><SelectionDetails ids={inferredRef.selectedIds} nodes={document.nodes}/>{inspectorEditor}<SelectionSharing research={research.attempt&&!research.attempt.completedAt&&research.attempt.level>=4&&c.session?.userId==='A'?{level:research.attempt.level as 4|5,attemptId:research.attempt.id}:undefined} selection={inferredRef} nodes={document.nodes} collaboration={c} footerHost={selectionFooterHost} note={draftNote} intent={selectionIntent} onNote={setDraftNote} onIntent={setSelectionIntent} onShared={id=>{setSelectionInspectorOpen(false);setActiveSharedId(id);setHighlightedId(id);setConversationOpen(true);}}/></div>}{conversationOpen&&conversationInInspector&&activeConversation&&<div className="inspector-conversation collab-panel" role="region" aria-label="Comparison conversation" tabIndex={0}><ReferenceConversation key={activeConversation.id} active={activeConversation} nodes={nodes} collaboration={c} onLocate={locate} onClear={()=>{setHighlightedId(null);setConversationOpen(false);}}/>{c.error&&<p role="alert">{c.error}</p>}</div>}</ComparisonInspector>
    </div><HelpModal isOpen={isHelpOpen} onClose={()=>setIsHelpOpen(false)}/>
  </div>;
}
