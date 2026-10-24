import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {RoomStore} from './store';
import {collaborationServer} from './app';
import {deploymentOptions} from './deployment';
test('Deployment settings keep localhost direct and support Render/Railway public origins',()=>{
 assert.deepEqual(deploymentOptions({}),{trustProxyHops:0,publicOrigin:undefined});
 assert.equal(deploymentOptions({RENDER_EXTERNAL_URL:'https://example.onrender.com',TRUST_PROXY_HOPS:'1'}).publicOrigin,'https://example.onrender.com');
 assert.equal(deploymentOptions({RAILWAY_PUBLIC_DOMAIN:'example.up.railway.app'}).publicOrigin,'https://example.up.railway.app');
 assert.equal(deploymentOptions({PUBLIC_ORIGIN:'https://custom.example',RENDER_EXTERNAL_URL:'https://other.example'}).publicOrigin,'https://custom.example');
 for(const value of ['true','-1','6','1.5'])assert.throws(()=>deploymentOptions({TRUST_PROXY_HOPS:value}));
 for(const value of ['https://a.example/path','https://a.example?token=test','https://u:p@a.example','file:///tmp'])assert.throws(()=>deploymentOptions({PUBLIC_ORIGIN:value}));
 assert.throws(()=>deploymentOptions({NODE_ENV:'production',PUBLIC_ORIGIN:'http://a.example'}));
});
test('Public HTTPS origin works behind one proxy; hostile/malformed origins are rejected',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sr-deployment-'));
 const app=collaborationServer(new RoomStore(join(dir,'rooms.json')),{trustProxyHops:1,publicOrigin:'https://smart.example'});
 app.get('/inspect',(req,res)=>res.json({ip:req.ip,protocol:req.protocol}));
 const server=createServer(app);await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${(server.address() as any).port}`;
 try{
  const headers={'Content-Type':'application/json','X-Forwarded-Proto':'https','X-Forwarded-For':'203.0.113.10',Origin:'https://smart.example'};
  const response=await fetch(base+'/api/rooms',{method:'POST',headers,body:'{}'});assert.equal(response.status,201);assert.equal(response.headers.get('referrer-policy'),'no-referrer');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.equal(response.headers.get('x-frame-options'),'DENY');
  assert.deepEqual(await (await fetch(base+'/inspect',{headers})).json(),{ip:'203.0.113.10',protocol:'https'});
  for(const origin of ['https://evil.example','not a URL','null','http://smart.example'])assert.equal((await fetch(base+'/api/rooms',{method:'POST',headers:{...headers,Origin:origin},body:'{}'})).status,403);
  const health=await fetch(base+'/api/health');assert.equal(health.status,200);assert.match(health.headers.get('cache-control')||'',/no-transform/);
  app.locals.shuttingDown=true;assert.equal((await fetch(base+'/api/health')).status,503);
 }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));rmSync(dir,{recursive:true,force:true});}
});
