import {SharedDesignChanges} from './DesignChangeSuggestions';
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
 const heading=active.intent==='Look at this'?'Shared reference':`${active.intent} request`;
 const recipient=isSender?`Sent to User ${active.targetUser}`:`From User ${active.sourceUser}`;
 const replyLabel=isSender?'Follow up':`Reply to User ${active.sourceUser}`;
 const replyRecipient=isSender?active.targetUser:active.sourceUser;
 const status=active.archivedAt?'Archived':active.status==='reviewed'?(isSender?`Reviewed by User ${active.targetUser}`:'You reviewed this'):'Awaiting review';
 useEffect(()=>{setResponse('');setReplyId(requestId());},[active.id]);
 return (<section className="reference-detail">
      <header className="conversation-header">
        <div className="conversation-heading"><h3>{heading}</h3><span className="conversation-status" role="status">{status}</span></div>
        <p className="conversation-recipient">{recipient}</p>
      </header>
      {active.intent==='Compare'&&<ComparisonOverview proposedChanges={<SharedDesignChanges reference={active} collaboration={c}/>} context={active.comparison} contextId={active.id} ids={active.elementIds} nodes={nodes} user={c.session?.userId}/>}
      <div className="conversation-note">
        <p className="conversation-note-label">{isSender?'Your note':`User ${active.sourceUser}’s note`}</p>
        <p className={active.message?'conversation-body':'conversation-empty'}>{active.message || 'No additional note'}</p>
      </div>
      {active.intent!=='Compare'&&active.comparison&&<ComparisonContext context={active.comparison} nodes={nodes} user={c.session?.userId}/>}
      {active.intent!=='Compare'&&<PropertyComparison ownership={active.comparison} contextId={active.id} ids={active.elementIds} nodes={nodes} expanded={false}/>}
      <div className="responses" aria-live="polite">{active.responses.map(reply=><div key={reply.id}><strong className={`user-${reply.userId}`}>{reply.userId===c.session?.userId?'You · ':''}User {reply.userId}</strong><p>{reply.message}</p><small>{new Date(reply.createdAt).toLocaleString()}</small></div>)}</div>
      <form className="conversation-reply" onSubmit={async e=>{e.preventDefault();const result=await c.respond(active.id,response,replyId);if(result){setResponse('');setReplyId(requestId());}}}>
        <label>{replyLabel}<textarea placeholder={`Write a message to User ${replyRecipient}…`} aria-label={isSender?`Follow up with User ${replyRecipient}`:replyLabel} disabled={!!active.archivedAt} maxLength={2000} value={response} onChange={e=>setResponse(e.target.value)}/></label>
        <div className="conversation-reply-actions"><button type="submit" disabled={c.busy||!c.connected||!!active.archivedAt||!response.trim()}>Send response</button>
          {active.targetUser===c.session?.userId&&<button type="button" disabled={c.busy||!c.connected||!!active.archivedAt||active.status==='reviewed'} onClick={async()=>{const result=await c.review(active.id);if(result)onClear();}}>{active.status==='reviewed'?'Reviewed':'Mark reviewed'}</button>}
        </div>
      </form>

    </section>);
}
