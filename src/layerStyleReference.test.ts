import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MOCK_NODES} from './data';
import {layerStyleProposal,suggestedLayerId} from './layerStyleReference';
import {applyPatches,proposalPatches} from './editing';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import LayerStyleReference from './components/LayerStyleReference';
test('style references copy only changed styles and preserve target content, geometry and identity',()=>{
 const nodes=MOCK_NODES.map(n=>n.id==='hc1-title'?{...n,fontSize:24}:n),before=JSON.stringify(nodes),p=layerStyleProposal(['hc2-title'],nodes,'hc1-title');
 const patches=proposalPatches(p,p.mappings.map(m=>m.id),nodes),after=applyPatches(nodes,patches),original=nodes.find(n=>n.id==='hc2-title')!,target=after.find(n=>n.id===original.id)!;
 assert.equal(target.fontSize,24);for(const key of ['id','text','label','x','y','w','h'] as const)assert.equal(target[key],original[key]);
 assert.equal(JSON.stringify(nodes),before);assert.ok(patches.every(p=>Object.entries(p.changes).every(([k,v])=>nodes.find(n=>n.id===p.id)?.[k as keyof typeof original]!==v)));
 assert.throws(()=>layerStyleProposal(['hc2-title'],nodes,'hc2-title'));
 assert.throws(()=>layerStyleProposal(['hc2-title'],nodes,'hc1'));
});
test('AI reference IDs and operations are validated; identical styling remains a valid no-change reference',()=>{
 const step={action:'matchStyles',role:'all',sourceId:'hc1-title',layout:null,token:null,property:null,value:null};
 assert.equal(suggestedLayerId({title:'Reference',steps:[step]},['hc2-title'],MOCK_NODES),'hc1-title');
 assert.throws(()=>suggestedLayerId({title:'Reference',steps:[{...step,sourceId:'invented'}]},['hc2-title'],MOCK_NODES));
 const source=MOCK_NODES.find(n=>n.id==='hc1-title')!,nodes=MOCK_NODES.map(n=>n.id==='hc2-title'?{...source,id:n.id,label:n.label,text:n.text}:n);
 assert.equal(layerStyleProposal(['hc2-title'],nodes,source.id).mappings.length,0);
});
test('compact reference section offers picking and Apply/Cancel without old source controls',()=>{
 const noop=()=>{},html=renderToStaticMarkup(React.createElement(LayerStyleReference,{ids:['hc2-title'],nodes:MOCK_NODES,sourceId:'hc1-title',picking:false,onSource:noop,onPicking:noop,onPreview:noop,onApply:noop,onCancel:noop}));
 assert.match(html,/Current selection/);assert.match(html,/Chosen reference/);assert.match(html,/Pick another layer/);assert.ok(html.indexOf('>Apply changes<')<html.indexOf('>Cancel<'));
 assert.doesNotMatch(html,/First Selected|Choose Reference|Find source in file|Source object|Propose changes from source|Rule-based proposal|type="checkbox"/);
});

test('Typography-scoped matching never transfers color or appearance',()=>{
 const nodes=MOCK_NODES.map(n=>n.id==='hc1-title'?{...n,color:'#ff0000',fontSize:24,radius:12}:n);
 const proposal=layerStyleProposal(['hc2-title'],nodes,'hc1-title',['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing']);
 const patches=proposalPatches(proposal,proposal.mappings.map(m=>m.id),nodes),after=applyPatches(nodes,patches),before=nodes.find(n=>n.id==='hc2-title')!,target=after.find(n=>n.id===before.id)!;
 assert.equal(target.fontSize,24);assert.equal(target.color,before.color);assert.equal(target.radius,before.radius);
 assert.ok(patches.every(p=>!('color' in p.changes)&&!('radius' in p.changes)));
});
