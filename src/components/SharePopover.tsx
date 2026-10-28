import ReferenceSharingControls from './ReferenceSharingControls';
import {createPortal} from 'react-dom';
import type {CollaborationClient} from '../collaborationClient';
import ComparisonOverview from './ComparisonOverview';
import ComparisonContext, {ComparisonPurpose} from './ComparisonContext';
import React, { useEffect, useRef, useState } from 'react';
import { ReferenceDraft, ReferenceIntent, DesignReference, DESIGN_REFERENCE_PURPOSE } from '../collaboration';
import { UIElement } from '../types';
import { CanvasTransform } from '../workspace';
import { requestId } from '../useCollaboration';
import { sharePopoverLayout, shareActionLabel } from '../referencePresentation';
import PropertyComparison from './PropertyComparison';
interface Props {comparisonKeys?:string[];onComparisonKeys?:(keys:string[])=>void;onPickSecond?:()=>void;documentNodes?:UIElement[];editingContent?:React.ReactNode;
 inspectorHost?:HTMLElement|null; inspector?:boolean;
  onDesignReference:(value:DesignReference)=>void;onComparisonPurpose:(value:string)=>void;onRefreshComparison:()=>void;comparisonChanged:boolean;
  draft:ReferenceDraft; nodes:UIElement[]; camera:CanvasTransform;
  collaboration:CollaborationClient; visible:boolean; onVisible:(open:boolean)=>void;
  note:string; intent:ReferenceIntent; onNote:(value:string)=>void; onIntent:(value:ReferenceIntent)=>void;
  onCancel:()=>void; onShared:(id:string)=>void;
  onRoom:()=>void; onLocate:()=>void;
}
export default function SharePopover({comparisonKeys,onComparisonKeys,onPickSecond,documentNodes,editingContent,inspector=false,inspectorHost,onDesignReference,onComparisonPurpose,onRefreshComparison,comparisonChanged,draft,nodes,camera,collaboration:c,visible,onVisible,note,intent,onNote,onIntent,onCancel,onShared,onRoom,onLocate}:Props){
  const host=useRef<HTMLDivElement>(null),popup=useRef<HTMLDivElement>(null),pin=useRef<HTMLButtonElement>(null);
  const [viewport,setViewport]=useState({width:800,height:600}),[height,setHeight]=useState(320),[sendId,setSendId]=useState(requestId);
  const [inviteNow,setInviteNow]=useState(false);
  useEffect(()=>setInviteNow(false),[draft.elementIds.join('|'),draft.comparison?.snapshotId]);
  useEffect(()=>{if(inspector&&draft.comparison&&!draft.comparison.purpose.trim())onComparisonPurpose('Compare differences');},[inspector,draft.comparison?.snapshotId]);
  const label=shareActionLabel(c.session?.userId),target=c.session?.userId==='B'?'A':'B';
  useEffect(()=>{const el=host.current;if(!el)return;const observer=new ResizeObserver(()=>setViewport({width:el.clientWidth,height:el.clientHeight}));observer.observe(el);return()=>observer.disconnect();},[inspector,inspectorHost]);
  useEffect(()=>{setSendId(requestId());},[draft,note,intent,inviteNow]);
  useEffect(()=>{
    if(!visible)return;
    const element=popup.current;if(!element)return;
    element.querySelector<HTMLSelectElement>('select')?.focus({preventScroll:true});
    const observer=new ResizeObserver(()=>setHeight(element.getBoundingClientRect().height));observer.observe(element);
    const outside=(e:PointerEvent)=>{if(!inspector&&!host.current?.contains(e.target as Node))onVisible(false);};
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){if(element.querySelector('[data-mention-options]'))return;e.preventDefault();e.stopPropagation();onVisible(false);pin.current?.focus({preventScroll:true});}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape,true);
    return()=>{observer.disconnect();document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape,true);};
  },[visible,inspector,inspectorHost]);
  const layout=sharePopoverLayout(draft.elementIds,nodes,camera,viewport,height);
  if(!layout&&!inspector)return null;
  const sharingControls=<ReferenceSharingControls comparison={!!draft.comparison} inspector={inspector} c={c} note={note} intent={intent} onNote={onNote} onIntent={onIntent} inviteNow={inviteNow} setInviteNow={setInviteNow}/>;
  const content=<div ref={host} className={inspector?'inspector-share-host':'draft-share-layer absolute inset-0 pointer-events-none'} onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
    {!inspector&&layout&&<button ref={pin} type="button" className={`reference-pin share-draft-pin user-${c.session?.userId||'A'} pointer-events-auto`} style={{left:layout.pin.x-12,top:layout.pin.y-12}} title={`${label} · Unsent request`} aria-label={`Open ${label} popup`} aria-expanded={visible} aria-haspopup="dialog" onClick={()=>onVisible(!visible)}>+</button>}
    {visible&&<div ref={popup} role="dialog" aria-label={label} className={inspector?'inspector-composer':'share-popover pointer-events-auto'} style={inspector?undefined:layout?.popup}>
      {!inspector&&<header><h3>{label}</h3></header>}
      <form onSubmit={async e=>{e.preventDefault();const result=await c.share({...draft,...(documentNodes?{document:documentNodes}:{})},intent,note,sendId,inviteNow);if(result)onShared(result.id);}}>
        <div className="share-form-body" onKeyDown={e=>{const target=e.target as HTMLElement;if(e.key==='Enter'&&target.matches('input,select')&&target.closest('.comparison-overview,.comparison-next-steps')){e.preventDefault();e.stopPropagation();}}} role={inspector?'region':undefined} aria-label={inspector?'Comparison content':undefined} tabIndex={inspector?0:undefined}>{!inspector&&<><p className="share-target-label" title={draft.label}>{draft.label}</p>
        <div className="share-target-meta"><span>{draft.elementIds.length} {draft.elementIds.length===1?'object':'objects'}</span><button type="button" onClick={onLocate}>Locate</button></div>
        {layout?.offscreen&&<p className="subtle">Targets offscreen.</p>}</>}

        {inspector?<ComparisonOverview selectedKeys={comparisonKeys} onSelectedKeys={onComparisonKeys} purposeControls={draft.comparison?<ComparisonPurpose showDesignControls={false} context={draft.comparison} onPurpose={onComparisonPurpose} onDesignReference={onDesignReference}/>:undefined}  showDesignIntent={false} context={draft.comparison} contextId={draft.comparison?.snapshotId||`share-${draft.elementIds.join('|')}`} ids={draft.elementIds} nodes={documentNodes||nodes} user={c.session?.userId}/>:draft.comparison?<><ComparisonContext context={draft.comparison} nodes={nodes} user={c.session?.userId} onPurpose={onComparisonPurpose}/><PropertyComparison ownership={draft.comparison} contextId={draft.comparison.snapshotId} ids={draft.elementIds} nodes={nodes} expanded/></>:intent==='Compare'?<PropertyComparison contextId={`share-${draft.elementIds.join('|')}`} ids={draft.elementIds} nodes={nodes} expanded/>:null}
        {inspector&&draft.elementIds.length===1&&onPickSecond&&<button type="button" className="choose-second-object" onClick={onPickSecond}>Choose second object on canvas</button>}
        {inspector&&editingContent}
        {draft.comparison&&comparisonChanged&&<p className="subtle">Selection changed. <button type="button" onClick={onRefreshComparison}>Refresh comparison</button></p>}
        {inspector?<section className="comparison-sharing-options" aria-label="Sharing options"><h4>Sharing options</h4>

          {sharingControls}
        </section>:sharingControls}
        {!draft.comparison&&intent!=='Compare'&&<PropertyComparison compact={inspector} contextId={`share-${draft.elementIds.join('|')}`} ids={draft.elementIds} nodes={nodes} expanded={false}/>}
        {!c.session||!c.room?<p className="subtle">Create or join a room first. <button type="button" onClick={onRoom}>Open shared workspace</button></p>:!c.room.members.some(m=>m.userId===target)?<p className="subtle">Invite User {target} before sending. <button type="button" onClick={onRoom}>Open room</button></p>:!c.room.members.some(m=>m.userId===target&&m.online)?<p className="subtle">User {target} is offline. They can open this request when they return.</p>:null}
        {c.error&&<p className="connection-error" role="alert">{c.error}</p>}
        </div><div className="action-row share-form-footer"><button className="primary-action" disabled={c.busy||!c.connected||!c.room||c.room.members.length<2||!!draft.comparison&&(!draft.comparison.purpose.trim()||draft.comparison.purpose===DESIGN_REFERENCE_PURPOSE&&!draft.comparison.designReference?.properties.length)} type="submit">{c.busy?'Sending…':draft.comparison?'Share comparison':`Send to User ${target}`}</button><button type="button" onClick={onCancel}>Cancel draft</button></div>
      </form>
    </div>}
  </div>;
  return inspector?(visible&&inspectorHost?createPortal(content,inspectorHost):null):content;
}
