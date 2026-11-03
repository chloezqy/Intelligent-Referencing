export type AIErrorCode='insufficient_quota'|'invalid_api_key'|'rate_limit'|'timeout'|'upstream_error'|'invalid_response'|'configuration_error'|'session_limit'|'server_busy';
export class AIServiceError extends Error{
 constructor(public status:number,public code:AIErrorCode,message:string,public retryable=false,public retryAfter?:number,public upstreamStatus?:number){super(message);}
}
export function retryAfterMs(value:string|null,now=Date.now()){
 if(!value)return undefined;const numeric=Number(value);if(Number.isFinite(numeric)&&numeric>=0)return numeric*1000;
 const date=Date.parse(value);return Number.isFinite(date)?Math.max(0,date-now):undefined;
}
export interface TransportOptions {fetcher?:typeof fetch;timeoutMs?:number;sleep?:(ms:number)=>Promise<void>;random?:()=>number;onAttempt?:()=>void}
export async function requestOpenAI(payload:unknown,key:string,options:TransportOptions={}){
 const deadline=Date.now()+(options.timeoutMs??25000),sleep=options.sleep||((ms:number)=>new Promise<void>(r=>setTimeout(r,ms)));
 for(let attempt=0;attempt<3;attempt++){
  const remaining=deadline-Date.now();if(remaining<=0)throw new AIServiceError(504,'timeout','AI timed out. You can retry; your selection is unchanged.',true);
  let response:Response,output:any;
  try{
   options.onAttempt?.();
   response=await (options.fetcher||fetch)('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(Math.max(1,Math.min(15000,remaining)))});
   try{output=await response.json();}catch{if(response.ok)throw new AIServiceError(502,'invalid_response','AI returned an invalid response. Rule-based tools remain available.',true);}
  }catch(error){
   if(error instanceof AIServiceError)throw error;
   throw new AIServiceError(504,'timeout','AI timed out or could not be reached. You can retry; your selection is unchanged.',true);
  }
  if(response.ok)return output;
  const code=output?.error?.code,type=output?.error?.type;
  if(type==='insufficient_quota'||['insufficient_quota','credit_balance_exhausted','billing_hard_limit_reached','usage_limit_reached','budget_exceeded','organization_spend_limit_exceeded','project_spend_limit_exceeded','organization_usage_limit_exceeded'].includes(code))throw new AIServiceError(503,'insufficient_quota','AI project quota is unavailable. Please contact the study organizer; rule-based tools still work.',false,undefined,response.status);
  if(response.status===401||code==='invalid_api_key')throw new AIServiceError(503,'invalid_api_key','AI authentication is unavailable. Please contact the study organizer; rule-based tools still work.',false,undefined,response.status);
  const retryable=response.status===429||response.status>=500;
  const delay=retryAfterMs(response.headers.get('retry-after'))??(500*2**attempt+Math.floor((options.random||Math.random)()*250));
  if(retryable&&attempt<2&&Date.now()+delay+250<deadline){await sleep(delay);continue;}
  if(response.status===429)throw new AIServiceError(429,'rate_limit','AI is temporarily rate-limited. Please wait and retry.',true,Math.max(1,Math.ceil(delay/1000)),response.status);
  if(response.status>=500)throw new AIServiceError(502,'upstream_error','The AI service is temporarily unavailable. Please retry; rule-based tools still work.',true,Math.max(1,Math.ceil(delay/1000)),response.status);
  throw new AIServiceError(503,'configuration_error','AI configuration is unavailable. Please contact the study organizer; rule-based tools still work.',false,undefined,response.status);
 }
 throw new AIServiceError(502,'upstream_error','AI is temporarily unavailable.',true);
}
