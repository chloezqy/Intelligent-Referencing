import CanvasFrameLabels from './CanvasFrameLabels';
import ProductIllustration from './ProductIllustration';
import MockSymbol,{isMockSymbol} from './MockSymbol';
import {wrapsMockText,mockContentPadding} from '../mockPresentation';
import {previewSpotlightNodes} from '../previewSpotlight';
import ReferenceActions from './ReferenceActions';
import {appendGestureSamples} from '../gestureSamples';
import {canvasSelectionTarget,nestedSelection,mergeLayerSelection,canvasMarqueeTargets,isSelectionDrag} from '../selectionInteraction';
import {toolDragIntent,moveTargets,movePositions,Positions} from '../toolInteraction';
import {useSemanticSuggestions} from '../useSemanticSuggestions';
import {closeSmartGesture,smartGestureEvidence} from '../smartGesture';
import {semanticSuggestionPresentation} from '../semanticSuggestionPresentation';
import { selectionActionLayout } from '../selectionActionLayout';
import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Point, UIElement, ToolMode, SelectionState, InferredReference, Interpretation, ScopeLevel } from '../types';
import ReferencePins from './ReferencePins';
import { ReferenceIntent, SharedReference } from '../collaboration';
import { zoomAtPoint } from '../workspace';
import { getBoundingBox, rectIntersect,inferSelection } from '../utils';
import {Check,X,Share2,GitCompareArrows} from 'lucide-react';
import Sparkles from './AIIcon';

interface CanvasProps {
  previewSpotlightIds?:string[];
  onMoveEnd:()=>void;
  pickingSource:boolean;
  sourceId:string|null;
  onPickSource:(id:string)=>void;
  shareLabel:string;
  sharing:boolean;
  inspectorOpen?:boolean;
  onSelectionStart:()=>void;
  onMove:(positions:Positions)=>void;
  onResearchEvent: (type:string,details?:{ids?:string[];method?:string})=>void;
  sharedReferences: SharedReference[];
  activeSharedId: string | null;
  onOpenShared: (id:string)=>void;
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  selectionState: SelectionState;
  setSelectionState: (state: SelectionState) => void;
  inferredRef: InferredReference | null;
  setInferredRef: (ref: InferredReference | null) => void;
  onCompare:()=>void;
  onInterpretationConfirmed:()=>void;
  compareOwn?:boolean;
  compareReady:boolean;
  compareHint:string;
  onAcceptReference: (intent?:ReferenceIntent) => void;
  nodes: UIElement[];
  transform: { x: number; y: number; scale: number };
  setTransform: React.Dispatch<React.SetStateAction<{ x: number; y: number; scale: number }>>;
}

