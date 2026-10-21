import React, { useRef, useState, useEffect } from 'react';
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
  onAcceptReference: (intent?:ReferenceIntent) => void;
  nodes: UIElement[];
  transform: { x: number; y: number; scale: number };
  setTransform: React.Dispatch<React.SetStateAction<{ x: number; y: number; scale: number }>>;
}

export default function Canvas({
  shareLabel, sharing,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 800, height: 600 });
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

  // Gesture & Marquee Path
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [rectStart, setRectStart] = useState<Point | null>(null);
  const [marqueeShift, setMarqueeShift] = useState(false);

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
        if(inferenceTimer.current)clearTimeout(inferenceTimer.current);
        if(selectionState==='interpreting'||selectionState==='drawing'){setSelectionState('idle');setCurrentPath([]);}
        setToolMode('pointer');
      }
      if (e.key === 's' || e.key === 'S') {
        setToolMode('smart-ref');
      }
      if (e.key === 'h' || e.key === 'H') {
        if(inferenceTimer.current)clearTimeout(inferenceTimer.current);
        if(selectionState==='interpreting'||selectionState==='drawing'){setSelectionState('idle');setCurrentPath([]);}
        setToolMode('pan');
      }
      if (e.key === 'Escape') {
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

  // --- FIGMA-LIKE SELECTION: INDIVIDUAL NODE POINTER DOWN ---
  const handleNodePointerDown = (e: React.PointerEvent, node: UIElement) => {
    if(inferenceTimer.current)clearTimeout(inferenceTimer.current);
    if (e.button === 1 || isSpacePressed || toolMode === 'pan') return;

    if (toolMode === 'pointer') {
      e.stopPropagation();
      
      const newClicks = clicksCounter + 1;
      setClicksCounter(newClicks);

      const currentSelected = inferredRef?.selectedIds || [];

      if (e.shiftKey) {
        // Figma Shift+Click: Toggle selection
        let nextSelected: string[];
        if (currentSelected.includes(node.id)) {
          nextSelected = currentSelected.filter(id => id !== node.id);
        } else {
          nextSelected = [...currentSelected, node.id];
        }

        if (nextSelected.length > 0) {
          setInferredRef({
            selectedIds: nextSelected,
            exemplarIds: nextSelected,
            label: nextSelected.length === 1 ? (nodes.find(n => n.id === nextSelected[0])?.label || '1 layer') : `${nextSelected.length} layers selected`,
            scope: 'exemplars',
            selectionMethod: 'conventional',
            clicksCount: newClicks
          });
          setSelectionState('preview');
        } else {
          setInferredRef(null);
          setSelectionState('idle');
        }
      } else {
        // Regular Click: Select only this element
        setInferredRef({
          selectedIds: [node.id],
          exemplarIds: [node.id],
          label: node.label,
          matchingRole: node.role,
          matchingComponent: node.component,
          scope: 'exemplars',
          selectionMethod: 'conventional',
          clicksCount: newClicks
        });
        setSelectionState('preview');
      }
    }
  };

  // --- CANVAS BACKGROUND POINTER DOWN ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || isSpacePressed || toolMode === 'pan') {
      setIsPanning(true);
      (e.target as Element).setPointerCapture(e.pointerId);
      return;
    }

    if (selectionState === 'interpreting') return;

    const pt = getCanvasCoords(e);

    if (toolMode === 'pointer') {
      if (!e.shiftKey) {
        setInferredRef(null);
        setSelectionState('idle');
        setShowAlternatives(false);
      }
      setMarqueeShift(e.shiftKey);
      setSelectionState('rect-selecting');
      setRectStart(pt);
      setCurrentPath([pt, pt]);
    } else if (toolMode === 'smart-ref') {
      setSelectionState('drawing');
      setCurrentPath([pt]);
      setInferredRef(null);
      setInterpretations([]);
      setActiveInterpretation(null);
      setShowAlternatives(false);
    }
    
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setTransform(prev => ({
        ...prev,
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
      return;
    }

    if (selectionState !== 'drawing' && selectionState !== 'rect-selecting') return;

    const pt = getCanvasCoords(e);

    if (selectionState === 'drawing') {
      setCurrentPath(prev => [...prev, pt]);
    } else if (selectionState === 'rect-selecting' && rectStart) {
      setCurrentPath([rectStart, pt]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {}
      return;
    }

    // Conventional Marquee Box finished
    if (selectionState === 'rect-selecting' && rectStart && currentPath.length === 2) {
      const end = currentPath[1];
      const r = {
        x: Math.min(rectStart.x, end.x),
        y: Math.min(rectStart.y, end.y),
        w: Math.abs(end.x - rectStart.x),
        h: Math.abs(end.y - rectStart.y)
      };
      
      const newHitIds = nodes.filter(n => n.type !== 'screen' && rectIntersect(n, r)).map(n => n.id);
      
      let finalSelected: string[];
      if (marqueeShift && inferredRef) {
        finalSelected = Array.from(new Set([...inferredRef.selectedIds, ...newHitIds]));
      } else {
        finalSelected = newHitIds;
      }
      
      if (finalSelected.length > 0) {
        const newClicks = clicksCounter + 1;
        setClicksCounter(newClicks);
        setInferredRef({
          selectedIds: finalSelected,
          exemplarIds: finalSelected,
          label: `${finalSelected.length} layers selected`,
          scope: 'exemplars',
          selectionMethod: 'conventional',
          clicksCount: newClicks
        });
        setSelectionState('preview');
      } else if (!marqueeShift) {
        setSelectionState('idle');
      }
      
      setCurrentPath([]);
      setRectStart(null);
      return;
    }

    if (selectionState !== 'drawing') return;

    onResearchEvent('gesture_attempt');
    // Smart Reference Gesture finished
    if (currentPath.length < 4) {
      setSelectionState('idle');
      setCurrentPath([]);
      return;
    }

    // Brief "Interpreting..." feedback state
    setSelectionState('interpreting');
    
    inferenceTimer.current = setTimeout(() => {
      const results = inferSelection(currentPath, nodes);
      
      if (results.length === 0) {
        setSelectionState('idle');
        setCurrentPath([]);
        return;
      }

      setInterpretations(results);
      
      // Auto-commit the best match and open simplified alternatives dropdown
      const best = results[0];
      onResearchEvent('gesture_interpreted');
      commitInterpretation(best, false);
      setSelectionState('disambiguating');
      setShowAlternatives(true);
    }, 300);
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
      selectionMethod: 'smart-ref'
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
  const gestureBB = currentPath.length > 0 ? {
    x: Math.min(...currentPath.map(p => p.x)),
    y: Math.min(...currentPath.map(p => p.y)),
    w: Math.max(...currentPath.map(p => p.x)) - Math.min(...currentPath.map(p => p.x)),
    h: Math.max(...currentPath.map(p => p.y)) - Math.min(...currentPath.map(p => p.y))
  } : null;

  // Frame children share the screen's rounded clipping boundary, while world coordinates stay unchanged.
  const renderNode = (node: UIElement, frame?: UIElement): React.ReactNode => {
            const isScreen = node.type === 'screen';
            const isSelected = activeIds.includes(node.id);
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
        ${isPanning || isSpacePressed ? 'cursor-grab' : toolMode === 'smart-ref' ? 'cursor-crosshair' : toolMode === 'pan' ? 'cursor-grab' : 'cursor-default'}`}
    >
      <ReferencePins references={sharedReferences} nodes={nodes} camera={transform} viewport={viewport} activeId={activeSharedId} onOpen={onOpenShared}/>
      {/* 
        ========================================================================
        SINGLE CONSISTENT TOP CONTEXTUAL SCOPE & SELECTION BAR (Fixed at Top Center)
        Never moves with circle, never clutters artwork, contains single authoritative toggle
        ========================================================================
      */}
      <AnimatePresence>
        {!sharing && (selectionState === 'preview' || selectionState === 'disambiguating') && inferredRef && activeIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.15 }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={`selection-context ${inferredRef.selectionMethod === 'conventional' ? 'conventional' : ''} absolute z-40 flex flex-col items-center pointer-events-auto select-none`}
            style={{ left: Math.max(12, Math.min(viewport.width - Math.min(440, viewport.width - 24) - 12, (boundingBox ? boundingBox.x * transform.scale + transform.x : 12))), top: Math.max(12, Math.min(viewport.height - 200, (boundingBox ? (boundingBox.y + boundingBox.h) * transform.scale + transform.y + 12 : 12))) }}
          >
            {/* The Main Pill Bar */}
            <div className="bg-white/95  border border-zinc-200/80 text-zinc-900 px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-3 text-xs ring-1 ring-zinc-200">
              
              {/* Selection Identity & Label */}
              <div className="flex items-center gap-1.5 font-semibold text-zinc-900 max-w-[200px] sm:max-w-[260px] truncate">
                {inferredRef.selectionMethod === 'smart-ref' ? (
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                ) : (
                  <MousePointer2 className="w-3.5 h-3.5 text-[#0d99ff] shrink-0" />
                )}
                <span className="truncate">{inferredRef.label}</span>
              </div>

              {/* Suggestions / Alternatives Dropdown Button (Smart Ref) */}
              {inferredRef.selectionMethod === 'smart-ref' && interpretations.length > 1 && (
                <button
                  onPointerDown={(e) => { e.stopPropagation(); setShowAlternatives(prev => !prev); }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium border flex items-center gap-1 transition-colors ${
                    showAlternatives
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                      : 'bg-zinc-100/80 border-zinc-200 text-zinc-600 hover:text-zinc-900'
                  }`}
                  title="View alternative smart interpretations"
                >
                  <span>Inferred ({interpretations.length})</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showAlternatives ? 'rotate-180' : ''}`} />
                </button>
              )}

              <span className="context-divider text-zinc-300">|</span>

              {/* THE SINGLE AUTHORITY SCOPE TOGGLE: TOUCHED, SCREEN, ALL SCREENS */}
              <div className="context-scope flex items-center gap-1 bg-zinc-50 p-0.5 rounded-lg border border-zinc-200">
                <button
                  onPointerDown={(e) => { e.stopPropagation(); handleScopeChange('exemplars'); }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    inferredRef.scope === 'exemplars'
                      ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                  title="Restrict to directly touched elements"
                >
                  Touched ({inferredRef.exemplarIds.length})
                </button>

                <button
                  onPointerDown={(e) => { e.stopPropagation(); handleScopeChange('screen'); }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    inferredRef.scope === 'screen'
                      ? 'bg-indigo-600 text-zinc-900 font-semibold shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                  title="Match items across current screen"
                >
                  Screen
                </button>

                <button
                  onPointerDown={(e) => { e.stopPropagation(); handleScopeChange('document'); }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                    inferredRef.scope === 'document'
                      ? 'bg-indigo-600 text-zinc-900 font-semibold shadow-xs'
                      : 'text-indigo-600 hover:bg-indigo-50/60'
                  }`}
                  title="Expand to all matching items across all 6 screens!"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>All Screens</span>
                </button>
              </div>

              <ReferenceActions shareLabel={shareLabel} count={inferredRef.selectedIds.length} onAction={onAcceptReference}/>

              {/* Clear Selection (Esc) */}
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectionState('idle');
                  setInferredRef(null);
                  setCurrentPath([]);
                  setShowAlternatives(false);
                }}
                className="p-1 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 rounded-md transition-colors"
                title="Clear selection (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 
              ========================================================================
              SIMPLIFIED INFERRED INTERPRETATIONS POPOVER
              Clean, compact list of candidate options — zero text walls, no duplicate toggles
              ========================================================================
            */}
            <AnimatePresence>
              {inferredRef.selectionMethod === 'smart-ref' && showAlternatives && interpretations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  className="mt-2 bg-white/98  border border-zinc-200/90 rounded-xl shadow-lg p-1.5 w-80 text-zinc-800"
                >
                  <div className="px-2 py-1 flex items-center justify-between text-[10px] text-zinc-600 uppercase font-mono tracking-wider border-b border-zinc-200 pb-1 mb-1">
                    <span>Inferred Interpretations</span>
                    <span className="text-zinc-500 font-sans lowercase">click to select</span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    {interpretations.map((interp) => {
                      const isSelected = activeInterpretation?.id === interp.id;
                      return (
                        <button
                          key={interp.id}
                          onPointerDown={(e) => e.stopPropagation()}
                          onMouseEnter={() => setHoveredInterpretation(interp)}
                          onMouseLeave={() => setHoveredInterpretation(null)}
                          onClick={() => {
                            commitInterpretation(interp, true);
                            setShowAlternatives(false);
                          }}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors ${
                            isSelected
                              ? 'bg-indigo-50/80 text-zinc-900 border border-indigo-700/60 font-medium'
                              : 'text-zinc-700 hover:bg-zinc-100/80 hover:text-zinc-900'
                          }`}
                        >
                          <span className="truncate pr-2">{interp.label}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 border border-zinc-200 text-zinc-600 shrink-0">
                            {interp.selectedIds.length} items
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        ref={containerRef}
        className="absolute inset-0 origin-top-left touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { if(inferenceTimer.current)clearTimeout(inferenceTimer.current); setIsPanning(false); setCurrentPath([]); setRectStart(null); setSelectionState('idle'); }}
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
            {(selectionState === 'preview' || selectionState === 'disambiguating') && activeIds.length > 0 && nodes.filter(n => activeIds.includes(n.id) && n.type !== 'screen').map(node => {
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
