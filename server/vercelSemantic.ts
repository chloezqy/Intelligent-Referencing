import express from 'express';
import type {ErrorRequestHandler} from 'express';
import {SemanticError,semanticHandler} from './semantic.js';
import type {SemanticOptions} from './semantic.js';

/** Vercel-only policy; deployment access itself is controlled by Vercel Protection. */
export function createVercelSemanticApp(options:Omit<SemanticOptions,'authorize'>={},env:NodeJS.ProcessEnv=process.env){
 const app=express();
 app.disable('x-powered-by');
 // Vercel's edge normalizes X-Forwarded-For; trust its last proxy hop for local limits.
 app.set('trust proxy',1);
 app.use((_req,res,next)=>{res.setHeader('Cache-Control','private, no-store');next();});
 app.all('/api/semantic/interpret',(req,res,next)=>{
  if(req.method!=='POST'){res.setHeader('Allow','POST');res.status(405).json({error:'Use POST for semantic interpretation.'});return;}
  if(!req.is('application/json')){res.status(415).json({error:'Send a JSON selection. Retry or select touched objects manually.'});return;}
  next();
 });
 const parseJson=express.json({limit:'512kb'});
 // Vercel may have consumed the stream and populated its lazy body helper already.
 app.use((req,res,next)=>{if(req.body!==undefined)next();else parseJson(req,res,next);});
 app.post('/api/semantic/interpret',semanticHandler({...options,authorize:req=>{
  if(env.VERCEL!=='1')throw new SemanticError(403,'Hosted AI requires the Vercel runtime. Use npm run dev for local AI.');
  // Never derive allowed origins from attacker-controlled Host/Forwarded headers.
  const origins=[env.PUBLIC_ORIGIN,...[env.VERCEL_URL,env.VERCEL_PROJECT_PRODUCTION_URL].filter(Boolean).map(host=>`https://${host}`)].filter(Boolean);
  const origin=req.get('origin');
  if(!origin||!origins.includes(origin)||req.get('sec-fetch-site')==='cross-site')throw new SemanticError(403,'AI requests must come from this deployment.');
  // Vercel can supply an already parsed body; enforce our bound in that case too.
  if(Buffer.byteLength(JSON.stringify(req.body)??'')>512*1024)throw new SemanticError(413,'Selection request is too large.');
 }}));
 app.use((_req,res)=>{res.status(404).json({error:'API route not found.'});});
 const errors:ErrorRequestHandler=(error,_req,res,_next)=>{
  const status=error.type==='entity.too.large'?413:400;
  res.status(status).json({error:status===413?'Selection request is too large.':'Invalid JSON selection. Retry or select touched objects manually.'});
 };
 app.use(errors);
 return app;
}
