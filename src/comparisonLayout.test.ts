import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ComparisonContext from './components/ComparisonContext';
import PropertyComparison from './components/PropertyComparison';
import {ruleBasedInterpreter} from './comparisonContext';
import {MOCK_NODES} from './data';
import {compareReferenceElements} from './referencePresentation';
import type {ComparisonContext as Context} from './collaboration';
const context:Context={snapshotId:'layout',purpose:'Compare selected elements',selections:{A:{userId:'A',elementIds:['hc1-title'],exemplarIds:['hc1-title'],scope:'exemplars',method:'conventional',revision:1},B:{userId:'B',elementIds:['sc1-cta'],exemplarIds:['sc1-cta'],scope:'exemplars',method:'conventional',revision:1}},interpretation:ruleBasedInterpreter.interpret(['hc1-title'],['sc1-cta'],MOCK_NODES)};
test('Compact comparison places ownership before one rule-based summary and omits repeated evidence and purpose controls',()=>{
 const html=renderToStaticMarkup(React.createElement(ComparisonContext,{context,nodes:MOCK_NODES,user:'B',compact:true}));
 assert.ok(html.indexOf('Your selection')<html.indexOf('Relationship · rule-based'));
 assert.equal((html.match(/Relationship · rule-based/g)||[]).length,1);
 assert.ok(!html.includes('Authored differences:'));assert.ok(!html.includes('Comparison purpose'));
 assert.ok(html.includes('1 object ·'));assert.ok(!html.includes('1 objects'));
 assert.ok(!html.includes('semantic · AI'));
});
test('Compact property display makes metadata readable without changing comparison values or omitting rows',()=>{
 const html=renderToStaticMarkup(React.createElement(PropertyComparison,{contextId:'layout',ids:['hc1-title','sc1-cta'],nodes:MOCK_NODES,expanded:true,ownership:context,compact:true}));
 assert.match(html,/Primary CTA/);assert.match(html,/Product Title/);
 assert.ok(html.includes('data-property="role"'));assert.ok(html.includes('data-property="dimensions"'));
 assert.ok(!html.includes('Differences describe properties'));
 assert.match(html,/User A/);assert.match(html,/User B/);
 const normal=renderToStaticMarkup(React.createElement(PropertyComparison,{contextId:'normal',ids:['hc1-title','sc1-cta'],nodes:MOCK_NODES,expanded:true}));
 assert.ok(normal.includes('primaryCTA'));assert.ok(normal.includes('Differences describe properties'));
});

test('Incomplete properties stay collapsed at the bottom; wholly absent rows never render and comparison data remains intact',()=>{
 const first={id:'one',type:'text' as const,label:'One',x:0,y:0,w:20,h:10,screen:'Home' as const,text:'Not specified',bg:'#fff'};
 const second={...first,id:'two',label:'Two',text:undefined,bg:undefined};
 const nodes=[first,second],comparison=compareReferenceElements(['one','two'],nodes);
 const before=JSON.stringify(comparison);
 assert.equal(comparison.rows.find(row=>row.key==='border')!.state,'unavailable');
 assert.equal(comparison.rows.find(row=>row.key==='background')!.state,'unavailable');
 for(const compact of [false,true]){
  const html=renderToStaticMarkup(React.createElement(PropertyComparison,{contextId:'missing',ids:['one','two'],nodes,expanded:true,compact}));
  assert.ok(html.includes('Show 2 incomplete properties'));
  assert.ok(html.includes('class="incomplete-properties"><summary>'));
  assert.ok(!html.includes('Unavailable or incomplete properties'));
  assert.ok(!html.includes('data-property="border"'));
  assert.ok(!html.includes('data-property="fontSize"'));
  assert.ok(!html.includes('data-property="location"'));
  assert.ok(html.includes('data-property="text"')); // Literal "Not specified" is recorded text.
  assert.ok(html.includes('data-property="background"'));
  assert.ok(html.indexOf('Matching properties')<html.indexOf('Show 2 incomplete'));
  assert.ok(html.indexOf('data-property="background"')>html.indexOf('Show 2 incomplete'));
 }
 assert.equal(JSON.stringify(compareReferenceElements(['one','two'],nodes)),before);
});
test('No incomplete link appears when optional properties are absent on every element',()=>{
 const nodes=[{id:'one',type:'text' as const,label:'One',x:0,y:0,w:20,h:10},{id:'two',type:'text' as const,label:'Two',x:0,y:0,w:20,h:10}];
 const html=renderToStaticMarkup(React.createElement(PropertyComparison,{contextId:'absent',ids:['one','two'],nodes,expanded:true}));
 assert.ok(!html.includes('incomplete-properties'));assert.ok(!html.includes('data-property="background"'));
});
