import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ReferenceActions from './components/ReferenceActions';

const props={shareLabel:'Share to User B',onCompare:()=>{},compareReady:true,compareHint:'',onMore:()=>{},onAction:()=>{}};
test('Expanded interpretation occupies the third step with one action header and one content body',()=>{
 const html=renderToStaticMarkup(React.createElement(ReferenceActions,{...props,expanded:true,interpretationContent:React.createElement('div',{id:'interpretation-adjustments'},'Touched / Screen / All screens')}));
 assert.equal((html.match(/>Adjust interpretation</g)||[]).length,1);
 assert.equal((html.match(/>Share reference</g)||[]).length,1);
 assert.equal((html.match(/id="interpretation-adjustments"/g)||[]).length,1);
 assert.ok(html.includes('interpretation-step is-expanded'));
 assert.ok(html.includes('aria-expanded="true"'));
 assert.ok(html.indexOf('Compare with User B</button>')<html.indexOf('Share reference</button>'));
 assert.ok(html.indexOf('Share reference</button>')<html.indexOf('interpretation-step'));
 assert.ok(!html.includes('interpretation-dropdown'));
});
test('Collapsed third step retains its header and hides interpretation content',()=>{
 const html=renderToStaticMarkup(React.createElement(ReferenceActions,{...props,interpretationContent:'Hidden controls'}));
 assert.ok(html.includes('aria-expanded="false"'));
 assert.ok(!html.includes('Hidden controls'));
 assert.ok(html.includes('action-orb'));
});
test('Provisional gesture references cannot compare or share until explicit confirmation',()=>{
 const html=renderToStaticMarkup(React.createElement(ReferenceActions,{...props,selectionPending:true,expanded:true}));
 assert.doesNotMatch(html,/Share reference|Compare with|disabled=|Confirm an interpretation first/);assert.match(html,/aria-expanded="true"/);
 const confirmed=renderToStaticMarkup(React.createElement(ReferenceActions,props));assert.doesNotMatch(confirmed,/disabled=""/);
});

test('Unavailable comparison is omitted while confirmed sharing and interpretation remain usable',()=>{
 const html=renderToStaticMarkup(React.createElement(ReferenceActions,{...props,compareReady:false}));
 assert.doesNotMatch(html,/Compare with|compare-unavailable|disabled=/);assert.match(html,/Share reference/);assert.match(html,/Adjust interpretation/);
});

test('Contextual actions contain only Compare when available, Share reference and Adjust interpretation',()=>{
 const one=renderToStaticMarkup(React.createElement(ReferenceActions,{...props,compareReady:false}));
 assert.match(one,/Share reference/);assert.match(one,/Adjust interpretation/);assert.doesNotMatch(one,/>Edit<|Compare with/);
 const many=renderToStaticMarkup(React.createElement(ReferenceActions,{...props,compareOwn:true}));
 assert.doesNotMatch(many,/>Edit</);assert.ok(many.indexOf('>Compare</button>')<many.indexOf('>Share reference</button>'));assert.ok(many.indexOf('>Share reference</button>')<many.indexOf('>Adjust interpretation<'));
});
