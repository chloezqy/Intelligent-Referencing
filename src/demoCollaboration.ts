import {DOCUMENT_ID,RoomSnapshot,SharedReference,ReferenceDraft,ReferenceIntent,SelectionPresence,ComparisonContext} from './collaboration';
import {MOCK_NODES} from './data';
import {mentionedUsers} from './mentions';
import {ruleBasedInterpreter} from './comparisonContext';
export const DEMO_KEY='sr-demo-v1';
export const freshDemo=():RoomSnapshot=>({code:'demo',documentId:DOCUMENT_ID,revision:0,members:[{userId:'A',online:true},{userId:'B',online:true}],references:[]});
export const demoPeer=():SelectionPresence=>({userId:'B',elementIds:['sc1-cta'],exemplarIds:['sc1-cta'],scope:'exemplars',method:'conventional',revision:1});
export function demoShare(room:RoomSnapshot,draft:ReferenceDraft,intent:ReferenceIntent,message:string,id:string,inviteNow=false):RoomSnapshot{
 if(room.references.some(r=>r.id===id))return room;
 const valid=new Set(MOCK_NODES.filter(n=>n.type!=='screen').map(n=>n.id));
 if(!draft.elementIds.length||draft.elementIds.some(id=>!valid.has(id)))throw new Error('Select valid design objects.');
 const at=new Date().toISOString(),mentions=mentionedUsers(message,room.members);
 const ref:SharedReference={...structuredClone(draft),id,simulated:true,sourceUser:'A',targetUser:'B',intent,message,createdAt:at,status:'open',mentions,notificationRecipients:mentions.filter(id=>id!=='A'),responses:[],activity:[],attention:inviteNow?[{id:`${id}-invite`,sourceUser:'A',targetUser:'B',createdAt:at}]:[]};
 return {...room,revision:room.revision+1,references:[...room.references,ref]};
}
/** Explicitly scripted evidence, never a real participant observation or model output. */
export function simulateRecipient(ref:SharedReference):SharedReference{
 if(ref.archivedAt||ref.responses.some(r=>r.id===`${ref.id}-demo-reply`))return ref;
 const at=new Date().toISOString();
 return {...ref,status:'reviewed',reviewedAt:at,activity:[...(ref.activity||[]),{id:`${ref.id}-demo-open`,userId:'B',kind:'opened',elementIds:[],at},{id:`${ref.id}-demo-locate`,userId:'B',kind:'located',elementIds:[...ref.elementIds],at}],responses:[...ref.responses,{id:`${ref.id}-demo-reply`,userId:'B',message:ref.intent==='Compare'?'[Simulated User B] I opened both sets of targets. Compare their labels, dimensions and styles in Property comparison.':'[Simulated User B] I opened the referenced objects and acknowledged your request. This is a scripted demo response.',createdAt:at}],attention:ref.attention?.map(a=>a.targetUser==='B'?{...a,viewedAt:at}:a)};
}
export function demoComparison(a:SelectionPresence,b:SelectionPresence,id:string):ComparisonContext{
 if(!a.elementIds.length||!b.elementIds.length)throw new Error('Both selections need objects.');
 return {snapshotId:id,selections:structuredClone({A:a,B:b}),purpose:'',interpretation:ruleBasedInterpreter.interpret(a.elementIds,b.elementIds,MOCK_NODES)};
}
