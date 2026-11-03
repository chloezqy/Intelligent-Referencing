import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MOCK_NODES} from './data';
import {buildLibrary,COMPONENT_STYLES,TYPOGRAPHY,COLORS} from './designSystem';
import {libraryProposal,proposalPatches,applyPatches,changedPatches,descendants} from './editing';
import EditingToolbar from './components/EditingToolbar';
const ids=['hc1','hc2','hc3','hc4'];
test('complete card application changes every card and nested styles with real library values',()=>{
 const p=libraryProposal(ids,MOCK_NODES),patches=proposalPatches(p,p.mappings.map(m=>m.id),MOCK_NODES),after=applyPatches(MOCK_NODES,patches);
 for(const id of ids){
  const card=after.find(n=>n.id===id)!;
  for(const [key,value] of Object.entries(COMPONENT_STYLES['Product Card']))assert.equal(card[key],value);
  for(const suffix of ['title','price','cta']){const source=MOCK_NODES.find(n=>n.id===`ds-product-card-${suffix}`)!,target=after.find(n=>n.id===`${id}-${suffix}`)!;for(const key of ['bg','color','radius','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','border'])if(source[key]!==undefined)assert.equal(target[key],source[key]);}
  assert.equal(after.find(n=>n.id===`${id}-img`)!.radius,MOCK_NODES.find(n=>n.id==='ds-product-card-img')!.radius);
  assert.equal(after.find(n=>n.id===`${id}-img`)!.bg,MOCK_NODES.find(n=>n.id===`${id}-img`)!.bg);
  assert.equal(after.find(n=>n.id===`${id}-title`)!.x,card.x+card.spacing!);
 }
 const allowed=new Set(descendants(ids,MOCK_NODES).map(n=>n.id));
 for(const n of after){const before=MOCK_NODES.find(b=>b.id===n.id)!;if(!allowed.has(n.id))assert.deepEqual(n,before);for(const key of ['text','label','parent','role','component'])assert.equal(n[key],before[key]);}
 const repeat=libraryProposal(ids,after);assert.equal(changedPatches(after,proposalPatches(repeat,repeat.mappings.map(m=>m.id),after)).length,0);
});
test('library source is authoritative, including missing properties and image corner styling',()=>{
 const nodes=structuredClone(MOCK_NODES);nodes.find(n=>n.id==='ds-product-card')!.shadow='0 4px 12px #11111122';nodes.find(n=>n.id==='ds-product-card-img')!.radius=7;nodes.find(n=>n.id==='ds-product-card-title')!.fontSize=15;
 const p=libraryProposal(ids,nodes),after=applyPatches(nodes,proposalPatches(p,p.mappings.map(m=>m.id),nodes));
 for(const id of ids){assert.equal(after.find(n=>n.id===id)!.shadow,'0 4px 12px #11111122');assert.equal(after.find(n=>n.id===`${id}-img`)!.radius,7);assert.equal(after.find(n=>n.id===`${id}-title`)!.fontSize,15);}
});
test('organized library samples match exported palettes, typography and component styles',()=>{
 const library=buildLibrary(),frame=library[0];
 Object.entries(COLORS).forEach(([name,value],i)=>{const swatch=library.find(n=>n.id===`ds-color-${i}`)!;assert.equal(swatch.token,`Color / ${name}`);assert.equal(swatch.bg,value);assert.ok(library.some(n=>n.text===value));});
 Object.entries(TYPOGRAPHY).forEach(([name,style],i)=>{const sample=library.find(n=>n.id===`ds-type-${i}`)!;assert.equal(sample.token,`Typography / ${name}`);for(const [key,value] of Object.entries(style))assert.equal(sample[key],value);});
 for(const n of library.slice(1)){const parent=library.find(p=>p.id===n.parent)!;assert.ok(parent,n.id);assert.ok(n.x>=parent.x&&n.y>=parent.y&&n.x+n.w<=parent.x+parent.w&&n.y+n.h<=parent.y+parent.h,n.id);assert.equal(n.library,true);}
 const buttonType=library.find(n=>n.token==='Typography / Button Label')!;assert.equal(buttonType.color,'#ffffff');assert.equal(buttonType.bg,COLORS.Primary);
 assert.equal(frame.y+frame.h-Math.max(...library.slice(1).map(n=>n.y+n.h)),28);assert.ok(!library.some(n=>n.id==='ds-footer'));assert.equal(library.find(n=>n.id==='ds-heading')!.textAlign,'left');assert.equal(library.find(n=>n.id==='ds-property-2')!.shadow,COMPONENT_STYLES['Product Card'].shadow);
});
test('normal Design inspector exposes full library application and source navigation without AI',()=>{
 const html=renderToStaticMarkup(React.createElement(EditingToolbar,{selectionInspector:true,inline:true,selection:{selectedIds:ids,exemplarIds:ids,scope:'screen',selectionMethod:'conventional',label:'Home cards'},nodes:MOCK_NODES,onPreview:()=>{},onApply:()=>{},onUndo:()=>{},onRedo:()=>{},canUndo:false,canRedo:false,sourceId:null,onSource:()=>{},picking:false,onPicking:()=>{},onState:()=>{},onLocateLibrary:()=>{}}));
 assert.match(html,/Appearance suggested actions/);assert.match(html,/design-smart-row[^>]*[\s\S]*Apply design system/);assert.match(html,/View design system/);assert.doesNotMatch(html,/selection-library-action|Apply complete design system/);
});
