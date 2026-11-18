import React,{useEffect,useState} from 'react';
import {Sparkles} from 'lucide-react';
import type {UIElement} from '../types';
import type {SharedReference} from '../collaboration';
import {ReviewFocus as Focus} from '../reviewFocus';
import {loadReviewFocus} from '../reviewFocusClient';
export function ReviewFocusContent({focus,nodes,onInspect,onCompare,onUseContext,accepted=false,retryAction}:{key?:string;focus:Focus;nodes:UIElement[];onInspect?:(ids:string[])=>void;onCompare?:(ids:string[])=>void;onUseContext?:(context:string)=>string|void;accepted?:boolean;retryAction?:React.ReactNode}){
 const [inspected,setInspected]=useState(false);
 const [adjusting,setAdjusting]=useState(false),[draft,setDraft]=useState(focus.focus);
 const referenced=nodes.find(n=>n.id===focus.referencedId),related=nodes.find(n=>n.id===focus.relatedId);
 if(!referenced)return null;
 const ids=[referenced.id,...(related?[related.id]:[])];
 return <section className="review-focus" aria-label="Possible review focus">
 <h4><Sparkles size={14}/>{accepted?'Accepted interpretation':'AI interpretation'}</h4>
 {adjusting?<label className="review-focus-editor">Adjust the interpretation<textarea value={draft} maxLength={160} rows={3} onChange={e=>setDraft(e.target.value)}/></label>:<p>{focus.focus}</p>}

 <div className="review-focus-actions">{onUseContext&&<>{(!accepted||adjusting)&&<button className="accept-interpretation" type="button" disabled={adjusting&&!draft.trim()} onClick={()=>{onUseContext(adjusting?draft.trim():focus.focus);setAdjusting(false);}}>{adjusting?'Accept changes':'Accept suggestion'}</button>}<button type="button" onClick={()=>{setDraft(focus.focus);setAdjusting(!adjusting);}}>{adjusting?'Cancel':'Adjust'}</button></>}{onInspect&&<button type="button" onClick={()=>{onInspect(ids);setInspected(true);}}>Inspect on canvas →</button>}
 {inspected&&related&&onCompare&&<button type="button" onClick={()=>onCompare(ids)}>Compare</button>}{retryAction}</div>
 </section>;
}
export default function ReviewFocus({reference,nodes,onInspect,onCompare,onUseContext}:{reference:Pick<SharedReference,'id'|'elementIds'|'message'>;nodes:UIElement[];onInspect?:(ids:string[])=>void;onCompare?:(ids:string[])=>void;onUseContext?:(context:string)=>string|void;accepted?:boolean}){

 const [state,setState]=useState<{key:string;focus?:Focus|null;loading?:boolean;error?:string;retryable?:boolean;accepted?:boolean}>({key:''});
 const key=JSON.stringify([reference.id,reference.elementIds,reference.message,nodes]);
 const current=React.useRef(key);current.current=key;
 const pending=React.useRef(false);
 const acceptedMessage=React.useRef<string|void>(undefined);
 useEffect(()=>{pending.current=false;if(acceptedMessage.current!==undefined&&reference.message===acceptedMessage.current){acceptedMessage.current=undefined;setState(previous=>({...previous,key}));}else{acceptedMessage.current=undefined;setState({key});}},[key]);
 const acceptContext=(context:string)=>{if(!state.focus)return;acceptedMessage.current=onUseContext?.(context);setState(previous=>({...previous,focus:{...previous.focus!,focus:context},accepted:true}));};
 async function request(){
  if(pending.current)return;pending.current=true;setState({key,loading:true});
  try{const focus=await loadReviewFocus(reference.elementIds,reference.message,nodes);if(current.current===key)setState({key,focus});}
  catch(error){if(current.current===key)setState({key,error:(error as Error).message,retryable:(error as any).retryable!==false});}
  finally{if(current.current===key)pending.current=false;}
 }
 const retryAction=<button className="interpret-context-button" type="button" disabled={state.loading||!!state.error&&state.retryable===false} onClick={()=>void request()}><Sparkles size={13}/>{state.loading?'Interpreting…':state.error?'Retry AI':state.focus?'Try again':'Interpret reference with AI'}</button>;
 return <section className="ai-context-panel" aria-label="AI reference interpretation">{state.key===key&&state.focus?<ReviewFocusContent key={key} focus={state.focus} nodes={nodes} onInspect={onInspect} onCompare={onCompare} onUseContext={onUseContext?acceptContext:undefined} accepted={state.accepted} retryAction={retryAction}/>:retryAction}
 {state.error&&<p className="review-focus-status" role="status">{state.error}</p>}
 {state.focus===null&&<p className="review-focus-status">No additional review focus found.</p>}</section>;
}
