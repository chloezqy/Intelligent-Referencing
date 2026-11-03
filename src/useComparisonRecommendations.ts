import {useEffect,useRef,useState} from 'react';
import type {ComparisonContext} from './collaboration';
import type {UIElement} from './types';
import type {DifferenceRecommendation} from './comparisonRecommendations';
import {comparisonAnalysisKey,canAnalyzeComparison,loadComparisonRecommendations,cachedComparisonRecommendations} from './comparisonAnalysisClient';
export function useComparisonRecommendations(context:ComparisonContext|undefined,nodes:UIElement[]){
 const key=context?comparisonAnalysisKey(context,nodes):'',eligible=canAnalyzeComparison(context,nodes),current=useRef(key);current.current=key;
 const [state,setState]=useState<{key:string;loading:boolean;results:DifferenceRecommendation[];message:string;retryable:boolean}>({key,loading:false,results:[],message:'',retryable:true});
 const pending=useRef(false);
 useEffect(()=>{pending.current=false;setState({key,loading:false,results:context?cachedComparisonRecommendations(context,nodes)||[]:[],message:'',retryable:true});},[key]);
 const request=async()=>{
  if(!eligible||!context||pending.current)return;pending.current=true;
  setState({key,loading:true,results:[],message:'',retryable:true});
  try{const results=await loadComparisonRecommendations(context,nodes,{force:true});if(current.current===key)setState({key,loading:false,results,message:'',retryable:true});}
  catch(error){if(current.current===key)setState({key,loading:false,results:[],message:(error as Error).message+' Using rule-based recommendations.',retryable:(error as any).retryable!==false});}
  finally{if(current.current===key)pending.current=false;}
 };
 return {eligible,request,loading:state.key===key&&state.loading,results:state.key===key?state.results:[],message:state.key===key?state.message:'',retryable:state.retryable};
}
