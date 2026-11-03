import React,{useEffect,useState} from 'react';
import {Sparkles} from 'lucide-react';
import type {UIElement} from '../types';
import type {SharedReference} from '../collaboration';
import {ReviewFocus as Focus,REVIEW_PROPERTIES,reviewValue} from '../reviewFocus';
import {loadReviewFocus} from '../reviewFocusClient';
import {ElementPreview} from './ReferencePreviewCard';
export function ReviewFocusContent({focus,nodes,onInspect,onCompare}:{key?:string;focus:Focus;nodes:UIElement[];onInspect?:(ids:string[])=>void;onCompare?:(ids:string[])=>void}){
 const [inspected,setInspected]=useState(false);
 const referenced=nodes.find(n=>n.id===focus.referencedId),related=nodes.find(n=>n.id===focus.relatedId);
 if(!referenced)return null;
 const ids=[referenced.id,...(related?[related.id]:[])];
 return <section className="review-focus" aria-label="Possible review focus">
 <h4><Sparkles size={14}/> Possible review focus <small>AI suggestion</small></h4>
 <p>{focus.focus}</p>
 <div className="review-focus-objects">{[referenced,...(related?[related]:[])].map((node,i)=><div key={node.id}><small>{i?'Related element':'Referenced'}</small><ElementPreview element={node} nodes={nodes}/><span className="review-focus-name" title={node.label}>{node.label.replace(/^Image · /,'')}</span>{focus.property&&<span className="review-focus-value">{REVIEW_PROPERTIES[focus.property]} · {reviewValue(node,focus.property)}</span>}</div>)}</div>
 <div className="review-focus-actions">{onInspect&&<button type="button" onClick={()=>{onInspect(ids);setInspected(true);}}>Inspect on canvas →</button>}
 {inspected&&related&&onCompare&&<button type="button" onClick={()=>onCompare(ids)}>Compare</button>}</div>
 </section>;
}
export default function ReviewFocus({reference,nodes,onInspect,onCompare}:{reference:SharedReference;nodes:UIElement[];onInspect?:(ids:string[])=>void;onCompare?:(ids:string[])=>void}){

 const [state,setState]=useState<{key:string;focus?:Focus|null;loading?:boolean;error?:string;retryable?:boolean}>({key:''});
 const key=JSON.stringify([reference.id,reference.elementIds,reference.message,nodes]);
 const current=React.useRef(key);current.current=key;
 const pending=React.useRef(false);
 useEffect(()=>{pending.current=false;setState({key});},[key]);
 async function request(){
  if(pending.current)return;pending.current=true;setState({key,loading:true});
  try{const focus=await loadReviewFocus(reference.elementIds,reference.message,nodes);if(current.current===key)setState({key,focus});}
  catch(error){if(current.current===key)setState({key,error:(error as Error).message,retryable:(error as any).retryable!==false});}
  finally{if(current.current===key)pending.current=false;}
 }
 return <>{state.key===key&&state.focus&&<ReviewFocusContent key={key} focus={state.focus} nodes={nodes} onInspect={onInspect} onCompare={onCompare}/>}
 <button type="button" disabled={state.loading||!!state.error&&state.retryable===false} onClick={()=>void request()}>{state.loading?'Finding a possible review focus…':state.error?'Retry AI':'Suggest review focus with AI'}</button>
 {state.error&&<p className="review-focus-status" role="status">{state.error}</p>}
 {state.focus===null&&<p className="review-focus-status">No additional review focus found.</p>}</>;
}
