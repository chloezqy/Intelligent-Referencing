import type {UIElement} from './types';
import type {ComparisonContext} from './collaboration';
import {comparisonSides} from './comparisonSides';
import {compareReferenceElements} from './referencePresentation';
export const RECOMMENDATION_CATEGORIES=['suggested','review','informational'] as const;
export type RecommendationCategory=typeof RECOMMENDATION_CATEGORIES[number];
export const RECOMMENDATION_LABELS={suggested:'Suggested to resolve',review:'Review recommended',informational:'Informational'};
export const RECOMMENDATION_REASONS={similar_function:'Similar functionality',style_consistency:'Potential style inconsistency',layout_context:'Different layout contexts',content_specific:'Content-specific difference',different_roles:'Different semantic roles',insufficient_context:'Insufficient relationship evidence',structural_context:'Different component structures'};
export interface DifferenceRecommendation{key:string;category:RecommendationCategory;reason:keyof typeof RECOMMENDATION_REASONS;source:'model'|'rule-based'}
export function comparisonEvidence(context:Pick<ComparisonContext,'sides'|'selections'>,nodes:UIElement[]){
 const sides=comparisonSides(context),ids=[...new Set([...sides.A.elementIds,...sides.B.elementIds])];
 const comparison=compareReferenceElements(ids,nodes);
 return {sides,ids,elements:comparison.elements,differences:comparison.rows.filter(row=>row.state==='different')};
}
export function ruleBasedRecommendations(context:ComparisonContext,nodes:UIElement[]):DifferenceRecommendation[]{
 const evidence=comparisonEvidence(context,nodes),elements=evidence.elements;
 const both=evidence.sides.A.elementIds.length>0&&evidence.sides.B.elementIds.length>0;
 const similar=both&&elements.every(n=>n.type===elements[0]?.type&&n.role===elements[0]?.role&&(n.component===elements[0]?.component||!n.component||!elements[0]?.component));
 const crossLayout=new Set(elements.map(n=>n.screen)).size>1||new Set(elements.map(n=>n.parent)).size>1;
 return evidence.differences.map(row=>{
  let category:RecommendationCategory='informational',reason:DifferenceRecommendation['reason']='different_roles';
  if(['text','label'].includes(row.key))reason='content_specific';
  else if(['type','role','component','screen','location'].includes(row.key))reason=['screen','location'].includes(row.key)?'layout_context':'structural_context';
  else if(!both)reason='insufficient_context';
  else if(similar){category=row.key==='dimensions'||crossLayout&&row.key==='spacing'?'review':'suggested';reason=category==='review'?'layout_context':'style_consistency';}
  return {key:row.key,category,reason,source:'rule-based'};
 });
}
/** Model output contains classifications only: no executable operations or invented values. */
export function validateRecommendations(input:unknown,keys:string[]):DifferenceRecommendation[]{
 if(!Array.isArray(input)||input.length!==keys.length)throw new Error('AI must assess each recorded difference.');
 const seen=new Set<string>();return input.map(item=>{
  if(!item||typeof item!=='object'||Object.keys(item).some(k=>!['key','category','reason'].includes(k))||!keys.includes(item.key)||seen.has(item.key)||!RECOMMENDATION_CATEGORIES.includes(item.category)||!Object.hasOwn(RECOMMENDATION_REASONS,item.reason))throw new Error('AI returned an unsupported comparison recommendation.');
  seen.add(item.key);return {key:item.key,category:item.category,reason:item.reason,source:'model'};
 });
}

/** Stable semantic priority, independent of the user's checkbox choices. */
export function recommendationPriority(key:string,recommendations:DifferenceRecommendation[]){
 const category=recommendations.find(item=>item.key===key)?.category;
 return category==='suggested'?0:category==='review'?1:2;
}
