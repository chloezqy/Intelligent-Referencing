import SenderNote from './SenderNote';
import {useDraggablePanel} from '../useDraggablePanel';
import {Crosshair,Share2,ChevronRight,Settings2} from 'lucide-react';
import {ElementPreview} from './ReferencePreviewCard';
import ShareRecipients from './ShareRecipients';
import type {UserId} from '../collaboration';
import {referenceSharingContext,type ReferenceShareDetails} from '../unifiedReference';
import ReferenceSharingControls from './ReferenceSharingControls';
import {createPortal} from 'react-dom';
import type {CollaborationClient} from '../collaborationClient';
import ComparisonOverview from './ComparisonOverview';
import ComparisonContext, {ComparisonPurpose} from './ComparisonContext';
import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { ReferenceDraft, ReferenceIntent, DesignReference, DESIGN_REFERENCE_PURPOSE,INTENTS } from '../collaboration';
import { UIElement } from '../types';
import { CanvasTransform } from '../workspace';
import { requestId } from '../useCollaboration';
import { sharePopoverLayout, shareActionLabel, referencePinPosition } from '../referencePresentation';
import PropertyComparison from './PropertyComparison';
interface Props {comparisonComposer?:boolean;renderReferenceWorkflow?:(sharing:(details:ReferenceShareDetails)=>React.ReactNode)=>React.ReactNode;comparisonKeys?:string[];onComparisonKeys?:(keys:string[])=>void;onPickSecond?:()=>void;documentNodes?:UIElement[];editingContent?:React.ReactNode;
 inspectorHost?:HTMLElement|null; inspector?:boolean;
  onDesignReference:(value:DesignReference)=>void;onComparisonPurpose:(value:string)=>void;onRefreshComparison:()=>void;comparisonChanged:boolean;
  draft:ReferenceDraft; nodes:UIElement[]; camera:CanvasTransform;
  collaboration:CollaborationClient; visible:boolean; onVisible:(open:boolean)=>void;
  note:string; intent:ReferenceIntent; onNote:(value:string)=>void; onIntent:(value:ReferenceIntent)=>void;
  onCancel:()=>void; onShared:(id:string)=>void;
  onRoom:()=>void; onLocate:()=>void;
}
export default function SharePopover(props:Props){
 const {renderReferenceWorkflow,comparisonKeys,onComparisonKeys,onPickSecond,documentNodes,editingContent,inspector=false,inspectorHost,onDesignReference,onComparisonPurpose,onRefreshComparison,comparisonChanged,draft,nodes,camera,collaboration:c,visible,onVisible,note,intent,onNote,onIntent,onCancel,onShared,onRoom,onLocate,comparisonComposer=false}=props;
 const [moreOptions,setMoreOptions]=useState(false);
 const [comparisonShare,setComparisonShare]=useState<ReferenceShareDetails|null>(null);
  const [dragPanel,setDragPanel]=useState<HTMLDivElement|null>(null);
  const host=useRef<HTMLDivElement>(null),popup=useRef<HTMLDivElement>(null),pin=useRef<HTMLButtonElement>(null);
 const bindDragPanel=useCallback((element:HTMLDivElement|null)=>{popup.current=element;setDragPanel(element);},[]);
  const [viewport,setViewport]=useState({width:800,height:600}),[height,setHeight]=useState(320),[sendId,setSendId]=useState(requestId);
  useEffect(()=>{if(inspector&&draft.comparison&&!draft.comparison.purpose.trim())onComparisonPurpose('Compare differences');},[inspector,draft.comparison?.snapshotId]);
  const label=shareActionLabel(c.session?.userId),target=c.session?.userId==='B'?'A':'B';
  const availableRecipients=(c.room?.members||[]).filter(member=>member.userId!==c.session?.userId).map(member=>member.userId);
  const [recipients,setRecipients]=useState<UserId[]>(availableRecipients);
  useEffect(()=>setRecipients(availableRecipients),[draft.elementIds.join('|'),c.session?.userId,availableRecipients.join('|')]);
  const chosenRecipients=recipients.filter(id=>availableRecipients.includes(id));
  useEffect(()=>{const el=host.current;if(!el)return;const observer=new ResizeObserver(()=>setViewport({width:el.clientWidth,height:el.clientHeight}));observer.observe(el);return()=>observer.disconnect();},[inspector,inspectorHost]);
  useEffect(()=>{setSendId(requestId());},[draft,note,intent,recipients.join('|')]);
  useLayoutEffect(()=>{
    if(!visible)return;
    const element=popup.current;if(!element)return;
    element.querySelector<HTMLInputElement|HTMLTextAreaElement>('input[aria-label="Intended action"],textarea[aria-label="Reference note"]')?.focus({preventScroll:true});
    const measure=()=>setHeight(element.getBoundingClientRect().height);measure();const observer=new ResizeObserver(measure);observer.observe(element);
    const outside=(e:PointerEvent)=>{if(!inspector&&!host.current?.contains(e.target as Node))onVisible(false);};
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){if(element.querySelector('[data-mention-options]'))return;e.preventDefault();e.stopPropagation();onVisible(false);pin.current?.focus({preventScroll:true});}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape,true);
    return()=>{observer.disconnect();document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape,true);};
  },[visible,inspector,inspectorHost]);
  const layout=sharePopoverLayout(draft.elementIds,nodes,camera,viewport,height);
  const placementKey=JSON.stringify([draft.elementIds,camera,viewport]);
  const [writingAnchor,setWritingAnchor]=useState<{key:string;top:number}|null>(null);
  useEffect(()=>{if(!visible||inspector||!note.trim()){setWritingAnchor(null);return;}if(layout&&writingAnchor?.key!==placementKey)setWritingAnchor({key:placementKey,top:layout.popup.top});},[visible,inspector,!!note.trim(),placementKey]);
  useDraggablePanel(dragPanel,JSON.stringify(draft.elementIds),visible&&!inspector);
  if(!layout&&!inspector)return null;
  const sharingControls=<ReferenceSharingControls senderAssistance={!inspector} comparison={!!draft.comparison} inspector={inspector} c={c} note={note} intent={intent} onNote={onNote} onIntent={onIntent} nodes={documentNodes||nodes} elementIds={draft.elementIds}/>;
  const submitButton=<button className="primary-action" disabled={!inspector&&!chosenRecipients.length||inspector&&!intent.trim()||c.busy||!c.connected||!c.room||c.room.members.length<2||!!draft.comparison&&(!draft.comparison.purpose.trim()||draft.comparison.purpose===DESIGN_REFERENCE_PURPOSE&&!draft.comparison.designReference?.properties.length)} type="submit">{c.busy?'Sending…':inspector&&draft.comparison?'Share comparison':'Send reference'}</button>;
  if(inspector&&renderReferenceWorkflow)return <>{visible&&inspectorHost?createPortal(renderReferenceWorkflow(details=><button type="button" className="reference-share-action" onClick={()=>setComparisonShare(details)}><Share2 size={14}/><span>Share comparison</span><ChevronRight size={13}/></button>),inspectorHost):null}{comparisonShare&&<SharePopover {...props} comparisonComposer inspector={false} inspectorHost={undefined} renderReferenceWorkflow={undefined} visible draft={{...draft,comparison:referenceSharingContext(draft.comparison!,comparisonShare)}} onVisible={open=>{if(!open)setComparisonShare(null);}} onCancel={()=>setComparisonShare(null)} onShared={()=>setComparisonShare(null)}/>}</>;

  const content=<div ref={host} className={inspector?'inspector-share-host':'draft-share-layer absolute inset-0 pointer-events-none'} onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
    {!inspector&&!visible&&layout&&<button ref={pin} type="button" className={`reference-pin share-draft-pin user-${c.session?.userId||'A'} pointer-events-auto`} style={referencePinPosition(layout.pin,viewport)} title={`${label} · Unsent request`} aria-label={`Open ${label} popup`} aria-expanded={visible} aria-haspopup="dialog" onClick={()=>onVisible(!visible)}><span className="pin-avatar" aria-hidden="true">+</span></button>}
    {visible&&<div ref={bindDragPanel} role="dialog" aria-label={label} className={inspector?'inspector-composer':'share-popover sender-share-popover quick-share-popover pointer-events-auto'} style={inspector?undefined:layout?{...layout.popup,...(writingAnchor?.key===placementKey?{top:writingAnchor.top,maxHeight:Math.min(640,viewport.height-writingAnchor.top-8)}:{})}:undefined}>
      {!inspector&&<header data-panel-drag-handle title="Drag to move panel"><h3>Share reference</h3><button type="button" aria-label="Close sharing popup" onClick={onCancel}>×</button></header>}
      <form onSubmit={async e=>{e.preventDefault();if(!inspector&&!chosenRecipients.length)return;const result=await c.share({...draft,...(documentNodes?{document:documentNodes}:{})},intent.trim()||'Look at this',note,sendId,true,inspector?undefined:chosenRecipients);if(result)onShared(result.id);}}>
        <div className="share-form-body" onKeyDown={e=>{const target=e.target as HTMLElement;if(e.key==='Enter'&&target.matches('input,select')&&target.closest('.comparison-overview,.comparison-next-steps')){e.preventDefault();e.stopPropagation();}}} role={inspector?'region':undefined} aria-label={inspector?'Comparison content':undefined} tabIndex={inspector?0:undefined}>{!inspector&&<><section className="share-selected-object" aria-label="Selected reference"><div className="share-object-thumbnails">{draft.elementIds.slice(0,2).map(id=>{const node=(documentNodes||nodes).find(n=>n.id===id);return node?<span key={id}><ElementPreview element={node} nodes={documentNodes||nodes}/></span>:null;})}</div><div className="share-object-copy"><strong title={draft.elementIds.map(id=>(documentNodes||nodes).find(n=>n.id===id)?.label||id).join(', ')}>{draft.elementIds.map(id=>(documentNodes||nodes).find(n=>n.id===id)?.label||id).join(', ')}</strong><small>{draft.elementIds.length} {draft.elementIds.length===1?'layer':'layers'} selected</small></div><button type="button" className="share-locate" onClick={onLocate}><Crosshair size={13}/>Locate</button></section>
        <ShareRecipients quick onAddPeople={onRoom} members={c.room?.members||[]} self={c.session?.userId} selected={chosenRecipients} onChange={setRecipients}/>
        {layout?.offscreen&&<p className="subtle">Targets offscreen.</p>}</>}

        {!inspector?null:inspector?<ComparisonOverview selectedKeys={comparisonKeys} onSelectedKeys={onComparisonKeys} purposeControls={draft.comparison?<ComparisonPurpose showDesignControls={false} context={draft.comparison} onPurpose={onComparisonPurpose} onDesignReference={onDesignReference}/>:undefined}  showDesignIntent={false} context={draft.comparison} contextId={draft.comparison?.snapshotId||`share-${draft.elementIds.join('|')}`} ids={draft.elementIds} nodes={documentNodes||nodes} user={c.session?.userId}/>:draft.comparison?<><ComparisonContext context={draft.comparison} nodes={nodes} user={c.session?.userId} onPurpose={onComparisonPurpose}/><PropertyComparison ownership={draft.comparison} contextId={draft.comparison.snapshotId} ids={draft.elementIds} nodes={nodes} expanded/></>:intent==='Compare'?<PropertyComparison contextId={`share-${draft.elementIds.join('|')}`} ids={draft.elementIds} nodes={nodes} expanded/>:null}
        {inspector&&draft.elementIds.length===1&&onPickSecond&&<button type="button" className="choose-second-object" onClick={onPickSecond}>Choose second layer on canvas</button>}
        {inspector&&editingContent}
        {draft.comparison&&comparisonChanged&&<p className="subtle">Selection changed. <button type="button" onClick={onRefreshComparison}>Refresh comparison</button></p>}
        {inspector?<section className="comparison-sharing-options" aria-label="Sharing options"><h4>Sharing options</h4>

          {sharingControls}
          <div className="comparison-share-submit">{submitButton}</div>
        </section>:<><SenderNote quick note={note} onNote={onNote} request={intent.trim()||'Look at this'} ids={draft.elementIds} nodes={documentNodes||nodes} members={c.room?.members||[]} self={c.session?.userId}/>{moreOptions&&<div className="quick-share-options" id="quick-share-options"><label>Request (optional)<input type="text" aria-label="Intended action" list="quick-share-intents" placeholder="No specific request" maxLength={120} value={intent} onChange={e=>onIntent(e.target.value)}/><datalist id="quick-share-intents">{INTENTS.map(option=><option key={option} value={option}/>)}</datalist></label></div>}</>}
        {inspector&&!draft.comparison&&intent!=='Compare'&&<PropertyComparison compact={inspector} contextId={`share-${draft.elementIds.join('|')}`} ids={draft.elementIds} nodes={nodes} expanded={false}/>}
        {!c.session||!c.room?<p className="subtle">Create or join a room first. <button type="button" onClick={onRoom}>Open shared workspace</button></p>:!c.room.members.some(m=>m.userId===target)?<p className="subtle">Invite User {target} before sending. <button type="button" onClick={onRoom}>Open room</button></p>:!c.room.members.some(m=>m.userId===target&&m.online)?<p className="subtle">User {target} is offline. They can open this request when they return.</p>:null}
        {c.error&&<p className="connection-error" role="alert">{c.error}</p>}
        </div><div className="action-row share-form-footer">{!inspector?<><button className="quick-more-options" type="button" aria-expanded={moreOptions} aria-controls="quick-share-options" onClick={()=>setMoreOptions(!moreOptions)}><Settings2 size={13}/>More options</button>{submitButton}</>:<button type="button" onClick={onCancel}>Cancel</button>}</div>
      </form>
    </div>}
  </div>;
  return inspector?(visible&&inspectorHost?createPortal(content,inspectorHost):null):content;
}
