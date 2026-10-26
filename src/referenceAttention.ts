import {SharedReference,UserId,AttentionRequest} from './collaboration';
export function nextAttention(references:SharedReference[],user:UserId|undefined,dismissed:string[]){
 if(!user)return undefined;
 return references.filter(r=>!r.archivedAt).flatMap(reference=>{
  const requests=reference.attention||[];
  const pending=requests.filter(i=>i.targetUser===user&&!i.viewedAt).map(invitation=>({key:invitation.id,sourceUser:invitation.sourceUser,createdAt:invitation.createdAt,reference,invitation:invitation as AttentionRequest|undefined}));
  if(reference.attention===undefined&&reference.intent==='Look at this'&&reference.targetUser===user&&reference.status==='open'&&!reference.activity?.some(e=>e.userId===user&&(e.kind==='located'||e.kind==='opened')))pending.push({key:reference.id,sourceUser:reference.sourceUser,createdAt:reference.createdAt,reference,invitation:undefined});
  return pending;
 }).filter(i=>!dismissed.includes(i.key)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
}


export const NUDGE_DISMISSALS_KEY='sr-nudge-dismissals-v1';
export function nudgeScope(mode:string,room:string,user:UserId){return `${mode}:${room}:${user}`;}
export function parseNudgeDismissals(raw:string|null):Record<string,string[]> {
 try{const value=JSON.parse(raw||'{}');if(!value||typeof value!=='object'||Array.isArray(value))return {};
 return Object.fromEntries(Object.entries(value).filter(([,ids])=>Array.isArray(ids)&&ids.every(id=>typeof id==='string'))) as Record<string,string[]>;}catch{return {};}
}
/** Silence only currently known banner events; a future invitation has a new ID. */
export function dismissedReferenceKeys(reference:SharedReference,user?:UserId){
 return [reference.id,`mention:${reference.id}`,...(reference.attention||[]).filter(i=>i.targetUser===user&&!i.viewedAt).map(i=>i.id)];
}

export function referenceRequestSender(reference:SharedReference,user?:UserId){
 return [...(reference.attention||[])].filter(i=>i.targetUser===user&&!i.viewedAt).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0]?.sourceUser||reference.sourceUser;
}
