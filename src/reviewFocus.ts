import type {UIElement} from './types.js';
export const REVIEW_PROPERTIES={radius:'Corner radius',bg:'Background color',color:'Text color',dimensions:'Dimensions',fontSize:'Font size',spacing:'Spacing',border:'Border'} as const;
export type ReviewProperty=keyof typeof REVIEW_PROPERTIES;
export interface ReviewFocus {source:'model';focus:string;referencedId:string;relatedId:string|null;property:ReviewProperty|null}
export function reviewValue(node:UIElement,key:ReviewProperty){
 if(key==='dimensions')return `${node.w} × ${node.h} px`;
 const value=node[key];return value===undefined?undefined:`${value}${['radius','fontSize','spacing'].includes(key)?' px':''}`;
}
export function reviewEvidence(ids:string[],nodes:UIElement[]){
 const referenced=nodes.filter(n=>ids.includes(n.id)&&!n.library&&n.type!=='screen');
 const related=nodes.filter(n=>!ids.includes(n.id)&&!n.library&&n.type!=='screen'&&referenced.some(r=>r.type===n.type&&(r.role? r.role===n.role:!!r.component&&r.component===n.component))).slice(0,32);
 return {referenced,related};
}
export function validateReviewFocus(value:any,ids:string[],nodes:UIElement[]):ReviewFocus|null{
 if(value===null)return null;
 const evidence=reviewEvidence(ids,nodes);
 if(!value||Object.keys(value).some(k=>!['focus','referencedId','relatedId','property'].includes(k))||typeof value.focus!=='string'||!value.focus.trim()||value.focus.length>160||/[\r\n]/.test(value.focus)||!evidence.referenced.some(n=>n.id===value.referencedId)||value.relatedId!==null&&!evidence.related.some(n=>n.id===value.relatedId)||value.property!==null&&!Object.hasOwn(REVIEW_PROPERTIES,value.property))throw Error('Invalid review suggestion.');
 const first=nodes.find(n=>n.id===value.referencedId)!,other=nodes.find(n=>n.id===value.relatedId);
 if(value.property!==null&&(reviewValue(first,value.property)===undefined||other&&reviewValue(other,value.property)===undefined))throw Error('Unrecorded review property.');
 return {...value,source:'model'};
}
