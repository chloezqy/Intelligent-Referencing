import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import CanvasToolbar,{CANVAS_TOOLS} from './components/CanvasToolbar';
test('Canvas toolbar exposes exactly one active functional tool and inert placeholders and editor modes',()=>{
 for(const tool of CANVAS_TOOLS){
  const html=renderToStaticMarkup(React.createElement(CanvasToolbar,{mode:tool.mode,onChange:()=>{throw new Error('Rendering cannot change tool');}}));
  assert.match(html,new RegExp(`aria-label="${tool.label} \\(${tool.key}\\)"`));
  assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
  assert.equal((html.match(/aria-disabled="true"/g)||[]).length,7);
  assert.match(html,/aria-expanded="false"/);assert.doesNotMatch(html,/role="menuitemradio"/);
  const labels=['Frame','Shape','Pen','Text','Code','Comment','Resources'];let previous=-1;for(const label of labels){const at=html.indexOf(`aria-label="${label} — Coming soon"`);assert.ok(at>previous);previous=at;}
 }
 assert.deepEqual(CANVAS_TOOLS.map(tool=>tool.key),['V','G','H']);
});

test('Share reference has the only active toolbar highlight while its mode is selected',()=>{
 const html=renderToStaticMarkup(React.createElement(CanvasToolbar,{mode:'pointer',shareSelecting:true,onChange:()=>{},onShare:()=>{}}));
 assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
 assert.match(html,/aria-label="Share reference \(R\)"/);
 assert.match(html,/class="canvas-tool-active is-active" aria-pressed="true"/);
 assert.doesNotMatch(html,/class="canvas-tool-active is-active" aria-label="Select/);
 assert.doesNotMatch(html,/Leave feedback on the canvas|Direct a teammate/);
});
