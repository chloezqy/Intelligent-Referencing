import {accessSync,constants,existsSync,mkdirSync} from 'node:fs';
import {deploymentOptions} from './deployment';
import 'dotenv/config';
import { resolve } from 'node:path';
import { createServer } from 'node:http';
import express from 'express';
import { collaborationServer } from './app';
import { RoomStore } from './store';
const dataDir=resolve(process.env.ROOM_DATA_DIR||'.data');
mkdirSync(dataDir,{recursive:true,mode:0o700});accessSync(dataDir,constants.R_OK|constants.W_OK);
const app = collaborationServer(new RoomStore(resolve(dataDir,'rooms.json')),deploymentOptions());
if (process.env.NODE_ENV === 'production') {
  if(!existsSync(resolve('dist/index.html')))throw new Error('Production frontend missing. Run npm run build before npm start.');
  app.use(express.static(resolve('dist')));
  app.get('*', (_req, res) => res.sendFile(resolve('dist/index.html')));
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT || 3000);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT must be a valid TCP port.');
const server = createServer(app);
server.listen(port, '0.0.0.0', () => console.log(`Smart Reference listening on 0.0.0.0:${port}; room storage: ${dataDir}`));
server.on('error', error => { console.error(error); process.exit(1); });

let stopping=false;
function shutdown(){
 if(stopping)return;stopping=true;app.locals.shuttingDown=true;
 console.log('Shutting down; realtime clients will reconnect.');
 server.close(()=>process.exit(0));
 setTimeout(()=>{server.closeAllConnections();},5000).unref();
 setTimeout(()=>process.exit(1),10000).unref();
}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
