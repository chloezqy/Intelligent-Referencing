import type {Patch} from './editing';
export type PreviewAppearance='before'|'after';

/** Transient display only. The owner retains the proposal and commits its patches. */
export function createPreviewComparison(publish:(patches:Patch[])=>void,changed:(mode:PreviewAppearance)=>void,spotlight:(ids:string[])=>void=()=>{}){
 let active=true,patches:Patch[]=[],pointer:{mode:PreviewAppearance;ids:string[]}|null=null,focus:{mode:PreviewAppearance;ids:string[]}|null=null;
 const show=()=>{if(!active)return;const interaction=pointer??focus,mode=interaction?.mode??'after';changed(mode);publish(mode==='before'?[]:patches);spotlight(interaction?.ids??[]);};
 return {
  update(next:Patch[]){patches=next;pointer=null;focus=null;spotlight([]);},
  enter(mode:PreviewAppearance,ids:string[]=[]){if(active){pointer={mode,ids};show();}},
  leave(){if(active){pointer=null;show();}},
  focus(mode:PreviewAppearance,ids:string[]=[]){if(active){pointer=null;focus={mode,ids};show();}},
  blur(){if(active){focus=null;show();}},
  close(){if(!active)return;active=false;pointer=null;focus=null;spotlight([]);},
 };
}
