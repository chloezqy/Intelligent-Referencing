import {verifyVercelImports} from './verify-vercel-imports.mjs';
// Offline deployment-contract smoke test. Never loads .env or calls OpenAI.
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import express from 'express';
import assert from 'node:assert/strict';

const canary='server-only-build-canary';
execFileSync('npm',['run','build'],{stdio:'inherit',env:{...process.env,OPENAI_API_KEY:canary,AI_ENABLED:'false'}});
for(const name of await readdir(resolve('dist/assets'))){
 if(name.endsWith('.js'))assert.ok(!(await readFile(resolve('dist/assets',name),'utf8')).includes(canary),'Server-only secret reached browser assets');
}
const directory=await mkdtemp(join(tmpdir(),'sr-vercel-'));
let server;
try{
 const inputs=await verifyVercelImports();
 console.log(`PASS: native Node ESM imports the unbundled API handler and all ${inputs.length} runtime modules (including exact-case paths).`);
 const outfile=join(directory,'function.cjs');
 await build({entryPoints:['api/semantic/interpret.ts'],bundle:true,platform:'node',format:'cjs',target:'node24',outfile,logLevel:'silent'});
 // Do not permit a paid call even if a developer has exported real credentials.
 process.env.AI_ENABLED='false';delete process.env.OPENAI_API_KEY;
 process.env.VERCEL='1';process.env.NODE_ENV='production';
 const handler=createRequire(import.meta.url)(outfile).default;
 const assets=express.static(resolve('dist'));
 server=createServer((req,res)=>{
  if(req.url?.startsWith('/api/'))handler(req,res);
  else assets(req,res,()=>{res.statusCode=404;res.end();});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 const page=await fetch(base);assert.equal(page.status,200);
 assert.match(await page.text(),/assets\/index-.*\.js/);
 const disabled=await fetch(base+'/api/semantic/interpret',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://demo.example'},body:JSON.stringify({contextId:'smoke',selectedIds:['hc1-title'],exemplarIds:['hc1-title'],scope:'document'})});
 assert.equal(disabled.status,503);assert.match((await disabled.json()).error,/disabled/);
 assert.equal(disabled.headers.get('cache-control'),'private, no-store');
 assert.equal((await fetch(base+'/api/rooms')).status,404);
 console.log('PASS: production assets + bundled Vercel function, JSON fallback, no room server, no browser secret, no paid calls.');
}finally{
 if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 await rm(directory,{recursive:true,force:true});
}
