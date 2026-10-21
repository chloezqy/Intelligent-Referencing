import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_NODES } from './data';
import { inferSelection, expandScope, getBoundingBox } from './utils';
import { fitBounds } from './workspace';
test('Cross-frame gestures use document scope rather than silently restricting to the first screen',()=>{
  const home=MOCK_NODES.find(n=>n.id==='home-chip-0')!,search=MOCK_NODES.find(n=>n.id==='search-chip-0');
  // Source IDs are stable, but resolve the Search chip by metadata to avoid inventing a fixture ID.
  const chip=search||MOCK_NODES.find(n=>n.screen==='Search'&&n.role==='filterChip')!;
  const stroke=[{x:home.x+1,y:home.y+1},{x:home.x+home.w/2,y:home.y+home.h/2},{x:chip.x+chip.w/2,y:chip.y+chip.h/2},{x:chip.x+chip.w-1,y:chip.y+chip.h-1}];
  const candidates=inferSelection(stroke,MOCK_NODES);
  assert.ok(candidates.length);assert.equal(candidates[0].scope,'document');
});
test('Metadata scope expansion and reference navigation resolve the same element IDs',()=>{
  const ids=expandScope(MOCK_NODES,['home-chip-0'],'document','filterChip');
  assert.equal(ids.length,8);const box=getBoundingBox(ids,MOCK_NODES)!;
  for(const [width,height] of [[600,500],[900,600],[1300,800]]){
    const view=fitBounds(box,width,height);
    assert.ok(box.x*view.scale+view.x>=0);assert.ok((box.x+box.w)*view.scale+view.x<=width);
    assert.ok(box.y*view.scale+view.y>=0);assert.ok((box.y+box.h)*view.scale+view.y<=height);
  }
});
