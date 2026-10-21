import { useEffect, useState } from 'react';
import { ApiResponseError, readApiJson, requireEventStream, parseRoomEvent } from './apiResponse';
import { CollaboratorCursor, ReferenceDraft, ReferenceIntent, RoomSnapshot, Session } from './collaboration';
export function requestId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16)); bytes[6] = bytes[6] & 15 | 64; bytes[8] = bytes[8] & 63 | 128;
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
const token = () => [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, '0')).join('');
const roomFromUrl = () => new URL(location.href).searchParams.get('room') || '';
export function useCollaboration() {
  const [session, setSession] = useState<Session | null>(null);
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [connected, setConnected] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [cursors,setCursors]=useState<Partial<Record<'A'|'B',CollaboratorCursor>>>({});
  const [initialCode] = useState(roomFromUrl);
  async function api(path: string, body?: unknown, identity = session) {
    const response = await fetch(`/api${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(identity ? { Authorization: `Bearer ${identity.token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    return readApiJson(response, `/api${path}`);
  }
  function remember(result: Record<string, any>) {
    const identity: Session = { code: result.code, userId: result.userId, token: result.token };
    if (!identity || !/^[a-f0-9]{24}$/.test(identity.code) || !['A','B'].includes(identity.userId) || typeof identity.token !== 'string' || identity.token.length < 40) throw new Error('The room server returned an invalid session. Check the backend configuration.');
    try { sessionStorage.setItem(`sr-room-${identity.code}`, JSON.stringify(identity)); localStorage.setItem(`sr-room-${identity.code}`, JSON.stringify(identity)); } catch { /* The live connection still works when browser storage is unavailable. */ }
    const url = new URL(location.href); url.searchParams.set('room', identity.code); url.searchParams.delete('join'); history.replaceState(null, '', url);
    setSession(identity); setRoom(null); setError('');
  }
  useEffect(() => {
    if (!initialCode) return;
    try {
      const invitation = new URL(location.href).searchParams.has('join');
      const saved = sessionStorage.getItem(`sr-room-${initialCode}`) || (!invitation ? localStorage.getItem(`sr-room-${initialCode}`) : null);
      if (saved) { const identity = JSON.parse(saved); if (identity.code === initialCode && ['A','B'].includes(identity.userId) && typeof identity.token === 'string') setSession(identity); }
    } catch { setError('Browser storage is unavailable. Keep this tab open to retain your identity.'); }
  }, []);
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController(); let retry = 1000;
    async function connect() {
      while (!controller.signal.aborted) {
        const attempt = new AbortController();
        const stop = () => attempt.abort();
        controller.signal.addEventListener('abort', stop, { once: true });
        let watchdog = setTimeout(stop, 15000);
        const alive = () => { clearTimeout(watchdog); watchdog = setTimeout(stop, 45000); };
        try {
          const endpoint = `/api/rooms/${session.code}/events`;
          const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${session.token}` }, signal: attempt.signal });
          await requireEventStream(response, endpoint);
          setConnected(true); setError(''); retry = 1000; alive();
          const reader = response.body!.getReader(), decoder = new TextDecoder(); let buffer = '';
          while (!controller.signal.aborted) {
            const { value, done } = await reader.read(); if (done) throw new Error('Connection closed. Reconnecting…');
            alive(); buffer += decoder.decode(value, { stream: true }); let index: number;
            while ((index = buffer.indexOf('\n\n')) !== -1) {
              const event = buffer.slice(0,index); buffer = buffer.slice(index+2);
              const data = event.split('\n').find(line => line.startsWith('data: '));
              if (data && !controller.signal.aborted) {
                if(event.split('\n').includes('event: cursor')){
                  const cursor=JSON.parse(data.slice(6));
                  if(['A','B'].includes(cursor.userId)&&Number.isFinite(cursor.x)&&Number.isFinite(cursor.y)&&typeof cursor.visible==='boolean'&&Number.isFinite(cursor.at))setCursors(previous=>({...previous,[cursor.userId]:cursor}));
                }else setRoom(parseRoomEvent(data.slice(6), endpoint));
              }
            }
          }
        } catch (err) {
          if (controller.signal.aborted) return;
          if (err instanceof ApiResponseError && [401,404].includes(err.status) && err.contentType === 'application/json') { setError(err.message); return; }
          setError(attempt.signal.aborted ? 'Connection lost. Reconnecting…' : err instanceof Error ? err.message : 'Connection lost. Reconnecting…');
        } finally { clearTimeout(watchdog); attempt.abort(); controller.signal.removeEventListener('abort', stop); if (!controller.signal.aborted) setConnected(false); }
        await new Promise<void>(resolve => { const finish = () => { clearTimeout(timer); controller.signal.removeEventListener('abort', finish); resolve(); }; const timer = setTimeout(finish, retry); controller.signal.addEventListener('abort', finish, { once: true }); });
        retry = Math.min(10000, retry * 2);
      }
    }
    connect();
    return () => { controller.abort(); setConnected(false); setCursors({}); };
  }, [session]);
  async function action<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(true); setError(''); try { return await fn(); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to connect.'); return undefined; } finally { setBusy(false); }
  }
  return { session, room, cursors, connected, busy, error, initialCode,
    cursor: async (x:number,y:number,visible:boolean) => {if(!session||!connected)return;try{await api(`/rooms/${session.code}/cursor`,{x,y,visible});}catch{/* Ephemeral presence never interrupts reference actions. */}},
    create: () => action(async () => { const identity = await api('/rooms', {}, null); remember(identity); return identity; }),
    join: (input: string) => action(async () => {
      let code = input.trim(); try { if (code.includes('://')) code = new URL(code).searchParams.get('room') || ''; } catch { /* Validate below. */ }
      if (!/^[a-f0-9]{24}$/.test(code)) throw new Error('Paste a room link or its 24-character room code.');
      let recovery = token(); try { recovery = sessionStorage.getItem(`sr-join-${code}`) || recovery; sessionStorage.setItem(`sr-join-${code}`, recovery); } catch { /* Retry identity is held in this request. */ }
      const identity = await api(`/rooms/${code}/join`, { token: recovery }, null); remember(identity); return identity;
    }),
    share: (draft: ReferenceDraft, intent: ReferenceIntent, message: string, id: string) => action(async () => {
      if (!session || !connected) throw new Error('Reconnect before sharing.');
      return api(`/rooms/${session.code}/references`, { ...draft, intent, message, requestId: id });
    }),
    respond: (id: string, message: string, responseId: string) => action(async () => { if (!session || !connected) throw new Error('Reconnect before responding.'); return api(`/rooms/${session.code}/references/${id}/responses`, { message, requestId: responseId }); }),
    review: (id: string) => action(async () => { if (!session || !connected) throw new Error('Reconnect before reviewing.'); return api(`/rooms/${session.code}/references/${id}/review`, {}); }),
    activity: (id: string, kind: 'opened' | 'located', elementIds: string[] = []) => action(async () => { if (!session || !connected) throw new Error('Reconnect before opening or locating a reference.'); return api(`/rooms/${session.code}/references/${id}/activity`, { kind, elementIds }); }),
    archive: (id: string, archived: boolean) => action(async () => { if (!session || !connected) throw new Error('Reconnect before archiving or restoring.'); return api(`/rooms/${session.code}/references/${id}/archive`, { archived }); }),
    invitation: session ? `${location.origin}/?room=${session.code}&join=1` : '',
  };
}
