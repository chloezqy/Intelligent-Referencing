import React from 'react';
import SenderNote from './SenderNote';
import type {UIElement} from '../types';
import MentionNote from './MentionNote';
import {mentionedUsers} from '../mentions';
import {ReferenceIntent} from '../collaboration';
import type {CollaborationClient} from '../collaborationClient';
export default function ReferenceSharingControls({senderAssistance=false,comparison=false,inspector=true,c,note,intent,onNote,onIntent,nodes,elementIds}:{senderAssistance?:boolean;comparison?:boolean;inspector?:boolean;c:CollaborationClient;note:string;intent:ReferenceIntent;onNote:(value:string)=>void;onIntent:(value:ReferenceIntent)=>void;nodes?:UIElement[];elementIds?:string[]}){
 return <>
        {!(inspector&&comparison)&&<label>{senderAssistance?'Request':'Request intent'}<input type="text" aria-label="Intended action" placeholder="What would you like them to do?" required maxLength={120} disabled={!!comparison} value={intent} onChange={e=>onIntent(e.target.value)}/></label>}

        {senderAssistance&&nodes&&elementIds?<SenderNote note={note} onNote={onNote} request={intent} ids={elementIds} nodes={nodes} members={c.room?.members||[]} self={c.session?.userId}/>:<MentionNote value={note} onChange={onNote} members={c.room?.members||[]} self={c.session?.userId}/>}{mentionedUsers(note,c.room?.members||[]).filter(id=>id!==c.session?.userId).length>0&&<p className="subtle">Notifying {mentionedUsers(note,c.room?.members||[]).filter(id=>id!==c.session?.userId).map(id=>`User ${id}`).join(', ')}</p>}
  </>;
}
