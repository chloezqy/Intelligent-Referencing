/** Shared explicit AI transport. Credentials stay server-side; success cache is scoped to this tab. */
const messages:Record<string,string>={
 document_mismatch:'The design document is out of date. Refresh the prototype and retry AI.',
 invalid_request:'AI could not use this selection or document. Refresh the prototype, select the objects again, and retry.',
 insufficient_quota:'AI project quota is unavailable. Please contact the study organizer; rule-based tools still work.',
 invalid_api_key:'AI authentication is unavailable. Please contact the study organizer; rule-based tools still work.',
 configuration_error:'AI is disabled or not configured. Please contact the study organizer; rule-based tools still work.',
 rate_limit:'AI is temporarily rate-limited. Please wait and retry.',
 session_limit:'Session AI limit reached. Please wait or contact the study organizer; rule-based tools still work.',
 timeout:'AI timed out. Retry AI when ready; your selection is unchanged.',
 server_busy:'AI is busy with other testers. Please retry shortly.',
 upstream_error:'AI is temporarily unavailable. Please retry; rule-based tools still work.',
 server_error:'The AI server encountered a temporary error. Please retry; rule-based tools still work.',
 invalid_response:'AI returned an unsupported response. You can retry; rule-based tools still work.'
};
export class AIRequestError extends Error{constructor(public code:string,public retryable:boolean,public retryAfter?:number){super(messages[code]||'AI request failed. Rule-based tools remain available.');}}
let sessionId:string|undefined;
function session(){if(!sessionId){try{sessionId=sessionStorage.getItem('sr-ai-session')||crypto.randomUUID();sessionStorage.setItem('sr-ai-session',sessionId);}catch{sessionId=crypto.randomUUID();}}return sessionId;}
const cooldown=new Map<string,{until:number;error:AIRequestError}>();
const cache=new Map<string,{until:number;pending:boolean;promise:Promise<any>;value?:any}>();
const fetchIds=new WeakMap<object,number>();let sequence=0;
function keyFor(body:any,fetcher:typeof fetch){if(!fetchIds.has(fetcher))fetchIds.set(fetcher,++sequence);const {contextId,...context}=body;return JSON.stringify([fetchIds.get(fetcher),context]);}
export function peekAI(body:any,fetcher:typeof fetch=fetch){const entry=cache.get(keyFor(body,fetcher));return entry&&entry.until>Date.now()?entry.value:undefined;}
export async function requestAI(body:any,options:{signal?:AbortSignal;fetcher?:typeof fetch;force?:boolean}={}){
 if(options.signal?.aborted)throw new DOMException('Cancelled','AbortError');
 const fetcher=options.fetcher||fetch,key=keyFor(body,fetcher),now=Date.now();
 for(const [key,item] of cache)if(!item.pending&&item.until<now)cache.delete(key);
 for(const [key,item] of cooldown)if(item.until<=now)cooldown.delete(key);
 const blocked=cooldown.get(key);if(blocked)throw blocked.error;
 let entry=cache.get(key);
 if(!entry||options.force&&!entry.pending){
  entry={until:now+600000,pending:true,promise:Promise.resolve()};
  const current=entry;
  entry.promise=(async()=>{
   let response:Response;try{response=await fetcher('/api/semantic/interpret',{method:'POST',headers:{'Content-Type':'application/json','X-Smart-Reference-Session':session()},body:JSON.stringify(body),signal:AbortSignal.timeout(28000)});}catch(error){throw new AIRequestError('timeout',true);}
   if(!response.headers.get('content-type')?.toLowerCase().includes('application/json'))throw new Error('AI endpoint unavailable. Rule-based tools remain available.');
   let result:any;try{result=await response.json();}catch{throw new AIRequestError('invalid_response',true);}
   if(!response.ok)throw new AIRequestError(result.code||'upstream_error',result.retryable===true,Number(result.retryAfter)||undefined);
   if(result.contextId!==body.contextId)throw new AIRequestError('invalid_response',true);
   if(typeof result.model==='string')current.value=result;
   else current.until=0;
   return result;
  })().catch(error=>{cache.delete(key);if(error instanceof AIRequestError&&error.retryAfter){if(cooldown.size>=100)cooldown.delete(cooldown.keys().next().value!);cooldown.set(key,{until:Date.now()+error.retryAfter*1000,error});}throw error;}).finally(()=>{current.pending=false;});
  if(cache.size>=100){const oldest=[...cache].find(([,v])=>!v.pending);if(oldest)cache.delete(oldest[0]);}
  cache.set(key,entry);
 }
 const pending=entry.promise.then(result=>result.contextId===body.contextId?result:{...result,contextId:body.contextId});
 if(!options.signal)return pending;
 const signal=options.signal;if(signal.aborted){pending.catch(()=>{});throw new DOMException('Cancelled','AbortError');}
 return new Promise<any>((resolve,reject)=>{const abort=()=>{cleanup();reject(new DOMException('Cancelled','AbortError'));},cleanup=()=>signal.removeEventListener('abort',abort);signal.addEventListener('abort',abort,{once:true});pending.then(value=>{cleanup();resolve(value);},error=>{cleanup();reject(error);});});
}
