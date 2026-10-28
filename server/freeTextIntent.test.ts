import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {RoomStore} from './store';
test('custom sharing intentions persist for the recipient and reject blank or oversized text',()=>{
 const dir=mkdtempSync(join(tmpdir(),'custom-intent-'));
 try{
 const file=join(dir,'rooms.json'),store=new RoomStore(file),a=store.create();store.join(a.code,'b'.repeat(48));
 const body={requestId:randomUUID(),elementIds:['hc1'],exemplarIds:['hc1'],scope:'exemplars',label:'Card',intent:'Check whether this fits the new layout',message:'Please review @B',inviteNow:true};
 store.share(a.code,'A',body);
 const saved=new RoomStore(file).snapshot(a.code,()=>true).references.find(r=>r.id===body.requestId)!;
 assert.equal(saved.intent,body.intent);assert.equal(saved.targetUser,'B');assert.equal(saved.message,body.message);assert.equal(saved.attention?.length,1);
 for(const intent of ['', '   ', 'x'.repeat(121),123])assert.throws(()=>store.share(a.code,'A',{...body,requestId:randomUUID(),intent}));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
