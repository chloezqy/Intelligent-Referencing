import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ComparisonPreview from './components/ComparisonPreview';
import {MOCK_NODES} from './data';
import {tokenFacts,tokenProposal} from './designSystemReferencing';
import {applyPatches,proposalPatches} from './editing';
const ids=['hc2-img'];
function proposal(properties:string[]){const facts=tokenFacts(ids,MOCK_NODES).filter(f=>f.tokenId==='ds-product-card-img'&&properties.includes(f.property));return tokenProposal(facts.map(fact=>({fact,source:'model',reason:'Offline fixture: existing matching image style.'})),ids,MOCK_NODES);}
test('Lamp library preview uses the same object and only selected Fill, preserving radius, text and geometry',()=>{
 const p=proposal(['bg']),patches=proposalPatches(p,p.mappings.map(m=>m.id),MOCK_NODES),after=applyPatches(MOCK_NODES,patches),before=MOCK_NODES.find(n=>n.id===ids[0])!,updated=after.find(n=>n.id===before.id)!;
 assert.equal(updated.bg,'#e0e7ff');assert.equal(before.bg,'#fef3c7');for(const key of Object.keys(before).filter(key=>key!=='bg'))assert.equal(updated[key],before[key]);
 const html=renderToStaticMarkup(React.createElement(ComparisonPreview,{variant:'design-system',proposal:p,enabled:p.mappings.map(m=>m.id),nodes:MOCK_NODES,onToggle:()=>{},onApply:()=>{},onCancel:()=>{}}));
 assert.match(html,/Preview design system changes/);assert.match(html,/Current/);assert.match(html,/With library styles/);assert.match(html,/#fef3c7/);assert.match(html,/#e0e7ff/);assert.match(html,/Background color/);assert.match(html,/library-property-value/);assert.match(html,/No changes applied yet/);assert.match(html,/Apply changes/);
 assert.equal((html.match(/aria-label="Preview of Image · Minimalist Desk Lamp"/g)||[]).length,2);
 assert.doesNotMatch(html,/Sample image|AI suggestion|Use existing design system properties|Customize|Show Current|affected layers|confirmed objects/);
 assert.equal((html.match(/type="button"/g)||[]).length,2);
});
test('Multiple selected library properties retain identity and cancel leaves the original document unchanged',()=>{
 const before=JSON.stringify(MOCK_NODES),p=proposal(['bg','radius']),patches=proposalPatches(p,p.mappings.map(m=>m.id),MOCK_NODES),after=applyPatches(MOCK_NODES,patches),updated=after.find(n=>n.id==='hc2-img')!;
 assert.equal(updated.bg,'#e0e7ff');assert.equal(updated.radius,10);assert.equal(JSON.stringify(MOCK_NODES),before);assert.deepEqual(applyPatches(MOCK_NODES,[]),MOCK_NODES);
 const html=renderToStaticMarkup(React.createElement(ComparisonPreview,{variant:'design-system',proposal:p,enabled:p.mappings.map(m=>m.id),nodes:MOCK_NODES,onToggle:()=>{},onApply:()=>{},onCancel:()=>{}}));assert.match(html,/Corner radius/);assert.match(html,/16 px/);assert.match(html,/10 px/);assert.match(html,/Background color/);assert.doesNotMatch(html,/type="checkbox"/);
 const radius=proposal(['radius']);assert.deepEqual(Object.keys(radius.mappings[0].patches[0].changes),['radius']);
});
