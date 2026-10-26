## Semantic OpenAI integration (local, opt-in)

`server/semantic.ts` installs POST `/api/semantic/interpret` before the API 404 handler. It resolves bounded candidates from the authoritative dataset, constructs metadata/hierarchy input, calls Responses via native server-side fetch and validates structured suggestions. `AI_ENABLED=true` plus `OPENAI_API_KEY` are required; production/non-loopback requests are rejected. It does not require collaboration identity. The first approved live test and validation correction are recorded in `docs/AI_LIVE_TEST.md`.

`src/modelSemanticProvider.ts` implements SemanticProvider over this endpoint. `src/useSemanticSuggestions.ts` aborts obsolete requests, checks context identity and keeps suggestions separate from selection. Canvas connects the explicit AI suggestions button to the existing interpretation dropdown; only choosing a candidate applies IDs. Interpretation provenance is optional on existing Interpretation records, preserving deterministic compatibility. Existing rule-based orchestration remains available.

See README’s semantic AI section for setup, payload bounds, cache/limits, verification steps and the explicitly mocked cross-role evaluation fixture. Implementation tests use mocks; the subsequent two approved live calls and cached UI verification are documented separately in `docs/AI_LIVE_TEST.md`.

## Standalone and realtime modes

Standalone is now default. `collaborationMode()` selects realtime for `?mode=realtime` or an existing `?room=...` link, unless `mode=demo` is explicit. References contains a mode selector. Switching modes reloads the workspace and discards unsent drafts.

- `src/collaborationClient.ts`: transport-independent component contract.
- `src/useCollaboration.ts`: mode facade plus preserved `useRealtimeCollaboration`; inactive realtime mode does not restore identities or start SSE.
- `src/useDemoCollaboration.ts`: local browser adapter with no network calls; manual A/B session switcher, no cursors and no scenario timers. Share remains pending until the recipient perspective manually opens/locates/replies/reviews. Actions use the current local actor and enforce recipient-only review.
- `src/demoCollaboration.ts`: pure share/snapshot/scenario helpers. Demo references carry `simulated:true`; existing real server schema and storage remain unchanged.
- Demo storage: `sr-demo-v1`; research storage: `sr-research-demo-v1-A` / `sr-research-demo-v1-B`. Perspective, per-user camera/selection and dismissed nudges have separate `sr-demo-*` keys. Research exports and new attempts include mode; Levels 4–5 remain strict but display demo completion. They do not represent human coordination evidence. Reset clears only these demo records.
- Browser storage is origin-specific and last-write persistence, not multi-tab synchronization. No server tokens or real rooms are copied into demo data. Disabled storage yields an explicit warning and memory-only use.
- `npm run dev:standalone` / `preview:standalone` serve only Vite/static assets. `npm run dev`, build, start, realtime APIs, SSE and production persistence verification remain available.

Model access is optional and disabled by default; see the semantic OpenAI integration section above.

The remaining deployment and authenticated collaboration sections describe **realtime mode**.

# Smart Reference — shared referencing

Two actual browser clients share object-anchored references, intent, notes, responses, and review status. Canvas camera and selection stay local. Gesture interpretation uses geometric intersection and authored semantic metadata immediately; the explicit AI suggestions action can request optional server-side model interpretation. The authored commerce dataset is immutable; Select can apply in-memory local position overrides.

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

The server runtime currently uses `tsx`, so install development dependencies as well as production dependencies. After `npm run build`, both `npm run preview` and `npm start` launch the complete Node server, including the room backend. Do not serve `dist` alone: a static host does not provide the collaboration API.

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

## Progressive Research Tasks

Open **Tasks** in the existing left rail. Start each level before interacting; level switching preserves progress. Reset creates a fresh attempt, invalidates earlier shared-reference evidence for that level, and retains prior events for export. Next Task appears on completion. The workspace layout, frames, tools and independent cameras are unchanged.

- **L1:** exactly 15 individual product prices (ProductCard, CartItem, Detail); aggregate and old prices excluded.
- **L2:** exactly all 15 `primaryCTA` objects, including checkout/order and Move All.
- **L3:** the four Home category chips, following a rough gesture, a changed interpretation/selection, and explicit final review in Tasks. A new gesture or target change invalidates an earlier review.
- **L4:** A shares at least two related objects (common nonempty role, component or parent), Review intent, and a context note. B opens, explicitly locates every target, then replies or marks reviewed.
- **L5:** exactly `hc1-cta` + `sc1-cta`, Compare intent and context note, followed by B's open, navigation to both targets, and reply/review decision. This exposes the existing “Add to Bag” / “Add” wording difference.

These are deterministic metadata/ID checks, not model judgments about note quality or visual consistency. Levels 4–5 are coordinated by User A; B uses References. Start those tasks after creating a room. Solo attempts and room/user attempts have separate browser-local logs. When A creates their first room, the earlier selection-level attempts carry into that room’s research progression; B never inherits them. Task history/progress and local interaction events are persisted in localStorage and exportable as JSON, with up to 100 attempts and 1,000 local events per active attempt. Clearing browser storage loses that research log. Shared references, attempt links, authenticated open/locate activity, responses and review timestamps remain server-persisted. No browser token is exported. Received references never move the recipient's camera automatically.

