import React from 'react';
import {ShoppingBag,ArrowLeft,ArrowUpRight,Heart,Compass,Search,Ellipsis} from 'lucide-react';
import type {UIElement} from '../types';
export const isMockSymbol=(node:UIElement)=>node.type==='icon'||node.role==='favorite';
/** Shared SVG avoids platform emoji metrics and keeps icon/label bounds explicit. */
export default function MockSymbol({node}:{node:UIElement}){
 const tab=node.role==='tabIcon',label=node.label.replace(/^Tab /,''),size=tab?18:Math.min(18,node.w-6,node.h-6);
 const Icon=node.role==='favorite'||/Saved/.test(label)?Heart:/Discover/.test(label)?Compass:/Search/.test(label)?Search:node.text==='←'?ArrowLeft:node.text==='↗'?ArrowUpRight:node.text==='🛒'||/Cart/.test(label)?ShoppingBag:Ellipsis;
 return <svg width="100%" height="100%" viewBox={`0 0 ${node.w} ${node.h}`} aria-hidden="true" style={{color:node.color||'#52525b'}}>
  <svg x={(node.w-size)/2} y={tab?1:(node.h-size)/2} width={size} height={size}><Icon size={size} strokeWidth={1.6} fill={node.role==='favorite'?'currentColor':'none'}/></svg>
  {tab&&<text x="50%" y={node.h-5} textAnchor="middle" fill="currentColor" fontSize={node.fontSize||10} fontWeight={node.fontWeight||500} fontFamily="Arial, sans-serif">{label}</text>}
 </svg>;
}
