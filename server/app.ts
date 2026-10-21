import express from 'express';
import { RoomStore, ApiError } from './store';
import { UserId } from '../src/collaboration';
export function collaborationServer(store: RoomStore) {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('Referrer-Policy', 'no-referrer'); next(); });
  app.use(express.json({ limit: '24kb' }));
  app.use('/api', (req, _res, next) => { if (req.method === 'POST' && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) return next(new ApiError(400, 'Expected a JSON object.')); next(); });
  const clients = new Map<string, Set<{ user: UserId; response: express.Response }>>();
  const online = (code: string, user: UserId) => [...(clients.get(code) || [])].some(c => c.user === user);
  const broadcast = (code: string) => { const data = JSON.stringify(store.snapshot(code, user => online(code, user))); for (const client of clients.get(code) || []) client.response.write(`data: ${data}\n\n`); };
  const limits = new Map<string, { count: number; until: number }>();
  app.use('/api', (req, _res, next) => {
    // Same-origin browser requests only; bearer tokens remain in authorization headers.
    const origin = req.get('origin');
    if (origin && new URL(origin).host !== req.get('host')) return next(new ApiError(403, 'Use this server’s workspace URL.'));
    if (req.method !== 'GET') {
      const key = req.ip || 'local', now = Date.now();
      if (limits.size > 10000) for (const [k, v] of limits) if (v.until < now) limits.delete(k);
      const limit = limits.get(key); if (!limit || limit.until < now) limits.set(key, { count: 1, until: now + 60000 }); else if (++limit.count > 120) return next(new ApiError(429, 'Too many requests. Try again shortly.'));
    }
    next();
  });
  const route = (fn: (req: express.Request, res: express.Response) => void) => (req: express.Request, res: express.Response, next: express.NextFunction) => { try { fn(req, res); } catch (error) { next(error); } };
  const auth = (req: express.Request) => store.authorize(String(req.params.code), (req.get('authorization') || '').replace(/^Bearer /, ''));
  app.get('/api/health', (_req, res) => res.json({ ok: true, backend: 'express-sse', persistence: 'server-disk' }));
  app.post('/api/rooms', route((_req, res) => res.status(201).json(store.create())));
  app.post('/api/rooms/:code/join', route((req, res) => { const session = store.join(String(req.params.code), req.body.token); broadcast(session.code); res.json(session); }));
  app.get('/api/rooms/:code', route((req, res) => { auth(req); res.json(store.snapshot(String(req.params.code), user => online(String(req.params.code), user))); }));
  app.get('/api/rooms/:code/events', route((req, res) => {
    const user = auth(req), code = String(req.params.code);
    res.status(200).set({ 'Content-Type': 'text/event-stream', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' }); res.flushHeaders();
    const set = clients.get(code) || new Set(); const client = { user, response: res }; set.add(client); clients.set(code, set);
    res.write('retry: 1500\n\n'); broadcast(code);
    const timer = setInterval(() => res.write(': heartbeat\n\n'), 15000);
    res.on('close', () => { clearInterval(timer); set.delete(client); if (!set.size) clients.delete(code); broadcast(code); });
  }));
  app.post('/api/rooms/:code/references', route((req, res) => { const user = auth(req), code = String(req.params.code); const id = store.share(code, user, req.body); broadcast(code); res.status(201).json({ id }); }));
  app.post('/api/rooms/:code/references/:id/responses', route((req, res) => { const user = auth(req), code = String(req.params.code); store.respond(code, user, String(req.params.id), req.body); broadcast(code); res.json({ ok: true }); }));
  app.post('/api/rooms/:code/references/:id/review', route((req, res) => { const user = auth(req), code = String(req.params.code); store.review(code, user, String(req.params.id)); broadcast(code); res.json({ ok: true }); }));
  app.post('/api/rooms/:code/references/:id/activity', route((req, res) => { const user = auth(req), code = String(req.params.code); store.activity(code, user, String(req.params.id), req.body); broadcast(code); res.json({ ok: true }); }));
  app.post('/api/rooms/:code/references/:id/archive', route((req, res) => { const user = auth(req), code = String(req.params.code); store.archive(code, user, String(req.params.id), req.body.archived); broadcast(code); res.json({ ok: true }); }));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API endpoint.' }));
  app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => { const status = error instanceof ApiError ? error.status : [400,413].includes(error.status) ? error.status : 500; if (status === 500) console.error(error); res.status(status).json({ error: status === 500 ? 'The server could not save this change. Try again.' : error.message }); });
  return app;
}
