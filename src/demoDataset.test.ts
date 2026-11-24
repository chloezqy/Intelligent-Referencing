import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MOCK_NODES} from './data';
import {selectionStyleChanges,categoryProposal,ACTION_CATEGORIES} from './selectionAIActions';
import {applyPatches,proposalPatches} from './editing';
import {ElementPreview} from './components/ReferencePreviewCard';
import MockSymbol,{isMockSymbol} from './components/MockSymbol';
import {mockTextLines,wrapsMockText,mockContentPadding} from './mockPresentation';
const homeIds=['hc1','hc2','hc3','hc4'];
test('demo cards align and every authored layer fits within its parent',()=>{
 const cards=homeIds.map(id=>MOCK_NODES.find(n=>n.id===id)!);
 assert.equal(new Set(cards.map(n=>`${n.w}:${n.h}`)).size,1);
 assert.equal(cards[0].y,cards[1].y);assert.equal(cards[2].y,cards[3].y);
 assert.equal(cards[0].x,cards[2].x);assert.equal(cards[1].x,cards[3].x);
 for(const node of MOCK_NODES){const parent=MOCK_NODES.find(p=>p.id===node.parent);if(!parent)continue;
  assert.ok(node.x>=parent.x&&node.y>=parent.y&&node.x+node.w<=parent.x+parent.w&&node.y+node.h<=parent.y+parent.h,node.id);
 }
 for(const id of homeIds){const node=(suffix:string)=>MOCK_NODES.find(n=>n.id===`${id}-${suffix}`)!;
  for(const [a,b] of [['title','rating'],['rating','price'],['price','cta']])assert.ok(node(a).y+node(a).h<=node(b).y,`${id}: ${a} overlaps ${b}`);
 }
 assert.equal(MOCK_NODES.filter(n=>!n.library&&n.role==='productImage').length,15);
 assert.equal(MOCK_NODES.filter(n=>!n.library&&n.role==='primaryCTA').length,15);
 assert.equal(MOCK_NODES.filter(n=>!n.library&&n.role==='filterChip').length,8);
});
test('warm baseline offers all library categories and matching preserves product content and layouts',()=>{
 const changes=selectionStyleChanges(homeIds,MOCK_NODES);
 for(const category of ACTION_CATEGORIES)assert.ok(changes.some(c=>c.category===category),category);
 const p=categoryProposal(homeIds,MOCK_NODES,changes,[...ACTION_CATEGORIES]),after=applyPatches(MOCK_NODES,proposalPatches(p,p.mappings.map(m=>m.id),MOCK_NODES));
 for(const id of homeIds){const before=MOCK_NODES.find(n=>n.id===id)!,next=after.find(n=>n.id===id)!;
  for(const key of ['x','y','w','h'])assert.equal(next[key],before[key]);
  assert.notEqual(next.bg,before.bg);assert.notEqual(after.find(n=>n.id===`${id}-cta`)!.bg,MOCK_NODES.find(n=>n.id===`${id}-cta`)!.bg);
 }
 for(const before of MOCK_NODES){const next=after.find(n=>n.id===before.id)!;for(const key of ['text','label','parent','role','component'])assert.equal(next[key],before[key]);if(before.role==='productImage')assert.equal(next.bg,before.bg);}
});
test('preview artwork scales in existing image layers and authored multiline copy fits its block',()=>{
 for(const id of ['hc1-img','hc2-img','hc3-img','hc4-img']){
  const element=MOCK_NODES.find(n=>n.id===id)!;
  const html=renderToStaticMarkup(React.createElement(ElementPreview,{element,nodes:MOCK_NODES}));
  assert.match(html,/class="product-illustration"/);assert.match(html,/viewBox="0 0 160 120"/);assert.doesNotMatch(html,/https?:\/\//);
 }
 for(const node of MOCK_NODES.filter(wrapsMockText))assert.ok(mockTextLines(node).length*(node.fontSize||12)*(node.lineHeight||1.35)<=node.h+1,`${node.id}: text exceeds block`);
});

test('compact icons retain drawable space and tab labels render separately from their glyphs',()=>{
 for(const node of MOCK_NODES.filter(isMockSymbol)){
  assert.equal(mockContentPadding(node),0,node.id);
  assert.ok(node.w>=18&&node.h>=18,node.id);
  const html=renderToStaticMarkup(React.createElement(MockSymbol,{node}));
  assert.match(html,/<svg/);assert.doesNotMatch(html,/<span|truncate/);
  if(node.role==='tabIcon')assert.ok(html.includes(node.label.replace(/^Tab /,'')),node.id);
 }
 for(const node of MOCK_NODES.filter(n=>n.type==='badge'||n.type==='chip'))assert.ok(node.w-mockContentPadding(node)*2>=40,node.id);
});
