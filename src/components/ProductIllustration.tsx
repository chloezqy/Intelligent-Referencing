import React from 'react';
/** Inline artwork follows the layer's fill and scales in both canvas and review previews. */
export default function ProductIllustration({label}:{label:string}){
 const kind=/lamp/i.test(label)?'lamp':/vase/i.test(label)?'vase':/stool/i.test(label)?'stool':'chair';
 return <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true" className="product-illustration">
  <ellipse cx="80" cy="106" rx="43" ry="5" fill="#443729" opacity=".09"/>
  {kind==='chair'?<g stroke="#624b38" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
   <path d="m54 76-7 28m53-28 9 28M63 78l4 24m25-24-3 24"/>
   <path d="M44 43q-1-12 12-14l43-3q13 0 14 14l-2 22-60 5Z" fill="#bd9b76"/>
   <path d="m51 65 57-4 8 17-65 5-9-10Z" fill="#e1c5a0"/>
   <path d="m45 52 5 19m62-24-5 20"/>
   <path d="m56 39 42-3" stroke="#ebd5b7" strokeWidth="2"/>
  </g>:kind==='lamp'?<g stroke="#54514b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
   <ellipse cx="81" cy="103" rx="25" ry="4" fill="#77746c"/>
   <path d="M81 101V67l17-23" fill="none"/>
   <path d="M72 49q7-29 29-21l18 22Z" fill="#d3b06a" stroke="#a78a50"/>
   <ellipse cx="96" cy="49" rx="23" ry="4" fill="#f5e6b7" stroke="#a78a50"/>
   <circle cx="81" cy="67" r="4" fill="#77746c"/>
  </g>:kind==='vase'?<g>
   <path d="M76 54q-11-25-3-40m9 44q2-30 15-43" fill="none" stroke="#71806a" strokeWidth="2"/>
   <ellipse cx="71" cy="26" rx="5" ry="12" transform="rotate(-30 71 26)" fill="#87947b"/>
   <ellipse cx="96" cy="30" rx="5" ry="13" transform="rotate(32 96 30)" fill="#a3af91"/>
   <path d="M65 48h29l-4 18q22 19 15 34-3 7-26 7t-25-7q-7-15 15-34Z" fill="#c49680" stroke="#a87864" strokeWidth="2"/>
   <path d="M67 78q-7 13-3 19" fill="none" stroke="#e5c0ac" strokeWidth="3" strokeLinecap="round"/>
   <ellipse cx="80" cy="48" rx="14" ry="3" fill="#a87864"/>
  </g>:<g stroke="#776047" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
   <path d="m55 60-8 44m57-44 9 44M69 67l-1 34m22-34 2 34"/>
   <path d="m52 57 58-4 7 12-60 5-12-7Z" fill="#c9ab7f"/>
   <path d="m57 61 48-3" stroke="#eddbbb" strokeWidth="2"/>
   <path d="m53 85 53 1"/>
  </g>}
 </svg>;
}
