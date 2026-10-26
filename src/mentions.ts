import type {SharedReference,UserId} from './collaboration';
export interface MentionParticipant {userId:UserId;online:boolean}
/** Plain text canonical tokens; server resolves only identities actually in the room. */
export function mentionedUsers(text:string,members:readonly {userId:UserId}[]):UserId[]{
 const available=new Set(members.map(m=>m.userId)),found=new Set<UserId>();
 for(const match of text.matchAll(/(?:^|[\s([{])@User[ \t]+([AB])(?=$|[\s.,!?;:)\]}])/gi)){const id=match[1].toUpperCase() as UserId;if(available.has(id))found.add(id);}
 return [...found];
}
export function mentionQueryAt(text:string,caret:number):{start:number;query:string}|null{
 const prefix=text.slice(0,caret),match=prefix.match(/(?:^|[\s([{])@([^@\n]{0,40})$/);
 if(!match||/^User [AB]\s/i.test(match[1]))return null;
 return {start:prefix.lastIndexOf('@'),query:match[1]};
}
export function insertMention(text:string,start:number,end:number,userId:UserId){
 const token=`@User ${userId} `;return {text:text.slice(0,start)+token+text.slice(end),caret:start+token.length};
}
export function unreadMention(reference:SharedReference,user?:UserId){return !!user&&!!reference.notificationRecipients?.includes(user)&&!reference.archivedAt&&!reference.activity?.some(e=>e.userId===user&&e.kind==='opened');}
export function needsReferenceNotification(reference:SharedReference,user?:UserId){
 if(!user||reference.archivedAt)return false;
 if(reference.attention?.some(invitation=>invitation.targetUser===user&&!invitation.viewedAt))return true;
 if(reference.status==='reviewed')return false;
 if(reference.simulated||reference.notificationRecipients===undefined)return reference.targetUser===user&&!reference.activity?.some(event=>event.userId===user&&event.kind==='opened');
 return unreadMention(reference,user);
}
