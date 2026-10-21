import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_NODES } from './data';
import { SharedReference } from './collaboration';
import { compareReferenceElements, layoutReferencePins, orderedReferences, PIN_SIZE, referenceShortLabel, pinChooserBounds, sharePopoverLayout, shareActionLabel } from './referencePresentation';
const reference=(id:string,elementIds:string[],status:'open'|'reviewed'='open'):SharedReference=>({id,elementIds,exemplarIds:[],sourceUser:'A',targetUser:'B',scope:'document',intent:'Compare',label:'Buttons',message:'Compare wording',createdAt:'2026-10-21T12:00:00Z',status,responses:[]});
const camera={x:0,y:0,scale:1},viewport={width:4000,height:2000};
test('Each saved target has an object anchor that follows world coordinates under pan and zoom',()=>{
 const ref=reference('r',['hc1-cta','sc1-cta']);
 for(const scale of [.08,.5,1,2.5]){
  const camera={x:50,y:50,scale},pins=layoutReferencePins([ref],MOCK_NODES,camera,{width:10000,height:10000},null);
  const anchors=pins.flatMap(p=>p.anchors);assert.equal(anchors.length,2);
  for(const a of anchors){const n=MOCK_NODES.find(n=>n.id===a.elementId)!;assert.equal(a.x,(n.x+n.w)*scale+camera.x);assert.equal(a.y,n.y*scale+camera.y);assert.equal(a.referenceId,'r');}
 }
 assert.equal(PIN_SIZE,24);
});
test('Nearby object pins cluster without creating a second conversation and expand at higher zoom',()=>{
 const nodes=MOCK_NODES.filter(n=>n.id==='hc1-cta'||n.id==='sc1-cta').map((n,i)=>({...n,x:100+i*40,y:100,w:20}));
 const refs=[reference('r',nodes.map(n=>n.id))];
 const low=layoutReferencePins(refs,nodes,{x:0,y:0,scale:.5},viewport,null);assert.equal(low.length,1);assert.equal(low[0].anchors.length,2);assert.deepEqual(low[0].referenceIds,['r']);
 assert.equal(layoutReferencePins(refs,nodes,{x:0,y:0,scale:2},viewport,null).length,2);
});
test('Overlapping conversations deduplicate reference IDs; active anchor wins; ordering is stable',()=>{
 const n=MOCK_NODES.find(n=>n.id==='hc1-cta')!,nodes=[{...n,id:'one',x:100,w:20},{...n,id:'two',x:110,w:20}];
 const refs=[reference('b',['one']),reference('a',['two','one'],'reviewed')];
 const pins=layoutReferencePins(refs,nodes,camera,viewport,'b');assert.equal(pins.length,1);assert.deepEqual(pins[0].referenceIds,['a','b']);assert.equal(pins[0].x,120);assert.equal(pins[0].anchors.filter(a=>a.active).length,1);
 assert.deepEqual(layoutReferencePins([...refs].reverse(),nodes,camera,viewport,'b'),pins);
 assert.deepEqual(orderedReferences(refs).map(r=>r.id),['a','b']);
});
test('Missing and offscreen objects create no false pins; restoring viewport brings anchors back',()=>{
 const refs=[reference('r',['hc1-cta','missing'])];
 assert.equal(layoutReferencePins(refs,MOCK_NODES,{x:-1000,y:0,scale:1},viewport,null).length,0);
 assert.equal(layoutReferencePins(refs,MOCK_NODES,camera,viewport,null).length,1);
});
test('Every pair of rendered cluster markers has at least 8px separation',()=>{
 const base=MOCK_NODES.find(n=>n.id==='hc1-cta')!,nodes=Array.from({length:100},(_,i)=>({...base,id:String(i),x:50+(i%10)*12,y:50+Math.floor(i/10)*20,w:10}));
 const pins=layoutReferencePins([reference('r',nodes.map(n=>n.id))],nodes,camera,viewport,null);
 for(let i=0;i<pins.length;i++)for(let j=i+1;j<pins.length;j++)assert.ok(Math.abs(pins[i].x-pins[j].x)>=32||Math.abs(pins[i].y-pins[j].y)>=32);
});
test('CTA comparison exposes real wording, size and radius differences, and authored matching properties',()=>{
 const result=compareReferenceElements(['hc1-cta','sc1-cta'],MOCK_NODES),row=(key:string)=>result.rows.find(r=>r.key===key)!;
 assert.deepEqual(row('text').values,['Add to Bag','Add']);assert.equal(row('text').state,'different');
 assert.deepEqual(row('dimensions').values,['145 × 30 px','80 × 28 px']);assert.deepEqual(row('radius').values,['8 px','6 px']);
 for(const key of ['type','role','component','background','color','fontSize','fontWeight'])assert.equal(row(key).state,'matching');
 assert.deepEqual(row('location').values,['x 26, y 490 px','x 269, y 266 px']);
});
test('Missing properties are not invented, mixed types are compared honestly and all targets are included',()=>{
 const base=MOCK_NODES.find(n=>n.id==='hc1-cta')!;
 const result=compareReferenceElements(['a','b','c','gone','a'],[{...base,id:'a',fontWeight:undefined},{...base,id:'b',fontWeight:'600',type:'text'},{...base,id:'c'}]);
 assert.equal(result.elements.length,3);assert.deepEqual(result.missingIds,['gone']);
 assert.equal(result.rows.find(r=>r.key==='type')!.state,'different');
 assert.equal(result.rows.find(r=>r.key==='fontWeight')!.state,'unavailable');
 assert.equal(result.rows.find(r=>r.key==='fontWeight')!.values[0],'Not specified');
});
test('Comparison reads saved IDs, does not mutate nodes or references, and ignores array ordering',()=>{
 const ref=reference('r',['sc1-cta','hc1-cta']),before=JSON.stringify(MOCK_NODES);
 const result=compareReferenceElements(ref.elementIds,MOCK_NODES);
 const otherSelection=['home-chip-0'];otherSelection.push('search-filter-0');
 assert.deepEqual(result.elements.map(n=>n.id),ref.elementIds);assert.equal(JSON.stringify(MOCK_NODES),before);
 assert.deepEqual(compareReferenceElements(ref.elementIds,[...MOCK_NODES].reverse()),result);
});

