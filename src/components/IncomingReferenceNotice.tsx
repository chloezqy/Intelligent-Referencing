import React,{useEffect,useState} from 'react';
import type {SharedReference} from '../collaboration';
import type {UIElement} from '../types';
import {conversationTime} from './ReferenceConversation';
export default function IncomingReferenceNotice({reference,nodes,connected,onView,onLater}:{reference:SharedReference;nodes:UIElement[];connected:boolean;onView:()=>void;onLater:()=>void}){
 const [now,setNow]=useState(Date.now);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer);},[]);
 const ids=[...new Set(reference.elementIds)];
 const label=ids.length===1?nodes.find(node=>node.id===ids[0])?.label||reference.label||'Shared layer':`${ids.length} layers selected`;
 return <div className="attention-notice incoming-reference-notice" role="status"><span className={`incoming-reference-avatar user-${reference.sourceUser}`} aria-hidden="true">{reference.sourceUser}</span><div className="incoming-reference-copy"><strong title={`User ${reference.sourceUser} shared a reference`}>User {reference.sourceUser} shared a reference</strong><small><span title={label}>{label}</span><span aria-hidden="true"> · </span><time dateTime={reference.createdAt} title={new Date(reference.createdAt).toLocaleString()}>{conversationTime(reference.createdAt,now)}</time></small></div><button type="button" className="incoming-reference-view" disabled={!connected} onClick={onView}>View reference</button><button type="button" className="incoming-reference-later" onClick={onLater}>Later</button></div>;
}
