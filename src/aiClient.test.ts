import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestAI,AIRequestError} from './aiClient';
test('shared browser transport coalesces rapid clicks and caches identical context across reopened panels',async()=>{
 let calls=0;const fetcher:typeof fetch=async(_u,init)=>{calls++;const b=JSON.parse(String(init?.body));assert.ok((init!.headers as any)['X-Smart-Reference-Session']);assert.equal((init!.headers as any).Authorization,undefined);await new Promise(r=>setTimeout(r,5));return Response.json({contextId:b.contextId,model:'fixture',candidates:[]});};
 const body={contextId:'first',selectedIds:['a'],document:[{id:'a',radius:1}]};
 const [a,b]=await Promise.all([requestAI(body,{fetcher}),requestAI({...body,contextId:'second'},{fetcher})]);assert.equal(calls,1);assert.equal(a.contextId,'first');assert.equal(b.contextId,'second');
 await requestAI({...body,contextId:'reopened'},{fetcher});assert.equal(calls,1);
 await requestAI({...body,document:[{id:'a',radius:2}]},{fetcher});assert.equal(calls,2);
});
test('failed requests recover on explicit retry; stale result context is never rewritten as valid',async()=>{
 let calls=0;const fetcher:typeof fetch=async(_u,init)=>{calls++;const b=JSON.parse(String(init?.body));return calls===1?Response.json({code:'upstream_error',retryable:true,error:'sensitive raw provider message'},{status:502}):Response.json({contextId:b.contextId,model:'fixture',plan:[]});};
 await assert.rejects(requestAI({contextId:'a',instruction:'recover'},{fetcher}),(e:AIRequestError)=>e.retryable&&!e.message.includes('sensitive'));
 await requestAI({contextId:'b',instruction:'recover'},{fetcher});assert.equal(calls,2);
 await assert.rejects(requestAI({contextId:'correct'},{fetcher:async()=>Response.json({contextId:'wrong',model:'fixture'})}),(e:AIRequestError)=>e.code==='invalid_response');
});
test('Retry-After cooldown prevents repeated clicks from sending more requests',async()=>{
 let calls=0;const fetcher:typeof fetch=async()=>{calls++;return Response.json({code:'rate_limit',retryable:true,retryAfter:60},{status:429});};
 for(let i=0;i<3;i++)await assert.rejects(requestAI({contextId:String(i),instruction:'cooldown'},{fetcher}),AIRequestError);
 assert.equal(calls,1);
});
test('opening comparison, library suggestions and review popup renders explicit actions without network calls',async()=>{
 const React=await import('react'),{renderToStaticMarkup}=await import('react-dom/server');
 const {default:DesignSystemReview}=await import('./components/DesignSystemReview'),{default:ReviewFocus}=await import('./components/ReviewFocus'),{default:PropertyComparison}=await import('./components/PropertyComparison');
 const {MOCK_NODES}=await import('./data'),{localComparison}=await import('./comparisonSides');
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('Must require an explicit action');};
 try{
 const library=renderToStaticMarkup(React.createElement(DesignSystemReview,{ids:['hc2-img'],nodes:MOCK_NODES,onPropose:()=>{},onSelected:()=>{}}));
 assert.match(library,/Suggest library matches with AI/);
 const openedLibrary=renderToStaticMarkup(React.createElement(DesignSystemReview,{requestOnOpen:true,ids:['hc2-img'],nodes:MOCK_NODES,onPropose:()=>{},onSelected:()=>{}}));
 assert.doesNotMatch(openedLibrary,/Suggest library matches with AI|Retry AI|No library style changes needed/);
 const review=renderToStaticMarkup(React.createElement(ReviewFocus,{reference:{id:'review',elementIds:['hc2-img'],message:'review the shape'} as any,nodes:MOCK_NODES}));assert.match(review,/Suggest review focus with AI/);
 const compare=renderToStaticMarkup(React.createElement(PropertyComparison,{ownership:localComparison('A',['hc1','sc2'],'explicit',MOCK_NODES),contextId:'explicit',ids:['hc1','sc2'],nodes:MOCK_NODES,expanded:true,visual:true,onSelectedKeys:()=>{}}));assert.match(compare,/Analyze differences with AI/);assert.match(compare,/Rule-based/);assert.equal(calls,0);
 }finally{globalThis.fetch=original;}
});
