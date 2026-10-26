import {test} from 'node:test';
import assert from 'node:assert/strict';
import {referenceLists,SharedReference} from './collaboration';
const reference=(id:string,extra:Partial<SharedReference>={}):SharedReference=>({id,sourceUser:'A',targetUser:'B',intent:'Review',elementIds:['hc1-title'],exemplarIds:['hc1-title'],label:'Title',scope:'exemplars',message:'Please review',createdAt:'2026-10-26T00:00:00Z',status:'open',responses:[],...extra});
test('Reviewed references move from Active to Archived, including previously saved demo and realtime records',()=>{
 for(const simulated of [true,false]){
  const open=reference('open',{simulated});
  const reviewed=reference('reviewed',{simulated,status:'reviewed',reviewedAt:'2026-10-26T01:00:00Z',responses:[{id:'reply',userId:'B',message:'Checked',createdAt:'2026-10-26T00:30:00Z'}]});
  const manual=reference('manual',{simulated,archivedAt:'2026-10-26T02:00:00Z'});
  const both=reference('both',{simulated,status:'reviewed',archivedAt:'2026-10-26T02:00:00Z'});
  const input=[open,reviewed,manual,both],before=JSON.stringify(input);
  const lists=referenceLists(input);
  assert.deepEqual(lists.active.map(r=>r.id),['open']);
  assert.deepEqual(lists.archived.map(r=>r.id),['reviewed','manual','both']);
  assert.equal(lists.archived[0],reviewed);
  assert.equal(lists.archived[0].responses[0].message,'Checked');
  assert.equal(JSON.stringify(input),before);
 }
});
test('An empty room has no active or archived references',()=>{assert.deepEqual(referenceLists([]),{active:[],archived:[]});});
