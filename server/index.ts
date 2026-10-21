import 'dotenv/config';
import { resolve } from 'node:path';
import { createServer } from 'node:http';
import express from 'express';
import { collaborationServer } from './app';
import { RoomStore } from './store';
const app = collaborationServer(new RoomStore(resolve(process.env.ROOM_DATA_DIR || '.data', 'rooms.json')));
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(resolve('dist')));
  app.get('*', (_req, res) => res.sendFile(resolve('dist/index.html')));
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT || 3000);
const server = createServer(app);
server.listen(port, '0.0.0.0', () => console.log(`Smart Reference server: http://localhost:${port} (HTTP + realtime + persistent rooms)`));
server.on('error', error => { console.error(error); process.exit(1); });
