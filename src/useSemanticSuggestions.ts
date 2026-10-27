import {useEffect,useRef,useState} from 'react';
import {SemanticCandidate} from './semanticInterpretation';
import {modelSemanticProvider} from './modelSemanticProvider';
import {InferredReference,UIElement} from './types';
import {scopeElements,distinctCandidates,resolveScopeIds} from './gestureContext';
/** A draft reference is independent of the confirmed reference; hover never publishes a selection. */
export function useSemanticSuggestions(selection:InferredReference|null,nodes:UIElement[]){
 const key=selection?JSON.stringify([selection.exemplarIds,selection.scope,nodes]):'';
 const current=useRef(key);current.current=key;
 const controller=useRef<AbortController|null>(null),cache=useRef(new Map<string,SemanticCandidate[]>());
 const [state,setState]=useState<{key:string;loading:boolean;candidates:SemanticCandidate[];message:string;done:boolean}>({key,loading:false,candidates:[],message:'',done:false});
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  controller.current?.abort();if(selection&&!selection.selectedIds.length){setState({key,loading:false,candidates:[],message:'No objects were touched. Draw across the objects you mean.',done:true});return;}if(!selection){setState({key,loading:false,candidates:[],message:'',done:false});return;}
  const saved=cache.current.get(key);if(saved){setState({key,loading:false,candidates:saved,message:'',done:true});return;}
  const abort=new AbortController();controller.current=abort;setState({key,loading:true,candidates:[],message:'',done:false});
  const elements=scopeElements(selection.exemplarIds,nodes,selection.scope);
  const eligible=new Set(elements.map(n=>n.id));
  void modelSemanticProvider.interpret({contextId:String(++requestSequence),selectedIds:selection.selectedIds.filter(id=>eligible.has(id)),exemplarIds:selection.exemplarIds.filter(id=>eligible.has(id)),scope:selection.scope,elements,document:nodes},abort.signal).then(output=>{
   if(abort.signal.aborted||current.current!==key)return;const candidates=distinctCandidates(output.map(c=>({...c,elementIds:resolveScopeIds(c.elementIds,elements,selection.scope)})));cache.current.set(key,candidates);if(cache.current.size>12)cache.current.delete(cache.current.keys().next().value!);setState({key,loading:false,candidates,message:candidates.length?'':'No confident interpretations. Retry or select touched objects.',done:true});
  }).catch(error=>{if(!abort.signal.aborted&&current.current===key)setState({key,loading:false,candidates:[],message:error instanceof Error?error.message:'AI unavailable. Retry or select touched objects.',done:false});});
  return()=>abort.abort();
 },[key,retry]);
 return {loading:!!selection&&(state.key!==key||state.loading),candidates:state.key===key?state.candidates:[],message:state.key===key?state.message:'',done:state.key===key&&state.done,request:()=>{cache.current.delete(key);setRetry(v=>v+1);}};
}
let requestSequence=0;
