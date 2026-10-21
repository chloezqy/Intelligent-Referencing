import { randomBytes, createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { ComparisonContext, DOCUMENT_ID, INTENTS, RoomSnapshot, SharedReference, UserId } from '../src/collaboration';
import { MOCK_NODES } from '../src/data';
interface Member { userId: UserId; tokenHash: string }
interface Room { code: string; documentId: string; revision: number; members: Member[]; references: SharedReference[] }
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const unique = (value: unknown, max: number) => {
  if (!Array.isArray(value) || value.length > max || !value.every(x => typeof x === 'string')) throw new ApiError(400, 'Invalid element list.');
  return [...new Set(value)] as string[];
};
const text = (value: unknown, max: number) => { if (typeof value !== 'string' || value.length > max) throw new ApiError(400, 'Invalid text length.'); return value.trim(); };
export class RoomStore {
  private rooms: Record<string, Room> = {};
  private validIds = new Set(MOCK_NODES.filter(n => n.type !== 'screen').map(n => n.id));
  constructor(private file: string) {
    if (existsSync(file)) {
      const saved = JSON.parse(readFileSync(file, 'utf8'));
      if (saved.version !== 1 || !saved.rooms || typeof saved.rooms !== 'object') throw new Error('Unsupported room store format.');
      this.rooms = saved.rooms;
    }
  }
  private transaction<T>(change: (rooms: Record<string, Room>) => T): T {
    const next = structuredClone(this.rooms), result = change(next);
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(`${this.file}.tmp`, JSON.stringify({ version: 1, rooms: next }), { mode: 0o600 });
    renameSync(`${this.file}.tmp`, this.file);
    this.rooms = next;
    return result;
  }
  private room(code: string, rooms = this.rooms): Room { const r = rooms[code]; if (!r) throw new ApiError(404, 'Room not found. Check the room code.'); return r; }
  authorize(code: string, token: string): UserId {
    const member = this.room(code).members.find(m => m.tokenHash === hash(token));
    if (!member) throw new ApiError(401, 'This room requires your original browser identity. Join with an invitation or reopen it in your original browser.');
    return member.userId;
  }
  create() {
    if (Object.keys(this.rooms).length >= 500) throw new ApiError(503, 'Room capacity reached.');
    const code = randomBytes(12).toString('hex'), token = randomBytes(32).toString('base64url');
    this.transaction(rooms => { rooms[code] = { code, documentId: DOCUMENT_ID, revision: 1, members: [{ userId: 'A', tokenHash: hash(token) }], references: [] }; });
    return { code, token, userId: 'A' as const };
  }
  join(code: string, token: string) {
    // A client-generated high-entropy recovery token also makes retrying a join idempotent.
    if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) throw new ApiError(400, 'Invalid join identity.');
    const r = this.room(code), existing = r.members.find(m => m.tokenHash === hash(token));
    if (existing) return { code, token, userId: existing.userId };
    if (r.members.length >= 2) throw new ApiError(409, 'This room already has two users. Reopen it in a browser that has already joined.');
    this.transaction(rooms => { const room = this.room(code, rooms); room.members.push({ userId: 'B', tokenHash: hash(token) }); room.revision++; });
    return { code, token, userId: 'B' as const };
  }
  snapshot(code: string, online: (user: UserId) => boolean): RoomSnapshot {
    const r = this.room(code);
    return { code, documentId: r.documentId, revision: r.revision, members: r.members.map(m => ({ userId: m.userId, online: online(m.userId) })), references: structuredClone(r.references) };
  }
  share(code: string, user: UserId, body: any, comparison?:ComparisonContext) {
    const elementIds = unique(body.elementIds, 182), exemplarIds = unique(body.exemplarIds, 182);
    if (!elementIds.length || elementIds.some(id => !this.validIds.has(id)) || exemplarIds.some(id => !elementIds.includes(id))) throw new ApiError(400, 'Choose existing objects; exemplars must belong to the reference.');
    if (!INTENTS.includes(body.intent) || !['exemplars', 'screen', 'document', 'flow'].includes(body.scope)) throw new ApiError(400, 'Invalid intent or scope.');
    const label = text(body.label, 300), message = text(body.message, 2000);
    if (body.research && (user !== 'A' || ![4,5].includes(body.research.level) || !/^[a-f0-9-]{36}$/i.test(body.research.attemptId || ''))) throw new ApiError(400, 'Invalid research attempt.');
    const research = body.research ? { level: body.research.level as 4 | 5, attemptId: body.research.attemptId as string } : undefined;
    if (!/^[a-f0-9-]{36}$/i.test(body.requestId || '')) throw new ApiError(400, 'Invalid request ID.');
    const r = this.room(code), targetUser = user === 'A' ? 'B' : 'A';
    if (!r.members.some(m => m.userId === targetUser)) throw new ApiError(409, 'Invite the other user before sharing.');
    const duplicate = r.references.find(ref => ref.id === body.requestId);
    if (duplicate) { if (duplicate.sourceUser !== user) throw new ApiError(409, 'Request ID already used.'); return duplicate.id; }
    if (r.references.length >= 200) throw new ApiError(409, 'This prototype supports up to 200 references per room.');
    this.transaction(rooms => { const room = this.room(code, rooms); room.references.push({ id: body.requestId, sourceUser: user, targetUser, elementIds, exemplarIds, scope: body.scope, label, intent: body.intent, message, createdAt: new Date().toISOString(), status: 'open', responses: [], activity: [], ...(comparison?{comparison}:{}), ...(research ? { research } : {}) }); room.revision++; });
    return body.requestId;
  }
  respond(code: string, user: UserId, id: string, body: any) {
    const message = text(body.message, 2000);
    if (!message || !/^[a-f0-9-]{36}$/i.test(body.requestId || '')) throw new ApiError(400, 'Write a response.');
    this.transaction(rooms => { const room = this.room(code, rooms), ref = room.references.find(r => r.id === id); if (!ref) throw new ApiError(404, 'Reference not found.'); if (ref.archivedAt) throw new ApiError(409, 'Restore this reference before responding.'); if (ref.responses.some(r => r.id === body.requestId)) return; if (ref.responses.length >= 100) throw new ApiError(409, 'Response limit reached.'); ref.responses.push({ id: body.requestId, userId: user, message, createdAt: new Date().toISOString() }); room.revision++; });
  }
  review(code: string, user: UserId, id: string) {
    this.transaction(rooms => { const room = this.room(code, rooms), ref = room.references.find(r => r.id === id); if (!ref) throw new ApiError(404, 'Reference not found.'); if (ref.targetUser !== user) throw new ApiError(403, 'Only the recipient can mark a reference reviewed.'); if (ref.archivedAt) throw new ApiError(409, 'Restore this reference before reviewing.'); if (ref.status !== 'reviewed') { ref.status = 'reviewed'; ref.reviewedAt = new Date().toISOString(); room.revision++; } });
  }
  activity(code: string, user: UserId, id: string, body: any) {
    if (!['opened', 'located'].includes(body.kind)) throw new ApiError(400, 'Invalid reference activity.');
    const ids = unique(body.elementIds || [], 182);
    this.transaction(rooms => {
      const room = this.room(code, rooms), ref = room.references.find(r => r.id === id);
      if (!ref) throw new ApiError(404, 'Reference not found.');
      if (ref.archivedAt) throw new ApiError(409, 'Restore this reference before opening or locating its targets.');
      if (ids.some(id => !ref.elementIds.includes(id)) || (body.kind === 'located' && !ids.length)) throw new ApiError(400, 'Navigate to existing reference targets.');
      const activity = ref.activity ||= [];
      // Idempotent evidence bounded by users × targets, including reconnect retries.
      const previous = activity.filter(e => e.userId === user && e.kind === body.kind);
      if (body.kind === 'opened' ? previous.length > 0 : ids.every(id => previous.some(e => e.elementIds.includes(id)))) return;
      activity.push({ id: randomUUID(), userId: user, kind: body.kind, elementIds: body.kind === 'opened' ? [] : ids, at: new Date().toISOString() });
      room.revision++;
    });
  }

  archive(code: string, user: UserId, id: string, archived: unknown) {
    if (typeof archived !== 'boolean') throw new ApiError(400, 'Specify whether to archive or restore the reference.');
    this.transaction(rooms => {
      const room = this.room(code, rooms), ref = room.references.find(r => r.id === id);
      if (!ref) throw new ApiError(404, 'Reference not found.');
      if (!!ref.archivedAt === archived) return;
      if (archived) { ref.archivedAt = new Date().toISOString(); ref.archivedBy = user; }
      else { delete ref.archivedAt; delete ref.archivedBy; }
      room.revision++;
    });
  }

}
