# Technical guide

Current implementation: November 24, 2026. Start with the [README](../README.md) for setup and the [demo guide](DEMO.md) for a walkthrough.

## Document and rendering

`src/data.ts` builds six commerce screens with stable IDs, semantic roles, components, parent relationships, and world-coordinate bounds. `src/designSystem.ts` builds the separate Studio Blue library, including the actual source styles consumed by matching. Library samples are read-only.

The commerce baseline uses warm surfaces, brown actions, serif product titles, and compact spacing. The library uses cobalt pill actions, Inter typography, 20px card corners, 16px card insets, and a different surface/radius/shadow system. These are intentional matching opportunities. Grid/list layouts and product content remain different after matching.

`ProductIllustration.tsx` renders simple scalable furniture artwork inside existing product-image layers. The same artwork is used by the canvas and SVG review previews. Illustrations add no selectable layers or external image requests. `mockPresentation.ts` handles multiline text in authored text blocks.

`Canvas.tsx` renders the document and selection overlays; `workspace.ts` handles camera transforms. Fit shows the commerce screens, with the library below them. CanvasFrameLabels renders fixed-size editor labels for all frames, independent of artwork zoom. Clicking a label or empty frame background selects the frame and shows bounds/fill/contents in FrameInspector; Enter enters its child layers. Frame inspection remains local, with frame IDs excluded from the collaboration presence contract. Frames keep their authored bounds rather than offering unsupported resize handles. Nested selection uses hierarchy-aware click, deep-select, box, and keyboard operations in `selectionInteraction.ts` and `toolInteraction.ts`.

## Selection and AI Actions

The right sidebar is persistent and initially 320px wide. Its order is selection heading/preview → AI Actions → native properties → history. Container queries adapt the AI card to the panel's actual width.

`SelectionAIActions.tsx` owns the selection action flow:

- **Match library:** deterministically derives recorded style differences from the in-file library. Colors, Text, Corners, Shadow, and Spacing chips select what to apply. Counts represent changed properties. Review values and optionally preview before Apply.
- **Pick source:** keeps target IDs fixed while choosing a compatible source on the canvas, in Layers, or from the dropdown. Copy changes only selected categories.
- **Layout:** sibling-root alignment and distribution apply directly. Uneven collinear gaps can produce an inline measured-spacing suggestion. Parent overflow checks and descendant movement are handled by the editing engine.
- **Ask AI:** submits an explicit instruction, compiles the validated result, applies the changes, and exposes Undo. Corner-radius commands include pill-shaped buttons.

`selectionAIActions.ts` computes category-scoped changes, checks stale before-values, and measures uneven gaps. Matching copies values; it does not bind instances to a live library. Single-selection layout buttons are omitted. Detailed change lists expand on demand.

## Editing contracts and persistence

`editing.ts` defines allowlisted patches, canonical selection roots, semantic descendants, library/source mapping, and geometry operations. Content, labels, IDs, roles, hierarchy, screens, and library objects are protected from editing commands.

`useDocument.ts` keeps committed nodes separate from temporary preview patches. Apply creates one undo entry per batch; completed drags also create one entry. Undo/redo history is session-local. Edited properties persist under `sr-document-v2` in local storage. Existing saved patches can override a newly authored baseline; Reset demo deliberately restores the latest dataset.

The model's allowlisted plans in `actionIntent.ts` support layout, library, source styles, typography, color, and corner-radius appearance edits. Server and client validate plans independently. Source/target checks prevent unrelated objects from being changed. Numeric limits and parent-bound checks remain authoritative.

## AI endpoint and triggers

All tasks use same-origin `POST /api/semantic/interpret`. `server/semantic.ts` dispatches interpretation, editing, design-system relevance, comparison analysis, design-change suggestions, and review-focus tasks. `server/documentContext.ts` reconstructs current editable properties while retaining authoritative IDs, content, and hierarchy.

| Surface | Request behavior |
| --- | --- |
| Smart Gesture / Adjust interpretation | Completing a gesture, explicitly opening interpretation, or changing interpretation scope requests candidates; confirmation applies the selection |
| Selection Match library / Pick source | Deterministic; no model request |
| Selection Ask AI | Explicit command submission; validated edits apply with Undo |
| Comparison recommendations | Analysis requests when comparison context is opened; labeled rule-based fallback on failure |
| Comparison library/design-change assistance | Explicitly opened/requested assistance can initiate a model request; property decisions remain explicit |
| Recipient review focus | Explicit request to interpret the reference note |

`aiClient.ts` handles browser caching, coalescing, context validation, cancellation, and safe errors. Obsolete requests cannot apply to a changed selection/document. `server/openaiTransport.ts` provides structured-output requests, bounded retries/queue, rate limits, caching, and safe diagnostics. See [AI reliability](AI_RELIABILITY.md) for operational details.

Local AI requires `AI_ENABLED=true` and `OPENAI_API_KEY`; `.env.example` documents configuration. Vite-only serving has no private endpoint. The Vercel adapter reuses the same task dispatcher; its access/origin policy differs from the loopback Node development route.

## References, comparison, and collaboration

References → Active shows the current local selection as a transient entry alongside saved open references. Clicking that entry locates its layers; changing or clearing the selection updates/removes it. It creates no shared record, notification, or archive entry. Sharing stays in the canvas composer.

Saved references freeze target IDs, scope, intent, note, and optional comparison data. Compare supports local Object A/B or collaborator-owned selections, recorded differences, direction/swap, selective transfer, and temporary preview before Apply. Proposed-change Accept/Dismiss decisions are discussion metadata; they do not apply canvas edits.

- `useDemoCollaboration.ts`: manual A/B adapter, browser-local references and per-perspective cameras/selections; no simulated automatic replies.
- `useCollaboration.ts`, `server/app.ts`: authenticated HTTP commands and SSE snapshots, selection/cursor presence, reference activity, and notifications.
- `server/store.ts`: atomic JSON room snapshots under `ROOM_DATA_DIR` (default `.data`). Exactly two participant slots; tokens are hashed on the server. Use one Node process for this file-backed store.
- `referenceAttention.ts`, `mentions.ts`: targeted unread notifications, View/Later, invitations, and dismissal state.
- `comparisonSides.ts`, `comparisonResolution.ts`, `designChanges.ts`: frozen ownership, editable differences, category transfers, and grounded proposals.

Viewport and applied document edits remain local. Real-time sharing synchronizes reference conversations, not the editable document. Reviewed/manual-archived references retain history; pins and Active status follow existing review/archive rules.

## Research code

`study.ts`, `useStudy.ts`, and `StudyPanel.tsx` retain guided-study definitions, completion detection, timing, interaction records, reset, and export. `research.ts` retains older editing tasks; `legacyResearch.ts` retains earlier collaboration contracts. These modules and tests remain useful, but the current simplified workspace does not render their study/task launcher. Do not direct demo viewers to a nonexistent top-bar toggle.

The retained [study protocol](research/USER_STUDY_PROTOCOL.md) is facilitator material, not a claim that the study UI is currently exposed. Stable layer IDs/roles keep target sets compatible. Changes to visual baselines should be recorded when collecting new research data.

## Verification and limits

Run TypeScript, unit/integration tests, the frontend build, and the appropriate deployment smoke test from the README. AI tests inject provider fixtures and do not spend live-model credits. Historical real-call evidence is separate from current verification.

This is a research prototype: no full Figma import, live component binding, synchronized document editing, production account/recovery system, or measured AI-quality claim. Deployment details are in [Vercel](VERCEL.md) and [Node hosting](DEPLOYMENT.md).