Each draft freezes its task/attempt identity and target IDs. Completion evaluates each reference independently; it cannot combine a reply on one reference with navigation on another or reuse a previous attempt. Authenticated activity commands derive the actor from the server session, reject unrelated target IDs, deduplicate repeated opening/navigation, and broadcast evidence over SSE. Per-screen navigation accumulates until every frozen target has been visited. Presence gives offline feedback; an offline B cannot generate the required interaction evidence. These events prove recorded UI actions, not whether a person cognitively understood the design.

Research modules: `src/research.ts` (task definitions/pure validation), `src/useResearch.ts` (attempts, event recording, persistence/export), `src/components/ResearchPanel.tsx` (level/progress UI). Server activity is additive and backward-compatible with rooms saved before research tasks.

Verification for restored tasks: Levels 1–3 were completed through real browser selection/gestures. Two independent browser tabs with distinct server-issued A/B identities completed Levels 4–5 via live SSE, including a negative check that a response plus navigation to only one comparison target remains incomplete. A refresh recovered completed tasks; server-store restart recovery is covered by integration tests. These are separate browser sessions on one computer; physical two-computer testing is not claimed.


## API response diagnostics

All room commands validate the HTTP status, Content-Type and JSON object before consuming the response. Realtime connections require `text/event-stream`; error responses pass through the same JSON validator. Errors identify the endpoint, status and returned media type instead of trying to parse a proxy error page as JSON. Invalid streams reconnect and do not report a healthy connection. Session identities are validated before saving them. Research task storage itself does not make API requests; shared-task open/locate/reply evidence uses the room API.

## Prototype 3 interaction integration

The React integration adapts `renderReferencePins` / `showSpatialComment`, `comparisonAnalysis`, and `compactActionsFor` from the original Prototype 3 interaction patterns. It does not execute or import that prototype's imperative DOM code, simulation timers, editor, or CSS. Source inspected: `Rok1006/AI_Widget_Referencing`, `src/prototypes/03-cross-application/interaction.js`, blob `ce4bfaf4be046c187f6535e1b1617749b8b90fde`.

- `src/referencePresentation.ts`: pure world-to-screen object anchors, spatial-bucket clustering (24px pins, 8px separation), stable creation/ID ordering, active-anchor priority, and dataset-only property comparison. Missing properties are reported, not inferred from computed styles. Coordinates are relative to their screen. Mixed/incomplete comparisons retain every available target and flag unavailable IDs.
- `ReferencePins.tsx`: accessible object pins and a single conversation chooser for overlapping references. Per-element pins resolve to the existing reference ID. Choosing a conversation calls the existing authenticated open command; no camera update or selection mutation occurs.
- `PropertyComparison.tsx`: reusable draft/saved-reference comparison, matching/incomplete sections and table-local scrolling. Compare references expand by default; other references stay collapsed until requested.
- `ReferenceActions.tsx`: compact intent shortcuts that create a frozen draft without sending it. Explicit intent overrides research defaults. Replacing draft targets preserves the original research attempt and the currently chosen intent.

SharedReference and room API/storage contracts are unchanged. No pin coordinates, comparison output, or independent annotation system are persisted. SSE snapshots remain authoritative for targets, notes, responses and status. Comparisons and cluster choosers do not generate research navigation or recipient-response evidence. Existing open/locate/reply/review commands retain that responsibility.

Verification: automated pure-helper tests cover coordinate transforms, clustering, overlap separation, active priority, stable ordering, offscreen/missing targets, CTA property differences, missing properties and non-mutating comparison behavior. Real A/B browser clients verified live pin receipt, clustered conversation opening without camera movement, frozen draft targets after clearing selection, deterministic comparison, replies and status synchronization, and completion of Levels 4 and 5 through recipient actions. Public Vercel backend deployment remains unimplemented.

## Compact pin chooser and synchronized archive

The canvas chooser contains short metadata rows only: intent/label, stable reference number, time, source and review state. Full notes are not rendered in the chooser or pin tooltips. The chooser is at most 240px wide and 224px tall, clamped to the canvas with an 8px margin and an independently scrollable list. It routes to the existing References conversation; a single-reference pin bypasses it.

`SharedReference` has optional `archivedAt` and `archivedBy` fields. Older room files remain compatible without migration. `POST /api/rooms/:code/references/:id/archive` accepts `{ archived: boolean }`, authenticates the member, assigns the actor/timestamp server-side, saves atomically and broadcasts the same room snapshot. Both A and B can archive/restore; retries are idempotent. Archiving leaves review status, target IDs, replies and research evidence unchanged. It hides pins, highlights, active list entries and pending-review counts. Archived items remain in the existing room/reference collection and count toward its storage limit.

Archived history is readable in References, but replying, marking reviewed and recording open/locate evidence require restoration. Opening an archived history item does not send research opening activity. Restore recovers the original conversation and object anchors; no second annotation or conversation store exists.


## Pin-attached share composer

