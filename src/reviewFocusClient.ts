import {requestAI} from './aiClient';
import type {UIElement} from './types';
import {validateReviewFocus,ReviewFocus} from './reviewFocus';
const cache=new Map<string,Promise<ReviewFocus|null>>();
export function loadReviewFocus(ids:string[],note:string,nodes:UIElement[],fetcher:typeof fetch=fetch){
 const key=JSON.stringify([ids,note,nodes]);
 const existing=cache.get(key);if(existing)return existing;
 const contextId=crypto.randomUUID();
 const promise=(async()=>{
 const result=await requestAI({task:'review-focus',contextId,elementIds:ids,note,document:nodes},{fetcher});
 if(result.contextId!==contextId||typeof result.model!=='string')throw Error('Invalid review response.');
 const {source,...suggestion}=result.suggestion||{};
 if(result.suggestion!==null&&source!=='model')throw Error('Invalid review source.');
 return validateReviewFocus(result.suggestion===null?null:suggestion,ids,nodes);
 })().catch(error=>{cache.delete(key);throw error;});
 if(cache.size>=30)cache.delete(cache.keys().next().value!);
 cache.set(key,promise);return promise;
}
