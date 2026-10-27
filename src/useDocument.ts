import {useState,useRef,useEffect,useCallback} from 'react';
import {MOCK_NODES} from './data';
import type {UIElement} from './types';
import {applyPatches,validatePatches,changedPatches,Patch} from './editing';
const STORAGE='sr-document-v2';
export function useDocument(){
 const [nodes,setNodes]=useState<UIElement[]>(()=>{try{const patches=JSON.parse(localStorage.getItem(STORAGE)||'[]');if(Array.isArray(patches)){validatePatches(MOCK_NODES,MOCK_NODES.filter(n=>!n.library&&n.type!=='screen').map(n=>n.id),patches);return applyPatches(MOCK_NODES,patches);}}catch{}return MOCK_NODES;});
 const current=useRef(nodes);current.current=nodes;
 const [preview,setPreview]=useState<Patch[]>([]),[revision,setRevision]=useState(0),[storageError,setStorageError]=useState('');
 const history=useRef<{past:UIElement[][];future:UIElement[][]}>({past:[],future:[]});
 const dragStart=useRef<UIElement[]|null>(null);
 const saveHistory=(before:UIElement[])=>{history.current.past.push(before);if(history.current.past.length>100)history.current.past.shift();history.current.future=[];setRevision(v=>v+1);};
 const commit=useCallback((patches:Patch[],targets:string[])=>{validatePatches(current.current,targets,patches);const changed=changedPatches(current.current,patches);setPreview([]);if(!changed.length)return false;saveHistory(current.current);const next=applyPatches(current.current,patches);current.current=next;setNodes(next);return true;},[]);
 const move=useCallback((positions:Record<string,{x:number;y:number}>)=>{if(!dragStart.current)dragStart.current=current.current;const patches=Object.entries(positions).map(([id,changes])=>({id,changes}));const next=applyPatches(current.current,patches.filter(p=>!current.current.find(n=>n.id===p.id)?.library));current.current=next;setNodes(next);setPreview([]);},[]);
 const finishMove=useCallback(()=>{if(dragStart.current){if(JSON.stringify(dragStart.current)!==JSON.stringify(current.current))saveHistory(dragStart.current);dragStart.current=null;}},[]);
 const undo=useCallback(()=>{setPreview([]);const previous=history.current.past.pop();if(previous){history.current.future.push(current.current);current.current=previous;setNodes(previous);setRevision(v=>v+1);}},[]);
 const redo=useCallback(()=>{setPreview([]);const next=history.current.future.pop();if(next){history.current.past.push(current.current);current.current=next;setNodes(next);setRevision(v=>v+1);}},[]);
 useEffect(()=>{try{const patches=nodes.filter(n=>!n.library&&n.type!=='screen').flatMap(n=>{const original=MOCK_NODES.find(o=>o.id===n.id)!;const changes=Object.fromEntries(Object.entries(n).filter(([key,value])=>value!==original[key as keyof UIElement]));return Object.keys(changes).length?[{id:n.id,changes}]:[];});localStorage.setItem(STORAGE,JSON.stringify(patches));setStorageError('');}catch{setStorageError('Document storage is unavailable; keep this tab open.');}},[nodes]);
 return {nodes,visibleNodes:preview.length?applyPatches(nodes,preview):nodes,preview,setPreview,commit,move,finishMove,undo,redo,canUndo:history.current.past.length>0,canRedo:history.current.future.length>0,revision,storageError};
}
