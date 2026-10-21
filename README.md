# Smart Reference — shared referencing

Two actual browser clients share object-anchored references, intent, notes, responses, and review status. Canvas camera and selection stay local. Gesture interpretation uses geometric intersection and authored semantic metadata; it does not call an AI model. The commerce document is read-only.

## Run

Use Node.js 22 or 24 (tested on Node 24).

```bash
npm ci
npm run dev
```

Open http://localhost:3000. This now starts **one Express server** serving both Vite and `/api`; do not start a separate Vite-only server for collaboration. `PORT` changes the actual server port. Port conflicts fail visibly rather than silently opening a different port.

1. Open **References** or **Create / Join room**. Create a room as A.
2. Copy the invitation. Open it in another browser/profile or on another computer, then join as B.
3. Gesture (S), inspect scope/alternatives, and correct with Select (V) + Shift-click. Choose **Share Reference**. Set Review, Compare, Help, or Look at this, plus an optional note.
4. B receives an inbox item without refreshing. Opening it highlights its objects but never moves the camera. **Locate referenced elements** moves the camera explicitly.
5. B responds or marks it reviewed; A sees those changes live.
6. Refresh either client: its identity and the server-saved references/responses recover.

A second tab in the same browser can also test B using the invitation URL (`join=1`). Each tab retains its own identity via sessionStorage. For returning after closing tabs, use separate browsers/profiles: localStorage restores that browser's last identity in a room. Clearing browser storage loses that identity; a room never silently replaces an existing participant.

## Two computers

Both computers must access **the same server**. Start the app on one machine, allow port 3000 through its firewall, and open `http://<server-LAN-IP>:3000` on both machines. Copy the invitation from that address. A `localhost` invitation points to the recipient's own computer and cannot be used across computers. The invitation is also visible in a selectable field when clipboard APIs are unavailable over LAN HTTP.

For different networks, deploy this Node application behind HTTPS to a host that supports long-lived streamed responses and a writable persistent volume. Set `PORT` to the host's port and `ROOM_DATA_DIR` to the mounted volume path. Configure the proxy not to buffer `/api/rooms/*/events` and allow long-lived responses. No Supabase credentials or privileged frontend keys are needed.

```bash
npm ci
npm run build
npm start
```

The server runtime currently uses `tsx`, so install development dependencies as well as production dependencies. `npm run preview` is Vite's static preview and **does not start the room backend**; use `npm start` for a complete production preview.

## Architecture

- `src/collaboration.ts`: DOM-independent shared reference/session contract; existing element IDs remain authoritative.
- `src/useCollaboration.ts`: authenticated HTTP commands and reconnecting streamed snapshots. No storage-event/BroadcastChannel simulation.
- `server/store.ts`: validates object IDs/intents, assigns A/B server-side, enforces recipient review rights, and persists atomic JSON snapshots.
- `server/app.ts`: room API, authenticated SSE connections, connection-derived presence, request limits, same-origin browser checks.
- `server/index.ts`: one-origin Vite development server or static production server.
- `CollaborationPanel.tsx`: room creation/join, frozen draft, reference inbox/details, replies, review.
- `Canvas.tsx`: existing gesture and local selection; persistent ID-resolved pins and independent shared highlighting.

Rooms contain exactly two identity slots. The invitation permits the second person to claim B. Each participant has an opaque bearer token, sent in an Authorization header (not an invitation URL); only a hash is stored on the server. Snapshot broadcasts never contain tokens. Request IDs make sharing/joining/responding retry-safe. References are immutable target snapshots; replacing a draft's targets is explicit. Received events never synchronize viewport transforms or arbitrary element modifications.

## Persistence and deployment limits

Rooms/references/responses survive server restart in `ROOM_DATA_DIR/rooms.json` (default `.data/rooms.json`, ignored by Git). Browser storage is used only to recover identity, not as the shared source of truth. Back up the data directory. If it is missing or ephemeral, rooms do not survive a host restart/redeploy.

This is a single-process prototype with bounded rooms/references/responses, not a horizontally scalable collaboration service. Run **one server process/replica** against its data directory. For multi-instance hosting, replace the store with a transactional database and the broadcaster with a shared realtime service (for example, Postgres + Supabase Realtime). That migration would require backend configuration and authorization policies; it is not silently provided here.

Use HTTPS outside a trusted LAN. Membership is invitation/browser-token based, not full account authentication. There is no account recovery, participant replacement, live co-editing, cursor streaming, email delivery, external AI, or Figma plugin.

## Verification

```bash
npm run lint
npm test
npm run build
```

The server integration test uses two independent authenticated HTTP/SSE clients. It covers room creation/join, presence, sharing, response delivery, review permissions, invalid IDs, duplicate retries, third-user rejection, reconnect, and persisted-store recovery. Existing geometry tests remain.

Manual browser verification for this iteration: two independent browser tabs with distinct A/B credentials and live server connections completed creation, invitation join, gesture/scope selection, share, live receipt, explicit locate with all eight targets highlighted, B's response delivered to A, review, and both identities/reference history surviving refresh. Receipt and opening the inbox item did not change B's camera. Testing on two physical computers or a public deployment has **not** been performed.
