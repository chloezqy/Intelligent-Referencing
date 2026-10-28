import React,{useEffect,useId,useState} from 'react';
import {createPortal} from 'react-dom';
import ReferenceSharingControls from './ReferenceSharingControls';
import {requestId} from '../useCollaboration';
import type {CollaborationClient} from '../collaborationClient';
import type {ReferenceDraft,ReferenceIntent} from '../collaboration';
import type {InferredReference,UIElement} from '../types';
export default function SelectionSharing({research,selection,nodes,collaboration:c,footerHost,note,intent,onNote,onIntent,onShared}:{research?:ReferenceDraft['research'];selection:InferredReference;nodes:UIElement[];collaboration:CollaborationClient;footerHost:HTMLElement|null;note:string;intent:ReferenceIntent;onNote:(value:string)=>void;onIntent:(value:ReferenceIntent)=>void;onShared:(id:string)=>void}){
 const formId=useId(),[inviteNow,setInviteNow]=useState(false),[sendId,setSendId]=useState(requestId);
 const key=selection.selectedIds.join('|');
 useEffect(()=>{setInviteNow(false);},[key]);
 useEffect(()=>{setSendId(requestId());},[key,note,intent,inviteNow]);
 const disabled=c.busy||!c.connected||!c.room||c.room.members.length<2||!selection.selectedIds.length;
 return <section className="selection-inspector-sharing"><h4 className="selection-section-title">Sharing options</h4><form id={formId} onSubmit={async event=>{event.preventDefault();if(disabled)return;const result=await c.share({elementIds:[...selection.selectedIds],exemplarIds:selection.exemplarIds.filter(id=>selection.selectedIds.includes(id)),scope:selection.scope,label:selection.label,document:nodes,...(research?{research}:{})},intent,note,sendId,inviteNow);if(result){setSendId(requestId());onShared(result.id);}}}>
  <ReferenceSharingControls c={c} note={note} intent={intent} onNote={onNote} onIntent={onIntent} inviteNow={inviteNow} setInviteNow={setInviteNow}/>
  {!c.connected?<p className="subtle">Connect to a room to share.</p>:c.room&&c.room.members.length<2?<p className="subtle">Invite a teammate to the room before sharing.</p>:null}{c.error&&<p role="alert">{c.error}</p>}
 </form>{footerHost&&createPortal(<div className="action-row share-form-footer selection-share-footer"><button className="primary-action" form={formId} type="submit" disabled={disabled}>{c.busy?'Sending…':'Share reference'}</button></div>,footerHost)}</section>;
}
