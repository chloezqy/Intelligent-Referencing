import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ruleBasedInterpreter} from './comparisonContext';
import {MOCK_NODES} from './data';
test('CTA suggestions describe possible intent using real metadata',()=>{
 const result=ruleBasedInterpreter.interpret(['hc1-cta'],['sc1-cta'],MOCK_NODES);
 assert.equal(result.provenance,'rule-based');assert.deepEqual(result.purposes,['Visual consistency','Wording consistency']);assert.match(result.summary,/could compare/);assert.ok(result.evidence.some(e=>e.includes('Shared role: primaryCTA')));
});
test('Price, image, mixed, identical and missing selections remain honest',()=>{
 assert.ok(ruleBasedInterpreter.interpret(['hc1-price'],['sc1-price'],MOCK_NODES).purposes.includes('Price formatting'));
 const images=MOCK_NODES.filter(n=>n.type==='image').slice(0,2);assert.ok(ruleBasedInterpreter.interpret([images[0].id],[images[1].id],MOCK_NODES).purposes.includes('Dimensions and styling'));
 assert.match(ruleBasedInterpreter.interpret(['hc1-cta'],['hc1-price'],MOCK_NODES).summary,/different kinds/);
 assert.match(ruleBasedInterpreter.interpret(['hc1-cta'],['hc1-cta'],MOCK_NODES).summary,/same objects/);
 assert.ok(ruleBasedInterpreter.interpret(['missing'],['hc1-cta'],MOCK_NODES).evidence.some(e=>e.includes('unavailable')));
});
