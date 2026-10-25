import {useEffect,useRef,useState} from 'react';
import type {CollaborationClient} from './collaborationClient';
import type {RoomSnapshot,SharedReference,SelectionPresence} from './collaboration';
import {DEMO_KEY,freshDemo,demoPeer,demoShare,simulateRecipient,demoComparison} from './demoCollaboration';
// No transport, room tokens or network requests belong in this adapter.
export function useDemoCollaboration(enabled:boolean):CollaborationClient{
 const [room,setRoom]=useState<RoomSnapshot>(()=>{if(enabled)try{const saved=JSON.parse(localStorage.getItem(DEMO_KEY)||'null');if(saved?.code==='demo'&&saved.documentId===freshDemo().documentId&&Array.isArray(saved.references))return saved;}catch{}return freshDemo();});
 const [selections,setSelections]=useState<CollaborationClient['selections']>({B:demoPeer()});
 const current=useRef(room);current.current=room;
 const selectionRef=useRef(selections);selectionRef.current=selections;
 const [error,setError]=useState('');
 const commit=(next:RoomSnapshot)=>{current.current=next;setRoom(next);};
 const mutate=(id:string,fn:(ref:SharedReference)=>SharedReference)=>{const old=current.current;if(!old.references.some(r=>r.id===id))throw new Error('Reference not found.');commit({...old,revision:old.revision+1,references:old.references.map(r=>r.id===id?fn(r):r)});return {ok:true};};
 async function action<T>(fn:()=>T):Promise<T|undefined>{try{setError('');return fn();}catch(e){setError(e instanceof Error?e.message:'Demo action failed.');return undefined;}}
 useEffect(()=>{if(!enabled)return;try{localStorage.setItem(DEMO_KEY,JSON.stringify(room));}catch{setError('Demo storage unavailable. Changes last only while this tab stays open.');}},[enabled,room]);
 // One predictable response per newly shared request; pending scenarios resume on refresh.
 useEffect(()=>{if(!enabled||!room.references.some(r=>!r.archivedAt&&!r.responses.some(e=>e.id===`${r.id}-demo-reply`)))return;
 const timer=setTimeout(()=>{const old=current.current;commit({...old,revision:old.revision+1,references:old.references.map(simulateRecipient)});},1200);return()=>clearTimeout(timer);
 },[enabled,room]);
 return {mode:'demo',session:enabled?{code:'demo',userId:'A',token:'local-demo-only'}:null,room:enabled?room:null,selections,cursors:{},connected:enabled,busy:false,error,initialCode:'',invitation:'',
 publishSelection:async body=>{const previous=selectionRef.current.A;if(previous&&JSON.stringify([previous.elementIds,previous.exemplarIds,previous.scope,previous.method])===JSON.stringify([body.elementIds,body.exemplarIds,body.scope,body.method]))return;const next={...selectionRef.current,A:{...structuredClone(body),userId:'A' as const,revision:(previous?.revision||0)+1}};selectionRef.current=next;setSelections(next);},
 cursor:async()=>{},create:async()=>undefined,join:async()=>undefined,
 comparisonDraft:()=>action(()=>{const a=selectionRef.current.A,b=selectionRef.current.B;if(!a||!b)throw new Error('Select objects before comparing.');return demoComparison(a,b,crypto.randomUUID());}),
 share:(draft,intent,message,id,inviteNow)=>action(()=>{const next=demoShare(current.current,draft,intent,message,id,inviteNow);commit(next);return next.references.find(r=>r.id===id)!;}),
 activity:(id,kind,elementIds=[])=>action(()=>mutate(id,r=>{if(r.archivedAt)throw new Error('Restore this reference first.');if(elementIds.some(id=>!r.elementIds.includes(id)))throw new Error('Invalid reference targets.');if(r.activity?.some(e=>e.userId==='A'&&e.kind===kind&&JSON.stringify(e.elementIds)===JSON.stringify(elementIds)))return r;return {...r,activity:[...(r.activity||[]),{id:crypto.randomUUID(),userId:'A',kind,elementIds,at:new Date().toISOString()}]};})),
 respond:(id,message,responseId)=>action(()=>mutate(id,r=>{if(r.archivedAt||!message.trim())throw new Error('Write a response to an active reference.');return r.responses.some(e=>e.id===responseId)?r:{...r,responses:[...r.responses,{id:responseId,userId:'A',message,createdAt:new Date().toISOString()}]};})),
 review:()=>action(()=>{throw new Error('Only the recipient can mark reviewed; User B is simulated in demo mode.');}),
 archive:(id,archived)=>action(()=>mutate(id,r=>({...r,archivedAt:archived?new Date().toISOString():undefined,archivedBy:archived?'A':undefined}))),
 inviteAttention:(id,requestId)=>action(()=>mutate(id,r=>{if(r.archivedAt)throw new Error('Restore this reference first.');return r.attention?.some(e=>e.id===requestId)?r:{...r,attention:[...(r.attention||[]),{id:requestId,sourceUser:'A',targetUser:'B',createdAt:new Date().toISOString(),viewedAt:new Date().toISOString()}]};})),
 viewAttention:()=>action(()=>({ok:true})),
 resetDemo:()=>{const fresh=freshDemo();try{localStorage.setItem(DEMO_KEY,JSON.stringify(fresh));}catch{}commit(fresh);setSelections({B:demoPeer()});selectionRef.current={B:demoPeer()};setError('');},
 };
}
