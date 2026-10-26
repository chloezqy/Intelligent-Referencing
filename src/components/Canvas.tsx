import {isSelectionDrag} from '../selectionInteraction';
import {toolDragIntent,moveTargets,movePositions,Positions} from '../toolInteraction';
import {useSemanticSuggestions} from '../useSemanticSuggestions';
import {interpretationLevel} from '../semanticInterpretation';
import { selectionActionLayout } from '../selectionActionLayout';
import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Point, UIElement, ToolMode, SelectionState, InferredReference, Interpretation, ScopeLevel } from '../types';
import ReferencePins from './ReferencePins';
import ReferenceActions from './ReferenceActions';
import { ReferenceIntent, SharedReference } from '../collaboration';
import { zoomAtPoint } from '../workspace';
import { SCREEN_CONFIGS, SCREEN_W, SCREEN_H, START_Y } from '../data';
import { inferSelection, getBoundingBox, expandScope, rectIntersect, generateScopeInterpretations } from '../utils';
import { Check, Sparkles, X, MousePointer2, ChevronDown } from 'lucide-react';

interface CanvasProps {
  shareLabel:string;
  sharing:boolean;
  onSelectionStart:()=>void;
  onMove:(positions:Positions)=>void;
  onResearchEvent: (type:string)=>void;
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
  compareReady:boolean;
  compareHint:string;
  onAcceptReference: (intent?:ReferenceIntent) => void;
  nodes: UIElement[];
  transform: { x: number; y: number; scale: number };
  setTransform: React.Dispatch<React.SetStateAction<{ x: number; y: number; scale: number }>>;
}

