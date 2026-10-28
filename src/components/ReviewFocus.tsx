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
 const [state,setState]=useState<{focus?:Focus|null;error?:boolean}>({});
 const key=JSON.stringify([reference.id,reference.elementIds,reference.message,nodes]);
 useEffect(()=>{let current=true;setState({});
 loadReviewFocus(reference.elementIds,reference.message,nodes).then(focus=>{if(current)setState({focus});},()=>{if(current)setState({error:true});});
 return()=>{current=false;};},[key]);
 if(state.error)return <p className="review-focus-status" role="status">AI review assistance unavailable.</p>;
 if(state.focus===undefined)return <p className="review-focus-status" role="status">Finding a possible review focus…</p>;
 if(!state.focus)return <p className="review-focus-status">No additional review focus found.</p>;
 return <ReviewFocusContent key={key} focus={state.focus} nodes={nodes} onInspect={onInspect} onCompare={onCompare}/>;
}
