import {createPortal} from 'react-dom';
import type {CollaborationClient} from '../collaborationClient';
import MentionNote from './MentionNote';
import {mentionedUsers} from '../mentions';
import ComparisonContext from './ComparisonContext';
import React, { useEffect, useRef, useState } from 'react';
import { ReferenceDraft, ReferenceIntent, INTENTS } from '../collaboration';
import { UIElement } from '../types';
import { CanvasTransform } from '../workspace';
import { requestId } from '../useCollaboration';
import { sharePopoverLayout, shareActionLabel } from '../referencePresentation';
import PropertyComparison from './PropertyComparison';
interface Props {
 inspectorHost?:HTMLElement|null; inspector?:boolean;
  onComparisonPurpose:(value:string)=>void;onRefreshComparison:()=>void;comparisonChanged:boolean;
  draft:ReferenceDraft; nodes:UIElement[]; camera:CanvasTransform;
  collaboration:CollaborationClient; visible:boolean; onVisible:(open:boolean)=>void;
  note:string; intent:ReferenceIntent; onNote:(value:string)=>void; onIntent:(value:ReferenceIntent)=>void;
  onCancel:()=>void; onShared:(id:string)=>void;
  onRoom:()=>void; onLocate:()=>void;
}
export default function SharePopover({inspector=false,inspectorHost,onComparisonPurpose,onRefreshComparison,comparisonChanged,draft,nodes,camera,collaboration:c,visible,onVisible,note,intent,onNote,onIntent,onCancel,onShared,onRoom,onLocate}:Props){
  const host=useRef<HTMLDivElement>(null),popup=useRef<HTMLDivElement>(null),pin=useRef<HTMLButtonElement>(null);
  const [viewport,setViewport]=useState({width:800,height:600}),[height,setHeight]=useState(320),[sendId,setSendId]=useState(requestId);
  const [inviteNow,setInviteNow]=useState(false);
  useEffect(()=>setInviteNow(false),[draft.elementIds.join('|'),draft.comparison?.snapshotId]);
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
  const content=<div ref={host} className={inspector?'inspector-share-host':'draft-share-layer absolute inset-0 pointer-events-none'} onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
    {!inspector&&layout&&<button ref={pin} type="button" className={`reference-pin share-draft-pin user-${c.session?.userId||'A'} pointer-events-auto`} style={{left:layout.pin.x-12,top:layout.pin.y-12}} title={`${label} · Unsent request`} aria-label={`Open ${label} popup`} aria-expanded={visible} aria-haspopup="dialog" onClick={()=>onVisible(!visible)}>+</button>}
    {visible&&<div ref={popup} role="dialog" aria-label={label} className={inspector?'inspector-composer':'share-popover pointer-events-auto'} style={inspector?undefined:layout?.popup}>
      <header><h3>{inspector?'Share comparison':label}</h3></header>
      <form onSubmit={async e=>{e.preventDefault();const result=await c.share(draft,intent,note,sendId,inviteNow);if(result)onShared(result.id);}}>
        <div className="share-form-body"><p className="share-target-label" title={draft.label}>{draft.label}</p>
        <div className="share-target-meta"><span>{draft.elementIds.length} {draft.elementIds.length===1?'object':'objects'}</span><button type="button" onClick={onLocate}>Locate</button></div>
        {!inspector&&layout?.offscreen&&<p className="subtle">Targets offscreen.</p>}
        {draft.comparison&&<><ComparisonContext context={draft.comparison} nodes={nodes} user={c.session?.userId} onPurpose={onComparisonPurpose}/>{comparisonChanged&&<p className="subtle">Selection changed. <button type="button" onClick={onRefreshComparison}>Refresh comparison</button></p>}<PropertyComparison ownership={draft.comparison} contextId={draft.comparison.snapshotId} ids={draft.elementIds} nodes={nodes} expanded={true}/></>}
        {!draft.comparison&&intent==='Compare'&&<PropertyComparison contextId={`share-${draft.elementIds.join('|')}`} ids={draft.elementIds} nodes={nodes} expanded={true}/>}
        <label>Action<select aria-label="Intended action" disabled={!!draft.comparison} value={intent} onChange={e=>onIntent(e.target.value as ReferenceIntent)}>{INTENTS.map(value=><option key={value}>{value}</option>)}</select></label>
        <label className="invite-now"><input type="checkbox" checked={inviteNow} onChange={e=>setInviteNow(e.target.checked)}/>Invite User {target} to view now</label>{inviteNow&&<p className="subtle">They choose whether to navigate.</p>}
        <MentionNote value={note} onChange={onNote} members={c.room?.members||[]} self={c.session?.userId}/>{mentionedUsers(note,c.room?.members||[]).filter(id=>id!==c.session?.userId).length>0&&<p className="subtle">Notifying {mentionedUsers(note,c.room?.members||[]).filter(id=>id!==c.session?.userId).map(id=>`User ${id}`).join(', ')}</p>}
        {!draft.comparison&&intent!=='Compare'&&<PropertyComparison contextId={`share-${draft.elementIds.join('|')}`} ids={draft.elementIds} nodes={nodes} expanded={false}/>}
        {!c.session||!c.room?<p className="subtle">Create or join a room first. <button type="button" onClick={onRoom}>Open shared workspace</button></p>:!c.room.members.some(m=>m.userId===target)?<p className="subtle">Invite User {target} before sending. <button type="button" onClick={onRoom}>Open room</button></p>:!c.room.members.some(m=>m.userId===target&&m.online)?<p className="subtle">User {target} is offline. They can open this request when they return.</p>:null}
        {c.error&&<p className="connection-error" role="alert">{c.error}</p>}
        </div><div className="action-row share-form-footer"><button className="primary-action" disabled={c.busy||!c.connected||!c.room||c.room.members.length<2||!!draft.comparison&&!draft.comparison.purpose.trim()} type="submit">{c.busy?'Sending…':draft.comparison?'Share comparison':`Send to User ${target}`}</button><button type="button" onClick={onCancel}>Cancel draft</button></div>
      </form>
    </div>}
  </div>;
  return inspector?(visible&&inspectorHost?createPortal(content,inspectorHost):null):content;
}
