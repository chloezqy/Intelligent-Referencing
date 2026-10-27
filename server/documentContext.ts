import {MOCK_NODES} from '../src/data.js';
import {STYLE_KEYS,validatePatches,applyPatches} from '../src/editing.js';
/** Hierarchy, content, role and identity remain authoritative; only editable properties may be supplied. */
export function documentContext(input:unknown){
 if(input===undefined)return MOCK_NODES;
 if(!Array.isArray(input)||input.length!==MOCK_NODES.length)throw new Error('Invalid document snapshot.');
 const byId=new Map(input.map(n=>[n?.id,n]));if(byId.size!==MOCK_NODES.length||MOCK_NODES.some(n=>!byId.has(n.id)))throw new Error('Invalid document IDs.');
 const patches=MOCK_NODES.filter(n=>!n.library&&n.type!=='screen').map(n=>{const value=byId.get(n.id);if(!value)throw new Error('Unknown document object.');return {id:n.id,changes:Object.fromEntries([...STYLE_KEYS,'x','y','w','h','token'].filter(k=>value[k]!==undefined).map(k=>[k,value[k]]))};});
 validatePatches(MOCK_NODES,MOCK_NODES.map(n=>n.id),patches);return applyPatches(MOCK_NODES,patches);
}
