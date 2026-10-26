import { ScopeLevel } from './types';
export type UserId = 'A' | 'B';
export type ReferenceIntent = 'Review' | 'Compare' | 'Help' | 'Look at this';
export interface SharedReference {
  simulated?: boolean;
  id: string; sourceUser: UserId; targetUser: UserId;
  elementIds: string[]; exemplarIds: string[]; scope: ScopeLevel;
  label: string; intent: ReferenceIntent; message: string; createdAt: string;
  status: 'open' | 'reviewed';
  mentions?:UserId[];
  notificationRecipients?:UserId[];
  attention?:AttentionRequest[];
  comparison?: ComparisonContext;
  research?: { level: 4 | 5; attemptId: string };
  reviewedAt?: string;
  archivedAt?: string;
  archivedBy?: UserId;
  activity?: { id: string; userId: UserId; kind: 'opened' | 'located'; elementIds: string[]; at: string }[];
  responses: { id: string; userId: UserId; message: string; createdAt: string }[];
}
export interface RoomSnapshot {
  code: string; documentId: string; revision: number;
  members: { userId: UserId; online: boolean }[];
  references: SharedReference[];
}
export interface Session { code: string; userId: UserId; token: string }
export interface ReferenceDraft { comparison?:ComparisonContext; elementIds: string[]; exemplarIds: string[]; scope: ScopeLevel; label: string; research?: { level: 4 | 5; attemptId: string } }
export const DOCUMENT_ID = 'mobile-commerce-v1';
export const INTENTS: ReferenceIntent[] = ['Review', 'Compare', 'Help', 'Look at this'];

export interface CollaboratorCursor { userId:UserId; x:number; y:number; visible:boolean; at:number }
export interface SelectionPresence {userId:UserId;elementIds:string[];exemplarIds:string[];scope:ScopeLevel;method:'conventional'|'smart-ref';revision:number}
export interface ComparisonContext {snapshotId:string;selections:Record<UserId,SelectionPresence>;purpose:string;designReference?:DesignReference;interpretation:import('./comparisonContext').ContextInterpretation}

export interface AttentionRequest {id:string;sourceUser:UserId;targetUser:UserId;createdAt:string;viewedAt?:string}


/** Completed references belong in Archived without rewriting their review evidence. */
export function referenceLists(references:SharedReference[]){
 const archived=(reference:SharedReference)=>!!reference.archivedAt||reference.status==='reviewed';
 return {active:references.filter(reference=>!archived(reference)),archived:references.filter(archived)};
}


export const DESIGN_REFERENCE_PURPOSE='Use as a design reference';
export const DESIGN_REFERENCE_PROPERTIES={typography:'Typography',spacing:'Spacing',colors:'Colors',cornerRadius:'Corner radius'} as const;
export interface DesignReference {direction:{referenceUser:'A';targetUser:'B'};properties:(keyof typeof DESIGN_REFERENCE_PROPERTIES)[]}
/** Optional, backwards-compatible comparison intent; IDs remain in the frozen selections. */
export function validateDesignReference(purpose:string,value:unknown,selections:ComparisonContext['selections']):DesignReference|undefined {
 if(purpose!==DESIGN_REFERENCE_PURPOSE)return undefined;
 const input=value as DesignReference|undefined;
 if(!input||input.direction?.referenceUser!=='A'||input.direction?.targetUser!=='B'||!selections.A.elementIds.length||!selections.B.elementIds.length||!Array.isArray(input.properties)||!input.properties.length||input.properties.length>4||new Set(input.properties).size!==input.properties.length||!input.properties.every(key=>Object.hasOwn(DESIGN_REFERENCE_PROPERTIES,key)))throw new Error('Choose at least one valid design reference property for User A → User B.');
 return {direction:{referenceUser:'A',targetUser:'B'},properties:[...input.properties]};
}
