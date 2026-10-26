import {useEffect,useRef,useState} from 'react';
import {SemanticCandidate} from './semanticInterpretation';
import {modelSemanticProvider} from './modelSemanticProvider';
import {InferredReference,UIElement} from './types';
export function useSemanticSuggestions(selection:InferredReference|null,nodes:UIElement[]){
 const key=JSON.stringify([selection?.selectedIds.slice().sort(),selection?.exemplarIds.slice().sort(),selection?.scope]);
 const current=useRef(key);current.current=key;
 const controller=useRef<AbortController|null>(null);
 const [state,setState]=useState<{key:string;loading:boolean;candidates:SemanticCandidate[];message:string;done:boolean}>({key,loading:false,candidates:[],message:'',done:false});
 useEffect(()=>{controller.current?.abort();setState({key,loading:false,candidates:[],message:'',done:false});return()=>controller.current?.abort();},[key]);
 const request=async()=>{
  if(!selection||state.loading||state.key===key&&state.done)return;
  controller.current?.abort();const abort=new AbortController();controller.current=abort;
  setState({key,loading:true,candidates:[],message:'',done:false});
  try{const candidates=await modelSemanticProvider.interpret({contextId:key,selectedIds:[...selection.selectedIds],exemplarIds:[...selection.exemplarIds],scope:selection.scope,elements:nodes},abort.signal);
   if(current.current===key&&!abort.signal.aborted)setState({key,loading:false,candidates,message:candidates.length?'':'No additional semantic relationships found.',done:true});
  }catch(error){if(current.current===key&&!abort.signal.aborted)setState({key,loading:false,candidates:[],message:error instanceof Error?error.message:'AI unavailable. Rule-based options still work.',done:false});}
 };
 return {loading:state.key===key&&state.loading,candidates:state.key===key?state.candidates:[],message:state.key===key?state.message:'',done:state.key===key&&state.done,request};
}
