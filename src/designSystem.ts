import type {UIElement} from './types.js';
export const COLORS = {Primary:'#0d99ff',Secondary:'#0f766e',Surface:'#f8fafc','Text Primary':'#142836','Text Secondary':'#64748b',Border:'#cbd5e1','On Primary':'#ffffff'};
export const TYPOGRAPHY = {
 Heading:{fontFamily:'Inter, sans-serif',fontSize:24,fontWeight:'700',lineHeight:1.2,letterSpacing:-.4,color:COLORS['Text Primary']},
 Body:{fontFamily:'Inter, sans-serif',fontSize:13,fontWeight:'600',lineHeight:1.4,letterSpacing:0,color:COLORS['Text Primary']},
 Caption:{fontFamily:'Inter, sans-serif',fontSize:11,fontWeight:'400',lineHeight:1.4,letterSpacing:.1,color:COLORS['Text Secondary']},
 'Button Label':{fontFamily:'Inter, sans-serif',fontSize:11,fontWeight:'600',lineHeight:1.2,letterSpacing:.2,color:COLORS['On Primary']},
 Price:{fontFamily:'Inter, sans-serif',fontSize:14,fontWeight:'700',lineHeight:1.3,letterSpacing:0,color:COLORS.Primary},
};
export const COMPONENT_STYLES = {
 'Primary Button':{bg:COLORS.Primary,color:COLORS['On Primary'],radius:10,border:'1px solid transparent',...TYPOGRAPHY['Button Label']},
 'Secondary Button':{bg:'#ffffff',color:COLORS.Primary,radius:10,border:`1px solid ${COLORS.Primary}`,fontWeight:'600'},
 'Product Card':{bg:COLORS.Surface,radius:12,border:`1px solid ${COLORS.Border}`,shadow:'0 3px 10px #14283618',spacing:16},
 'Filter Chip':{bg:'#eff8fe',color:COLORS.Primary,radius:12,border:'1px solid #c9e7fc'},
 'Input Field':{bg:COLORS.Surface,color:COLORS['Text Primary'],radius:10,border:`1px solid ${COLORS.Border}`},
};
/** These samples are also the authoritative style sources consumed by the editor. */
export const PRODUCT_IMAGE_STYLE={bg:'#e2f2fd',radius:10};
export function buildLibrary():UIElement[]{
 const x=80,y=1120,screen='Design System' as const;
 const frame:UIElement={id:'screen-design-system',type:'screen',x,y,w:1420,h:1,label:'Design System · Library',screen,bg:'#edf3f9',radius:20,library:true};
 const nodes:UIElement[]=[frame];let section=frame.id;
 const add=(n:Omit<UIElement,'parent'|'screen'|'library'> & {parent?:string})=>nodes.push({...n,parent:n.parent||section,screen,library:true});
 const label=(id:string,text:string,dx:number,dy:number,w=330,size=12,color=COLORS['Text Secondary'],h=24,weight='400')=>add({id,type:'text',x:x+dx,y:y+dy,w,h,label:text,text,fontFamily:'Inter, sans-serif',fontSize:size,fontWeight:weight,color,textAlign:'left',lineHeight:1.3});
 const panel=(id:string,dx:number,dy:number,w:number,h:number)=>{add({id,parent:frame.id,type:'group',x:x+dx,y:y+dy,w,h,label:id.replace('ds-panel-','')+' specimens',bg:'#ffffff',radius:16,border:'1px solid #dce5f0',shadow:'0 2px 8px #14283606'});section=id;};
 // Brand masthead: separate from the actual token specimens below.
 add({id:'ds-masthead',type:'group',x:x+28,y:y+28,w:1364,h:156,label:'Studio Blue / Brand masthead',bg:'#142f4d',radius:18});section='ds-masthead';
 label('ds-eyebrow','NORDIC LIVING / DESIGN FOUNDATIONS',56,46,800,11,'#91cfff',20,'600');
 label('ds-heading','Studio Blue',56,76,820,36,'#ffffff',48,'700');
 label('ds-intro','A clear, confident system for everyday commerce.',56,132,1000,14,'#c2d6eb',26);
 add({id:'ds-version',type:'badge',x:x+1192,y:y+56,w:168,h:30,label:'Library edition',text:'CORE LIBRARY / 01',bg:'#23486c',color:'#d8eeff',radius:15,fontSize:10,fontWeight:'600'});
 // Palette is a full-width row of generously sized, named swatches.
 panel('ds-panel-palette',28,208,1364,208);
 label('ds-colors-heading','01 / Color palette',56,228,600,17,COLORS['Text Primary'],28,'600');
 label('ds-palette-caption','One accent. Calm surfaces. Clear hierarchy.',800,230,550,12);
 Object.entries(COLORS).forEach(([name,bg],i)=>{
  const dx=56+i*188;
  add({id:`ds-color-${i}`,type:'rect',x:x+dx,y:y+278,w:164,h:64,label:`Color / ${name}`,bg,border:`1px solid ${COLORS.Border}`,radius:10,token:`Color / ${name}`});
  label(`ds-color-name-${i}`,name,dx,350,164,12,COLORS['Text Primary'],20,'600');label(`ds-color-value-${i}`,bg,dx,376,164,11);
 });
 // Type specimens retain the exact exported token values.
 panel('ds-panel-type',28,440,404,636);
 label('ds-type-heading','02 / Typography',52,462,356,17,COLORS['Text Primary'],28,'600');
 label('ds-type-caption','Inter / Purposeful at every scale',52,494,356,11);
 Object.entries(TYPOGRAPHY).forEach(([name,style],i)=>{
  const dy=540+i*94;
  label(`ds-type-label-${i}`,name.toUpperCase(),52,dy-20,356,10,COLORS['Text Secondary'],18,'600');
  add({id:`ds-type-${i}`,type:'text',x:x+52,y:y+dy,w:356,h:38,label:`Typography / ${name}`,text:name==='Heading'?'Less, but better.':name==='Caption'?'Considered details, quietly useful.':name==='Price'?'$289.00':name==='Button Label'?'Explore the collection':'Designed for everyday living.',...style,textAlign:'left',...(name==='Button Label'?{bg:COLORS.Primary,radius:8}:{}),token:`Typography / ${name}`});
  label(`ds-type-meta-${i}`,`${style.fontSize}px · ${style.fontWeight} weight · ${style.lineHeight} line height`,52,dy+40,356,10);
 });
 // A complete component, composed from the same real source nodes used by matching.
 panel('ds-panel-card',456,440,448,636);
 label('ds-card-heading','03 / Product card',480,462,400,17,COLORS['Text Primary'],28,'600');
 label('ds-card-caption','A complete component, built from the foundations.',480,494,400,11);
 const cardId='ds-product-card';
 add({id:cardId,type:'card',x:x+536,y:y+540,w:288,h:340,label:'Product Card / Default',component:'ProductCard',role:'card',...COMPONENT_STYLES['Product Card']});
 add({id:`${cardId}-img`,parent:cardId,type:'image',x:x+552,y:y+556,w:256,h:152,label:'Library Product Image',role:'productImage',text:'Product image',...PRODUCT_IMAGE_STYLE});
 add({id:`${cardId}-title`,parent:cardId,type:'text',x:x+552,y:y+724,w:256,h:26,label:'Library Product Title',role:'productTitle',text:'Arc Lounge Chair',...TYPOGRAPHY.Body,textAlign:'left'});
 add({id:'ds-card-description',parent:cardId,type:'text',x:x+552,y:y+752,w:256,h:20,label:'Library card description',text:'Natural oak · Canvas upholstery',...TYPOGRAPHY.Caption,textAlign:'left'});
 add({id:`${cardId}-price`,parent:cardId,type:'text',x:x+552,y:y+782,w:256,h:24,label:'Library Price',role:'price',text:'$289.00',...TYPOGRAPHY.Price,textAlign:'left'});
 add({id:`${cardId}-cta`,parent:cardId,type:'button',x:x+552,y:y+824,w:256,h:40,label:'Library Primary Button',role:'primaryCTA',text:'Add to Bag',...COMPONENT_STYLES['Primary Button']});
 label('ds-card-fill',`Surface ${COLORS.Surface} / Border ${COLORS.Border}`,480,914,400,11);
 label('ds-card-metrics','12px corners / 16px inset / Soft elevation',480,946,400,12,COLORS['Text Primary'],24,'500');
 label('ds-image-note','The image remains content; its shape follows the system.',480,982,400,11);
 label('ds-content-note','Body titles / Price values / Caption details',480,1018,400,11);
 // Controls use the same grid and a clear specimen/caption rhythm.
 panel('ds-panel-controls',928,440,464,360);
 label('ds-components-heading','04 / Controls',952,462,416,17,COLORS['Text Primary'],28,'600');
 Object.entries(COMPONENT_STYLES).filter(([name])=>name!=='Product Card').forEach(([name,style],i)=>{
  const dy=512+i*68;
  add({id:`ds-component-${i}`,type:name==='Input Field'?'input':name==='Filter Chip'?'chip':'button',x:x+952,y:y+dy,w:416,h:36,label:`Component / ${name}`,text:name==='Primary Button'?'Continue shopping':name==='Secondary Button'?'Save to wishlist':name==='Filter Chip'?'In stock':'Search the collection',...style,fontFamily:'Inter, sans-serif',fontSize:11});
  label(`ds-component-meta-${i}`,`${name} / ${style.radius}px radius`,952,dy+40,416,10);
 });
 // Compact token tiles make shape, inset and elevation visible rather than just listed.
 panel('ds-panel-tokens',928,824,464,252);
 label('ds-tokens-heading','05 / Shape & spacing',952,846,416,17,COLORS['Text Primary'],28,'600');
 add({id:'ds-property-0',type:'rect',x:x+952,y:y+892,w:128,h:64,label:'Radius / Medium · 12px',text:'12 px',bg:COLORS.Surface,radius:12,fontSize:22,color:COLORS['Text Primary'],fontWeight:'600'});
 label('ds-radius-note','CORNERS\n12px cards / 10px controls',952,972,128,10,COLORS['Text Secondary'],56);
 add({id:'ds-property-1',type:'rect',x:x+1096,y:y+892,w:128,h:64,label:'Spacing / Default · 16px',bg:COLORS.Surface,spacing:16,radius:8});
 add({id:'ds-spacing-inner',parent:'ds-property-1',type:'rect',x:x+1112,y:y+908,w:96,h:32,label:'Spacing inset illustration',text:'16 px',bg:'#d5ecff',fontSize:12,color:COLORS.Primary,radius:4});
 label('ds-spacing-note','INSET\n16px content spacing',1096,972,128,10,COLORS['Text Secondary'],56);
 add({id:'ds-property-2',type:'rect',x:x+1240,y:y+892,w:128,h:64,label:'Shadow / Small',text:'Soft',bg:COLORS.Surface,radius:12,shadow:COMPONENT_STYLES['Product Card'].shadow,fontSize:14,color:COLORS['Text Primary']});
 label('ds-shadow-note','ELEVATION\nSubtle depth, clear edges',1240,972,128,10,COLORS['Text Secondary'],56);
 frame.h=Math.ceil(Math.max(...nodes.slice(1).map(n=>n.y+n.h))-y+28);
 return nodes;
}
