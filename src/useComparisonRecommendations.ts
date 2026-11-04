import {useEffect,useState} from 'react';
import type {ComparisonContext} from './collaboration';
import type {UIElement} from './types';
import type {DifferenceRecommendation} from './comparisonRecommendations';
import {comparisonAnalysisKey,canAnalyzeComparison,loadComparisonRecommendations} from './comparisonAnalysisClient';

export function useComparisonRecommendations(context:ComparisonContext|undefined,nodes:UIElement[]){
 const key=context?comparisonAnalysisKey(context,nodes):'';
 const eligible=canAnalyzeComparison(context,nodes);
 const [retry,setRetry]=useState<{key:string;attempt:number}>();
 const attempt=retry?.key===key?retry.attempt:0;
 const [state,setState]=useState<{key:string;attempt:number;results:DifferenceRecommendation[];message:string;retryable:boolean}>();

 useEffect(()=>{
  if(!eligible||!context)return;
  let active=true;
  loadComparisonRecommendations(context,nodes,{force:attempt>0}).then(
   results=>{if(active)setState({key,attempt,results,message:'',retryable:false});},
   error=>{if(active)setState({key,attempt,results:[],message:(error as Error).message+' Using rule-based recommendations.',retryable:error?.retryable!==false});},
  );
  return()=>{active=false;};
 },[key,eligible,attempt]);

 const resolved=eligible&&state?.key===key&&state.attempt===attempt?state:undefined;
 return {
  eligible,
  request:()=>setRetry({key,attempt:attempt+1}),
  loading:eligible&&!resolved,
  results:resolved?.results??[],
  message:resolved?.message??'',
  retryable:resolved?.retryable??false,
 };
}
