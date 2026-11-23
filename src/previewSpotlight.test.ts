import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MOCK_NODES} from './data';
import {previewSpotlightNodes,createPreviewSpotlight} from './previewSpotlight';
import {createPreviewComparison} from './previewComparison';
import {applyPatches} from './editing';

test('spotlight follows only the hovered preview target and its children, never other proposal targets',()=>{
 const card=previewSpotlightNodes(['hc1'],MOCK_NODES);
 assert.ok(card.some(n=>n.id==='hc1'));assert.ok(card.some(n=>n.id==='hc1-title'));
 assert.ok(!card.some(n=>n.id==='hc2'||n.id==='hc2-title'));
 const title=previewSpotlightNodes(['hc1-title'],MOCK_NODES);
 assert.deepEqual(title.map(n=>n.id),['hc1-title']);
 assert.deepEqual(previewSpotlightNodes(['missing'],MOCK_NODES),[]);
 assert.equal(new Set(card.map(n=>n.id)).size,card.length);
});
test('spotlight geometry uses visible before/after dimensions and radius, including offscreen world coordinates',()=>{
 const before=previewSpotlightNodes(['hc1'],MOCK_NODES).find(n=>n.id==='hc1')!;
 const after=applyPatches(MOCK_NODES,[{id:'hc1',changes:{x:6000,y:4000,w:200,h:250,radius:12}}]);
 const visible=previewSpotlightNodes(['hc1'],after).find(n=>n.id==='hc1')!;
 assert.equal(before.radius,16);assert.equal(visible.radius,12);
 assert.deepEqual([visible.x,visible.y,visible.w,visible.h],[6000,4000,200,250]);
 assert.equal(MOCK_NODES.find(n=>n.id==='hc1')!.radius,16);
});
test('hover and keyboard spotlight target the card, clear on leave/blur/update/close and ignore stale events',()=>{
 let ids:string[]=[];
 const session=createPreviewComparison(()=>{},()=>{},next=>ids=next);
 session.enter('before',['hc1']);assert.deepEqual(ids,['hc1']);
 session.enter('after',['hc2']);assert.deepEqual(ids,['hc2']);
 session.leave();assert.deepEqual(ids,[]);
 session.focus('before',['hc1']);assert.deepEqual(ids,['hc1']);
 session.blur();assert.deepEqual(ids,[]);
 session.enter('after',['hc2']);session.update([]);assert.deepEqual(ids,[]);
 session.enter('before',['hc1']);session.close();assert.deepEqual(ids,[]);
 session.enter('after',['hc2']);session.focus('before',['hc2']);session.leave();assert.deepEqual(ids,[]);
});
test('late cleanup from another preview cannot clear the active spotlight',()=>{
 let ids:string[]=[];const update=createPreviewSpotlight(next=>ids=next);
 const old=Symbol(),current=Symbol();update(old,['hc1']);update(current,['hc2']);
 update(old,[]);assert.deepEqual(ids,['hc2']);
 update(current,[]);assert.deepEqual(ids,[]);
});
