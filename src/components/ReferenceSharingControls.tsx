import React from 'react';
import MentionNote from './MentionNote';
import {mentionedUsers} from '../mentions';
import {ReferenceIntent} from '../collaboration';
import type {CollaborationClient} from '../collaborationClient';
export default function ReferenceSharingControls({comparison=false,inspector=true,c,note,intent,onNote,onIntent,inviteNow,setInviteNow}:{comparison?:boolean;inspector?:boolean;c:CollaborationClient;note:string;intent:ReferenceIntent;onNote:(value:string)=>void;onIntent:(value:ReferenceIntent)=>void;inviteNow:boolean;setInviteNow:(value:boolean)=>void}){
 const target=c.session?.userId==='B'?'A':'B';
 return <>
        {!(inspector&&comparison)&&<label>Request intent<input type="text" aria-label="Intended action" placeholder="What would you like them to do?" required maxLength={120} disabled={!!comparison} value={intent} onChange={e=>onIntent(e.target.value)}/></label>}

        <MentionNote value={note} onChange={onNote} members={c.room?.members||[]} self={c.session?.userId}/><label className="invite-now"><input type="checkbox" checked={inviteNow} onChange={e=>setInviteNow(e.target.checked)}/>Invite mentioned teammates to view now</label>{inspector&&inviteNow&&!mentionedUsers(note,c.room?.members||[]).some(id=>id!==c.session?.userId)&&<p className="subtle">Invites User {target}, the default recipient.</p>}{mentionedUsers(note,c.room?.members||[]).filter(id=>id!==c.session?.userId).length>0&&<p className="subtle">Notifying {mentionedUsers(note,c.room?.members||[]).filter(id=>id!==c.session?.userId).map(id=>`User ${id}`).join(', ')}</p>}
  </>;
}