export default function Canvas({
  shareLabel, sharing,onSelectionStart,onMove,onCompare,compareReady,compareHint,
  toolMode,
  setToolMode,
  selectionState,
  setSelectionState,
  inferredRef,
  setInferredRef,
  onAcceptReference,
  nodes,
  transform,
  setTransform, onResearchEvent, sharedReferences, activeSharedId, onOpenShared
}: CanvasProps) {
  const ai=useSemanticSuggestions(inferredRef,nodes);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 800, height: 600 });
  const [actionAnchor,setActionAnchor]=useState<Point|null>(null);
  const [detailsOpen,setDetailsOpen]=useState(false);
  const [actionSurface,setActionSurface]=useState<HTMLDivElement|null>(null);
  const collapsedActionSize=useRef({width:320,height:196});
  const [actionPosition,setActionPosition]=useState({left:8,top:8});
  const [pinChooserOpen, setPinChooserOpen] = useState(false);
  const [selectionPopupDismissed, setSelectionPopupDismissed] = useState(false);
  useEffect(()=>{setSelectionPopupDismissed(false);},[inferredRef]);
  useEffect(()=>{if(sharing||pinChooserOpen)setSelectionPopupDismissed(true);},[sharing,pinChooserOpen]);
  useEffect(()=>{
    const dismiss=(event:PointerEvent)=>{
      if(!(event.target as Element).closest('.selection-context')){setSelectionPopupDismissed(true);setDetailsOpen(false);}
    };
    document.addEventListener('pointerdown',dismiss,true);
    return()=>document.removeEventListener('pointerdown',dismiss,true);
  },[]);

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

  const pendingPointer=useRef<{id:number;start:Point;screenStart:Point;screenPoints:Point[];path:Point[];node:UIElement|null;shift:boolean;previous:InferredReference|null;dragging:boolean;tool:ToolMode;moveNodes:UIElement[]}|null>(null);
  const [movingIds,setMovingIds]=useState<string[]>([]);
  const panPoint=useRef<Point|null>(null);
  // Gesture & Marquee Path
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [rectStart, setRectStart] = useState<Point | null>(null);

  // Interpretations from gesture inference
  const [interpretations, setInterpretations] = useState<Interpretation[]>([]);
  const [hoveredInterpretation, setHoveredInterpretation] = useState<Interpretation | null>(null);
  const [activeInterpretation, setActiveInterpretation] = useState<Interpretation | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const inferenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(()=>()=>{if(inferenceTimer.current)clearTimeout(inferenceTimer.current);},[]);
  const [clicksCounter, setClicksCounter] = useState(0);

  // Keyboard navigation & shortcuts (Figma standard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select, button, summary, [role=dialog], [contenteditable=true]')) return;

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
      if(e.key==='r'||e.key==='R'){handlePointerCancel();setToolMode('reference');}
      if (e.key === 'h' || e.key === 'H') {
        handlePointerCancel();
        setToolMode('pan');
      }
      if (e.key === 'Escape') {
        if(pendingPointer.current||panPoint.current||selectionState==='interpreting'){handlePointerCancel();return;}
        if(inferenceTimer.current)clearTimeout(inferenceTimer.current);
        setSelectionState('idle');
        setInferredRef(null);
        setCurrentPath([]);
        setShowAlternatives(false);
        setClicksCounter(0);
      }
      // Cmd+A / Ctrl+A: Select all selectable layers
      if ((e.metaKey || e.ctrlKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        const allSelectable = nodes.filter(n => n.type !== 'screen' && n.type !== 'header' && n.type !== 'tabbar').map(n => n.id);
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
      if (e.key === 'Enter' && (selectionState === 'preview' || selectionState === 'disambiguating')) {
        onAcceptReference();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
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
  }, [selectionState, onAcceptReference, setToolMode, nodes, clicksCounter]);

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
  const getCanvasCoords = (e: React.PointerEvent): Point => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left - transform.x) / transform.scale,
      y: (e.clientY - rect.top - transform.y) / transform.scale
    };
  };

  // One Select interaction: decide click versus drag only after movement/release.
  const handleNodePointerDown=(e:React.PointerEvent,node:UIElement)=>{e.stopPropagation();handlePointerDown(e,node);};
  const handlePointerDown=(e:React.PointerEvent,node:UIElement|null=null)=>{
    if(e.button!==0&&e.button!==1)return;
    if(pendingPointer.current||panPoint.current)return;
    if(inferenceTimer.current){clearTimeout(inferenceTimer.current);inferenceTimer.current=null;}
    if(e.button===1||isSpacePressed||toolMode==='pan'){
      setIsPanning(true);panPoint.current={x:e.clientX,y:e.clientY};containerRef.current?.setPointerCapture(e.pointerId);return;
    }
    const start=getCanvasCoords(e),screenStart={x:e.clientX,y:e.clientY};
    pendingPointer.current={id:e.pointerId,start,screenStart,screenPoints:[screenStart],path:[start],node,shift:e.shiftKey,previous:inferredRef,dragging:false,tool:toolMode,moveNodes:[]};
    containerRef.current?.setPointerCapture(e.pointerId);
  };
  const handlePointerMove=(e:React.PointerEvent)=>{
    if(panPoint.current){const previous=panPoint.current;panPoint.current={x:e.clientX,y:e.clientY};setTransform(t=>({...t,x:t.x+e.clientX-previous.x,y:t.y+e.clientY-previous.y}));return;}
    const pending=pendingPointer.current;if(!pending||pending.id!==e.pointerId)return;
    pending.screenPoints.push({x:e.clientX,y:e.clientY});pending.path.push(getCanvasCoords(e));
    const intent=toolDragIntent(pending.tool,!!pending.node,pending.shift);
    if(!pending.dragging&&isSelectionDrag(pending.screenStart,pending.screenPoints)){
      onSelectionStart();pending.dragging=true;setShowAlternatives(false);setDetailsOpen(false);
      if(intent==='move'){pending.moveNodes=moveTargets(nodes,pending.node!.id,pending.previous?.selectedIds||[]);setMovingIds(pending.previous?.selectedIds.includes(pending.node!.id)?pending.previous.selectedIds:[pending.node!.id]);}
    }
    if(pending.dragging){
      if(intent==='move'){setSelectionState('moving');setCurrentPath([]);const end=pending.path[pending.path.length-1];onMove(movePositions(pending.moveNodes,{x:end.x-pending.start.x,y:end.y-pending.start.y},nodes));}
      else {setSelectionState(intent==='box'?'rect-selecting':'drawing');setRectStart(pending.start);setCurrentPath(intent==='box'?[pending.start,pending.path[pending.path.length-1]]:[...pending.path]);}
    }

  };
  useEffect(()=>{handlePointerCancel();},[toolMode]);
  const commitClick=(node:UIElement|null,shift:boolean,previous:InferredReference|null)=>{
    onSelectionStart();
    if(!node){if(!shift){setInferredRef(null);setSelectionState('idle');}return;}
    const count=clicksCounter+1;setClicksCounter(count);
    const ids=shift?(previous?.selectedIds.includes(node.id)?previous.selectedIds.filter(id=>id!==node.id):[...(previous?.selectedIds||[]),node.id]):[node.id];
    if(!ids.length){setInferredRef(null);setSelectionState('idle');return;}
    setInferredRef({selectedIds:ids,exemplarIds:ids,label:ids.length===1?nodes.find(n=>n.id===ids[0])!.label:`${ids.length} layers selected`,...(ids.length===1?{matchingRole:nodes.find(n=>n.id===ids[0])?.role,matchingComponent:nodes.find(n=>n.id===ids[0])?.component}:{}),scope:'exemplars',selectionMethod:'conventional',clicksCount:count});
    setSelectionState('preview');setShowAlternatives(false);
  };
  const handlePointerCancel=()=>{
    if(inferenceTimer.current){clearTimeout(inferenceTimer.current);inferenceTimer.current=null;}
    const active=!!pendingPointer.current||!!panPoint.current||selectionState==='drawing'||selectionState==='rect-selecting'||selectionState==='interpreting';
    const pending=pendingPointer.current;if(pending?.moveNodes.length)onMove(Object.fromEntries(pending.moveNodes.map(n=>[n.id,{x:n.x,y:n.y}])));setMovingIds([]);
    pendingPointer.current=null;panPoint.current=null;setIsPanning(false);setCurrentPath([]);setRectStart(null);
    if(active)setSelectionState(inferredRef?'preview':'idle');
  };
  useEffect(()=>{const blur=()=>{setIsSpacePressed(false);handlePointerCancel();};window.addEventListener('blur',blur);return()=>window.removeEventListener('blur',blur);},[inferredRef,selectionState]);
  const handlePointerUp=(e:React.PointerEvent)=>{
    if(panPoint.current){panPoint.current=null;setIsPanning(false);if(containerRef.current?.hasPointerCapture(e.pointerId))containerRef.current.releasePointerCapture(e.pointerId);return;}
    const pending=pendingPointer.current;if(!pending||pending.id!==e.pointerId)return;
    pendingPointer.current=null;
    const end=getCanvasCoords(e);pending.path.push(end);pending.screenPoints.push({x:e.clientX,y:e.clientY});
    if(containerRef.current?.hasPointerCapture(e.pointerId))containerRef.current.releasePointerCapture(e.pointerId);
    setActionAnchor(end);setCurrentPath([]);setRectStart(null);
    if(!isSelectionDrag(pending.screenStart,pending.screenPoints)){if(pending.tool==='pointer')commitClick(pending.node,pending.shift,pending.previous);return;}
    const intent=toolDragIntent(pending.tool,!!pending.node,pending.shift);
    if(intent==='move'){
      const snapshot=pending.moveNodes.length?pending.moveNodes:moveTargets(nodes,pending.node!.id,pending.previous?.selectedIds||[]);
      onMove(movePositions(snapshot,{x:end.x-pending.start.x,y:end.y-pending.start.y},nodes));setMovingIds([]);onResearchEvent('object_move');
      if(!pending.previous?.selectedIds.includes(pending.node!.id))commitClick(pending.node,false,pending.previous);else setSelectionState('preview');return;
    }
    if(intent==='box'){
      const r={x:Math.min(pending.start.x,end.x),y:Math.min(pending.start.y,end.y),w:Math.abs(end.x-pending.start.x),h:Math.abs(end.y-pending.start.y)};
      const hitIds=nodes.filter(n=>n.type!=='screen'&&rectIntersect(n,r)).map(n=>n.id);
      const ids=[...new Set([...(pending.shift?(pending.previous?.selectedIds||[]):[]),...hitIds])];
      const count=clicksCounter+1;setClicksCounter(count);
      setInferredRef(ids.length?{selectedIds:ids,exemplarIds:ids,label:`${ids.length} layers selected`,scope:'exemplars',selectionMethod:'conventional',clicksCount:count}:null);setSelectionState(ids.length?'preview':'idle');return;
    }
    onResearchEvent('gesture_attempt');setSelectionState('interpreting');setCurrentPath(pending.path);
    inferenceTimer.current=setTimeout(()=>{
      inferenceTimer.current=null;
      const results=inferSelection(pending.path,nodes);
      if(!results.length){setSelectionState(pending.previous?'preview':'idle');setCurrentPath([]);return;}
      setInterpretations(results);onResearchEvent('gesture_interpreted');commitInterpretation(results[0],false);setSelectionState('preview');setShowAlternatives(false);setDetailsOpen(false);setCurrentPath([]);
    },300);
  };

  const commitInterpretation = (interp: Interpretation, finalize = true) => {
    setActiveInterpretation(interp);
    setInferredRef({
      selectedIds: interp.selectedIds,
      exemplarIds: interp.exemplarIds,
      label: interp.label,
      activeInterpretation: interp,
      matchingRole: interp.matchingRole,
      matchingComponent: interp.matchingComponent,
      scope: interp.scope,
      selectionMethod: interp.source==='model'?(inferredRef?.selectionMethod||'conventional'):'smart-ref'
    });

    if (finalize) {
      onResearchEvent('interpretation_choice');
      setSelectionState('preview');
      setShowAlternatives(false);
    }
  };

  // --- UNCONDITIONAL ROBUST SCOPE SWITCHER ("All Screens", "Screen", "Touched") ---
  const handleScopeChange = (newScope: ScopeLevel) => {
    const baseExemplars = inferredRef?.exemplarIds?.length ? inferredRef.exemplarIds : (inferredRef?.selectedIds || []);

    if (baseExemplars.length === 0) return;

    const roleHint = inferredRef?.matchingRole;
    const compHint = inferredRef?.matchingComponent;
    const screenHint = inferredRef?.activeInterpretation?.targetScreen;

    // Dynamically regenerate the smart suggestions list tailored to the selected scope!
    const newInterpretations = generateScopeInterpretations(
      baseExemplars,
      nodes,
      newScope,
      roleHint,
      compHint,
      screenHint
    );

    setInterpretations(newInterpretations);
    setHoveredInterpretation(null);

    const bestMatch = newInterpretations[0];
    if (bestMatch) {
      setActiveInterpretation(bestMatch);
      setInferredRef({
        selectedIds: bestMatch.selectedIds,
        exemplarIds: baseExemplars,
        label: bestMatch.label,
        activeInterpretation: bestMatch,
        matchingRole: bestMatch.matchingRole || roleHint,
        matchingComponent: bestMatch.matchingComponent || compHint,
        scope: newScope,
        selectionMethod: inferredRef?.selectionMethod || 'smart-ref'
      });
    }
  };

  // Generate SVG path for the ink trail
  const pathD = (selectionState === 'drawing' || selectionState === 'interpreting' || selectionState === 'disambiguating') && currentPath.length > 1
    ? `M ${currentPath.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`
    : '';

  // Active highlights
  const activeCandidate = hoveredInterpretation || inferredRef?.activeInterpretation;
  const activeIds = activeCandidate ? activeCandidate.selectedIds : (inferredRef?.selectedIds || []);
  const exemplarIds = activeCandidate ? activeCandidate.exemplarIds : (inferredRef?.exemplarIds || []);

  const boundingBox = activeIds.length > 0 ? getBoundingBox(activeIds, nodes) : null;
  // Re-anchor only on appearance or actual canvas navigation, never accordion changes.
  useLayoutEffect(()=>{
    if(!actionSurface)return;
    if(!detailsOpen)collapsedActionSize.current={width:actionSurface.offsetWidth,height:actionSurface.offsetHeight};
    const width=Math.min(inferredRef?.selectionMethod==='smart-ref'?320:336,Math.max(0,viewport.width-16));
    // Reserve a small scrollable adjustment area when first choosing an edge-safe anchor.
    const height=Math.min(Math.max(0,viewport.height-16),collapsedActionSize.current.height+72);
    setActionPosition(selectionActionLayout(boundingBox,transform,viewport,{width,height},actionAnchor));
  },[actionSurface,transform.x,transform.y,transform.scale,viewport.width,viewport.height,actionAnchor]);
  const actionAvailableHeight=Math.max(0,viewport.height-actionPosition.top-8);
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
                onPointerDown={(e) => !isScreen && handleNodePointerDown(e, node)}
                onMouseEnter={() => !isScreen && setHoveredNodeId(node.id)}
                onMouseLeave={() => !isScreen && setHoveredNodeId(null)}
                className={`absolute transition-opacity duration-150 ${
                  isScreen 
                    ? 'shadow-lg shadow-black/10 rounded-[40px] overflow-hidden pointer-events-none' 
                    : 'pointer-events-auto flex items-center justify-center text-center overflow-hidden cursor-pointer'
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
                  opacity: (selectionState === 'preview' || selectionState === 'disambiguating') && activeIds.length > 0 && !isSelected && !isScreen
                    ? 0.35
                    : 1
                }}
              >
                {isScreen && <div className="absolute inset-0 pointer-events-none z-20" style={{ border: node.border, borderRadius: node.radius }} />}
                {/* Screen Mock Status Bar */}
                {isScreen && (
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
                {!isScreen && (
                  <span title={node.text} className={`truncate pointer-events-none select-none ${node.role === 'price' || node.role === 'originalPrice' ? 'tabular-nums' : 'px-1'}`}>
                    {node.text || ''}
                  </span>
                )}
              </div>
            );

  };

  return (
    <div 
      className={`relative w-full h-full overflow-clip bg-[#e8e8e8] select-none
        ${isPanning || isSpacePressed ? 'cursor-grab' : selectionState === 'drawing' ? 'cursor-crosshair' : toolMode === 'pan' ? 'cursor-grab' : 'cursor-default'}`}
    >
      <ReferencePins references={sharedReferences} nodes={nodes} camera={transform} viewport={viewport} activeId={activeSharedId} dismissChooser={sharing} onChooserChange={setPinChooserOpen} onOpen={onOpenShared}/>
      {/* 
        ========================================================================
        SINGLE CONSISTENT TOP CONTEXTUAL SCOPE & SELECTION BAR (Fixed at Top Center)
        Never moves with circle, never clutters artwork, contains single authoritative toggle
        ========================================================================
      */}
      <AnimatePresence>
        {!sharing && !pinChooserOpen && !selectionPopupDismissed && (selectionState === 'preview' || selectionState === 'disambiguating') && inferredRef && activeIds.length > 0 && (
          <motion.div
            ref={setActionSurface}
            role="region" aria-label={`Actions for ${inferredRef.label}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition:{duration:0} }}
            transition={{ duration: 0.15 }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={`selection-context action-context ${inferredRef.selectionMethod==='smart-ref'?'gesture-context':''} ${detailsOpen?'details-expanded':''} ${inferredRef.selectionMethod === 'conventional' ? 'conventional' : ''} absolute z-40 flex flex-col items-center pointer-events-auto select-none`}
            style={{...actionPosition,width:Math.min(inferredRef.selectionMethod==='smart-ref'?320:336,Math.max(0,viewport.width-16)),maxHeight:actionAvailableHeight,'--adjustment-space':`${Math.max(0,actionAvailableHeight-collapsedActionSize.current.height-1)}px`} as React.CSSProperties}
          >
            {inferredRef.selectionMethod==='smart-ref'&&<header className="interpretation-summary"><strong>{inferredRef.label}</strong><span>{inferredRef.activeInterpretation?.level||(inferredRef.activeInterpretation?interpretationLevel(inferredRef.activeInterpretation):'geometric')} · {inferredRef.activeInterpretation?.source==='model'?'AI':'rule-based'}</span></header>}
            {(!detailsOpen||inferredRef.selectionMethod==='smart-ref')&&<ReferenceActions hideMore={inferredRef.selectionMethod==='smart-ref'} onMore={()=>{setDetailsOpen(true);setShowAlternatives(false);}} onCompare={onCompare} compareReady={compareReady} compareHint={compareHint} shareLabel={shareLabel} onAction={onAcceptReference}/>}
            {(inferredRef.selectionMethod==='smart-ref'||detailsOpen)&&<div className={`interpretation-dropdown ${detailsOpen?'is-expanded':''}`}>
            <button type="button" className="interpretation-toggle" aria-controls="interpretation-adjustments" aria-expanded={detailsOpen} onClick={()=>setDetailsOpen(v=>!v)}><span>{inferredRef.selectionMethod==='smart-ref'?'Adjust interpretation':'Selection details'}</span><ChevronDown size={14} aria-hidden="true" className={detailsOpen?'rotate-180':''}/></button>
            {detailsOpen&&<div id="interpretation-adjustments" className="interpretation-adjustments">
              {inferredRef.selectionMethod!=='smart-ref'&&<><strong>{inferredRef.label}</strong>{inferredRef.activeInterpretation?.source==='model'&&<small>semantic · AI</small>}</>}
              <div className="scope-options" role="group" aria-label="Reference scope">{([{scope:'exemplars',label:'Touched'},{scope:'screen',label:'Screen'},{scope:'document',label:'All screens'}] as const).map(option=><button type="button" key={option.scope} aria-pressed={inferredRef.scope===option.scope} onClick={()=>handleScopeChange(option.scope)}>{option.label}</button>)}</div>
              {inferredRef.selectionMethod==='smart-ref'&&interpretations.length>1&&<details><summary>Alternative interpretations ({interpretations.length})</summary><div className="interpretation-options">{interpretations.map(interp=><button type="button" key={interp.id} aria-pressed={inferredRef.activeInterpretation?.id===interp.id} onMouseEnter={()=>setHoveredInterpretation(interp)} onMouseLeave={()=>setHoveredInterpretation(null)} onClick={()=>{commitInterpretation(interp,true);setHoveredInterpretation(null);}}><strong>{interp.label}</strong><small>{interpretationLevel(interp)} · rule-based</small></button>)}</div></details>}
              <div className="semantic-suggestions">
                <button type="button" data-semantic-input={JSON.stringify({selectedIds:inferredRef.selectedIds,exemplarIds:inferredRef.exemplarIds,scope:inferredRef.scope})} disabled={ai.loading||ai.done||inferredRef.selectedIds.length>24} title={inferredRef.selectedIds.length>24?'Select up to 24 objects to request AI suggestions':undefined} onClick={()=>{onResearchEvent('ai_interpretation_requested');void ai.request();}}><Sparkles size={12} aria-hidden="true"/> {ai.loading?'Interpreting…':ai.done?'AI suggestions loaded':'AI suggestions'}</button>
                {ai.message&&<p className="subtle" role="status">{ai.message}</p>}
                {ai.candidates.length>0&&<details open><summary>AI interpretations ({ai.candidates.length})</summary><div className="interpretation-options">{ai.candidates.map(candidate=><button type="button" key={candidate.id} onClick={()=>{const exemplars=candidate.evidenceIds.filter(id=>candidate.elementIds.includes(id));onResearchEvent('ai_interpretation_chosen');commitInterpretation({id:candidate.id,label:candidate.label,description:candidate.reason,reasoning:candidate.reason,selectedIds:candidate.elementIds,exemplarIds:exemplars,inferredIds:candidate.elementIds.filter(id=>!exemplars.includes(id)),scope:inferredRef.scope,confidence:'medium',source:'model',level:'semantic'},true);}}><strong>{candidate.label}</strong><small>semantic · AI</small><small>{candidate.reason}</small></button>)}</div></details>}
              </div>
              <p className="subtle">Click or Shift-click objects to correct the selection. Scope changes apply immediately.</p>
            </div>}
            </div>}

          </motion.div>
        )}
      </AnimatePresence>

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

          {/* Frame Headers */}
          <div className="absolute pointer-events-none z-0">
            {SCREEN_CONFIGS.map(cfg => (
              <div 
                key={cfg.name} 
                className="absolute"
                style={{ left: cfg.x, top: START_Y - 24, width: SCREEN_W }}
              >
                <div className="flex items-center justify-between text-zinc-600 font-mono text-xs">
                  <span className="font-semibold text-zinc-800">{cfg.label}</span>
                </div>


              </div>
            ))}
          </div>

          {/* Render All UI Nodes with Real Conventional Selection Handlers */}
          {nodes.filter(node => node.type === 'screen' || !node.screen).map(node => renderNode(node))}

          {sharedReferences.filter(ref=>ref.id===activeSharedId&&!ref.archivedAt).flatMap(ref=>nodes.filter(n=>ref.elementIds.includes(n.id)).map(node=><div key={`shared-${ref.id}-${node.id}`} className={`shared-target absolute pointer-events-none z-20 ${ref.sourceUser==='A'?'shared-a':'shared-b'}`} style={{left:node.x-2,top:node.y-2,width:node.w+4,height:node.h+4,borderRadius:(node.radius||0)+2,borderWidth:2/transform.scale}}/>))}

          {/* Individual Selection Ring Overlays */}
          <AnimatePresence>
            {(selectionState === 'moving' || selectionState === 'preview' || selectionState === 'disambiguating') && (movingIds.length||activeIds.length) > 0 && nodes.filter(n => (movingIds.length?movingIds:activeIds).includes(n.id) && n.type !== 'screen').map(node => {
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
                      ? 'border-2 border-indigo-500 bg-indigo-500/20 shadow-md shadow-indigo-500/30' 
                      : 'border-2 border-cyan-400 border-dashed bg-cyan-400/10 shadow-sm'
                  }`}
                  style={{ 
                    left: node.x - 2, 
                    top: node.y - 2, 
                    width: node.w + 4, 
                    height: node.h + 4,
                    borderRadius: (node.radius || 0) + 3
                  }}
                >
                  {!isConventional && isExemplar ? (
                    <span className="absolute -top-3.5 -left-1 bg-indigo-600 text-zinc-900 font-mono text-[9px] px-1 py-0.2 rounded font-bold uppercase shadow-sm">
                      Exemplar
                    </span>
                  ) : null}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* FIGMA-STYLE OVERALL BOUNDING BOX WITH CLEAN CORNER HANDLES ONLY (NO CLUTTERED FLOATING BADGES) */}
          <AnimatePresence>
            {(selectionState === 'preview' || selectionState === 'disambiguating') && boundingBox && (
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

            <AnimatePresence>
              {pathD && (
                <motion.path
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                  d={pathD}
                  fill="none"
                  stroke="#818cf8"
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
                className="absolute bg-white border border-indigo-500/40 text-zinc-900 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 pointer-events-none z-50 ring-4 ring-indigo-500/20"
                style={{
                  left: gestureBB.x + gestureBB.w / 2,
                  top: gestureBB.y - 36,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="w-3 h-3 border-2 border-indigo-400 border-t-white rounded-full animate-spin" />
                <span>Interpreting reference...</span>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
      
    </div>
  );
}
