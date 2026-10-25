import type {CollaboratorCursor,ComparisonContext,ReferenceDraft,ReferenceIntent,RoomSnapshot,SelectionPresence,Session,SharedReference} from './collaboration';
export type CollaborationMode='demo'|'realtime';
export interface CollaborationClient {
 mode:CollaborationMode; session:Session|null;room:RoomSnapshot|null;
 selections:Partial<Record<'A'|'B',SelectionPresence>>;cursors:Partial<Record<'A'|'B',CollaboratorCursor>>;
 connected:boolean;busy:boolean;error:string;initialCode:string;invitation:string;
 publishSelection(body:Omit<SelectionPresence,'userId'|'revision'>):Promise<void>;
 cursor(x:number,y:number,visible:boolean):Promise<void>;
 comparisonDraft():Promise<ComparisonContext|undefined>;
 create():Promise<unknown>;join(input:string):Promise<unknown>;
 share(draft:ReferenceDraft,intent:ReferenceIntent,message:string,id:string,inviteNow?:boolean):Promise<SharedReference|undefined>;
 inviteAttention(id:string,requestId:string):Promise<unknown>;
 viewAttention(id:string,invitationId:string):Promise<unknown>;
 respond(id:string,message:string,responseId:string):Promise<unknown>;
 review(id:string):Promise<unknown>;
 activity(id:string,kind:'opened'|'located',elementIds?:string[]):Promise<unknown>;
 archive(id:string,archived:boolean):Promise<unknown>;
 setPerspective?(user: 'A'|'B'):void;
 resetDemo?():void;
}
export function collaborationMode(search:string):CollaborationMode {
 const params=new URLSearchParams(search);
 return params.get('mode')==='realtime'||(params.has('room')&&params.get('mode')!=='demo')?'realtime':'demo';
}
