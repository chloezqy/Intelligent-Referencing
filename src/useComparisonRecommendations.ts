import {useEffect,useState} from 'react';
import type {ComparisonContext} from './collaboration';
import type {UIElement} from './types';
import type {DifferenceRecommendation} from './comparisonRecommendations';
import {comparisonAnalysisKey,canAnalyzeComparison,loadComparisonRecommendations} from './comparisonAnalysisClient';
export function useComparisonRecommendations(context:ComparisonContext|undefined,nodes:UIElement[]){
 const key=context?comparisonAnalysisKey(context,nodes):'',eligible=canAnalyzeComparison(context,nodes);
 const [state,setState]=useState<{key:string;loading:boolean;results:DifferenceRecommendation[];message:string}>({key,loading:eligible,results:[],message:''});
 useEffect(()=>{
  let active=true;setState({key,loading:eligible,results:[],message:''});
  if(eligible&&context)loadComparisonRecommendations(context,nodes).then(results=>{if(active)setState({key,loading:false,results,message:''});},error=>{if(active)setState({key,loading:false,results:[],message:`${error.message} Using rule-based recommendations.`});});
  return()=>{active=false;};
 },[key,eligible]);

 return {loading:eligible&&(state.key!==key||state.loading),results:state.key===key?state.results:[],message:state.key===key?state.message:''};
}
