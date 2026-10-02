import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Point, UIElement, ToolMode, SelectionState, InferredReference, Interpretation, ScopeLevel } from '../types';
import { SCREEN_CONFIGS, SCREEN_W, SCREEN_H, START_Y } from '../data';
import { inferSelection, getBoundingBox, expandScope, rectIntersect, generateScopeInterpretations } from '../utils';
import { Check, Sparkles, X, ArrowRight, MousePointer2, ChevronDown } from 'lucide-react';

interface CanvasProps {
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  selectionState: SelectionState;
  setSelectionState: (state: SelectionState) => void;
  inferredRef: InferredReference | null;
  setInferredRef: (ref: InferredReference | null) => void;
  onAcceptReference: () => void;
  nodes: UIElement[];
  transform: { x: number; y: number; scale: number };
  setTransform: React.Dispatch<React.SetStateAction<{ x: number; y: number; scale: number }>>;
}

export default function Canvas({
  toolMode,
  setToolMode,
  selectionState,
  setSelectionState,
  inferredRef,
  setInferredRef,
  onAcceptReference,
  nodes,
  transform,
  setTransform
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
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
  const [clicksCounter, setClicksCounter] = useState(0);

  // Keyboard navigation & shortcuts (Figma standard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
      if (e.key === 'v' || e.key === 'V') {
        setToolMode('pointer');
      }
      if (e.key === 's' || e.key === 'S') {
        setToolMode('smart-ref');
      }
      if (e.key === 'h' || e.key === 'H') {
        setToolMode('pan');
      }
      if (e.key === 'Escape') {
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
          const newScale = Math.min(Math.max(0.15, prev.scale * zoomFactor), 2.5);
          return { ...prev, scale: newScale };
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

    // Smart Reference Gesture finished
    if (currentPath.length < 4) {
      setSelectionState('idle');
      setCurrentPath([]);
      return;
    }

    // Brief "Interpreting..." feedback state
    setSelectionState('interpreting');
    
    setTimeout(() => {
      const results = inferSelection(currentPath, nodes);
      
      if (results.length === 0) {
        setSelectionState('idle');
        setCurrentPath([]);
        return;
      }

      setInterpretations(results);
      
      // Auto-commit the best match and open simplified alternatives dropdown
      const best = results[0];
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
      setSelectionState('preview');
      setShowAlternatives(false);
    }
  };

  // --- UNCONDITIONAL ROBUST SCOPE SWITCHER ("All Screens", "Screen", "Touched") ---
  const handleScopeChange = (newScope: ScopeLevel) => {
    const baseExemplars = activeInterpretation?.exemplarIds?.length
      ? activeInterpretation.exemplarIds
      : (inferredRef?.exemplarIds?.length ? inferredRef.exemplarIds : (inferredRef?.selectedIds || []));

    if (baseExemplars.length === 0) return;

    const roleHint = activeInterpretation?.matchingRole || inferredRef?.matchingRole;
    const compHint = activeInterpretation?.matchingComponent || inferredRef?.matchingComponent;
    const screenHint = activeInterpretation?.targetScreen;

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
  const activeCandidate = hoveredInterpretation || activeInterpretation;
  const activeIds = activeCandidate ? activeCandidate.selectedIds : (inferredRef?.selectedIds || []);
  const exemplarIds = activeCandidate ? activeCandidate.exemplarIds : (inferredRef?.exemplarIds || []);

  const boundingBox = activeIds.length > 0 ? getBoundingBox(activeIds, nodes) : null;
  const gestureBB = currentPath.length > 0 ? {
    x: Math.min(...currentPath.map(p => p.x)),
    y: Math.min(...currentPath.map(p => p.y)),
    w: Math.max(...currentPath.map(p => p.x)) - Math.min(...currentPath.map(p => p.x)),
    h: Math.max(...currentPath.map(p => p.y)) - Math.min(...currentPath.map(p => p.y))
  } : null;

  return (
    <div 
      className={`relative w-full h-full overflow-hidden bg-zinc-950 select-none
        ${isPanning || isSpacePressed ? 'cursor-grab' : toolMode === 'smart-ref' ? 'cursor-crosshair' : toolMode === 'pan' ? 'cursor-grab' : 'cursor-default'}`}
    >
      {/* 
        ========================================================================
        SINGLE CONSISTENT TOP CONTEXTUAL SCOPE & SELECTION BAR (Fixed at Top Center)
        Never moves with circle, never clutters artwork, contains single authoritative toggle
        ========================================================================
      */}
      <AnimatePresence>
        {(selectionState === 'preview' || selectionState === 'disambiguating') && inferredRef && activeIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.15 }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-3.5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-auto select-none"
          >
            {/* The Main Pill Bar */}
            <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 text-white px-3.5 py-1.5 rounded-xl shadow-2xl flex items-center gap-3 text-xs ring-1 ring-zinc-800">
              
              {/* Selection Identity & Label */}
              <div className="flex items-center gap-1.5 font-semibold text-zinc-100 max-w-[200px] sm:max-w-[260px] truncate">
                {inferredRef.selectionMethod === 'smart-ref' ? (
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                ) : (
                  <MousePointer2 className="w-3.5 h-3.5 text-[#0d99ff] shrink-0" />
                )}
                <span className="truncate">{inferredRef.label}</span>
              </div>

              {/* Suggestions / Alternatives Dropdown Button (Smart Ref) */}
              {interpretations.length > 1 && (
                <button
                  onPointerDown={(e) => { e.stopPropagation(); setShowAlternatives(prev => !prev); }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium border flex items-center gap-1 transition-colors ${
                    showAlternatives
                      ? 'bg-indigo-950 border-indigo-600 text-indigo-300'
                      : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                  title="View alternative smart interpretations"
                >
                  <span>Inferred ({interpretations.length})</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showAlternatives ? 'rotate-180' : ''}`} />
                </button>
              )}

              <span className="text-zinc-700">|</span>

              {/* THE SINGLE AUTHORITY SCOPE TOGGLE: TOUCHED, SCREEN, ALL SCREENS */}
              <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
                <button
                  onPointerDown={(e) => { e.stopPropagation(); handleScopeChange('exemplars'); }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    inferredRef.scope === 'exemplars'
                      ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Restrict to directly touched elements"
                >
                  Touched ({exemplarIds.length})
                </button>

                <button
                  onPointerDown={(e) => { e.stopPropagation(); handleScopeChange('screen'); }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    inferredRef.scope === 'screen'
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Match items across current screen"
                >
                  Screen
                </button>

                <button
                  onPointerDown={(e) => { e.stopPropagation(); handleScopeChange('document'); }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                    inferredRef.scope === 'document'
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-indigo-400 hover:bg-indigo-950/60'
                  }`}
                  title="Expand to all matching items across all 6 screens!"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>All Screens</span>
                </button>
              </div>

              {/* Attach Reference to Prompt */}
              <button
                onPointerDown={(e) => { e.stopPropagation(); onAcceptReference(); }}
                className="ml-0.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-xs"
                title="Attach this selection to AI Prompt Bar"
              >
                <Check className="w-3 h-3" />
                <span>Attach</span>
              </button>

              {/* Clear Selection (Esc) */}
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectionState('idle');
                  setInferredRef(null);
                  setCurrentPath([]);
                  setShowAlternatives(false);
                }}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition-colors"
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
              {showAlternatives && interpretations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  className="mt-2 bg-zinc-900/98 backdrop-blur-md border border-zinc-700/90 rounded-xl shadow-2xl p-1.5 w-80 text-zinc-200"
                >
                  <div className="px-2 py-1 flex items-center justify-between text-[10px] text-zinc-400 uppercase font-mono tracking-wider border-b border-zinc-800 pb-1 mb-1">
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
                              ? 'bg-indigo-950/80 text-white border border-indigo-700/60 font-medium'
                              : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                          }`}
                        >
                          <span className="truncate pr-2">{interp.label}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 shrink-0">
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
        className="absolute inset-0 origin-top-left"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
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

          {/* Section Headers & Inter-Screen Flow Connectors */}
          <div className="absolute pointer-events-none z-0">
            {SCREEN_CONFIGS.map((cfg, idx) => (
              <div 
                key={cfg.name} 
                className="absolute"
                style={{ left: cfg.x, top: START_Y - 50, width: SCREEN_W }}
              >
                <div className="flex items-center justify-between text-zinc-400 font-mono text-xs">
                  <span className="font-semibold text-zinc-200">{cfg.label}</span>
                  <span className="text-[11px] text-zinc-500 font-sans">{cfg.desc}</span>
                </div>

                {/* Flow Arrow to next screen */}
                {idx < SCREEN_CONFIGS.length - 1 && (
                  <div 
                    className="absolute top-8 left-[390px] flex items-center gap-1.5 text-zinc-600 font-mono text-[11px]"
                    style={{ width: 100 }}
                  >
                    <div className="h-0.5 flex-1 bg-zinc-800" />
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Render All UI Nodes with Real Figma Selection Handlers */}
          {nodes.map(node => {
            const isScreen = node.type === 'screen';
            const isSelected = activeIds.includes(node.id);
            const isExemplar = exemplarIds.includes(node.id);
            const isHovered = hoveredNodeId === node.id && toolMode === 'pointer';

            return (
              <div
                key={node.id}
                onPointerDown={(e) => !isScreen && handleNodePointerDown(e, node)}
                onMouseEnter={() => !isScreen && setHoveredNodeId(node.id)}
                onMouseLeave={() => !isScreen && setHoveredNodeId(null)}
                className={`absolute transition-opacity duration-150 ${
                  isScreen 
                    ? 'shadow-2xl shadow-black/80 rounded-[40px] overflow-hidden pointer-events-none' 
                    : 'flex items-center justify-center text-center overflow-hidden cursor-pointer'
                } ${isHovered && !isSelected ? 'ring-1 ring-[#0d99ff] ring-offset-1 ring-offset-transparent' : ''}`}
                style={{
                  left: node.x,
                  top: node.y,
                  width: node.w,
                  height: node.h,
                  backgroundColor: node.bg || 'transparent',
                  color: node.color || '#18181b',
                  borderRadius: node.radius || 0,
                  border: node.border || 'none',
                  fontSize: node.fontSize,
                  fontWeight: node.fontWeight as any,
                  opacity: (selectionState === 'preview' || selectionState === 'disambiguating') && activeIds.length > 0 && !isSelected && !isScreen
                    ? 0.35
                    : 1
                }}
              >
                {/* Screen Mock Status Bar */}
                {isScreen && (
                  <div className="absolute top-0 inset-x-0 h-11 px-6 flex items-center justify-between text-zinc-800 text-xs font-semibold select-none pointer-events-none z-10">
                    <span>9:41</span>
                    <div className="w-20 h-4.5 bg-black rounded-full mx-auto" />
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span>5G</span>
                      <div className="w-5 h-2.5 rounded-sm border border-zinc-700 p-0.5 flex items-center">
                        <div className="w-full h-full bg-zinc-800 rounded-2xs" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Text / Label */}
                {!isScreen && (
                  <span className="truncate px-1 pointer-events-none select-none">
                    {node.text || ''}
                  </span>
                )}
              </div>
            );
          })}

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
                    <span className="absolute -top-3.5 -left-1 bg-indigo-600 text-white font-mono text-[9px] px-1 py-0.2 rounded font-bold uppercase shadow-sm">
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
                  {/* Figma 4 Corner Resize Handles */}
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#0d99ff] rounded-xs shadow-xs" />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#0d99ff] rounded-xs shadow-xs" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#0d99ff] rounded-xs shadow-xs" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#0d99ff] rounded-xs shadow-xs" />
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
                  className={selectionState === 'interpreting' ? 'animate-pulse' : ''}
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
                className="absolute bg-zinc-900 border border-indigo-500/40 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 pointer-events-none z-50 ring-4 ring-indigo-500/20"
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
      
      {/* Bottom Right Canvas Pan/Zoom Controls HUD */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2 pointer-events-auto z-20">
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-3 text-[11px]">
          <span><strong className="text-zinc-300">Shift + Click:</strong> Multi-Select</span>
          <span className="text-zinc-700">·</span>
          <span><strong className="text-zinc-300">Space + Drag:</strong> Pan</span>
          <span className="text-zinc-700">·</span>
          <span><strong className="text-zinc-300">S:</strong> Smart Ref</span>
          <span className="text-zinc-700">·</span>
          <span><strong className="text-zinc-300">V:</strong> Select</span>
        </div>
      </div>
    </div>
  );
}
