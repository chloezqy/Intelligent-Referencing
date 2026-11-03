import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hexToHSV,hsvToHex,adjustColorProposal} from './colorAdjustment';
import {MOCK_NODES} from './data';
import {applyPatches} from './editing';
test('color wheel conversions round-trip actual hex values',()=>{for(const hex of ['#4f46e5','#ffffff','#000000','#cbd5e1','#0f766e']){const {h,s,v}=hexToHSV(hex);assert.equal(hsvToHex(h,s,v),hex);}});
test('manual color preview changes only chosen properties and does not mutate source nodes',()=>{
 const nodes=MOCK_NODES.map(n=>n.id==='hc1'?{...n,border:'2px solid #cbd5e1'}:n),before=JSON.stringify(nodes),proposal=adjustColorProposal(['hc1'],nodes,{border:'#ff0000'}),patches=proposal.mappings.flatMap(m=>m.patches),after=applyPatches(nodes,patches),target=after.find(n=>n.id==='hc1')!,original=nodes.find(n=>n.id==='hc1')!;
 assert.equal(target.border,'2px solid #ff0000');assert.equal(target.bg,original.bg);assert.equal(target.text,original.text);assert.equal(JSON.stringify(nodes),before);
 assert.equal(adjustColorProposal(['hc1'],nodes,{bg:original.bg}).mappings.length,0);
 assert.equal(adjustColorProposal(['hc1'],nodes,{bg:'invalid'}).mappings.length,0);
});
