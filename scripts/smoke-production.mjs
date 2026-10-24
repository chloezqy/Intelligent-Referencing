import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:net';
import {randomUUID,randomBytes} from 'node:crypto';
const data=await mkdtemp(join(tmpdir(),'smart-reference-production-'));
const probe=createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const base=`http://127.0.0.1:${port}`;let child;const streams=[];
async function start(){
 child=spawn(process.execPath,['--import','tsx','server/index.ts'],{env:{...process.env,NODE_ENV:'production',PORT:String(port),ROOM_DATA_DIR:data,PUBLIC_ORIGIN:'https://smart.example',TRUST_PROXY_HOPS:'1'},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Production server did not start.')),15000);const exit=()=>{clearTimeout(timeout);reject(new Error('Production server exited before listening.'));};child.once('exit',exit);child.stdout.on('data',chunk=>{if(chunk.toString().includes('Smart Reference listening')){clearTimeout(timeout);child.removeListener('exit',exit);resolve();}});child.stderr.on('data',chunk=>process.stderr.write(chunk));});
}
async function stop(){if(!child||child.exitCode!==null)return;const done=once(child,'exit');child.kill('SIGTERM');await done;}
async function api(path,body,session){const response=await fetch(base+'/api'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Origin:'https://smart.example','X-Forwarded-Proto':'https',...(session?{Authorization:`Bearer ${session.token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});assert.match(response.headers.get('content-type')||'',/application\/json/);assert.ok(response.ok,`API failed: ${path} HTTP ${response.status}`);return response.json();}
try{
 await start();
 const page=await fetch(base);assert.equal(page.status,200);assert.match(page.headers.get('content-type')||'',/text\/html/);const html=await page.text();assert.match(html,/assets\//);
 const assetPath=html.match(/src="([^"]+\.js)"/)[1];assert.equal((await fetch(base+assetPath)).status,200);
 assert.equal((await api('/health')).backend,'express-sse');
 const unknown=await fetch(base+'/api/not-an-endpoint');assert.equal(unknown.status,404);assert.match(unknown.headers.get('content-type'),/application\/json/);
 const a=await api('/rooms',{}),b=await api(`/rooms/${a.code}/join`,{token:randomBytes(32).toString('hex')});
 const controller=new AbortController();streams.push(controller);const events=await fetch(`${base}/api/rooms/${a.code}/events`,{headers:{Authorization:`Bearer ${b.token}`},signal:controller.signal});assert.match(events.headers.get('content-type'),/text\/event-stream/);assert.match(events.headers.get('cache-control'),/no-transform/);
 const reader=events.body.getReader(),decoder=new TextDecoder();let buffer='';
 async function waitFor(id){const timer=setTimeout(()=>controller.abort(),10000);try{while(true){let end;while((end=buffer.indexOf('\n\n'))>=0){const event=buffer.slice(0,end);buffer=buffer.slice(end+2);if(event.includes('event: '))continue;const line=event.split('\n').find(l=>l.startsWith('data: '));if(line){const room=JSON.parse(line.slice(6));if(room.references?.some(r=>r.id===id))return room;}}const {value,done}=await reader.read();assert.equal(done,false);buffer+=decoder.decode(value,{stream:true});}}finally{clearTimeout(timer);}}
 const id=randomUUID();await api(`/rooms/${a.code}/references`,{requestId:id,elementIds:['hc1-cta','sc1-cta'],exemplarIds:['hc1-cta'],scope:'document',intent:'Compare',label:'Production smoke comparison',message:'Review both primary actions.'},a);
 assert.ok((await waitFor(id)).references.some(r=>r.id===id));
 await api(`/rooms/${a.code}/references/${id}/responses`,{requestId:randomUUID(),message:'Received live.'},b);
 controller.abort();await reader.cancel().catch(()=>{});
 await stop();await start();
 const recovered=await api(`/rooms/${a.code}`,undefined,a);assert.equal(recovered.references.find(r=>r.id===id).responses[0].message,'Received live.');
 assert.equal((await api(`/rooms/${a.code}`,undefined,b)).code,a.code);
 const privatePath=await fetch(base+'/.data/rooms.json');assert.match(privatePath.headers.get('content-type')||'',/text\/html/);assert.ok(!(await privatePath.text()).includes(a.token));
 console.log('Production smoke passed: frontend + API + authenticated SSE + live reference + response + restart recovery.');
}finally{streams.forEach(s=>s.abort());await stop();await rm(data,{recursive:true,force:true});}
