import {DOCUMENT_ID,RoomSnapshot,SharedReference,ReferenceDraft,ReferenceIntent,SelectionPresence,ComparisonContext,UserId,validateDesignReference} from './collaboration';
import {MOCK_NODES} from './data';
import {mentionedUsers} from './mentions';
import {ruleBasedInterpreter} from './comparisonContext';
export const DEMO_KEY='sr-demo-v1';
export const freshDemo=():RoomSnapshot=>({code:'demo',documentId:DOCUMENT_ID,revision:0,members:[{userId:'A',online:true},{userId:'B',online:true}],references:[]});
export function demoShare(room:RoomSnapshot,draft:ReferenceDraft,intent:ReferenceIntent,message:string,id:string,inviteNow=false,sourceUser:UserId='A'):RoomSnapshot{
 if(room.references.some(r=>r.id===id))return room;
 const valid=new Set(MOCK_NODES.filter(n=>n.type!=='screen').map(n=>n.id));
 if(!draft.elementIds.length||draft.elementIds.some(id=>!valid.has(id)))throw new Error('Select valid design objects.');
 const at=new Date().toISOString(),mentions=mentionedUsers(message,room.members);
 const comparison=draft.comparison?structuredClone(draft.comparison):undefined;
 if(comparison){const designReference=validateDesignReference(comparison.purpose,comparison.designReference,comparison.selections,comparison.sides,draft.document||MOCK_NODES);if(designReference)comparison.designReference=designReference;else delete comparison.designReference;}

 const {document:documentSnapshot,...storedDraft}=draft;
 const ref:SharedReference={...structuredClone(storedDraft),...(comparison?{comparison}:{}),id,simulated:true,sourceUser,targetUser:sourceUser==='A'?'B':'A',intent,message,createdAt:at,status:'open',mentions,notificationRecipients:mentions.filter(id=>id!==sourceUser),responses:[],activity:[],attention:inviteNow?[{id:`${id}-invite`,sourceUser,targetUser:sourceUser==='A'?'B':'A',createdAt:at}]:[]};
 return {...room,revision:room.revision+1,references:[...room.references,ref]};
}
export function demoComparison(a:SelectionPresence,b:SelectionPresence,id:string):ComparisonContext{
 if(!a.elementIds.length||!b.elementIds.length)throw new Error('Both selections need objects.');
 return {snapshotId:id,selections:structuredClone({A:a,B:b}),purpose:'',interpretation:ruleBasedInterpreter.interpret(a.elementIds,b.elementIds,MOCK_NODES)};
}
