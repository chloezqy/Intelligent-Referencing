import {installSemantic} from './semantic';
import { DeploymentOptions } from './deployment';
import { randomUUID } from 'node:crypto';
import { MOCK_NODES } from '../src/data';
import { ruleBasedInterpreter } from '../src/comparisonContext';
import express from 'express';
import { RoomStore, ApiError } from './store';
import { ComparisonContext, SelectionPresence, UserId, validateDesignReference } from '../src/collaboration';
export function collaborationServer(store: RoomStore,options:DeploymentOptions={trustProxyHops:0}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy',options.trustProxyHops);
  app.use((_req,res,next)=>{res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'});next();});
  app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store, no-transform'); res.setHeader('Referrer-Policy', 'no-referrer'); next(); });
  app.use(express.json({ limit: '24kb' }));
  app.use('/api', (req, _res, next) => { if (req.method === 'POST' && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) return next(new ApiError(400, 'Expected a JSON object.')); next(); });
  const clients = new Map<string, Set<{ user: UserId; response: express.Response }>>();
  const online = (code: string, user: UserId) => [...(clients.get(code) || [])].some(c => c.user === user);
  const broadcast = (code: string) => { const data = JSON.stringify(store.snapshot(code, user => online(code, user))); for (const client of clients.get(code) || []) client.response.write(`data: ${data}\n\n`); };
  const limits = new Map<string, { count: number; until: number }>();
  app.use('/api', (req, _res, next) => {
    // Same-origin browser requests only; bearer tokens remain in authorization headers.
    const origin = req.get('origin');
    if(origin){let parsed:URL;try{parsed=new URL(origin);}catch{return next(new ApiError(403,'Invalid request origin.'));}
      const allowed=options.publicOrigin||`${req.protocol}://${req.get('host')}`;
      if(parsed.origin!==allowed||origin!==parsed.origin)return next(new ApiError(403,'Use this server’s workspace URL.'));
    }
    if (req.method !== 'GET' && !/^\/rooms\/[a-f0-9]{24}\/cursor$/.test(req.path)) {
      const key = req.ip || 'local', now = Date.now();
      if (limits.size > 10000) for (const [k, v] of limits) if (v.until < now) limits.delete(k);
      const limit = limits.get(key); if (!limit || limit.until < now) limits.set(key, { count: 1, until: now + 60000 }); else if (++limit.count > 120) return next(new ApiError(429, 'Too many requests. Try again shortly.'));
    }
    next();
  });
  installSemantic(app);
  const route = (fn: (req: express.Request, res: express.Response) => void) => (req: express.Request, res: express.Response, next: express.NextFunction) => { try { fn(req, res); } catch (error) { next(error); } };
  const auth = (req: express.Request) => store.authorize(String(req.params.code), (req.get('authorization') || '').replace(/^Bearer /, ''));
  const selections=new Map<string,Partial<Record<UserId,SelectionPresence>>>();
  const drafts=new Map<string,{code:string;user:UserId;context:ComparisonContext;expires:number}>();
  let selectionRevision=0;
  const selectionEvent=(code:string)=>{const data=JSON.stringify(selections.get(code)||{});for(const client of clients.get(code)||[])client.response.write(`event: selection\ndata: ${data}\n\n`);};
  app.post('/api/rooms/:code/selection',route((req,res)=>{
    const userId=auth(req),code=String(req.params.code),body=req.body;
    const valid=new Set(MOCK_NODES.filter(n=>n.type!=='screen').map(n=>n.id));
    if(!Array.isArray(body.elementIds)||body.elementIds.length>182||body.elementIds.some((id:any)=>!valid.has(id))||!Array.isArray(body.exemplarIds)||body.exemplarIds.some((id:any)=>!body.elementIds.includes(id))||!['exemplars','screen','flow','document'].includes(body.scope)||!['conventional','smart-ref'].includes(body.method))throw new ApiError(400,'Invalid selection.');
    const elementIds=[...new Set<string>(body.elementIds)],exemplarIds=[...new Set<string>(body.exemplarIds)],room=selections.get(code)||{};
    const previous=room[userId];
    if(!previous||JSON.stringify([previous.elementIds,previous.exemplarIds,previous.scope,previous.method])!==JSON.stringify([elementIds,exemplarIds,body.scope,body.method])){
      room[userId]={userId,elementIds,exemplarIds,scope:body.scope,method:body.method,revision:++selectionRevision};selections.set(code,room);selectionEvent(code);
    }
    res.json({ok:true});
  }));
  app.post('/api/rooms/:code/comparison-drafts',route((req,res)=>{
    const user=auth(req),code=String(req.params.code),room=selections.get(code);
    if(!online(code,'A')||!online(code,'B')||!room?.A?.elementIds.length||!room?.B?.elementIds.length)throw new ApiError(409,'Both users must be online with a selection.');
    if(req.body.revisions?.A!==room.A.revision||req.body.revisions?.B!==room.B.revision)throw new ApiError(409,'Selections changed. Try Compare again.');
    for(const [id,draft] of drafts)if(draft.expires<Date.now())drafts.delete(id);
    if(drafts.size>=1000)throw new ApiError(429,'Too many comparison drafts. Try later.');
    const context:ComparisonContext={snapshotId:randomUUID(),selections:structuredClone(room) as Record<UserId,SelectionPresence>,purpose:'',interpretation:ruleBasedInterpreter.interpret(room.A.elementIds,room.B.elementIds,MOCK_NODES)};
    drafts.set(context.snapshotId,{code,user,context,expires:Date.now()+3600000});res.status(201).json(context);
  }));
  const cursorLimits=new Map<string,{count:number;until:number}>();
  const cursorEvent=(code:string,cursor:object)=>{for(const client of clients.get(code)||[])client.response.write(`event: cursor\ndata: ${JSON.stringify(cursor)}\n\n`);};
  app.post('/api/rooms/:code/cursor',route((req,res)=>{
    const userId=auth(req),code=String(req.params.code),now=Date.now(),key=`${code}:${userId}`;
    for(const [k,v] of cursorLimits)if(v.until<now)cursorLimits.delete(k);
    const limit=cursorLimits.get(key);if(limit&&++limit.count>30)throw new ApiError(429,'Cursor update rate exceeded.');
    if(!limit)cursorLimits.set(key,{count:1,until:now+1000});
    const {x,y,visible}=req.body;
    if(typeof visible!=='boolean'||!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>1000000||Math.abs(y)>1000000)throw new ApiError(400,'Invalid cursor position.');
    cursorEvent(code,{userId,x,y,visible,at:now});res.json({ok:true});
  }));
  app.get('/api/health', (_req, res) => res.status(app.locals.shuttingDown?503:200).json({ ok: true, backend: 'express-sse', persistence: 'server-disk' }));
  app.post('/api/rooms', route((_req, res) => res.status(201).json(store.create())));
  app.post('/api/rooms/:code/join', route((req, res) => { const session = store.join(String(req.params.code), req.body.token); broadcast(session.code); res.json(session); }));
  app.get('/api/rooms/:code', route((req, res) => { auth(req); res.json(store.snapshot(String(req.params.code), user => online(String(req.params.code), user))); }));
  app.get('/api/rooms/:code/events', route((req, res) => {
    const user = auth(req), code = String(req.params.code);
    if([...(clients.get(code)||[])].filter(c=>c.user===user).length>=8)throw new ApiError(429,'Too many active room connections for this user. Close unused tabs.');
    res.status(200).set({ 'Content-Type': 'text/event-stream', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' }); res.flushHeaders();
    const set = clients.get(code) || new Set(); const client = { user, response: res }; set.add(client); clients.set(code, set);
    res.write('retry: 1500\n\n'); broadcast(code); selectionEvent(code);
    const timer = setInterval(() => res.write(': heartbeat\n\n'), 15000);
    res.on('close', () => { clearInterval(timer); set.delete(client); if (!set.size) clients.delete(code); if(!online(code,user)){const room=selections.get(code);if(room){delete room[user];if(!Object.keys(room).length)selections.delete(code);selectionEvent(code);}} if(!online(code,user))cursorEvent(code,{userId:user,x:0,y:0,visible:false,at:Date.now()}); broadcast(code); });
  }));
  app.post('/api/rooms/:code/references', route((req, res) => { const user = auth(req), code = String(req.params.code); let comparison:ComparisonContext|undefined;
    if(req.body.comparison){
      const frozen=drafts.get(req.body.comparison.snapshotId);
      if(!frozen||frozen.code!==code||frozen.user!==user||frozen.expires<Date.now())throw new ApiError(409,'Comparison draft expired. Refresh the comparison.');
      const purpose=req.body.comparison.purpose;
      if(typeof purpose!=='string'||!purpose.trim()||purpose.length>300||req.body.intent!=='Compare')throw new ApiError(400,'Choose a comparison purpose.');
      comparison={...structuredClone(frozen.context),purpose:purpose.trim()};
      try{const designReference=validateDesignReference(comparison.purpose,req.body.comparison.designReference,comparison.selections);if(designReference)comparison.designReference=designReference;}catch(error){throw new ApiError(400,(error as Error).message);}
      const ids=[...new Set([...comparison.selections.A.elementIds,...comparison.selections.B.elementIds])];
      if(!Array.isArray(req.body.elementIds)||ids.length!==req.body.elementIds.length||ids.some(id=>!req.body.elementIds.includes(id)))throw new ApiError(400,'Comparison targets must match the frozen selections.');
    }
    const id = store.share(code, user, req.body,comparison); broadcast(code); res.status(201).json({ id }); }));
  app.post('/api/rooms/:code/references/:id/attention',route((req,res)=>{const user=auth(req),code=String(req.params.code);store.inviteAttention(code,user,String(req.params.id),req.body.requestId);broadcast(code);res.json({ok:true});}));
  app.post('/api/rooms/:code/references/:id/attention/:invitationId/view',route((req,res)=>{const user=auth(req),code=String(req.params.code);store.viewAttention(code,user,String(req.params.id),String(req.params.invitationId));broadcast(code);res.json({ok:true});}));
  app.post('/api/rooms/:code/references/:id/responses', route((req, res) => { const user = auth(req), code = String(req.params.code); store.respond(code, user, String(req.params.id), req.body); broadcast(code); res.json({ ok: true }); }));
  app.post('/api/rooms/:code/references/:id/changes/:changeId',route((req,res)=>{const user=auth(req),code=String(req.params.code);store.decideChange(code,user,String(req.params.id),String(req.params.changeId),req.body.status);broadcast(code);res.json({ok:true});}));
  app.post('/api/rooms/:code/references/:id/review', route((req, res) => { const user = auth(req), code = String(req.params.code); store.review(code, user, String(req.params.id)); broadcast(code); res.json({ ok: true }); }));
  app.post('/api/rooms/:code/references/:id/activity', route((req, res) => { const user = auth(req), code = String(req.params.code); store.activity(code, user, String(req.params.id), req.body); broadcast(code); res.json({ ok: true }); }));
  app.post('/api/rooms/:code/references/:id/archive', route((req, res) => { const user = auth(req), code = String(req.params.code); store.archive(code, user, String(req.params.id), req.body.archived); broadcast(code); res.json({ ok: true }); }));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API endpoint.' }));
  app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => { const status = error instanceof ApiError ? error.status : [400,413].includes(error.status) ? error.status : 500; if (status === 500) console.error(error); res.status(status).json({ error: status === 500 ? 'The server could not save this change. Try again.' : error.message }); });
  return app;
}
