import React,{useState} from 'react';
import {AlignLeft,AlignCenter,AlignRight,AlignStartVertical,AlignCenterVertical,AlignEndVertical,ArrowDownToLine,ArrowUpToLine,AlignVerticalJustifyCenter,ChevronDown,Maximize2} from 'lucide-react';
import type {UIElement} from '../types';
import {roots,textTargets,layoutPatches,LayoutOperation} from '../editing';
import {SECTION_FIELDS,FIELD_LABELS,selectedProperty,DesignSection} from '../designInspectorProperties';
import {ElementPreview} from './ReferencePreviewCard';
interface Props {ids:string[];nodes:UIElement[];onProperties:(section:DesignSection,values:Partial<UIElement>)=>void;onAlign:(op:LayoutOperation)=>void;tools:(section:DesignSection)=>React.ReactNode;preview:(section:DesignSection)=>React.ReactNode;history:React.ReactNode}
export default function DesignInspector({ids,nodes,onProperties,onAlign,tools,preview,history}:Props){
 const selected=roots(ids,nodes),[expanded,setExpanded]=useState(false);
 const text=textTargets(ids,nodes,'all').length>0;
 const sections=(Object.keys(SECTION_FIELDS) as DesignSection[]).map(section=>({section,tools:tools(section)})).filter(({section,tools})=>(section!=='Typography'||text)&&(section!=='Appearance'||SECTION_FIELDS.Appearance.some(key=>selectedProperty(ids,nodes,key).available)||(Array.isArray(tools)?tools.length>0:!!tools)));
 return <div className="native-design-inspector">
 <div className="design-layer-heading"><strong>{selected.length===1?selected[0].type.replace(/^./,c=>c.toUpperCase()):'Multiple layers'}</strong><small>{selected.length>1?selected.length+' selected':selected[0]?.label}</small></div>
 <div className={`design-selection-preview ${expanded?'is-expanded':''}`}>
 <button type="button" className="design-preview-toggle" aria-label="Expand selection preview" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}><Maximize2 size={12}/></button>
 {selected.slice(0,expanded?selected.length:3).map(n=><figure key={n.id}><ElementPreview element={n} nodes={nodes}/><figcaption><strong title={n.label}>{n.label}</strong><small>{n.type} · {n.screen}</small></figcaption></figure>)}
 {selected.length>3&&!expanded&&<small>+{selected.length-3} more layers</small>}
 </div>
 {sections.map(({section,tools:sectionTools})=><PropertySection key={section+ids.join('|')+JSON.stringify(selected)} section={section} ids={ids} nodes={nodes} onProperties={onProperties} tools={sectionTools} preview={preview(section)}>
 {section==='Position'&&<div className="design-alignment" role="group" aria-label="Alignment">{([['left',AlignLeft,'Align left'],['center',AlignCenter,'Align horizontal centers'],['right',AlignRight,'Align right'],['top',AlignStartVertical,'Align top'],['middle',AlignCenterVertical,'Align vertical centers'],['bottom',AlignEndVertical,'Align bottom']] as const).map(([op,Icon,title])=>{let issue='';try{layoutPatches(ids,nodes,op);}catch(e){issue=(e as Error).message;}return <button key={op} type="button" aria-label={title} title={issue||title} disabled={!!issue} onClick={()=>onAlign(op)}><Icon size={14}/></button>;})}</div>}
 </PropertySection>)}
 <details className="design-property-section design-export"><summary>Export<ChevronDown size={12}/></summary><p className="design-unavailable">Export is not available in this prototype.</p></details>
 {history}
 </div>;
}
function PropertySection({section,ids,nodes,onProperties,children,tools,preview}:{key?:string;section:DesignSection;ids:string[];nodes:UIElement[];onProperties:Props['onProperties'];children:React.ReactNode;tools:React.ReactNode;preview:React.ReactNode}){
 const [draft,setDraft]=useState<Record<string,string>>({}),fields=SECTION_FIELDS[section].filter(key=>selectedProperty(ids,nodes,key).available);
 return <details className="design-property-section" open={section!=='Stroke'&&section!=='Effects'}><summary>{section}<ChevronDown size={12}/></summary>
 {children}
 {fields.length?<form onSubmit={e=>{e.preventDefault();const values=Object.fromEntries(Object.entries(draft).map(([k,v])=>[k,['x','y','w','h','spacing','radius','fontSize','lineHeight','letterSpacing'].includes(k)?Number(v):v]));onProperties(section,values);}}>
 <div className={`design-property-grid ${section==='Typography'?'design-typography-grid':''}`}>{fields.filter(key=>key!=='textAlign'&&key!=='textVerticalAlign').map(key=>{const state=selectedProperty(ids,nodes,key),numeric=typeof state.value==='number'||['x','y','w','h','spacing','radius','fontSize','lineHeight','letterSpacing'].includes(key),color=key==='bg'||key==='color';return <label className={key==='fontFamily'||key==='border'||key==='shadow'?'wide':''} key={key} title={!state.editable?'Read only: this property is unavailable on part of the selection or belongs to the library.':undefined}>
 {color&&typeof state.value==='string'&&<i className="design-color-swatch" style={{backgroundColor:state.value}}/>}{(section!=='Typography'||key==='lineHeight'||key==='letterSpacing')&&<span aria-hidden={section==='Typography'}>{section==='Typography'?(key==='lineHeight'?'↕':'↔'):FIELD_LABELS[key]}</span>}{section==='Typography'&&key==='fontWeight'?<select aria-label="Typography Weight" disabled={!state.editable} value={draft[key]??String(state.value??'')} onChange={e=>setDraft({...draft,[key]:e.target.value})}><option value="">Mixed</option>{Object.entries({'100':'Thin','200':'Extra Light','300':'Light','400':'Regular','500':'Medium','600':'Semibold','700':'Bold','800':'Extra Bold','900':'Black',...(state.value&&!/^\d00$/.test(String(state.value))?{[String(state.value)]:String(state.value)}:{})}).map(([value,name])=><option key={value} value={value}>{name}</option>)}</select>:<><input aria-label={section+' '+FIELD_LABELS[key]} type={numeric?'number':'text'} step="any" readOnly={!state.editable} list={section==='Typography'&&key==='fontFamily'?'typography-fonts':undefined} placeholder={state.mixed?'Mixed':key==='lineHeight'?'Auto':'Not recorded'} value={draft[key]??(state.value===undefined?'':String(state.value))} onChange={e=>setDraft({...draft,[key]:e.target.value})}/>{key==='fontFamily'&&<datalist id="typography-fonts">{['Inter, sans-serif','Arial','Georgia','Helvetica','Times New Roman','monospace'].map(font=><option key={font} value={font}/>)}</datalist>}</>}{!state.editable&&<small>Read only</small>}
 </label>;})}
 {section==='Typography'&&([
  ['textAlign','Horizontal text alignment',[['left',AlignLeft],['center',AlignCenter],['right',AlignRight]]],
  ['textVerticalAlign','Vertical text alignment',[['top',ArrowUpToLine],['middle',AlignVerticalJustifyCenter],['bottom',ArrowDownToLine]]],
 ] as const).map(([key,label,options])=>{
  const state=selectedProperty(ids,nodes,key);
  return <div key={key} className="design-text-alignment" role="group" aria-label={label}>
   {options.map(([value,Icon])=><button key={value} type="button" aria-label={`Align text ${value}`} title={`Align text ${value}`} disabled={!state.editable} aria-pressed={(draft[key]??state.value)===value} onClick={()=>setDraft({...draft,[key]:value})}><Icon size={14}/></button>)}
  </div>;
 })}</div>
 {Object.keys(draft).length>0&&<div className="design-field-actions"><button type="submit">Preview changes</button><button type="button" onClick={()=>setDraft({})}>Reset</button></div>}
 </form>:<p className="design-unavailable">{section==='Typography'?'Text styles are available on nested layers.':`No ${section.toLowerCase()} properties recorded.`}</p>}
 {tools}{preview}
 </details>;
}
