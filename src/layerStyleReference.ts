import {matchStyles,STYLE_KEYS,descendants,type EditProposal} from './editing';
import type {UIElement} from './types';
import {validateActionPlan} from './actionIntent';
export function layerStyleProposal(ids:string[],nodes:UIElement[],sourceId:string,properties:readonly string[]=STYLE_KEYS):EditProposal{
 if(descendants(ids,nodes).some(n=>n.id===sourceId))throw Error('Choose a reference outside the current selection.');
 const proposal=matchStyles(ids,nodes,sourceId);
 return {...proposal,mappings:proposal.mappings.map(m=>({...m,patches:m.patches.map(p=>({...p,changes:Object.fromEntries(Object.entries(p.changes).filter(([key,next])=>properties.includes(key)&&STYLE_KEYS.includes(key as typeof STYLE_KEYS[number])&&nodes.find(n=>n.id===p.id)?.[key as keyof UIElement]!==next))})).filter(p=>Object.keys(p.changes).length)})).filter(m=>m.patches.length)};
}
export function suggestedLayerId(plan:unknown,ids:string[],nodes:UIElement[]){
 const valid=validateActionPlan(plan,nodes);
 if(valid.steps.length!==1||valid.steps[0].action!=='matchStyles'||!valid.steps[0].sourceId)throw Error('No suggested reference');
 const id=valid.steps[0].sourceId;layerStyleProposal(ids,nodes,id);return id;
}
