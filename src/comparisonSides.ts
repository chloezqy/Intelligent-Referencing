import type {ComparisonContext,DesignReference,SelectionPresence,UserId} from './collaboration';
import type {UIElement} from './types';
import {ruleBasedInterpreter} from './comparisonContext';
export type ComparisonSide='A'|'B';
export interface ComparisonSideSelection {elementIds:string[];selectedBy:UserId}
export function comparisonSides(context:Pick<ComparisonContext,'sides'|'selections'>):Record<ComparisonSide,ComparisonSideSelection>{
 return context.sides||{A:{elementIds:context.selections.A.elementIds,selectedBy:'A'},B:{elementIds:context.selections.B.elementIds,selectedBy:'B'}};
}
export function sideLabel(context:Pick<ComparisonContext,'sides'|'selections'>,side:ComparisonSide){const sides=comparisonSides(context);return sides.A.selectedBy===sides.B.selectedBy?`Object ${side}`:`User ${sides[side].selectedBy}`;}
export function referenceSides(context:Pick<ComparisonContext,'sides'|'selections'|'designReference'>){
 const direction=context.designReference?.direction;
 const referenceSide=direction?.referenceSide||(direction?.referenceUser==='B'?'B':'A');
 const targetSide=referenceSide==='A'?'B':'A';const sides=comparisonSides(context);
 return {referenceSide,targetSide,reference:sides[referenceSide],target:sides[targetSide]} as const;
}
export function sideDirection(context:Pick<ComparisonContext,'sides'|'selections'>,referenceSide:ComparisonSide='A'):DesignReference['direction']{const sides=comparisonSides(context),targetSide=referenceSide==='A'?'B':'A';return {referenceSide,targetSide,referenceUser:sides[referenceSide].selectedBy,targetUser:sides[targetSide].selectedBy};}
export function localComparison(user:UserId,ids:string[],snapshotId:string,nodes:UIElement[]):ComparisonContext{
 if(!ids.length||ids.length>182||new Set(ids).size!==ids.length||ids.some(id=>!nodes.some(n=>n.id===id&&n.type!=='screen')))throw new Error('Select 1–182 existing objects to inspect.');
 const selection=(userId:UserId):SelectionPresence=>({userId,elementIds:userId===user?[...ids]:[],exemplarIds:userId===user?[...ids]:[],scope:'exemplars',method:'conventional',revision:0});
 return {snapshotId,selections:{A:selection('A'),B:selection('B')},sides:{A:{elementIds:ids.length===2?[ids[0]]:[...ids],selectedBy:user},B:{elementIds:ids.length===2?[ids[1]]:[],selectedBy:user}},purpose:'Compare differences',interpretation:ruleBasedInterpreter.interpret(ids.length===2?[ids[0]]:ids,ids.length===2?[ids[1]]:[],nodes)};
}
