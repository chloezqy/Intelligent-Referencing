import React from 'react';
import ReviewFocus from './ReviewFocus';
import type {UIElement} from '../types';
import MentionNote from './MentionNote';
import {mentionedUsers} from '../mentions';
import {ReferenceIntent} from '../collaboration';
import type {CollaborationClient} from '../collaborationClient';
export default function ReferenceSharingControls({comparison=false,inspector=true,c,note,intent,onNote,onIntent,nodes,elementIds}:{comparison?:boolean;inspector?:boolean;c:CollaborationClient;note:string;intent:ReferenceIntent;onNote:(value:string)=>void;onIntent:(value:ReferenceIntent)=>void;nodes?:UIElement[];elementIds?:string[]}){
 return <>
        {!(inspector&&comparison)&&<label>Request intent<input type="text" aria-label="Intended action" placeholder="What would you like them to do?" required maxLength={120} disabled={!!comparison} value={intent} onChange={e=>onIntent(e.target.value)}/></label>}

        <MentionNote value={note} onChange={onNote} members={c.room?.members||[]} self={c.session?.userId}/>{mentionedUsers(note,c.room?.members||[]).filter(id=>id!==c.session?.userId).length>0&&<p className="subtle">Notifying {mentionedUsers(note,c.room?.members||[]).filter(id=>id!==c.session?.userId).map(id=>`User ${id}`).join(', ')}</p>}
        {intent.trim().toLowerCase()==='review'&&note.trim()&&nodes&&elementIds?.length&&<ReviewFocus reference={{id:'sharing-draft',elementIds,message:note}} nodes={nodes} onUseContext={context=>{const next=`${note.trim().replace(/\n\nReview focus: [^\n]*$/, '')}\n\nReview focus: ${context}`;onNote(next);return next;}}/>}
  </>;
}
