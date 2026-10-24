import {SharedReference,UserId,AttentionRequest} from './collaboration';
export function nextAttention(references:SharedReference[],user:UserId|undefined,dismissed:string[]){
 if(!user)return undefined;
 return references.filter(r=>!r.archivedAt).flatMap(reference=>{
  const requests=reference.attention||[];
  const pending=requests.filter(i=>i.targetUser===user&&!i.viewedAt).map(invitation=>({key:invitation.id,sourceUser:invitation.sourceUser,createdAt:invitation.createdAt,reference,invitation:invitation as AttentionRequest|undefined}));
  if(reference.attention===undefined&&reference.intent==='Look at this'&&reference.targetUser===user&&reference.status==='open'&&!reference.activity?.some(e=>e.userId===user&&e.kind==='located'))pending.push({key:reference.id,sourceUser:reference.sourceUser,createdAt:reference.createdAt,reference,invitation:undefined});
  return pending;
 }).filter(i=>!dismissed.includes(i.key)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
}
