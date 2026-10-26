import type {CollaborationClient} from '../collaborationClient';
import ComparisonContext from './ComparisonContext';
import ComparisonOverview from './ComparisonOverview';
import React, { useState, useEffect } from 'react';
import PropertyComparison from './PropertyComparison';
import { SharedReference } from '../collaboration';
import { UIElement } from '../types';
import { requestId } from '../useCollaboration';
interface Props {key?:string;active:SharedReference;nodes:UIElement[];collaboration:CollaborationClient;onLocate:(ref:SharedReference)=>void;onClear:()=>void}
export default function ReferenceConversation({active,nodes,collaboration:c,onLocate,onClear}:Props){
 const [response,setResponse]=useState(''),[replyId,setReplyId]=useState(requestId);
 const isSender=active.sourceUser===c.session?.userId;
 const heading=isSender?`Your request to User ${active.targetUser}`:`Request from User ${active.sourceUser}`;
 const replyLabel=isSender?`Follow up with User ${active.targetUser}`:`Reply to User ${active.sourceUser}`;
 const status=active.archivedAt?'Archived':active.status==='reviewed'?(isSender?`Reviewed by User ${active.targetUser}`:'You reviewed this'):(isSender?`Awaiting User ${active.targetUser}’s review`:'Awaiting your review');
 useEffect(()=>{setResponse('');setReplyId(requestId());},[active.id]);
 return (<section className="reference-detail">
      {active.intent==='Compare'&&<ComparisonOverview context={active.comparison} contextId={active.id} ids={active.elementIds} nodes={nodes} user={c.session?.userId}/>}
      <div className="conversation-heading"><h3>{heading}</h3></div>
      <p className={`conversation-intent user-${active.sourceUser}`}>{active.intent}</p>
      <p className="conversation-status" role="status">{status}</p>
      <p className="conversation-note-label">{isSender?'Your note':`User ${active.sourceUser}’s note`}</p>
      <p>{active.message || 'No additional note.'}</p>
      {active.intent!=='Compare'&&active.comparison&&<ComparisonContext context={active.comparison} nodes={nodes} user={c.session?.userId}/>}
      {active.intent!=='Compare'&&<PropertyComparison ownership={active.comparison} contextId={active.id} ids={active.elementIds} nodes={nodes} expanded={false}/>}
      <div className="responses" aria-live="polite">{active.responses.map(reply=><div key={reply.id}><strong className={`user-${reply.userId}`}>{reply.userId===c.session?.userId?'You · ':''}User {reply.userId}</strong><p>{reply.message}</p><small>{new Date(reply.createdAt).toLocaleString()}</small></div>)}</div>
      <form onSubmit={async e=>{e.preventDefault();const result=await c.respond(active.id,response,replyId);if(result){setResponse('');setReplyId(requestId());}}}>
        <label>{replyLabel}<textarea aria-label={replyLabel} disabled={!!active.archivedAt} maxLength={2000} value={response} onChange={e=>setResponse(e.target.value)}/></label>
        <button disabled={c.busy||!c.connected||!!active.archivedAt||!response.trim()}>Send response</button>
      </form>
      {active.targetUser===c.session?.userId&&<div className="review-action"><button disabled={c.busy||!c.connected||!!active.archivedAt||active.status==='reviewed'} onClick={async()=>{const result=await c.review(active.id);if(result)onClear();}}>{active.status==='reviewed'?'Reviewed':'Mark reviewed'}</button></div>}
    </section>);
}
