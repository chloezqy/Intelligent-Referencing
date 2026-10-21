import React from 'react';
import { ToolMode, InferredReference } from '../types';
import { Sparkles, ZoomIn, ZoomOut, Maximize2, Zap, HelpCircle, ChevronRight } from 'lucide-react';
interface TopBarProps {
  toolMode: ToolMode; setToolMode: (mode: ToolMode) => void; scale: number;
  onZoomIn: () => void; onZoomOut: () => void; onZoomFit: () => void;
  isTasksOpen: boolean; setIsTasksOpen: (open: boolean) => void;
  inferredRef: InferredReference | null; onShowHelp: () => void;
}
export default function TopBar({ scale, onZoomIn, onZoomOut, onZoomFit, isTasksOpen, setIsTasksOpen, onShowHelp }: TopBarProps) {
  return <header className="top-header">
    <div className="header-identity"><div className="brand-mark"><Sparkles size={19} /></div><strong>Smart Reference</strong><ChevronRight size={14} className="text-zinc-400" /><span className="document-name">Mobile Commerce Workspace</span><span className="prototype-label">Prototype</span></div>
    <div className="header-actions">
      <button className={`research-toggle ${isTasksOpen ? 'selected' : ''}`} onClick={() => setIsTasksOpen(!isTasksOpen)}><Zap size={15} /><span>Research Tasks</span></button>
      <div className="zoom-controls"><button title="Zoom out" aria-label="Zoom out" onClick={onZoomOut}><ZoomOut size={15} /></button><button title="Zoom to fit all artboards" onClick={onZoomFit}>{Math.round(scale * 100)}%</button><button title="Zoom in" aria-label="Zoom in" onClick={onZoomIn}><ZoomIn size={15} /></button><button title="Fit view" aria-label="Fit view" onClick={onZoomFit}><Maximize2 size={15} /></button></div>
      <button title="How Smart Reference works" aria-label="How Smart Reference works" onClick={onShowHelp}><HelpCircle size={18} /></button>
    </div>
  </header>;
}
