import FrameInspector from './components/FrameInspector';
import UnifiedReferenceWorkflow from './components/UnifiedReferenceWorkflow';
import {createPreviewSpotlight} from './previewSpotlight';
import {PreviewComparisonActivityContext,createPreviewComparisonActivity} from './previewComparisonActivity';
import {useStudy} from './useStudy';
import {resetPrototypeStorage,nextStudyTask,STUDY_TASKS} from './study';
import CanvasToolbar from './components/CanvasToolbar';
import {collaboratorReferenceIds} from './comparisonSides';
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
import React, { useState, useCallback, useRef, useEffect,useMemo } from 'react';
import SharePopover from './components/SharePopover';
import { shareActionLabel } from './referencePresentation';
import { useResearch } from './useResearch';
import InspectorHeaderControls from './components/InspectorHeaderControls';
import PageInspector from './components/PageInspector';
import WorkspaceNavigation from './components/WorkspaceNavigation';
import Canvas from './components/Canvas';
import LayersPanel from './components/LayersPanel';
import CollaborationPanel from './components/CollaborationPanel';
import HelpModal from './components/HelpModal';
import { ToolMode, SelectionState, InferredReference } from './types';
import { MOCK_NODES } from './data';
import { getBoundingBox } from './utils';
import { fitWorkspace, fitBounds, zoomAtPoint } from './workspace';
import { ReferenceDraft, ReferenceIntent, SharedReference, DESIGN_REFERENCE_PURPOSE } from './collaboration';
import { useCollaboration } from './useCollaboration';
import { PanelLeftClose,ChevronDown,HelpCircle } from 'lucide-react';
export default function App() {
  const study=useStudy();
  const [generation,setGeneration]=useState(0),[resetError,setResetError]=useState('');
  const prepare=()=>{try{resetPrototypeStorage(localStorage);const url=new URL(location.href);url.searchParams.set('mode','demo');url.searchParams.delete('room');url.searchParams.delete('join');history.replaceState(null,'',url);setResetError('');setGeneration(v=>v+1);return true;}catch{setResetError('Reset failed because browser storage is unavailable. Export your records and enable storage before starting a fresh session.');return false;}};
  return <>{resetError&&<div role="alert">{resetError}</div>}<Workspace key={generation} study={study} onReset={()=>{if(prepare())study.finish();}} onToggleStudy={()=>{if(study.active)study.finish();else if(prepare())study.begin('Unassigned');}}/></>;
}
function Workspace({study,onReset,onToggleStudy}:{key?:number;study:ReturnType<typeof useStudy>;onReset:()=>void;onToggleStudy:()=>void}) {
  const document=useDocument();
  const [comparisonPreviewActive,setComparisonPreviewActive]=useState(false);
  const [previewSpotlightIds,setPreviewSpotlightIds]=useState<string[]>([]);
  const [registerComparisonPreview]=useState(()=>createPreviewComparisonActivity(setComparisonPreviewActive));
  const [setPreviewSpotlight]=useState(()=>createPreviewSpotlight(setPreviewSpotlightIds));
  const comparisonPreviewContext=useMemo(()=>({register:registerComparisonPreview,spotlight:setPreviewSpotlight}),[registerComparisonPreview,setPreviewSpotlight]);
  const nodes=document.visibleNodes;
  const [sourceId,setSourceId]=useState<string|null>(null),[pickingSource,setPickingSource]=useState(false),[editStage,setEditStage]=useState('Reference Confirmed');
  const pickSource=(id:string)=>{if(nodes.find(n=>n.id===id)?.type==='screen')return;setSourceId(id);setPickingSource(false);research.record('style_source_chosen',{ids:[id],step:true});};
  const [toolMode,setToolMode]=useState<ToolMode>('pointer');
  const [selectionState,setSelectionState]=useState<SelectionState>('idle');
  const [inspectorMode,setInspectorMode]=useState<'edit'|'compare'>('edit');
  const [choosingSecond,setChoosingSecond]=useState<string[]|null>(null);
  const [inferredRef,setInferredRef]=useState<InferredReference|null>(null);
  const [transform,setTransform]=useState({x:30,y:10,scale:.46});
  const [activePanelTab,setActivePanelTab]=useState<'layers'|'references'|'study'>(()=>new URL(location.href).searchParams.has('room')?'references':'layers');
  const [panelOpen,setPanelOpen]=useState(()=>study.active || window.innerWidth>1000 || new URL(location.href).searchParams.has('room'));
  const [panelWidth,setPanelWidth]=useState(240);
  const [isHelpOpen,setIsHelpOpen]=useState(false);
  const [draft,setDraft]=useState<ReferenceDraft|null>(null),[draftNote,setDraftNote]=useState('');
  const [draftPopoverOpen,setDraftPopoverOpen]=useState(false);
  const [draftIntent,setDraftIntent]=useState<ReferenceIntent>('');
  const [shareSelecting,setShareSelecting]=useState(false);
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
  const legacyResearch=useResearch(c.room,c.session,c.mode,document.nodes);
  const research={...legacyResearch,record:useCallback((type:string,details:Parameters<typeof legacyResearch.record>[1]={})=>{if(!study.active)legacyResearch.record(type,details);study.record(type,{ids:details?.ids,method:details?.method,actor:c.session?.userId});},[legacyResearch.record,study.record,study.active,c.session?.userId]),recordSelection:useCallback((ref:InferredReference|null)=>{if(!study.active)legacyResearch.recordSelection(ref);study.record('selection',{ids:ref?.selectedIds||[],method:ref?.selectionMethod,actor:c.session?.userId});},[legacyResearch.recordSelection,study.record,study.active,c.session?.userId])};
  useEffect(()=>{study.observe(document.nodes,c.room?.references||[]);},[document.nodes,c.room,study.attempt,study.observe]);
  const dismissalIdentity=c.session?nudgeScope(c.mode,c.session.code,c.session.userId):'';
  const dismissedAttention=dismissedByUser[dismissalIdentity]||[];
  useEffect(()=>{const sync=(event:StorageEvent)=>{if(event.key===NUDGE_DISMISSALS_KEY)setDismissedByUser(parseNudgeDismissals(event.newValue));};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
  const dismissReferenceBanner=(ref:SharedReference)=>{
   let stored=dismissedByUser;try{stored={...stored,...parseNudgeDismissals(localStorage.getItem(NUDGE_DISMISSALS_KEY))};}catch{}
   const next={...stored,[dismissalIdentity]:[...new Set([...(stored[dismissalIdentity]||[]),...dismissedReferenceKeys(ref,c.session?.userId)])]};
   try{localStorage.setItem(NUDGE_DISMISSALS_KEY,JSON.stringify(next));}catch{}
   setDismissedByUser(next);
  };

  const cancelForSelection=useCallback(()=>{setInspectorMode('edit');setComparisonKeys([]);setReviewTokens(false);document.setPreview([]);setPickingSource(false);setSourceId(null);setDraft(null);setDraftNote('');setDraftPopoverOpen(false);setConversationOpen(false);setHighlightedId(null);},[]);
  useEffect(()=>{
    const task=nextStudyTask(study.session);if(task===null)return;
    cancelForSelection();setToolMode('pointer');setInferredRef(null);setSelectionState('idle');setActiveSharedId(null);
    if(c.session?.userId!=='A')c.setPerspective?.('A');
    setActivePanelTab('study');setPanelOpen(true);
    const targets=[...STUDY_TASKS[task].targets];
    const box=getBoundingBox(targets,document.nodes),r=canvasHost.current?.getBoundingClientRect();
    if(r)setTransform(box?fitBounds(box,r.width,r.height):fitWorkspace(r.width,r.height));
    study.start(task,document.nodes,c.room?.references||[]);
  },[study.session?.id,study.session?.participant,study.attempt?.id,study.attempt?.outcome]);
  const updateSelection=useCallback((ref:InferredReference|null)=>{cancelForSelection();setEditStage('Reference Confirmed');setInferredRef(ref);research.recordSelection(ref);},[research.recordSelection,cancelForSelection]);
  useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(!(event.metaKey||event.ctrlKey)||event.key.toLowerCase()!=='z'||(event.target as HTMLElement).closest('input,textarea,[contenteditable=true]'))return;event.preventDefault();if(event.shiftKey){document.redo();research.record('redo',{step:true});}else{document.undo();research.record('undo',{step:true});}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[document.undo,document.redo,research.record]);
  const zoomAtCenter=(factor:number)=>{const r=canvasHost.current?.getBoundingClientRect();if(r)setTransform(p=>zoomAtPoint(p,factor,r.width/2,r.height/2));};
  const handleZoomFit=useCallback(()=>{const r=canvasHost.current?.getBoundingClientRect();if(r)setTransform(fitWorkspace(r.width,r.height));},[]);
  const demoViews=useRef<Record<string,{camera:typeof transform;selection:InferredReference|null}>>({});
  useEffect(()=>{if(c.mode==='demo')try{demoViews.current=JSON.parse(localStorage.getItem('sr-demo-views')||'{}');const saved=demoViews.current[c.session?.userId||'A'];if(saved){setTransform(saved.camera);setInferredRef(saved.selection);setSelectionState(saved.selection?'preview':'idle');return;}}catch{}handleZoomFit();},[handleZoomFit]);
  useEffect(()=>{if(c.mode!=='demo'||!c.session)return;demoViews.current[c.session.userId]={camera:transform,selection:inferredRef};try{localStorage.setItem('sr-demo-views',JSON.stringify(demoViews.current));}catch{}},[transform,inferredRef,c.mode,c.session?.userId]);
  const switchPerspective=(user:'A'|'B')=>{if(c.mode!=='demo'||user===c.session?.userId)return;study.record('perspective_changed',{actor:user});cancelForSelection();const saved=demoViews.current[user];setTransform(saved?.camera||{x:30,y:10,scale:.46});setInferredRef(saved?.selection||null);setSelectionState(saved?.selection?'preview':'idle');setActiveSharedId(null);c.setPerspective?.(user);};
  const shareSelection=useCallback((note='',intent?:ReferenceIntent,selection=inferredRef)=>{
    if(!selection?.selectedIds.length)return;
    const ids=selection.selectedIds.filter(id=>nodes.some(n=>n.id===id&&n.type!=='screen'));
    if(!ids.length)return;
    setDraft({elementIds:[...ids],exemplarIds:selection.exemplarIds.filter(id=>ids.includes(id)),scope:selection.scope,label:selection.label,...(!study.active&&research.attempt&&!research.attempt.completedAt&&research.attempt.level>=4&&c.session?.userId==='A'?{research:{level:research.attempt.level as 4|5,attemptId:research.attempt.id}}:{})});
    setConversationOpen(false);
    setDraftIntent(intent??(!study.active&&research.attempt?.level===5?'Compare':''));
    setDraftNote(note);setDraftPopoverOpen(true);
  },[inferredRef,research.attempt,c.session?.userId,study.active]);
  const changeCanvasTool=(mode:ToolMode)=>{setShareSelecting(false);setToolMode(mode);};
  const beginQuickShare=()=>{if(['drawing','interpreting','disambiguating'].includes(selectionState))return;setToolMode('pointer');setShareSelecting(true);if(inferredRef?.selectedIds.some(id=>nodes.some(n=>n.id===id&&n.type!=='screen')))shareSelection();else cancelForSelection();};
  const committedShareSelection=(selection:InferredReference)=>{if(shareSelecting)shareSelection('',undefined,selection);};
  useEffect(()=>{const key=(e:KeyboardEvent)=>{
    if(e.metaKey||e.ctrlKey||e.altKey||e.shiftKey||e.repeat)return;
    const target=e.target as HTMLElement;
    if(shareSelecting&&e.key==='Escape'){
      if(target.closest('.mention-note')?.querySelector('[data-mention-options]'))return;
      e.preventDefault();e.stopImmediatePropagation();setShareSelecting(false);setDraft(null);setDraftPopoverOpen(false);setToolMode('pointer');return;
    }
    if(target.closest('input,textarea,select,[contenteditable=true],[role=dialog]'))return;
    if(e.key.toLowerCase()==='r'){e.preventDefault();e.stopImmediatePropagation();beginQuickShare();}
    else if(shareSelecting&&['v','s','g','h'].includes(e.key.toLowerCase())){setShareSelecting(false);setToolMode(e.key.toLowerCase()==='g'?'reference':e.key.toLowerCase()==='h'?'pan':'pointer');}
  };window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);},[shareSelecting,selectionState,inferredRef,shareSelection]);

  const selectNode=(id:string,shift=false)=>{if(pickingSource){pickSource(id);return;}const node=nodes.find(n=>n.id===id);if(!node)return;const ids=shift?(inferredRef?.selectedIds.includes(id)?inferredRef.selectedIds.filter(n=>n!==id):[...(inferredRef?.selectedIds||[]),id]):[id];if(!ids.length){updateSelection(null);setSelectionState('idle');return;}const selection:InferredReference={selectedIds:ids,exemplarIds:ids,label:ids.length===1?node.label:`${ids.length} layers selected`,matchingRole:node.role,matchingComponent:node.component,scope:'exemplars',selectionMethod:'conventional'};updateSelection(selection);setSelectionState('preview');committedShareSelection(selection);};
  const openSection=(tab:typeof activePanelTab)=>{setPanelOpen(open=>tab==='references'||tab!==activePanelTab?true:!open);setActivePanelTab(tab);};
  const resizePanel=(e:React.PointerEvent<HTMLDivElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);const start=e.clientX,width=panelWidth;e.currentTarget.onpointermove=event=>setPanelWidth(Math.max(240,Math.min(420,width+event.clientX-start)));const finish=()=>{e.currentTarget.onpointermove=null;};e.currentTarget.onpointerup=finish;e.currentTarget.onpointercancel=finish;};
  const openShared=(id:string)=>{setDraftPopoverOpen(false);setReferenceOpenRevision(v=>v+1);const ref=c.room?.references.find(r=>r.id===id);if(ref&&!ref.archivedAt){void c.activity(id,'opened');for(const invitation of ref.attention||[])if(invitation.targetUser===c.session?.userId&&!invitation.viewedAt)void c.viewAttention(ref.id,invitation.id);}setActiveSharedId(id);setHighlightedId(id);setConversationOpen(true);};
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
    if(!chosen&&!refresh&&draft?.comparison&&!comparisonChanged){setInspectorMode('compare');setDraftPopoverOpen(true);setConversationOpen(false);return;}
    const own=!!chosen||localCompareReady,chosenIds=chosen?.selectedIds||inferredRef?.selectedIds||[];
    const context=!chosen&&chosenIds.length===1&&!peerCompareReady&&referenceForComparison?await c.comparisonDraft([...chosenIds],referenceForComparison.id):own&&!c.connected?localComparison(c.session?.userId||'A',[...chosenIds],crypto.randomUUID(),document.nodes):await c.comparisonDraft(own?[...chosenIds]:undefined);if(!context)return;
    if(!context.sides)research.record(draft?.comparison?'comparison_refreshed':'comparison_established',{ids:[...new Set([...context.selections.A.elementIds,...context.selections.B.elementIds])],method:'two-user-selection',step:true});
    const ids=[...new Set([...context.selections.A.elementIds,...context.selections.B.elementIds])];
    const exemplars=[...new Set([...context.selections.A.exemplarIds,...context.selections.B.exemplarIds])];
    setDraft(current=>{
      const evidence=!context.sides?(current?.research||(!study.active&&research.attempt&&!research.attempt.completedAt&&research.attempt.level>=4&&c.session?.userId==='A'?{level:research.attempt.level as 4|5,attemptId:research.attempt.id}:undefined)):undefined;
      return {elementIds:ids,exemplarIds:exemplars,scope:'document',label:context.sides?'Comparison of selected objects':'Comparison of User A and User B selections',comparison:{...context,purpose:current?.comparison?.purpose||'Compare differences',...(current?.comparison?.designReference?{designReference:{direction:sideDirection(context),properties:current.comparison.designReference.properties}}:{})},...(evidence?{research:evidence}:{})};
    });
    setInspectorMode('compare');setDraftIntent('Compare');setConversationOpen(false);setDraftPopoverOpen(true);
  };
  const [inspectorHost,setInspectorHost]=useState<HTMLDivElement|null>(null);
  const [comparisonKeys,setComparisonKeys]=useState<string[]>([]);
  const activeConversation=c.room?.references.find(r=>r.id===activeSharedId);
  const draftInInspector=!!draft?.comparison;
  const conversationInInspector=activeConversation?.intent==='Compare';
  const selectionMode=!(inspectorMode==='compare'&&draftInInspector&&draftPopoverOpen||conversationInInspector&&conversationOpen);
  const activeCompareDraft=!selectionMode&&draftInInspector;
  const compareInspectorOpen=!!(activeCompareDraft&&draftPopoverOpen||conversationInInspector&&conversationOpen);
  const referenceForComparison=c.room?.references.find(reference=>reference.id===activeSharedId&&collaboratorReferenceIds(reference,c.session?.userId||'A',document.nodes).length>0);
  const compareModeAvailable=!!inferredRef&&(inferredRef.selectedIds.length>=2||peerCompareReady||!!referenceForComparison);
  const changeInspectorMode=(mode:'edit'|'compare')=>{if(mode==='compare'){if(compareModeAvailable)void compareSelections();}else{document.setPreview([]);setPickingSource(false);setInspectorMode('edit');setDraftPopoverOpen(false);setConversationOpen(false);requestAnimationFrame(()=>inspectorHost?.focus({preventScroll:true}));}};
  const selectionPending=['drawing','interpreting','disambiguating'].includes(selectionState);
  useEffect(()=>{if(!choosingSecond||!inferredRef)return;const additions=inferredRef.selectedIds.filter(id=>!choosingSecond.includes(id));if(!additions.length)return;const ids=[...new Set([...choosingSecond,...additions])],selection={...inferredRef,selectedIds:ids,exemplarIds:ids};setChoosingSecond(null);updateSelection(selection);void compareSelections(selection);},[inferredRef,choosingSecond]);
  const editingIds=activeCompareDraft&&draft?inspectorTargets(draft.comparison,draft.elementIds):inferredRef?.selectedIds||[];
  const editingSelection:InferredReference|null=activeCompareDraft&&draft?{selectedIds:editingIds,exemplarIds:editingIds,label:draft.label,scope:draft.scope,selectionMethod:inferredRef?.selectionMethod||'conventional'}:inferredRef;
  const [reviewTokens,setReviewTokens]=useState(false);
  const selectedFrames=editingIds.flatMap(id=>{const node=document.nodes.find(node=>node.id===id&&node.type==='screen');return node?[node]:[];});
  const inspectorEditor=editingSelection&&(selectionMode&&selectedFrames.length>0?<FrameInspector frames={editingIds.flatMap(id=>{const node=document.nodes.find(node=>node.id===id);return node?[node]:[];})} nodes={document.nodes} onSelectContents={ids=>{updateSelection({selectedIds:ids,exemplarIds:ids,label:`${ids.length} layers selected`,scope:'exemplars',selectionMethod:'conventional'});setSelectionState('preview');}}/>:<PreviewComparisonActivityContext.Provider value={comparisonPreviewContext}><EditingToolbar onLocateLibrary={()=>{const frame=nodes.find(n=>n.id==='screen-design-system'),r=canvasHost.current?.getBoundingClientRect();if(frame&&r)setTransform(fitBounds(frame,r.width,r.height));}} comparisonKeys={comparisonKeys} onDesignReference={value=>setDraft(current=>current?.comparison?{...current,comparison:{...current.comparison,designReference:value}}:current)} selectionInspector={selectionMode} reviewTokens={reviewTokens} onTokenChanges={tokenSuggestions=>setDraft(current=>activeCompareDraft&&current?.comparison?{...current,comparison:{...current.comparison,tokenSuggestions}}:current)} inline context={activeCompareDraft?draft?.comparison:undefined} onEvent={(type,details)=>{research.record(type,{step:true});if(type==='ai_suggestion_previewed')study.record('ai_preview_patch',details);if(type==='design_system_previewed')study.record(type,details);}} selection={editingSelection} nodes={document.nodes} onPreview={document.setPreview} onApply={(proposal,patches)=>{const committed=document.commit(patches,proposal.targetIds);if(committed)study.record('edit_committed',{ids:proposal.targetIds,patches,method:proposal.sourceId==='ds-product-card'&&proposal.title.includes('Design System')?'design-system':undefined,actor:c.session?.userId});setDraftPopoverOpen(false);setConversationOpen(false);setInspectorMode('edit');setChoosingSecond(null);setPickingSource(false);setDraft(current=>current?.comparison?{...current,comparison:{...current.comparison,tokenSuggestions:undefined,...(current.comparison.designReference?{designReference:{...current.comparison.designReference,proposedChanges:undefined}}:{})}}:current);research.record('action_applied',{ids:[...proposal.targetIds],method:editingSelection.selectionMethod,step:true,action:proposal.title});}} onUndo={()=>{document.undo();research.record('undo',{step:true});}} onRedo={()=>{document.redo();research.record('redo',{step:true});}} canUndo={document.canUndo} canRedo={document.canRedo} sourceId={sourceId||(activeCompareDraft&&draft?.comparison?.purpose===DESIGN_REFERENCE_PURPOSE?referenceSides(draft.comparison).reference.elementIds[0]||null:null)} onSource={id=>{setSourceId(id);if(id)research.record('style_source_chosen',{ids:[id],step:true});}} picking={pickingSource} onPicking={setPickingSource} onState={setEditStage}/></PreviewComparisonActivityContext.Provider>);

  const comparisonChanged=!!draft?.comparison&&(draft.comparison.sides?JSON.stringify(inferredRef?.selectedIds||[])!==JSON.stringify([...new Set(Object.values(comparisonSides(draft.comparison)).filter(side=>side.selectedBy===(c.session?.userId||'A')).flatMap(side=>side.elementIds))]):(['A','B'] as const).some(id=>c.selections[id]?.revision!==draft.comparison!.selections[id].revision));
  const shareLabel=shareActionLabel(c.session?.userId);
  const attention=nextAttention(c.room?.references||[],c.session?.userId,dismissedAttention);
  const mentionNotification=c.room?.references.filter(r=>needsReferenceNotification(r,c.session?.userId)&&!dismissedAttention.includes(`mention:${r.id}`)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
  const pending=c.room?.references.filter(r=>needsReferenceNotification(r,c.session?.userId)).length||0;
  return <div className="app-shell flex flex-col h-dvh w-full overflow-hidden text-zinc-800 bg-white font-sans">

    <div className="flex flex-1 min-h-0 overflow-hidden relative">
      <WorkspaceNavigation active={activePanelTab} open={panelOpen} pending={pending} onOpen={openSection}/>
      <main className="workspace flex flex-col flex-1 min-w-0 relative overflow-hidden" aria-label="Design canvas">
        <div ref={canvasHost} className="canvas-surface relative flex-1 min-h-0"><CollaboratorSelection selection={inferredRef} nodes={nodes} camera={transform} collaboration={c}/><CollaboratorCursors camera={transform} collaboration={c}/><Canvas shareMode={shareSelecting} onSelectionCommitted={committedShareSelection} previewSpotlightIds={previewSpotlightIds} pickingSource={pickingSource} sourceId={sourceId} onPickSource={pickSource} onMoveEnd={()=>document.finishMove()} onMove={document.move} onInterpretationConfirmed={()=>changeInspectorMode('edit')} onSelectionStart={cancelForSelection} onCompare={()=>{setChoosingSecond(null);setReviewTokens(false);void compareSelections();}} compareOwn={localCompareReady} compareReady={compareModeAvailable} compareHint={compareHint} shareLabel={shareLabel} inspectorOpen={compareInspectorOpen||pickingSource||comparisonPreviewActive||document.preview.length>0} sharing={(!!draft&&draftPopoverOpen)||conversationOpen} toolMode={toolMode} setToolMode={changeCanvasTool} selectionState={selectionState} setSelectionState={setSelectionState} inferredRef={inferredRef} setInferredRef={updateSelection} onResearchEvent={(type,details)=>{if(type==='gesture_attempt')cancelForSelection();research.record(type,details);}} onAcceptReference={intent=>shareSelection('',intent)} nodes={nodes} transform={transform} setTransform={setTransform} sharedReferences={c.room?.references||[]} activeSharedId={highlightedId} onOpenShared={openShared}/>{shareSelecting&&!draftPopoverOpen&&<div className="quick-share-selection-hint" role="status">Select objects to share.</div>}{choosingSecond&&<div className="second-object-prompt">Select another object to compare.<button type="button" onClick={()=>setChoosingSecond(null)}>Cancel</button></div>}{draft&&<SharePopover renderReferenceWorkflow={draft.comparison?sharing=><PreviewComparisonActivityContext.Provider value={comparisonPreviewContext}><UnifiedReferenceWorkflow key={draft.comparison!.snapshotId} context={draft.comparison!} nodes={document.nodes} sharing={sharing} onPreview={document.setPreview} onApply={(proposal,patches)=>{const committed=document.commit(patches,proposal.targetIds);if(committed){study.record('edit_committed',{ids:proposal.targetIds,patches,actor:c.session?.userId});research.record('action_applied',{ids:[...proposal.targetIds],method:editingSelection?.selectionMethod,step:true,action:proposal.title});}return committed;}} onUndo={()=>{document.undo();research.record('undo',{step:true});}} onRedo={()=>{document.redo();research.record('redo',{step:true});}} canUndo={document.canUndo} canRedo={document.canRedo} onCancel={()=>{document.setPreview([]);setDraft(null);setDraftPopoverOpen(false);setInspectorMode('edit');}}/></PreviewComparisonActivityContext.Provider>:undefined} comparisonKeys={comparisonKeys} onComparisonKeys={setComparisonKeys} onPickSecond={()=>{setChoosingSecond(draft.elementIds);setDraft(null);setDraftPopoverOpen(false);}} documentNodes={document.nodes} editingContent={inspectorEditor} inspector={draftInInspector} inspectorHost={inspectorHost} comparisonChanged={comparisonChanged} onRefreshComparison={()=>void compareSelections(undefined,true)} onDesignReference={designReference=>setDraft(current=>current?.comparison?{...current,comparison:{...current.comparison,tokenSuggestions:undefined,designReference:JSON.stringify([current.comparison.designReference?.properties.slice().sort(),current.comparison.designReference?.direction])===JSON.stringify([designReference.properties.slice().sort(),designReference.direction])?designReference:{...designReference,proposedChanges:undefined}}}:current)} onComparisonPurpose={purpose=>setDraft(current=>current?.comparison?{...current,comparison:{...current.comparison,purpose,tokenSuggestions:undefined,designReference:purpose===DESIGN_REFERENCE_PURPOSE?(current.comparison.designReference||{direction:sideDirection(current.comparison),properties:[]}):undefined}}:current)} draft={draft} nodes={nodes} camera={transform} collaboration={c} visible={draftPopoverOpen} onVisible={open=>{setDraftPopoverOpen(open);if(!open&&draft?.comparison)setInspectorMode('edit');}} note={draftNote} intent={draftIntent} onNote={setDraftNote} onIntent={setDraftIntent} onCancel={()=>{setDraft(null);setDraftPopoverOpen(false);setInspectorMode('edit');}} onShared={id=>{setDraft(null);setDraftPopoverOpen(false);setInspectorMode('edit');setActiveSharedId(id);setHighlightedId(id);}} onRoom={()=>{setDraftPopoverOpen(false);setActivePanelTab('references');setPanelOpen(true);}} onLocate={()=>{const box=getBoundingBox(draft.elementIds,nodes),r=canvasHost.current?.getBoundingClientRect();if(box&&r)setTransform(fitBounds(box,r.width,r.height));}}/>}{conversationOpen&&!conversationInInspector&&c.room?.references.find(r=>r.id===activeSharedId)&&<ReferenceConversationPopover reference={c.room.references.find(r=>r.id===activeSharedId)!} nodes={nodes} camera={transform} collaboration={c} onInspect={ids=>{const selection:InferredReference={selectedIds:ids,exemplarIds:ids,label:'Review focus',scope:'exemplars',selectionMethod:'conventional'};setInferredRef(selection);setSelectionState('preview');research.recordSelection(selection);const box=getBoundingBox(ids,nodes),r=canvasHost.current?.getBoundingClientRect();if(box&&r)setTransform(fitBounds(box,r.width,r.height));}} onCompare={ids=>{const selection:InferredReference={selectedIds:ids,exemplarIds:ids,label:'Review focus',scope:'exemplars',selectionMethod:'conventional'};setInferredRef(selection);setSelectionState('preview');void compareSelections(selection);}} onClose={()=>setConversationOpen(false)} onLocate={locate} onClear={()=>{setHighlightedId(null);setConversationOpen(false);}}/>}</div>
        {attention&&!conversationOpen&&!draftPopoverOpen&&<div className="attention-notice" role="status"><span className={`user-${attention.sourceUser}`}><strong>User {attention.sourceUser} wants you to look here</strong></span><button type="button" disabled={!c.connected} onClick={()=>viewSharedRequest(attention.reference)}>{c.mode==='demo'?'View reference':'View'}</button><button type="button" onClick={()=>dismissReferenceBanner(attention.reference)}>Later</button></div>}
        {!attention&&mentionNotification&&!conversationOpen&&!draftPopoverOpen&&<div className="attention-notice" role="status"><span className={`user-${mentionNotification.sourceUser}`}><strong>User {mentionNotification.sourceUser} {c.mode==='demo'?'shared a reference':'mentioned you'}</strong></span><button type="button" disabled={!c.connected} onClick={()=>{openShared(mentionNotification.id);if(c.mode==='demo')locate(mentionNotification);}}>{c.mode==='demo'?'View reference':'Open reference'}</button><button type="button" onClick={()=>dismissReferenceBanner(mentionNotification)}>Later</button></div>}
        <div className="workspace-dock"><CanvasToolbar mode={toolMode} onShare={beginQuickShare} shareSelecting={shareSelecting} onChange={changeCanvasTool}/></div>
      </main>
      <aside id="workspace-panel" className={`right-sidebar research-sidebar ${panelOpen?'':'panel-hidden'}`} style={{width:panelOpen?panelWidth:0}} aria-label="Workspace panel" inert={!panelOpen}>
        {activePanelTab!=='layers'&&<div className="panel-heading"><span>{activePanelTab==='references'?'Shared References':activePanelTab==='layers'?'Layers':activePanelTab==='study'?'User Study':'Selection'}</span><button title="Close panel" aria-label="Close panel" onClick={()=>setPanelOpen(false)}><PanelLeftClose size={16}/></button></div>}
        <div className="flex-1 min-h-0" hidden={activePanelTab!=='layers'}><LayersPanel onClose={()=>setPanelOpen(false)} onSelectNodes={ids=>{const selection:InferredReference={selectedIds:ids,exemplarIds:ids,scope:'exemplars',selectionMethod:'conventional',label:`${ids.length} layers selected`};updateSelection(selection);setSelectionState('preview');committedShareSelection(selection);}} onLocate={ids=>{const box=getBoundingBox(ids,nodes),r=canvasHost.current?.getBoundingClientRect();if(box&&r)setTransform(fitBounds(box,r.width,r.height));}} nodes={nodes} inferredRef={inferredRef} onSelectNode={selectNode}/></div>
        <div className="flex-1 min-h-0" hidden={activePanelTab!=='references'}><CollaborationPanel selection={selectionPending?null:inferredRef} onLocateSelection={()=>{if(!inferredRef)return;const box=getBoundingBox(inferredRef.selectedIds,nodes),r=canvasHost.current?.getBoundingClientRect();if(box&&r)setTransform(fitBounds(box,r.width,r.height));}} studyActive={study.active} onStudyReset={onReset} visible={panelOpen&&activePanelTab==='references'} nodes={nodes} collaboration={c} hasDraft={!!draft} onResumeDraft={()=>{setConversationOpen(false);setDraftPopoverOpen(true);}} activeId={activeSharedId} openRevision={referenceOpenRevision} onOpen={id=>{const ref=c.room?.references.find(r=>r.id===id);if(ref&&needsReferenceNotification(ref,c.session?.userId))viewSharedRequest(ref);else openShared(id);}} onLocate={locate} onClear={()=>{setHighlightedId(null);setConversationOpen(false);}}/></div>
        <div role="separator" aria-label="Resize workspace panel" aria-orientation="vertical" aria-valuenow={panelWidth} aria-valuemin={240} aria-valuemax={420} tabIndex={0} className="panel-resizer" onPointerDown={resizePanel} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();setPanelWidth(v=>Math.max(240,Math.min(420,v+(e.key==='ArrowRight'?10:-10))));}}}/>
      </aside>
      <ComparisonInspector headerControls={<InspectorHeaderControls session={c.session} mode={c.mode} onPerspective={switchPerspective}/>} zoomControls={<button type="button" className="inspector-zoom" aria-label="Zoom to fit" title="Zoom to fit all screens" onClick={handleZoomFit}>{Math.round(transform.scale*100)}%<ChevronDown size={10}/></button>} workMode={compareInspectorOpen?'compare':'edit'} onModeChange={changeInspectorMode} compareAvailable={compareModeAvailable} mode={selectionMode?'selection':'compare'} count={selectionMode?inferredRef?.selectedIds.length:draftInInspector?draft?.elementIds.length:activeConversation?.elementIds.length} contentRef={setInspectorHost}>{selectionMode&&!selectionPending&&inferredRef&&<div className="selection-inspector-body">{inspectorEditor}</div>}{selectionMode&&!selectionPending&&!inferredRef&&<PageInspector/>}{selectionMode&&selectionPending&&<p className="design-empty-state">Confirm the interpretation to inspect its properties.</p>}{conversationOpen&&conversationInInspector&&activeConversation&&<div className="inspector-conversation collab-panel" role="region" aria-label="Comparison conversation" tabIndex={0}><ReferenceConversation key={activeConversation.id} active={activeConversation} nodes={nodes} collaboration={c} onLocate={locate} onClear={()=>{setHighlightedId(null);setConversationOpen(false);}}/>{c.error&&<p role="alert">{c.error}</p>}</div>}</ComparisonInspector><button type="button" className="figma-help" aria-label="Help" onClick={()=>setIsHelpOpen(true)}><HelpCircle size={22} strokeWidth={1.5}/></button>
    </div><HelpModal isOpen={isHelpOpen} onClose={()=>setIsHelpOpen(false)}/>
  </div>;
}