test('Archived references have no canvas pins; restoring retains their object anchors',()=>{
 const archived={...reference('old',['hc1-cta']),archivedAt:'2026-10-21T13:00:00Z',archivedBy:'B' as const};
 assert.equal(layoutReferencePins([archived],MOCK_NODES,camera,viewport,null).length,0);
 assert.equal(layoutReferencePins([{...archived,archivedAt:undefined}],MOCK_NODES,camera,viewport,null).length,1);
});
test('Compact chooser labels never include full notes and its bounds stay inside the canvas',()=>{
 const ref={...reference('r',['hc1-cta']),label:'A long label '.repeat(30),message:'Full private conversation text should not appear on the canvas'};
 const label=referenceShortLabel(ref);assert.ok(label.length<60);assert.ok(!label.includes(ref.message));
 for(const width of [160,280,700])for(const height of [120,300,800])for(const anchor of [{x:0,y:0},{x:width,y:height},{x:width/2,y:height/2}]){
  const box=pinChooserBounds(anchor,{width,height});assert.ok(box.left>=8);assert.ok(box.top>=8);assert.ok(box.left+box.width<=width-8);assert.ok(box.top+box.maxHeight<=height-8);
 }
});

test('Sharing labels identify the actual recipient',()=>{
 assert.equal(shareActionLabel('A'),'Share to User B');assert.equal(shareActionLabel('B'),'Share to User A');assert.equal(shareActionLabel(null),'Share to user?');
});
test('The share popup follows a frozen target and stays within the viewport, flipping above when needed',()=>{
 const node=MOCK_NODES.find(n=>n.id==='hc1-cta')!;
 for(const width of [220,800,1300])for(const height of [240,600])for(const scale of [.08,.5,2.5]){
  const layout=sharePopoverLayout([node.id],MOCK_NODES,{x:0,y:0,scale},{width,height},320)!;
  assert.ok(layout.popup.left>=8);assert.ok(layout.popup.top>=8);assert.ok(layout.popup.left+layout.popup.width<=width-8);assert.ok(layout.popup.top+Math.min(320,layout.popup.maxHeight)<=height-8);
 }
 const simple=[{...node,id:'anchor',x:50,y:50,w:50}];
 const low=sharePopoverLayout(['anchor'],simple,camera,{width:800,height:600},250)!;
 assert.deepEqual(low.pin,{x:100,y:50});assert.equal(low.popup.top,70);
 const moved=sharePopoverLayout(['anchor'],simple,{x:10,y:15,scale:2},{width:800,height:600},250)!;
 assert.deepEqual(moved.pin,{x:210,y:115});
 const bottom=sharePopoverLayout(['anchor'],[{...simple[0],y:500}],camera,{width:800,height:600},250)!;assert.ok(bottom.popup.top<bottom.pin.y);
 assert.equal(sharePopoverLayout(['missing'],MOCK_NODES,camera,viewport),null);
});
