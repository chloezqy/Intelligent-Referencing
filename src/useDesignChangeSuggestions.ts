import {requestAI} from './aiClient';
import {referenceSides} from './comparisonSides';
import {useEffect,useRef,useState} from 'react';
import type {ComparisonContext,DesignReference} from './collaboration';
import {designChangeKey,designChangeContext,validateProposedChanges,ProposedDesignChange} from './designChanges';
import type {UIElement} from './types';
import {MOCK_NODES} from './data';
/** Explicit requests only; abort and discard results when the frozen context changes. */
export function useDesignChangeSuggestions(context:ComparisonContext|undefined,onChange:(value:DesignReference)=>void,nodes:UIElement[]=MOCK_NODES,requestOnOpen=false){
 const key=context?JSON.stringify([designChangeKey(context),nodes]):'';
 const current=useRef(key);current.current=key;
 const controller=useRef<AbortController|null>(null);
 const [state,setState]=useState<{key:string;loading:boolean;proposals:ProposedDesignChange[];message:string;failed?:boolean}>({key,loading:false,proposals:[],message:''});
 useEffect(()=>{controller.current?.abort();setState({key,loading:false,proposals:[],message:''});if(requestOnOpen)void request();return()=>controller.current?.abort();},[key,requestOnOpen]);
 const request=async()=>{
  if(!context?.designReference||state.key===key&&state.loading)return;
  const value=context.designReference;
  let evidence:ReturnType<typeof designChangeContext>;
  try{const sides=referenceSides(context);evidence=designChangeContext(sides.reference.elementIds,sides.target.elementIds,value.properties,nodes);}catch(error){setState({key,loading:false,proposals:[],message:(error as Error).message});return;}
  if(!evidence.facts.length){setState({key,loading:false,proposals:[],message:'No recorded differences for these properties.'});return;}
  const abort=new AbortController();controller.current?.abort();controller.current=abort;
  setState({key,loading:true,proposals:[],message:''});
  try{
   const contextId=crypto.randomUUID();
   const result=await requestAI({task:'design-changes',contextId,document:nodes,referenceIds:evidence.referenceIds,targetIds:evidence.targetIds,properties:evidence.properties},{signal:abort.signal});
   if(result.contextId!==contextId)throw new Error('Reference context changed. Suggest changes again.');
   const proposals=validateProposedChanges(result.proposals,evidence);
   if(current.current===key&&!abort.signal.aborted)setState({key,loading:false,proposals,message:proposals.length?'':'No supported changes suggested. Recorded differences remain available below.'});
  }catch(error){if(current.current===key&&!abort.signal.aborted)setState({key,loading:false,proposals:[],failed:true,message:(error as Error).name==='TimeoutError'?'AI timed out. Recorded differences remain available below.':(error as Error).message});}
 };
 const proposals=state.key===key?state.proposals:[];
 return {proposals,failed:state.key===key&&!!state.failed,loading:state.key===key&&state.loading,message:state.key===key?state.message:'',request,
  toggle:(proposal:ProposedDesignChange,include:boolean)=>{if(!context?.designReference)return;const selected=context.designReference.proposedChanges||[];onChange({...context.designReference,proposedChanges:include?[...selected.filter(s=>s.id!==proposal.id),proposal]:selected.filter(s=>s.id!==proposal.id)});},
 };
}
