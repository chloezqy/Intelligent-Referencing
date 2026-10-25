import {useEffect,useRef,useState} from 'react';
import type {CollaborationClient} from './collaborationClient';
import type {RoomSnapshot,SharedReference,UserId} from './collaboration';
import {DEMO_KEY,freshDemo,demoShare,demoComparison} from './demoCollaboration';
// No transport, room tokens or network requests belong in this adapter.
export function useDemoCollaboration(enabled:boolean):CollaborationClient{
 const [room,setRoom]=useState<RoomSnapshot>(()=>{if(enabled)try{const saved=JSON.parse(localStorage.getItem(DEMO_KEY)||'null');if(saved?.code==='demo'&&saved.documentId===freshDemo().documentId&&Array.isArray(saved.references))return saved;}catch{}return freshDemo();});
 const [user,setUser]=useState<UserId>(()=>{try{return enabled&&localStorage.getItem('sr-demo-perspective')==='B'?'B':'A';}catch{return 'A';}});
 const [selections,setSelections]=useState<CollaborationClient['selections']>({});
 const current=useRef(room);current.current=room;
 const selectionRef=useRef(selections);selectionRef.current=selections;
 const [error,setError]=useState('');
 const commit=(next:RoomSnapshot)=>{current.current=next;setRoom(next);};
 const mutate=(id:string,fn:(ref:SharedReference)=>SharedReference)=>{const old=current.current;if(!old.references.some(r=>r.id===id))throw new Error('Reference not found.');commit({...old,revision:old.revision+1,references:old.references.map(r=>r.id===id?fn(r):r)});return {ok:true};};
 async function action<T>(fn:()=>T):Promise<T|undefined>{try{setError('');return fn();}catch(e){setError(e instanceof Error?e.message:'Demo action failed.');return undefined;}}
 useEffect(()=>{if(!enabled)return;try{localStorage.setItem(DEMO_KEY,JSON.stringify(room));}catch{setError('Demo storage unavailable. Changes last only while this tab stays open.');}},[enabled,room]);
 return {mode:'demo',session:enabled?{code:'demo',userId:user,token:'local-demo-only'}:null,room:enabled?room:null,selections,cursors:{},connected:enabled,busy:false,error,initialCode:'',invitation:'',
 publishSelection:async body=>{const previous=selectionRef.current[user];if(previous&&JSON.stringify([previous.elementIds,previous.exemplarIds,previous.scope,previous.method])===JSON.stringify([body.elementIds,body.exemplarIds,body.scope,body.method]))return;const next={...selectionRef.current,[user]:{...structuredClone(body),userId:user,revision:(previous?.revision||0)+1}};selectionRef.current=next;setSelections(next);},
 cursor:async()=>{},create:async()=>undefined,join:async()=>undefined,
 comparisonDraft:()=>action(()=>{const a=selectionRef.current.A,b=selectionRef.current.B;if(!a||!b)throw new Error('Select objects before comparing.');return demoComparison(a,b,crypto.randomUUID());}),
 share:(draft,intent,message,id,inviteNow)=>action(()=>{const next=demoShare(current.current,draft,intent,message,id,inviteNow,user);commit(next);return next.references.find(r=>r.id===id)!;}),
 activity:(id,kind,elementIds=[])=>action(()=>mutate(id,r=>{if(r.archivedAt)throw new Error('Restore this reference first.');if(elementIds.some(id=>!r.elementIds.includes(id)))throw new Error('Invalid reference targets.');if(r.activity?.some(e=>e.userId===user&&e.kind===kind&&JSON.stringify(e.elementIds)===JSON.stringify(elementIds)))return r;return {...r,activity:[...(r.activity||[]),{id:crypto.randomUUID(),userId:user,kind,elementIds,at:new Date().toISOString()}]};})),
 respond:(id,message,responseId)=>action(()=>mutate(id,r=>{if(r.archivedAt||!message.trim())throw new Error('Write a response to an active reference.');return r.responses.some(e=>e.id===responseId)?r:{...r,responses:[...r.responses,{id:responseId,userId:user,message,createdAt:new Date().toISOString()}]};})),
 review:id=>action(()=>mutate(id,r=>{if(r.targetUser!==user)throw new Error('Only the recipient can mark reviewed.');if(r.archivedAt)throw new Error('Restore this reference first.');return r.status==='reviewed'?r:{...r,status:'reviewed',reviewedAt:new Date().toISOString()};})),
 archive:(id,archived)=>action(()=>mutate(id,r=>({...r,archivedAt:archived?new Date().toISOString():undefined,archivedBy:archived?user:undefined}))),
 inviteAttention:(id,requestId)=>action(()=>mutate(id,r=>{if(r.archivedAt)throw new Error('Restore this reference first.');return r.attention?.some(e=>e.id===requestId)?r:{...r,attention:[...(r.attention||[]),{id:requestId,sourceUser:user,targetUser:user==='A'?'B':'A',createdAt:new Date().toISOString()}]};})),
 viewAttention:(id,invitationId)=>action(()=>mutate(id,r=>({...r,attention:r.attention?.map(a=>{if(a.id!==invitationId)return a;if(a.targetUser!==user)throw new Error('Only the recipient can view this invitation.');return {...a,viewedAt:a.viewedAt||new Date().toISOString()};})}))),
 setPerspective:next=>{setUser(next);setError('');try{localStorage.setItem('sr-demo-perspective',next);}catch{}},
 resetDemo:()=>{const fresh=freshDemo();try{localStorage.setItem(DEMO_KEY,JSON.stringify(fresh));}catch{}commit(fresh);setSelections({});selectionRef.current={};setError('');},
 };
}