export default function Canvas({
  previewSpotlightIds=[],onMoveEnd,pickingSource,sourceId,onPickSource,shareLabel, sharing,inspectorOpen=false,onSelectionStart,onMove,onCompare,onInterpretationConfirmed,compareOwn=false,compareReady,compareHint,
  toolMode,
  setToolMode,
  selectionState,
  setSelectionState,
  inferredRef:confirmedRef,
  setInferredRef,
  onAcceptReference,
  nodes,
  transform,
  setTransform, onResearchEvent, sharedReferences, activeSharedId, onOpenShared
}: CanvasProps) {
  const [draftRef,setDraftRef]=useState<InferredReference|null>(null);
  const [activeInterpretation,setActiveInterpretation]=useState<Interpretation|null>(null);
  const additiveBase=useRef<string[]>([]);
  const inferredRef=draftRef||confirmedRef;
  const mergeGestureIds=(ids:string[])=>[...new Set([...additiveBase.current,...ids])];
  const [adjustOpen,setAdjustOpen]=useState(false);
  const [gesturePaths,setGesturePaths]=useState<Point[][]>([]);
  const [chatInput,setChatInput]=useState('');
  const [gestureNotice,setGestureNotice]=useState('');
  const [interpretationEngaged,setInterpretationEngaged]=useState(false);
  const [chatMessage,setChatMessage]=useState('');
  const ai=useSemanticSuggestions(draftRef?{...draftRef,selectedIds:draftRef.exemplarIds}:inferredRef,nodes);
  // Completing a rough gesture (or changing its scope) requests interpretation once.
  // Loading/error updates do not retrigger this effect; failed requests remain retryable.
  useEffect(()=>{if(draftRef){onResearchEvent('ai_interpretation_requested');void ai.request();}},[draftRef]);
  useEffect(()=>{if(selectionState==='idle'){additiveBase.current=[];setHoveredInterpretation(null);setDraftRef(null);setActiveInterpretation(null);setAdjustOpen(false);setCurrentPath([]);setGesturePaths([]);setChatMessage('');}},[selectionState]);
  useEffect(()=>{if(inferredRef){setHoveredInterpretation(null);}},[inferredRef]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 800, height: 600 });
  const [actionSurface,setActionSurface]=useState<HTMLDivElement|null>(null);
  const [actionPosition,setActionPosition]=useState({left:8,top:8});
  const [pinChooserOpen, setPinChooserOpen] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setViewport({ width: el.clientWidth, height: el.clientHeight }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const pendingPointer=useRef<{id:number;start:Point;screenStart:Point;screenPoints:Point[];path:Point[];lastSampleTime:number;node:UIElement|null;rawNodeId:string|null;shift:boolean;deep:boolean;previous:InferredReference|null;dragging:boolean;tool:ToolMode;moveNodes:UIElement[]}|null>(null);
  const lastLayerClick=useRef<{id:string;at:number;point:Point}|null>(null);
  const [movingIds,setMovingIds]=useState<string[]>([]);
  const panPoint=useRef<Point|null>(null);
  // Gesture & Marquee Path
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [rectStart, setRectStart] = useState<Point | null>(null);

  // Candidate previews are separate from the confirmed reference.
  const [hoveredInterpretation, setHoveredInterpretation] = useState<Interpretation | null>(null);
  const [clicksCounter, setClicksCounter] = useState(0);

  // Keyboard navigation & shortcuts (Figma standard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select, button, summary, [role=dialog], .comparison-inspector, [contenteditable=true]')) return;

      if((e.metaKey||e.ctrlKey||e.altKey)&&!['a','A'].includes(e.key))return;
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      if (e.key === 'v' || e.key === 'V') {
        handlePointerCancel();
        setToolMode('pointer');
      }
      if (e.key === 's' || e.key === 'S') {
        handlePointerCancel();setToolMode('pointer');
      }
      if(!e.metaKey&&!e.ctrlKey&&!e.altKey&&(e.key==='g'||e.key==='G')){handlePointerCancel();setToolMode('reference');}
      if (e.key === 'h' || e.key === 'H') {
        handlePointerCancel();
        setToolMode('pan');
      }
      if (e.key === 'Escape') {
        if(pendingPointer.current||panPoint.current){handlePointerCancel();return;}
        setHoveredInterpretation(null);
        setSelectionState('idle');
        setDraftRef(null);setActiveInterpretation(null);setInferredRef(null);
        setCurrentPath([]);

        setClicksCounter(0);
      }
      // Cmd+A / Ctrl+A: Select all selectable layers
      if ((e.metaKey || e.ctrlKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        const parent=confirmedRef?.selectedIds.length===1?nodes.find(n=>n.id===confirmedRef.selectedIds[0])?.parent:undefined;
        const allSelectable = nodes.filter(n => !n.library && n.type !== 'screen' && (parent?n.parent===parent:nodes.find(p=>p.id===n.parent)?.type==='screen')).map(n => n.id);
        setInferredRef({
          selectedIds: allSelectable,
          exemplarIds: allSelectable,
          label: `All ${allSelectable.length} layers`,
          scope: 'document',
          selectionMethod: 'conventional',
          clicksCount: clicksCounter + 1
        });
        setSelectionState('preview');
      }
      if(e.key==='Enter'){if(activeInterpretation){e.preventDefault();commitInterpretation(activeInterpretation);}else if(!draftRef&&confirmedRef){e.preventDefault();const ids=nestedSelection(confirmedRef.selectedIds,nodes,e.shiftKey?'parent':'children');setInferredRef({...confirmedRef,selectedIds:ids,exemplarIds:ids,selectionMethod:'conventional',label:`${ids.length} layers selected`});setSelectionState('preview');}}
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if((e.metaKey||e.ctrlKey||e.altKey)&&!['a','A'].includes(e.key))return;
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectionState, onAcceptReference, setToolMode, nodes, clicksCounter,draftRef,activeInterpretation,confirmedRef]);

  // Wheel handling: zoom and pan
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        setTransform(prev => {
          const rect = el.getBoundingClientRect();
          return zoomAtPoint(prev, zoomFactor, e.clientX - rect.left, e.clientY - rect.top);
        });
      } else {
        // Pan
        setTransform(prev => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [setTransform]);

  // Coordinate transformation from screen to canvas space
  const getCanvasCoords = (e: Pick<React.PointerEvent,'clientX'|'clientY'>): Point => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left - transform.x) / transform.scale,
      y: (e.clientY - rect.top - transform.y) / transform.scale
    };
  };

  // One Select interaction: decide click versus drag only after movement/release.
  const handleNodePointerDown=(e:React.PointerEvent,node:UIElement|null)=>{e.stopPropagation();handlePointerDown(e,node);};
  const handlePointerDown=(e:React.PointerEvent,node:UIElement|null=null)=>{
    if(e.button!==0&&e.button!==1)return;
    if(pendingPointer.current||panPoint.current)return;
    if(e.button===1||isSpacePressed||toolMode==='pan'){
      setIsPanning(true);panPoint.current={x:e.clientX,y:e.clientY};containerRef.current?.setPointerCapture(e.pointerId);return;
    }
    setGestureNotice('');
    if(pickingSource){if(node)onPickSource(node.id);return;}
    if(node?.library&&toolMode==='pointer'){commitClick(node,false,inferredRef);return;}
    if(toolMode!=='reference'||!e.shiftKey){
      additiveBase.current=[];
      setGesturePaths([]);setChatMessage('');
      setDraftRef(null);setActiveInterpretation(null);
    }
    setHoveredInterpretation(null);
    if(toolMode==='reference'&&e.shiftKey)setInterpretationEngaged(false);
    const rawNodeId=node?.id||null;
    if(node&&toolMode==='pointer')node=canvasSelectionTarget(node.id,nodes,confirmedRef?.selectedIds||[],{deep:e.metaKey||e.ctrlKey,extend:e.shiftKey})||node;
    const start=getCanvasCoords(e),screenStart={x:e.clientX,y:e.clientY};
    pendingPointer.current={id:e.pointerId,start,screenStart,screenPoints:[screenStart],path:[start],lastSampleTime:e.timeStamp,node,rawNodeId,shift:e.shiftKey,deep:e.metaKey||e.ctrlKey,previous:confirmedRef,dragging:false,tool:toolMode,moveNodes:[]};
    containerRef.current?.setPointerCapture(e.pointerId);
  };
  // Capture hardware updates without waiting for React rendering or pointermove
  // dispatch. Fast loops can finish between two animation frames.
  useEffect(()=>{
    const element=containerRef.current;if(!element)return;
    const capture=(event:PointerEvent)=>{const pending=pendingPointer.current;if(pending?.id===event.pointerId)appendGestureSamples(pending,event,getCanvasCoords);};
    element.addEventListener('pointerrawupdate',capture);
    return()=>element.removeEventListener('pointerrawupdate',capture);
  },[transform.x,transform.y,transform.scale]);
  const handlePointerMove=(e:React.PointerEvent)=>{
    if(panPoint.current){const previous=panPoint.current;panPoint.current={x:e.clientX,y:e.clientY};setTransform(t=>({...t,x:t.x+e.clientX-previous.x,y:t.y+e.clientY-previous.y}));return;}
    const pending=pendingPointer.current;if(!pending||pending.id!==e.pointerId)return;
    appendGestureSamples(pending,e.nativeEvent,getCanvasCoords);
    const intent=toolDragIntent(pending.tool,!!pending.node,pending.shift);
    if(!pending.dragging&&isSelectionDrag(pending.screenStart,pending.screenPoints)){
      onSelectionStart();lastLayerClick.current=null;pending.dragging=true;
      if(intent==='move'){pending.moveNodes=moveTargets(nodes,pending.node!.id,pending.previous?.selectedIds||[]);setMovingIds(pending.previous?.selectedIds.includes(pending.node!.id)?pending.previous.selectedIds:[pending.node!.id]);}
    }
    if(pending.dragging){
      if(intent==='move'){setSelectionState('moving');setCurrentPath([]);const end=pending.path[pending.path.length-1];onMove(movePositions(pending.moveNodes,{x:end.x-pending.start.x,y:end.y-pending.start.y},nodes));}
      else {setSelectionState(intent==='box'?'rect-selecting':'drawing');setRectStart(pending.start);setCurrentPath(intent==='box'?[pending.start,pending.path[pending.path.length-1]]:[...pending.path]);}
    }

  };
  useEffect(()=>{
    handlePointerCancel();
    additiveBase.current=[];setGesturePaths([]);
    setDraftRef(null);setActiveInterpretation(null);setAdjustOpen(false);
    if(draftRef)setSelectionState(confirmedRef?'preview':'idle');
  },[toolMode]);
  const commitClick=(node:UIElement|null,shift:boolean,previous:InferredReference|null)=>{
    setAdjustOpen(false);onSelectionStart();setHoveredInterpretation(null);
    if(!node){if(!shift){setInferredRef(null);setSelectionState('idle');}return;}
    const count=clicksCounter+1;setClicksCounter(count);
    const ids=mergeLayerSelection(previous?.selectedIds||[],node.id,nodes,shift);
    if(!ids.length){setInferredRef(null);setSelectionState('idle');return;}
    setInferredRef({selectedIds:ids,exemplarIds:ids,label:ids.length===1?nodes.find(n=>n.id===ids[0])!.label:`${ids.length} layers selected`,...(ids.length===1?{matchingRole:nodes.find(n=>n.id===ids[0])?.role,matchingComponent:nodes.find(n=>n.id===ids[0])?.component}:{}),scope:'exemplars',selectionMethod:'conventional',clicksCount:count});
    setSelectionState('preview');
  };
  const handlePointerCancel=()=>{
    const active=!!pendingPointer.current||!!panPoint.current||selectionState==='drawing'||selectionState==='rect-selecting'||selectionState==='interpreting';
    const pending=pendingPointer.current;if(pending?.moveNodes.length)onMove(Object.fromEntries(pending.moveNodes.map(n=>[n.id,{x:n.x,y:n.y}])));setMovingIds([]);onMoveEnd();
    pendingPointer.current=null;panPoint.current=null;setIsPanning(false);setCurrentPath([]);setRectStart(null);
    if(active)setSelectionState(inferredRef?'preview':'idle');
  };
  useEffect(()=>{const blur=()=>{setIsSpacePressed(false);handlePointerCancel();};window.addEventListener('blur',blur);return()=>window.removeEventListener('blur',blur);},[inferredRef,selectionState]);
  const handlePointerUp=(e:React.PointerEvent)=>{
    if(panPoint.current){panPoint.current=null;setIsPanning(false);if(containerRef.current?.hasPointerCapture(e.pointerId))containerRef.current.releasePointerCapture(e.pointerId);return;}
    const pending=pendingPointer.current;if(!pending||pending.id!==e.pointerId)return;
    pendingPointer.current=null;
    appendGestureSamples(pending,e.nativeEvent,getCanvasCoords);
    const end=getCanvasCoords(e);
    if(containerRef.current?.hasPointerCapture(e.pointerId))containerRef.current.releasePointerCapture(e.pointerId);
    setCurrentPath([]);setRectStart(null);
    if(!isSelectionDrag(pending.screenStart,pending.screenPoints)){
      if(pending.tool==='pointer'){const last=lastLayerClick.current;const double=last&&pending.rawNodeId===last.id&&e.timeStamp-last.at<500&&Math.hypot(e.clientX-last.point.x,e.clientY-last.point.y)<6;const target=double&&pending.rawNodeId?canvasSelectionTarget(pending.rawNodeId,nodes,pending.previous?.selectedIds||[],{drill:true,deep:pending.deep}):pending.node;commitClick(target||null,pending.shift,pending.previous);lastLayerClick.current=!double&&pending.rawNodeId?{id:pending.rawNodeId,at:e.timeStamp,point:{x:e.clientX,y:e.clientY}}:null;}
      else if(pending.tool==='reference'&&!pending.shift){
        // A tap ends the previous rough reference; only a stroke starts a new one.
        commitClick(null,false,pending.previous);
        setHoveredInterpretation(null);
        setClicksCounter(0);
      }
      return;
    }
    if(!pending.dragging){onSelectionStart();lastLayerClick.current=null;}
    const intent=toolDragIntent(pending.tool,!!pending.node,pending.shift);
    if(intent==='move'){
      const snapshot=pending.moveNodes.length?pending.moveNodes:moveTargets(nodes,pending.node!.id,pending.previous?.selectedIds||[]);
      onMove(movePositions(snapshot,{x:end.x-pending.start.x,y:end.y-pending.start.y},nodes));setMovingIds([]);onMoveEnd();onResearchEvent('object_move');
      if(!pending.previous?.selectedIds.includes(pending.node!.id))commitClick(pending.node,false,pending.previous);else setSelectionState('preview');return;
    }
    if(intent==='box'){
      const r={x:Math.min(pending.start.x,end.x),y:Math.min(pending.start.y,end.y),w:Math.abs(end.x-pending.start.x),h:Math.abs(end.y-pending.start.y)};
      const hitIds=canvasMarqueeTargets(nodes.filter(n=>!n.library&&n.type!=='screen'&&rectIntersect(n,r)).map(n=>n.id),nodes,pending.previous?.selectedIds||[],pending.deep);
      const ids=[...new Set([...(pending.shift?(pending.previous?.selectedIds||[]):[]),...hitIds])];
      const count=clicksCounter+1;setClicksCounter(count);
      setInferredRef(ids.length?{selectedIds:ids,exemplarIds:ids,label:`${ids.length} layers selected`,scope:'exemplars',selectionMethod:'conventional',clicksCount:count}:null);setSelectionState(ids.length?'preview':'idle');return;
    }
    onResearchEvent('gesture_attempt');
    setInterpretationEngaged(false);
    const closedPath=closeSmartGesture(pending.path);
    setGesturePaths(paths=>pending.shift?[...paths,closedPath]:[closedPath]);
    const touched=smartGestureEvidence(closedPath,nodes,transform.scale);
    const results=touched.length?inferSelection(closedPath,nodes):[];
    const first=results[0]||{id:'touched',label:`${touched.length} touched objects`,description:'Directly touched objects',reasoning:'Direct gesture coverage',selectedIds:touched,exemplarIds:touched,inferredIds:[],scope:'exemplars' as const,confidence:'medium' as const};
    const base=pending.shift?(activeInterpretation?.selectedIds??inferredRef?.selectedIds??[]):[];
    if(!first.selectedIds.length&&pending.shift&&base.length){
      setGestureNotice('No objects near this gesture. Try drawing a little closer.');
      setSelectionState(draftRef?'disambiguating':'preview');return;
    }
    additiveBase.current=[...base];
    if(first.selectedIds.length){const evidence=touched.length?touched:first.selectedIds;setDraftRef({selectedIds:mergeGestureIds(evidence),exemplarIds:evidence,label:'Gesture reference',scope:'exemplars',selectionMethod:'smart-ref'});setActiveInterpretation(null);setSelectionState('disambiguating');setAdjustOpen(true);onResearchEvent('gesture_interpreted');}else{setGestureNotice('No objects near this gesture. Try drawing a little closer.');setInferredRef(null);setSelectionState('idle');}
    setCurrentPath([]);
  };

  const commitInterpretation=(interp:Interpretation,record=true)=>{
    const selection:InferredReference={selectedIds:[...interp.selectedIds],exemplarIds:interp.exemplarIds.filter(id=>interp.selectedIds.includes(id)),label:interp.label,activeInterpretation:interp,matchingRole:interp.matchingRole,matchingComponent:interp.matchingComponent,scope:interp.scope,selectionMethod:'smart-ref'};
    additiveBase.current=[];setDraftRef(null);setActiveInterpretation(null);setInferredRef(selection);
    if(record){onResearchEvent('interpretation_choice',{ids:[...selection.selectedIds],method:selection.selectionMethod});setAdjustOpen(false);onInterpretationConfirmed();}setHoveredInterpretation(null);setSelectionState('preview');
  };
  const handleScopeChange=(scope:ScopeLevel)=>{if(!inferredRef)return;setDraftRef({...inferredRef,scope});setSelectionState('disambiguating');setActiveInterpretation(null);setHoveredInterpretation(null);onResearchEvent('scope_changed');};
  const candidateInterpretation=(candidate:typeof ai.candidates[number]):Interpretation=>{
    const summary=semanticSuggestionPresentation(candidate,nodes),exemplars=candidate.elementIds.filter(id=>inferredRef?.exemplarIds.includes(id));
    return {id:candidate.id,label:`${summary.count} ${summary.title.replace(/^Matching /,'')}`,description:candidate.reason,reasoning:candidate.reason,selectedIds:mergeGestureIds(candidate.elementIds),exemplarIds:exemplars,inferredIds:candidate.elementIds.filter(id=>!exemplars.includes(id)),scope:inferredRef?.scope||'exemplars',confidence:'medium',source:'model',level:'semantic'};
  };

  // Generate SVG path for the ink trail
  const pathD = (selectionState === 'drawing' || selectionState === 'interpreting' || selectionState === 'disambiguating') && currentPath.length > 1
    ? `M ${currentPath.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`
    : '';

  // Active highlights
  const activeCandidate = hoveredInterpretation || activeInterpretation;
  const activeIds = activeCandidate ? activeCandidate.selectedIds : (draftRef ? [] : inferredRef?.selectedIds || []);
  const drawingStack = selectionState==='drawing' && !!pendingPointer.current?.shift;
  const showGestureAnimation = drawingStack || (!!draftRef && !interpretationEngaged && !activeCandidate);
  const previewing = !!activeCandidate && !drawingStack;
  const spotlightNodes=previewing?nodes.filter(n=>activeIds.includes(n.id)):previewSpotlightNodes(previewSpotlightIds,nodes);
  const submitMeaning=(event:React.FormEvent)=>{event.preventDefault();const intent=chatInput.trim();if(!intent||ai.loading)return;setChatMessage(intent);setChatInput('');setActiveInterpretation(null);setHoveredInterpretation(null);onResearchEvent('ai_interpretation_requested');void ai.request(intent);};
  const exemplarIds = activeCandidate ? activeCandidate.exemplarIds : (inferredRef?.exemplarIds || []);

  const boundingBox = activeIds.length > 0 ? getBoundingBox(activeIds, nodes) : null;
  // Candidate hover affects canvas highlighting, never the popup's selection anchor.
  const actionBounds=getBoundingBox(draftRef?draftRef.exemplarIds:confirmedRef?.selectedIds||[],nodes);
  const actionBoundsKey=JSON.stringify(actionBounds);
  useLayoutEffect(()=>{
    if(!actionSurface)return;
    const place=()=>{
      const placed=selectionActionLayout(actionBounds,transform,viewport,{width:actionSurface.offsetWidth,height:actionSurface.offsetHeight});
      setActionPosition(previous=>previous.left===placed.left&&previous.top===placed.top?previous:placed);
    };
    place();const observer=new ResizeObserver(place);observer.observe(actionSurface);
    return()=>observer.disconnect();
  },[actionSurface,actionBoundsKey,transform.x,transform.y,transform.scale,viewport.width,viewport.height,adjustOpen]);
  useEffect(()=>{setAdjustOpen(false);setHoveredInterpretation(null);},[confirmedRef?.selectedIds.join('|'),sharing]);
  const gestureBB = currentPath.length > 0 ? {
    x: Math.min(...currentPath.map(p => p.x)),
    y: Math.min(...currentPath.map(p => p.y)),
    w: Math.max(...currentPath.map(p => p.x)) - Math.min(...currentPath.map(p => p.x)),
    h: Math.max(...currentPath.map(p => p.y)) - Math.min(...currentPath.map(p => p.y))
  } : null;

  // Frame children share the screen's rounded clipping boundary, while world coordinates stay unchanged.
  const renderNode = (node: UIElement, frame?: UIElement): React.ReactNode => {
            const isScreen = node.type === 'screen';
            const isSelected = (movingIds.length?movingIds:activeIds).includes(node.id);
            const isExemplar = exemplarIds.includes(node.id);
            const isHovered = hoveredNodeId === node.id && toolMode === 'pointer';

            return (
              <div
                key={node.id}
                data-canvas-node={node.id}
                role={node.role==='productImage'||isMockSymbol(node)?'img':undefined}
                aria-label={node.role==='productImage'||isMockSymbol(node)?node.label:undefined}
                onPointerDown={event=>{if(isScreen&&toolMode==='pointer'&&!isSpacePressed&&event.button===0&&!pickingSource){event.stopPropagation();commitClick(node,event.shiftKey,confirmedRef);}else handleNodePointerDown(event,isScreen&&toolMode==='reference'?null:node);}}
                onMouseEnter={() => !isScreen && setHoveredNodeId(toolMode==='pointer'?canvasSelectionTarget(node.id,nodes,confirmedRef?.selectedIds||[])?.id||node.id:node.id)}
                onMouseLeave={() => !isScreen && setHoveredNodeId(null)}
                className={`absolute transition-opacity duration-150 ${
                  isScreen
                    ? 'overflow-hidden pointer-events-auto'
                    : `pointer-events-auto flex ${node.textVerticalAlign==='top'?'items-start':node.textVerticalAlign==='bottom'?'items-end':'items-center'} ${node.textAlign==='left'?'justify-start text-left':node.textAlign==='right'?'justify-end text-right':'justify-center text-center'} overflow-hidden cursor-pointer`
                } ${isHovered && !isSelected ? 'ring-1 ring-[#0d99ff] ring-offset-1 ring-offset-transparent' : ''}`}
                style={{
                  left: node.x - (frame?.x || 0),
                  top: node.y - (frame?.y || 0),
                  width: node.w,
                  height: node.h,
                  backgroundColor: node.bg || 'transparent',
                  color: node.color || '#18181b',
                  borderRadius: node.radius || 0,
                  border: isScreen ? 'none' : node.border || 'none',
                  fontSize: node.fontSize,
                  fontWeight: node.fontWeight as any,
                  textAlign:node.textAlign,fontFamily:node.fontFamily,paddingInline:mockContentPadding(node),lineHeight:node.lineHeight||1.2,letterSpacing:node.letterSpacing,boxShadow:isScreen?'0 1px 4px #00000008':node.shadow,
                  opacity: 1
                }}
              >
                {isScreen && <div className="absolute inset-0 pointer-events-none z-20" style={{ border: node.border, borderRadius: node.radius }} />}
                {/* Screen Mock Status Bar */}
                {isScreen && !node.library && (
                  <div className="absolute top-0 inset-x-0 h-11 px-6 flex items-center justify-between text-zinc-800 text-xs font-semibold select-none pointer-events-none z-10">
                    <span>9:41</span>
                    <div className="w-20 h-4.5 bg-black rounded-full mx-auto" />
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span>5G</span>
                      <div className="w-5 h-2.5 rounded-sm border border-zinc-200 p-0.5 flex items-center">
                        <div className="w-full h-full bg-zinc-800 rounded-2xs" />
                      </div>
                    </div>
                  </div>
                )}


                {isScreen && nodes.filter(child => child.type !== 'screen' && child.screen === node.screen).map(child => renderNode(child, node))}

                {/* Text / Label */}
                {!isScreen&&isMockSymbol(node)&&<MockSymbol node={node}/>}
                {!isScreen&&node.role==='productImage'&&<ProductIllustration label={node.label}/>}
                {node.id==='home-hero'&&<div className="absolute right-1 bottom-0 w-28 h-24 pointer-events-none"><ProductIllustration label="Lounge chair"/></div>}
                {!isScreen&&!isMockSymbol(node)&&node.role!=='productImage' && (
                  <span title={node.text} style={{maxWidth:node.id==='home-hero'?'68%':undefined,lineHeight:wrapsMockText(node)?(node.lineHeight||1.35):undefined}} className={`${wrapsMockText(node)?'whitespace-pre-line':'truncate'} pointer-events-none select-none ${node.role === 'price' || node.role === 'originalPrice' ? 'tabular-nums' : ''}`}>
                    {node.text || ''}
                  </span>
                )}
              </div>
            );

  };

  return (
    <div
      className={`relative w-full h-full overflow-clip bg-[#f5f5f5] select-none
        ${isPanning || isSpacePressed ? 'cursor-grab' : selectionState === 'drawing' ? 'cursor-crosshair' : toolMode === 'pan' ? 'cursor-grab' : 'cursor-default'}`}
    >
      <CanvasFrameLabels frames={nodes.filter(node=>node.type==='screen')} camera={transform} selectedIds={activeIds} disabled={pickingSource} onSelect={(frame,shift)=>commitClick(frame,shift,confirmedRef)} onPointerDown={(event,frame)=>{event.stopPropagation();if(toolMode==='pointer'&&!isSpacePressed&&event.button===0){event.preventDefault();commitClick(frame,event.shiftKey,confirmedRef);}else handlePointerDown(event,null);}}/>
      {gestureNotice&&<div className="gesture-notice" role="status">{gestureNotice}<button type="button" aria-label="Dismiss gesture message" onClick={()=>setGestureNotice('')}><X size={14}/></button></div>}
      <ReferencePins references={sharedReferences} nodes={nodes} camera={transform} viewport={viewport} activeId={activeSharedId} dismissChooser={sharing} onChooserChange={setPinChooserOpen} onOpen={onOpenShared}/>
      {/* One AI review surface; editing is available only after reference confirmation. */}
      {!sharing&&!inspectorOpen&&inferredRef?.selectedIds.every(id=>nodes.find(node=>node.id===id)?.type!=='screen')&&(selectionState==='preview'||!!draftRef)&&inferredRef&&<div ref={setActionSurface} className={`selection-context action-context horizontal-reference-context absolute z-40 flex flex-col items-stretch pointer-events-none ${adjustOpen?'is-expanded':''} ${viewport.width<380?'is-compact':''} ${inferredRef.selectionMethod==='conventional'?'conventional':''}`} role="region" aria-label="Selection actions" onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()} style={{left:actionPosition.left,top:actionPosition.top,width:adjustOpen?Math.min(336,viewport.width-16):'max-content',maxWidth:Math.max(0,viewport.width-16),maxHeight:Math.max(0,viewport.height-16),'--adjustment-space':`${Math.max(0,viewport.height-16-44)}px`} as React.CSSProperties}>
        <ReferenceActions selectionPending={!!draftRef} compareOwn={compareOwn} compareReady={compareReady&&inferredRef.selectedIds.length>=2} compareHint={compareHint} shareLabel={shareLabel} onCompare={onCompare} onAction={intent=>{setAdjustOpen(false);onAcceptReference(intent);}} expanded={adjustOpen} onMore={()=>{const opening=!adjustOpen;setAdjustOpen(opening);setHoveredInterpretation(null);if(opening&&!ai.done&&!ai.loading){onResearchEvent('ai_interpretation_requested');void ai.request();}}} interpretationContent={<div id="interpretation-adjustments" className="interpretation-adjustments">
          <div className="interpretation-chat" role="log" aria-label="Selection conversation" aria-live="polite">
            <p className="assistant-message"><Sparkles size={14}/>What would you like to select?</p>
            {chatMessage&&<p className="user-message">{chatMessage}</p>}
            {ai.loading&&<div className="interpretation-loading" role="status"><span aria-hidden="true"/>Understanding your selection…</div>}
            {ai.message&&<p role="status" className="subtle">{ai.message}</p>}
            {!ai.loading&&ai.candidates.length>0&&<><p className="subtle">Try a selection</p><div className="selection-suggestion-pills">{ai.candidates.map(candidate=><button type="button" key={candidate.id} aria-pressed={activeInterpretation?.id===candidate.id} title={candidate.reason} onMouseEnter={()=>{setInterpretationEngaged(true);setHoveredInterpretation(candidateInterpretation(candidate));}} onMouseLeave={()=>setHoveredInterpretation(null)} onFocus={()=>{setInterpretationEngaged(true);setHoveredInterpretation(candidateInterpretation(candidate));}} onBlur={()=>setHoveredInterpretation(null)} onClick={()=>{onResearchEvent('candidate_activated');setActiveInterpretation(candidateInterpretation(candidate));setHoveredInterpretation(null);}}>{candidate.label.replace(/^Matching /,'Select similar ')}<span>{mergeGestureIds(candidate.elementIds).length}</span></button>)}</div></>}
          </div>
          <form className="interpretation-composer" onSubmit={submitMeaning}>
            <label className="sr-only" htmlFor="selection-meaning">Describe what you want to select</label>
            <textarea id="selection-meaning" value={chatInput} maxLength={300} rows={2} placeholder="e.g. Select all images like this" onChange={e=>{setChatInput(e.target.value);setInterpretationEngaged(true);setHoveredInterpretation(null);setActiveInterpretation(null);}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();e.currentTarget.form?.requestSubmit();}}}/>
            <div><label>Look in <select aria-label="Where to find matches" value={inferredRef.scope} onChange={e=>handleScopeChange(e.target.value as ScopeLevel)}><option value="exemplars">Drawn area</option><option value="screen">This screen</option><option value="document">All screens</option></select></label><button type="submit" disabled={!chatInput.trim()||ai.loading}>Send</button></div>
          </form>
          {!ai.loading&&!ai.done&&<button type="button" onClick={()=>void ai.request(chatMessage)}>Try again</button>}
          {activeInterpretation&&<button type="button" className="primary-action confirm-reference" onClick={()=>{onResearchEvent('ai_interpretation_chosen');commitInterpretation(activeInterpretation);}}><Check size={14}/>Select {activeInterpretation.selectedIds.length} objects</button>}
          {!ai.loading&&!!draftRef&&<button type="button" onClick={()=>commitInterpretation({id:'manual-touched',label:`${inferredRef.selectedIds.length} selected objects`,description:'Manual selection',reasoning:'Directly indicated objects',selectedIds:mergeGestureIds(inferredRef.exemplarIds),exemplarIds:inferredRef.exemplarIds,inferredIds:[],scope:'exemplars',confidence:'high'})}>Keep my drawn selection</button>}

        </div>}/>
      </div>}

      <div
        ref={containerRef}
        className="absolute inset-0 origin-top-left touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={()=>{if(pendingPointer.current||panPoint.current)handlePointerCancel();}}
      >
        <div
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0'
          }}
          className="w-full h-full relative"
        >
          {/* Canvas Dot Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              width: 5000,
              height: 3000,
              backgroundImage: 'radial-gradient(#a1a1aa 1.5px, transparent 1.5px)',
              backgroundSize: '32px 32px'
            }}
          />

          {/* Render All UI Nodes with Real Conventional Selection Handlers */}
          {nodes.filter(node => node.type === 'screen' || !node.screen).map(node => renderNode(node))}

          {sharedReferences.filter(ref=>ref.id===activeSharedId&&!ref.archivedAt).flatMap(ref=>nodes.filter(n=>ref.elementIds.includes(n.id)).map(node=><div key={`shared-${ref.id}-${node.id}`} className={`shared-target absolute pointer-events-none z-20 ${ref.sourceUser==='A'?'shared-a':'shared-b'}`} style={{left:node.x-2,top:node.y-2,width:node.w+4,height:node.h+4,borderRadius:(node.radius||0)+2,borderWidth:2/transform.scale}}/>))}

          {sourceId&&nodes.filter(n=>n.id===sourceId).map(n=><div key={`source-${n.id}`} className="source-outline absolute pointer-events-none z-30" style={{left:n.x-3,top:n.y-3,width:n.w+6,height:n.h+6}}><span>Style source</span></div>)}
          {(previewing||spotlightNodes.length>0)&&<svg data-canvas-spotlight={previewing?'gesture':'comparison'} className="absolute inset-0 pointer-events-none overflow-visible z-20" style={{width:5000,height:3000}} aria-hidden="true">
            <defs><mask id="selection-preview-focus" maskUnits="userSpaceOnUse" x={-transform.x/transform.scale} y={-transform.y/transform.scale} width={viewport.width/transform.scale} height={viewport.height/transform.scale}>
              <rect x={-transform.x/transform.scale} y={-transform.y/transform.scale} width={viewport.width/transform.scale} height={viewport.height/transform.scale} fill="white"/>
              {spotlightNodes.map(n=><rect data-spotlight-node={n.id} key={n.id} x={n.x-2} y={n.y-2} width={n.w+4} height={n.h+4} rx={(n.radius||0)+2} fill="black"/>)}
            </mask></defs>
            <rect x={-transform.x/transform.scale} y={-transform.y/transform.scale} width={viewport.width/transform.scale} height={viewport.height/transform.scale} fill="#101d27" fillOpacity="0.55" mask="url(#selection-preview-focus)"/>
          </svg>}
          {nodes.filter(node=>node.type==='screen'&&activeIds.includes(node.id)).map(frame=><div key={`frame-outline-${frame.id}`} className="canvas-frame-outline" style={{left:frame.x,top:frame.y,width:frame.w,height:frame.h,borderWidth:1/transform.scale}}/>)}
          {/* Individual Selection Ring Overlays */}
          <AnimatePresence>
            {!showGestureAnimation && (selectionState === 'drawing' || (selectionState === 'rect-selecting' && pendingPointer.current?.shift) || selectionState === 'moving' || selectionState === 'preview' || selectionState === 'disambiguating') && (movingIds.length||activeIds.length) > 0 && nodes.filter(n => (movingIds.length?movingIds:activeIds).includes(n.id) && n.type !== 'screen').map(node => {
              const isExemplar = exemplarIds.includes(node.id);
              const isConventional = inferredRef?.selectionMethod === 'conventional';

              return (
                <motion.div
                  key={`highlight-${node.id}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                  className={`absolute pointer-events-none z-20 ${
                    isConventional
                      ? 'border-2 border-[#0d99ff] bg-[#0d99ff]/15 shadow-sm'
                      : isExemplar
                      ? 'border-2 border-[#0d99ff] bg-transparent shadow-sm'
                      : 'border-2 border-[#0d99ff] bg-transparent shadow-sm'
                  }`}
                  style={{
                    left: node.x - 2,
                    top: node.y - 2,
                    width: node.w + 4,
                    height: node.h + 4,
                    borderRadius: (node.radius || 0) + 3
                  }}
                >

                </motion.div>
              );
            })}
          </AnimatePresence>


          {/* FIGMA-STYLE OVERALL BOUNDING BOX WITH CLEAN CORNER HANDLES ONLY (NO CLUTTERED FLOATING BADGES) */}
          <AnimatePresence>
            {!draftRef && (selectionState === 'preview' || selectionState === 'disambiguating' || (selectionState === 'rect-selecting' && pendingPointer.current?.shift)) && boundingBox && !activeIds.every(id=>nodes.find(node=>node.id===id)?.type==='screen') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute pointer-events-none z-20"
                style={{
                  left: boundingBox.x - 4,
                  top: boundingBox.y - 4,
                  width: boundingBox.w + 8,
                  height: boundingBox.h + 8
                }}
              >
                {/* Clean Blue Bounding Box Outline */}
                <div className="w-full h-full border border-[#0d99ff]/70 relative">
                  {/* Selection boundary only; no editing handles. */}

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Drawing Ink Trail / Marquee Overlay */}
          <svg
            className="absolute inset-0 pointer-events-none overflow-visible z-40"
            style={{ width: 5000, height: 3000 }}
          >
            <defs>
              <filter id="inkGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {showGestureAnimation&&<>
              <defs><mask id="gesture-area" maskUnits="userSpaceOnUse" x="0" y="0" width="5000" height="3000">
                {gesturePaths.map((path,index)=><path key={index} d={`M ${path.map(p=>`${p.x},${p.y}`).join(' L ')}${path.length>2?' Z':''}`} fill={path.length>2?'white':'none'} stroke="white" strokeWidth={24/transform.scale} strokeLinejoin="round" strokeLinecap="round"/>)}
              </mask></defs>
              <foreignObject x="0" y="0" width="5000" height="3000" mask="url(#gesture-area)"><div className="gesture-gradient"/></foreignObject>
            </>}
            {!previewing&&gesturePaths.map((path,index)=><path key={`gesture-${index}`} d={`M ${path.map(p=>`${p.x},${p.y}`).join(' L ')}`} fill="none" stroke="#0d99ff" strokeWidth={2/transform.scale} strokeLinecap="round" strokeLinejoin="round" opacity={0.65}/>)}
            <AnimatePresence>
              {pathD && (
                <motion.path
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                  d={pathD}
                  fill="none"
                  stroke="#81c6f8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#inkGlow)"
                  className={selectionState === 'interpreting' ? '' : ''}
                />
              )}

              {/* Conventional Marquee Box */}
              {selectionState === 'rect-selecting' && rectStart && currentPath.length === 2 && (
                <rect
                  x={Math.min(rectStart.x, currentPath[1].x)}
                  y={Math.min(rectStart.y, currentPath[1].y)}
                  width={Math.abs(currentPath[1].x - rectStart.x)}
                  height={Math.abs(currentPath[1].y - rectStart.y)}
                  fill="rgba(13, 153, 255, 0.12)"
                  stroke="#0d99ff"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              )}
            </AnimatePresence>
          </svg>

          {/* Brief "Interpreting..." Status Banner (During 300ms inference) */}
          <AnimatePresence>
            {selectionState === 'interpreting' && gestureBB && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bg-white border border-[#0d99ff]/40 text-zinc-900 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 pointer-events-none z-50 ring-4 ring-[#0d99ff]/20"
                style={{
                  left: gestureBB.x + gestureBB.w / 2,
                  top: gestureBB.y - 36,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="w-3 h-3 border-2 border-[#0d99ff] border-t-white rounded-full animate-spin" />
                <span>Interpreting reference...</span>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

    </div>
  );
}
