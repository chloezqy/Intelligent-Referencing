import {SharedDesignChanges} from './DesignChangeSuggestions';
import type {CollaborationClient} from '../collaborationClient';
import ComparisonContext from './ComparisonContext';
import ComparisonOverview from './ComparisonOverview';
import React, { useState, useEffect } from 'react';
import {ArrowUp,CheckCircle2,Crosshair,X,Archive,RotateCcw} from 'lucide-react';
import PropertyComparison from './PropertyComparison';
import { SharedReference } from '../collaboration';
import { UIElement } from '../types';
import { requestId } from '../useCollaboration';
interface Props {key?:string;active:SharedReference;nodes:UIElement[];collaboration:CollaborationClient;onClose?:()=>void;onLocate:(ref:SharedReference)=>void;onClear:()=>void;onInspect?:(ids:string[])=>void;onCompare?:(ids:string[])=>void}
export function conversationTime(createdAt:string,now:number){
 const elapsed=Math.max(0,Math.floor((now-new Date(createdAt).getTime())/60000));
 if(!Number.isFinite(elapsed))return '';
 if(elapsed<1)return 'Just now';
 if(elapsed<60)return `${elapsed} ${elapsed===1?'minute':'minutes'} ago`;
 const hours=Math.floor(elapsed/60);if(hours<24)return `${hours} ${hours===1?'hour':'hours'} ago`;
 const days=Math.floor(hours/24);return `${days} ${days===1?'day':'days'} ago`;
}
export default function ReferenceConversation({active,nodes,collaboration:c,onClose,onLocate,onClear}:Props){
 const [response,setResponse]=useState(''),[replyId,setReplyId]=useState(requestId),[now,setNow]=useState(Date.now);
 const isSender=active.sourceUser===c.session?.userId;
 const heading=active.intent==='Look at this'?'Shared reference':`${active.intent} request`;
 const replyLabel=isSender?`Follow up with User ${active.targetUser}`:`Reply to User ${active.sourceUser}`;
 const status=active.archivedAt?'Resolved':active.status==='reviewed'?(isSender?`Reviewed by User ${active.targetUser}`:'You reviewed this'):'Awaiting review';
 useEffect(()=>{setResponse('');setReplyId(requestId());},[active.id]);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer);},[]);
 const message=(id:string,user:string,text:string,date:string)=><article className="conversation-message" key={id}><span className={`conversation-avatar user-${user}`} aria-hidden="true">{user}</span><div className="conversation-message-copy"><div className="conversation-message-meta"><strong>User {user}</strong><time dateTime={date} title={new Date(date).toLocaleString()}>{conversationTime(date,now)}</time></div><p className={text?'conversation-body':'conversation-empty'}>{text||'No additional note'}</p></div></article>;
 return <section className="reference-detail comment-thread">
  <header className="conversation-header" data-panel-drag-handle title="Drag to move panel"><div className="conversation-heading"><h3>{heading}</h3><span className="conversation-status" role="status">{status}</span></div><div className="conversation-header-actions"><button type="button" aria-label="Locate reference" title="Locate reference" onClick={()=>onLocate(active)}><Crosshair size={15}/></button>{active.targetUser===c.session?.userId&&<button type="button" aria-label={active.status==='reviewed'?'Reviewed':'Mark reviewed'} title={active.status==='reviewed'?'Reviewed':'Mark reviewed'} disabled={c.busy||!c.connected||!!active.archivedAt||active.status==='reviewed'} onClick={async()=>{const result=await c.review(active.id);if(result)onClear();}}><CheckCircle2 size={16}/></button>}<button type="button" aria-label={active.archivedAt?'Reopen reference':'Mark as resolved'} title={active.archivedAt?'Reopen reference':'Mark as resolved'} disabled={c.busy||!c.connected} onClick={async()=>{const result=await c.archive(active.id,!active.archivedAt);if(result)onClear();}}>{active.archivedAt?<RotateCcw size={15}/>:<Archive size={15}/>}</button>{onClose&&<button type="button" aria-label="Close conversation" title="Close conversation" onClick={onClose}><X size={16}/></button>}</div></header>
  <div className="conversation-thread-messages">{message(active.id,active.sourceUser,active.message,active.createdAt)}<div className="conversation-thread-replies" aria-live="polite">{active.responses.map(reply=>message(reply.id,reply.userId,reply.message,reply.createdAt))}</div></div>
  {(active.comparison||active.elementIds.length>1)&&<details className="conversation-reference-details"><summary>Reference details</summary>{active.intent==='Compare'?<ComparisonOverview proposedChanges={<SharedDesignChanges reference={active} collaboration={c}/>} context={active.comparison} contextId={active.id} ids={active.elementIds} nodes={nodes} user={c.session?.userId}/>:<><ComparisonContext context={active.comparison} nodes={nodes} user={c.session?.userId}/><PropertyComparison ownership={active.comparison} contextId={active.id} ids={active.elementIds} nodes={nodes} expanded/></>}</details>}
  <form className="conversation-reply" onSubmit={async e=>{e.preventDefault();if(c.busy||!c.connected||active.archivedAt||!response.trim())return;const result=await c.respond(active.id,response,replyId);if(result){setResponse('');setReplyId(requestId());}}}><span className={`conversation-avatar user-${c.session?.userId||'A'}`} aria-hidden="true">{c.session?.userId||'A'}</span><div className="conversation-reply-field"><textarea placeholder="Reply…" rows={1} aria-label={replyLabel} disabled={!!active.archivedAt} maxLength={2000} value={response} onChange={e=>setResponse(e.target.value)}/><button type="submit" aria-label={c.busy?'Sending response':'Send response'} title="Send response" disabled={c.busy||!c.connected||!!active.archivedAt||!response.trim()}><ArrowUp size={16}/></button></div></form>
 </section>;
}
