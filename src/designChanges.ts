import {comparisonSides,referenceSides} from './comparisonSides.js';
import type {ComparisonContext,DesignReference,SharedReference,UserId} from './collaboration.js';
import type {UIElement} from './types.js';
export type DesignProperty=DesignReference['properties'][number];
export interface DesignChangeFact {id:string;category:DesignProperty;property:string;referenceId:string;targetId:string;referenceValue:string;targetValue:string}
export interface ProposedDesignChange {id:string;title:string;explanation:string;facts:DesignChangeFact[];source:'model';status:'pending'|'accepted'|'dismissed';reviewedAt?:string}
export interface DesignChangeContext {referenceIds:string[];targetIds:string[];properties:DesignProperty[];elements:UIElement[];facts:DesignChangeFact[]}
const fields:{category:DesignProperty;key:keyof UIElement;label:string;unit?:string}[]=[
 {category:'spacing',key:'spacing',label:'Spacing',unit:' px'},
 {category:'typography',key:'fontSize',label:'Font size',unit:' px'},
 {category:'typography',key:'fontWeight',label:'Font weight'},
 {category:'colors',key:'bg',label:'Background'},
 {category:'colors',key:'color',label:'Text color'},
 {category:'cornerRadius',key:'radius',label:'Corner radius',unit:' px'},
];
export function designChangeContext(referenceIds:string[],targetIds:string[],properties:DesignProperty[],nodes:UIElement[]):DesignChangeContext {
 const roots=[...referenceIds,...targetIds];
 if(referenceIds.length>24||targetIds.length>24||!referenceIds.length||!targetIds.length||roots.some(id=>!nodes.some(n=>n.id===id&&n.type!=='screen')))throw new Error('Choose 1–24 existing objects on each side.');
 const descendants=(ids:string[])=>{const set=new Set(ids);for(let i=0;i<nodes.length;i++){let changed=false;for(const n of nodes)if(n.type!=='screen'&&n.parent&&set.has(n.parent)&&!set.has(n.id)){set.add(n.id);changed=true;}if(!changed)break;}return nodes.filter(n=>set.has(n.id)).slice(0,32);};
 const a=descendants(referenceIds),b=descendants(targetIds),facts:DesignChangeFact[]=[];
 for(const source of a)for(const target of b){
  // Match recorded roles (or exact object types when neither has a role), never arbitrary pairs.
  if(source.id===target.id)continue;
  if(source.role||target.role){if(source.role!==target.role)continue;}else if(source.type!==target.type)continue;
  for(const field of fields){if(!properties.includes(field.category))continue;const av=source[field.key],bv=target[field.key];
   if(av===undefined||bv===undefined||av===''||bv===''||String(av).toLowerCase()===String(bv).toLowerCase())continue;
   facts.push({id:`${source.id}:${target.id}:${field.key}`,category:field.category,property:field.label,referenceId:source.id,targetId:target.id,referenceValue:`${av}${field.unit||''}`,targetValue:`${bv}${field.unit||''}`});
  }
 }
 return {referenceIds:[...referenceIds],targetIds:[...targetIds],properties:[...properties],elements:[...new Map([...a,...b].map(n=>[n.id,n])).values()],facts:facts.slice(0,96)};
}
export function designChangeKey(context:Pick<ComparisonContext,'sides'|'selections'|'designReference'|'purpose'>){return JSON.stringify([context.purpose,comparisonSides(context),context.designReference?.direction,context.designReference?.properties.slice().sort()]);}
export function validateProposedChanges(value:unknown,context:DesignChangeContext):ProposedDesignChange[]{
 if(value===undefined)return [];
 if(!Array.isArray(value)||value.length>3)throw new Error('Invalid proposed changes.');
 const ids=new Set<string>();
 return value.map(change=>{
  if(!change||typeof change.id!=='string'||change.id.length>100||ids.has(change.id)||typeof change.title!=='string'||!change.title.trim()||change.title.length>80||typeof change.explanation!=='string'||!change.explanation.trim()||change.explanation.length>240||change.source!=='model'||!Array.isArray(change.facts)||!change.facts.length||change.facts.length>6)throw new Error('Invalid proposed change.');
  ids.add(change.id);
  const facts=change.facts.map((fact:DesignChangeFact)=>{const actual=context.facts.find(f=>f.id===fact.id);if(!actual||Object.keys(actual).some(key=>actual[key as keyof DesignChangeFact]!==fact[key as keyof DesignChangeFact]))throw new Error('Proposed changes must match recorded property differences.');return {...actual};});
  return {id:change.id,title:change.title.trim(),explanation:change.explanation.trim(),facts,source:'model',status:'pending'};
 });
}
/** Shared by local demo and realtime mutations; decisions never edit canvas properties. */
export function decideDesignChange(reference:SharedReference,user:UserId,id:string,status:unknown):SharedReference {
 if(user!==reference.targetUser||!reference.comparison?.designReference)throw new Error('Only the request recipient can review proposed changes.');
 if(reference.archivedAt||reference.status==='reviewed')throw new Error('Restore an open reference before reviewing changes.');
 if(!['accepted','dismissed','pending'].includes(status as string))throw new Error('Invalid proposed change status.');
 const changes=reference.comparison.designReference.proposedChanges;
 if(!changes?.some(c=>c.id===id))throw new Error('Proposed change not found.');
 return {...reference,comparison:{...reference.comparison,designReference:{...reference.comparison.designReference,proposedChanges:changes.map(c=>c.id===id?{...c,status:status as ProposedDesignChange['status'],reviewedAt:new Date().toISOString()}:c)}}};
}
