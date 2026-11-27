import type {UIElement} from './types.js';
import {reviewEvidence,REVIEW_PROPERTIES} from './reviewFocus.js';
export interface ShareNoteInterpretation {source:'model';kind:'rewrite'|'clear';text:string;referencedIds:string[];relatedIds:string[];properties:string[]}
export function meaningfulShareNote(note:string){return note.replace(/@(?:User\s*)?[AB]\b/gi,'').replace(/[^\p{L}\p{N}]/gu,'').length>=3;}
export function vagueShareNote(note:string){return /^(?:please\s+)?(?:look at this|review(?: this)?|check(?: this)?|take a look|can you (?:review|check)(?: this)?)[.!?\s]*$/i.test(note.replace(/@(?:User\s*)?[AB]\b/gi,'').trim());}
export function validateShareNoteInterpretation(value:any,ids:string[],note:string,nodes:UIElement[]):ShareNoteInterpretation{
 const evidence=reviewEvidence(ids,nodes);
 if(!value||Object.keys(value).some(k=>!['kind','text','referencedIds','relatedIds','properties'].includes(k))||!['rewrite','clear'].includes(value.kind)||typeof value.text!=='string'||value.text.length>400||/[<>\r\n]/.test(value.text)||value.kind!=='clear'&&!value.text.trim())throw Error('Invalid note interpretation.');
 for(const field of ['referencedIds','relatedIds','properties'])if(!Array.isArray(value[field])||new Set(value[field]).size!==value[field].length)throw Error('Invalid note interpretation context.');
 if(!value.referencedIds.length||value.referencedIds.some((id:string)=>!evidence.referenced.some(n=>n.id===id))||value.relatedIds.some((id:string)=>!evidence.related.some(n=>n.id===id))||value.properties.some((key:string)=>!Object.hasOwn(REVIEW_PROPERTIES,key)||!evidence.referenced.some(n=>key==='dimensions'||n[key as keyof UIElement]!==undefined)))throw Error('Unrecorded note interpretation context.');
 if(vagueShareNote(note)&&(value.relatedIds.length||value.properties.length))throw Error('Vague notes must not invent specific changes.');
 const known=JSON.stringify([note,evidence.referenced,evidence.related]);
 if((value.text.match(/#[\da-f]{3,8}\b|\d+(?:\.\d+)?/gi)||[]).some((v:string)=>!known.includes(v)))throw Error('Unrecorded note values.');
 if(value.kind==='rewrite'&&(note.match(/@(?:User\s*)?[AB]\b/gi)||[]).some((mention:string)=>!value.text.includes(mention)))throw Error('Note mentions must be preserved.');
 return {...value,text:value.text.trim(),source:'model'};
}

export function noteSuggestionRange(original:string,suggestion:string){
 let start=0,end=original.length,nextEnd=suggestion.length;
 while(start<end&&start<nextEnd&&original[start]===suggestion[start])start++;
 while(end>start&&nextEnd>start&&original[end-1]===suggestion[nextEnd-1]){end--;nextEnd--;}
 while(start>0&&/\S/.test(original[start-1]))start--;
 while(end<original.length&&/\S/.test(original[end]))end++;
 return {start,end};
}
export function noteIdentity(note:string){return note.trim().replace(/\s+/g,' ').toLowerCase().replace(/[.!?]+$/,'');}
