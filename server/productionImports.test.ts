import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyVercelImports} from '../scripts/verify-vercel-imports.mjs';

test('Vercel semantic API imports its complete emitted dependency graph in native Node ESM',async()=>{
 const inputs=await verifyVercelImports();
 for(const file of ['api/semantic/interpret.ts','src/comparisonSides.ts','src/comparisonContext.ts','src/referencePresentation.ts','server/comparisonRecommendations.ts','src/comparisonRecommendations.ts','src/designSystemReferencing.ts'])assert.ok(inputs.includes(file),`Missing runtime dependency ${file}`);
});

test('Production import audit rejects an extensionless import even when the bundler resolves it',async()=>{
 const {mkdtemp,mkdir,writeFile,rm}=await import('node:fs/promises');
 const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const root=await mkdtemp(join(tmpdir(),'esm-regression-'));
 try{
  await mkdir(join(root,'api/semantic'),{recursive:true});
  await writeFile(join(root,'api/semantic/interpret.ts'),"import {handler} from './dependency';export default handler;");
  await writeFile(join(root,'api/semantic/dependency.ts'),'export const handler=()=>{};');
  await assert.rejects(verifyVercelImports(root),/Native ESM import needs \.js/);
 }finally{await rm(root,{recursive:true,force:true});}
});
