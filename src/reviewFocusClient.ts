import type {UIElement} from './types';
import {validateReviewFocus,ReviewFocus} from './reviewFocus';
const cache=new Map<string,Promise<ReviewFocus|null>>();
export function loadReviewFocus(ids:string[],note:string,nodes:UIElement[],fetcher:typeof fetch=fetch){
 const key=JSON.stringify([ids,note,nodes]);
 const existing=cache.get(key);if(existing)return existing;
 const contextId=crypto.randomUUID();
 const promise=(async()=>{
 const response=await fetcher('/api/semantic/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task:'review-focus',contextId,elementIds:ids,note,document:nodes}),signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('AI review assistance unavailable.');
 const result=await response.json();
 if(result.contextId!==contextId||typeof result.model!=='string')throw Error('Invalid review response.');
 const {source,...suggestion}=result.suggestion||{};
 if(result.suggestion!==null&&source!=='model')throw Error('Invalid review source.');
 return validateReviewFocus(result.suggestion===null?null:suggestion,ids,nodes);
 })();
 if(cache.size>=30)cache.delete(cache.keys().next().value!);
 cache.set(key,promise);return promise;
}
