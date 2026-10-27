import {useEffect,useRef,useState} from 'react';
import {SemanticCandidate} from './semanticInterpretation';
import {modelSemanticProvider} from './modelSemanticProvider';
import {InferredReference,UIElement} from './types';
import {scopeElements,distinctCandidates,resolveScopeIds} from './gestureContext';
/** Selection stays deterministic until the user explicitly requests model suggestions. */
export function useSemanticSuggestions(selection:InferredReference|null,nodes:UIElement[]){
 const key=selection?JSON.stringify([selection.exemplarIds,selection.scope,nodes]):'';
 const current=useRef(key);current.current=key;
 const controller=useRef<AbortController|null>(null),cache=useRef(new Map<string,SemanticCandidate[]>());
 const [state,setState]=useState<{key:string;loading:boolean;candidates:SemanticCandidate[];message:string;done:boolean}>({key,loading:false,candidates:[],message:'',done:false});
 useEffect(()=>{controller.current?.abort();setState({key,loading:false,candidates:[],message:'',done:false});return()=>controller.current?.abort();},[key]);
 const request=async()=>{
  if(!selection||state.loading)return;
  if(!selection.selectedIds.length){setState({key,loading:false,candidates:[],message:'Select or draw across the objects you mean.',done:true});return;}
  const saved=cache.current.get(key);if(saved){setState({key,loading:false,candidates:saved,message:'',done:true});return;}
  const abort=new AbortController();controller.current?.abort();controller.current=abort;setState({key,loading:true,candidates:[],message:'',done:false});
  const elements=scopeElements(selection.exemplarIds,nodes,selection.scope),eligible=new Set(elements.map(n=>n.id));
  try{const output=await modelSemanticProvider.interpret({contextId:String(++requestSequence),selectedIds:selection.selectedIds.filter(id=>eligible.has(id)),exemplarIds:selection.exemplarIds.filter(id=>eligible.has(id)),scope:selection.scope,elements,document:nodes},abort.signal);
   if(abort.signal.aborted||current.current!==key)return;
   const candidates=distinctCandidates(output.map(c=>({...c,elementIds:resolveScopeIds(c.elementIds,elements,selection.scope)})));cache.current.set(key,candidates);if(cache.current.size>12)cache.current.delete(cache.current.keys().next().value!);
   setState({key,loading:false,candidates,message:candidates.length?'':'No additional interpretations. Rule-based options remain available.',done:true});
  }catch(error){if(!abort.signal.aborted&&current.current===key)setState({key,loading:false,candidates:[],message:error instanceof Error?error.message:'AI unavailable. Rule-based options remain available.',done:false});}
 };
 return {loading:state.key===key&&state.loading,candidates:state.key===key?state.candidates:[],message:state.key===key?state.message:'',done:state.key===key&&state.done,request};
}
let requestSequence=0;
