import type {Point,UIElement,ScopeLevel} from './types.js';
import {roots as referenceRoots} from './editing.js';
import {strokeIntersectsRect,getNodeCoverage,expandScope} from './utils.js';
export function gestureTouched(path:Point[],nodes:UIElement[]){return nodes.filter(n=>n.type!=='screen'&&n.type!=='header'&&n.type!=='tabbar'&&(strokeIntersectsRect(path,n)||getNodeCoverage(n,path)>.08)).map(n=>n.id);}
export function scopeElements(ids:string[],nodes:UIElement[],scope:ScopeLevel){
 const touched=new Set(ids),byId=new Map(nodes.map(n=>[n.id,n]));
 if(scope==='document'||scope==='flow')return nodes.filter(n=>n.type!=='screen'&&(!n.library||ids.some(id=>byId.get(id)?.library)));
 if(scope==='screen'){const screen=byId.get(ids[0])?.screen;return nodes.filter(n=>n.type!=='screen'&&n.screen===screen);}
 const eligible=new Set(ids);
 for(const id of touched){let parent=byId.get(id)?.parent;const seen=new Set<string>();while(parent&&!seen.has(parent)){seen.add(parent);const p=byId.get(parent);if(!p||p.type==='screen')break;eligible.add(parent);parent=p.parent;}}
 for(let changed=true;changed;){changed=false;for(const n of nodes)if(n.parent&&eligible.has(n.parent)&&!eligible.has(n.id)){eligible.add(n.id);changed=true;}}
 return nodes.filter(n=>n.type!=='screen'&&eligible.has(n.id));
}
export function distinctCandidates<T extends {elementIds:string[]}>(candidates:T[]){const sets=new Set<string>();return candidates.filter(c=>{const key=[...c.elementIds].sort().join('|');if(sets.has(key))return false;sets.add(key);return true;});}

/** Execute an AI-chosen homogeneous semantic reference within its eligible scope.
 * The model chooses the role/granularity; existing matching code reliably resolves every instance.
 * Mixed functional groups retain the model's exact validated IDs. */
export function resolveScopeIds(ids:string[],eligible:UIElement[],scope:ScopeLevel){
 const canonical=referenceRoots(ids,eligible).map(n=>n.id);
 if(scope==='exemplars'||!canonical.length)return canonical;
 const targets=eligible.filter(n=>canonical.includes(n.id)),first=targets[0];
 if(first.role&&targets.every(n=>n.role===first.role&&n.type===first.type)){
  const matches=expandScope(eligible,canonical,scope,first.role,undefined,first.screen);
  return matches.filter(id=>{const n=eligible.find(n=>n.id===id)!;return n.type===first.type&&(first.type!=='card'||!first.component||n.component===first.component);});
 }
 return canonical;
}