`SharePopover.tsx` now owns the only share form, positioned as a canvas overlay. The sidebar retains room setup, saved references, archive/restore and conversations; it contains no duplicated composer. App state owns the frozen draft, note, intent and popup visibility, preserving them when a saved conversation opens or the share popup closes. The temporary pin reopens the same unsent draft. The send command and idempotent request ID still use the existing collaboration API. Research metadata remains on the original draft during target replacement.

`sharePopoverLayout` derives its anchor from the first visible saved target ID, follows the local camera, and bounds a 312px-wide, at-most-360px-tall popup to the canvas. It flips above the pin when needed. If all targets are offscreen, the pin stays at the nearest viewport edge and the popup offers explicit Locate. Popup Locate changes only the local viewport, not recipient research evidence. The generic action label is “Share to user?” before room identity exists, then names the opposite real participant. Comparison and target replacement remain available in an expandable section.

## Live selections and collaborative comparisons

Selection presence uses authenticated `POST /api/rooms/:code/selection` and named `selection` SSE events. It is transient in-memory state, carries stable element IDs and server revisions, replays on connection, and clears when a participant’s last stream disconnects. `CollaboratorSelection` publishes committed local selections and renders noninteractive world-coordinate outlines independently of local camera state.

`POST /api/rooms/:code/comparison-drafts` validates both participants are online, nonempty selections, and current client revisions. The server freezes both selections and rule-based interpretation in a bounded, one-hour draft registry. Sharing uses the snapshot ID and purpose; the server ignores client-supplied ownership and interpretation, verifies target union, and persists optional `SharedReference.comparison`. Old references remain valid. Live changes never modify frozen snapshots. A server restart invalidates unsent drafts; saved comparisons persist with normal room data.

`src/comparisonContext.ts` defines the pure `ContextInterpreter` interface and metadata-based implementation. It suggests possible purposes using roles, types, screens, and authored differences without model calls or automatic edits. A future model adapter can return the same interpretation shape. Comparison ownership lives in frozen metadata, not a second annotation store. Existing activity, review, research validation, and pin logic continue using union `elementIds`.

## Unified Select interaction

The toolbar order is `pointer` (Select), `reference` (Rough Reference), `pan` (Hand), with V/S, R and H shortcuts. Selection metadata still distinguishes `conventional` and `smart-ref` for collaboration and research evidence.

Canvas keeps a pending pointer interaction containing the initial hit node, Shift modifier, prior selection, screen-space samples, and world-space stroke. It does not mutate reference state on pointer-down. A maximum displacement greater than 6 screen pixels establishes a drag; Select drags on objects move local snapshots and descendants; Select drags on empty canvas use a box, with Shift preserving additive box behavior. Rough Reference always uses gesture inference, including when starting on an object. The trajectory classifier is not used for routing. Pointer-up commits clicks/boxes, or starts interpretation; only the interpretation result changes the shared selection. Pointer cancellation, capture loss, or window blur discards the transient stroke and retains prior selection. The inference engine accepts two-point strokes so short gestures are independent of pointer event frequency.

## Progressive interpretation and consolidated attention

Canvas commits the best rule-based gesture interpretation directly into preview state, clears the transient stroke, and presents one interpretation-first surface. Scopes and alternatives expand inside it; Share/Compare replace it with their existing composer. Ordinary clicks keep two action pills and secondary details. All research validators are unchanged; Level 3’s explicit review button remains task-only evidence.

`SharedReference.attention` is an optional array of invitation requests (`id`, authenticated source/target, creation/view timestamps). New references always write an array, including `[]` for asynchronous sharing. `share(..., inviteNow)` creates the initial invitation atomically with a reference, preserving idempotent reference IDs. Existing references use authenticated `POST /api/rooms/:code/references/:id/attention` with an idempotency request ID. `POST .../attention/:invitationId/view` records the recipient’s explicit View action. Both routes broadcast through existing SSE snapshots and persist to the same room file. Invitations never create conversations or modify target IDs, replies, review status, or research association. Archived references cannot be invited; repeated invitations have separate receipts, capped at 50/reference. Legacy Look at this references without the new array retain their prior notification behavior.

`src/semanticInterpretation.ts` defines geometric/structural/semantic levels, rule-based/model provenance, request context IDs, metadata/optional intent/peer selection inputs, and a separate asynchronous `SemanticProvider` contract. The orchestrator validates candidate IDs/shape and falls back to the existing scope generator. It returns candidates only; it never applies a selection or sends a reference. Context matching rejects stale model responses. The modelSemanticProvider transport and local-only server endpoint now implement the opt-in model path, with no automatic AI trigger or live calls during verification.

A future server-side model adapter should construct an authoritative, bounded metadata request from selected IDs and relevant candidate objects (including hierarchy, role, text, component and available properties), enforce a timeout/cancellation, and return labeled candidates. Introduce an explicit semantic-suggestions action within Adjust interpretation; applying a candidate must remain an explicit user action. Cross-user interpretation can use the optional peer IDs/revision from existing presence/frozen comparison snapshots. Keep deterministic property comparisons independent, and extend selection/reference provenance when model candidates become usable. Do not present the current metadata heuristics as model inference.
