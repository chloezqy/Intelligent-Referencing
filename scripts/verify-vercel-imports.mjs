// Native Node deployment import check. No tsx loader, bundling, .env, or model calls.
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {mkdtemp,readFile,readdir,rm,symlink,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename,relative,sep} from 'node:path';
import assert from 'node:assert/strict';

export async function verifyVercelImports(root=process.cwd()){
 const entry='api/semantic/interpret.ts';
 // Discover the actual runtime closure instead of maintaining a partial entry-point list.
 const graph=await build({absWorkingDir:root,entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm',packages:'external',metafile:true,logLevel:'silent'});
 const inputs=Object.keys(graph.metafile.inputs).filter(file=>!file.split(/[\\/]/).includes('node_modules'));
 const directory=await mkdtemp(join(tmpdir(),'sr-native-esm-'));
 try{
  const emitted=await build({absWorkingDir:root,entryPoints:inputs,outbase:root,outdir:directory,bundle:false,platform:'node',format:'esm',target:'node24',metafile:true,logLevel:'silent'});
  await writeFile(join(directory,'package.json'),JSON.stringify({type:'module'}));
  await symlink(resolve(root,'node_modules'),join(directory,'node_modules'),'dir');
  for(const output of Object.keys(emitted.metafile.outputs)){
   const file=resolve(root,output);if(!file.endsWith('.js'))continue;
   const source=await readFile(file,'utf8');
   for(const match of source.matchAll(/(?:from\s*|import\s*\(?\s*)["'](\.{1,2}\/[^"']+)["']/g)){
    const specifier=match[1];assert.ok(/\.js$/.test(specifier),`Native ESM import needs .js: ${relative(directory,file)} → ${specifier}`);
    const target=resolve(dirname(file),specifier);assert.ok(!relative(directory,target).startsWith('..'),`Import escaped emitted graph: ${specifier}`);
    // Linux deployments are case-sensitive, even when local development is not.
    let parent=directory;for(const part of relative(directory,target).split(sep)){assert.ok((await readdir(parent)).includes(part),`Missing or case-mismatched emitted dependency: ${relative(directory,file)} → ${specifier}`);parent=join(parent,part);}
    assert.equal(basename(target),basename(specifier));
   }
  }
  execFileSync(process.execPath,['--input-type=module','-e',`const {default:handler}=await import(${JSON.stringify(join(directory,'api/semantic/interpret.js'))});if(typeof handler!=='function')throw new Error('Missing API handler');`],{cwd:root,stdio:'pipe',env:{...process.env,NODE_OPTIONS:'',AI_ENABLED:'false',OPENAI_API_KEY:''}});
  return inputs.sort();
 }finally{await rm(directory,{recursive:true,force:true});}
}
