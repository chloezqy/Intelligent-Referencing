import { ScopeLevel } from './types';
export type UserId = 'A' | 'B';
export type ReferenceIntent = 'Review' | 'Compare' | 'Help' | 'Look at this';
export interface SharedReference {
  id: string; sourceUser: UserId; targetUser: UserId;
  elementIds: string[]; exemplarIds: string[]; scope: ScopeLevel;
  label: string; intent: ReferenceIntent; message: string; createdAt: string;
  status: 'open' | 'reviewed';
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
export interface ComparisonContext {snapshotId:string;selections:Record<UserId,SelectionPresence>;purpose:string;interpretation:import('./comparisonContext').ContextInterpretation}

export interface AttentionRequest {id:string;sourceUser:UserId;targetUser:UserId;createdAt:string;viewedAt?:string}
