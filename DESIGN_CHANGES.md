# Optional design-reference proposals

Select two objects and click **Compare**, or select one side and click **Compare with User A/B** when the collaborator has a selection. Both paths open the same inspector. Choose **Use as a design reference**, choose the reference side (use **Swap** to reverse it), select the properties to reference, then click **Suggest changes**. The button is the only AI trigger. New suggestions are unchecked. Check only the proposals to include and share through the existing request form. Closing and resuming preserves included proposals in the draft. Changes to the frozen objects, reference direction or selected property categories discard proposals; refresh the comparison and request suggestions again.

The existing same-origin `POST /api/semantic/interpret` endpoint accepts `task: "design-changes"` with `contextId`, `referenceIds`, `targetIds` and `properties`. Requests without `task` retain semantic-selection behavior. Both tasks share the existing server-side OpenAI key, model, authorization, timeouts, caching, coalescing and request budget. No additional environment variables or Vercel routes are required. Repeated identical contexts use the existing ten-minute instance cache. No request is made automatically when opening the inspector or changing a checkbox.

The server validates the current document snapshot through the existing editable-property validator, preserving authoritative element IDs, hierarchy and content, then builds evidence from existing elements and their descendants (up to 24 selected roots per side and 32 objects per side). Suggested facts are restricted to explicit selected categories, recorded values on both sides, different values, and corresponding recorded roles or object types. The model returns at most three short proposals citing those fact IDs. Returned facts are validated again in the browser and when sharing, and their exact values come from application metadata, never model-generated numbers.

## Dataset limits

Font size, font weight, background/text colors and corner radius can be proposed when both sides have recorded values. Nested text and controls can supply evidence when a parent card is selected. Explicit spacing values can be proposed when recorded on both objects. Missing padding/layout gaps are never inferred from positions; many original commerce elements have no recorded spacing. Positions and bounding boxes are not substitutes for spacing data. Matching roles/types are evidence candidates, not a guarantee that the two objects should have identical styling; proposals remain optional. Candidate evidence is bounded, so large groups may not expose every possible difference.

If AI is disabled, unavailable, or there is insufficient evidence, the existing deterministic comparison details stay usable and the request can still be shared without proposals. There is no automatic fallback presented as AI.

## Sharing and decisions

Only explicitly checked proposals are added to optional `comparison.designReference.proposedChanges`. Existing references need no migration. Frozen selections remain unchanged. Optional `comparison.sides` identifies Object A/B and who selected each independently of user identity; absent sides retain the legacy A/B-user interpretation. Reference direction includes explicit reference/target side keys and supports Swap, including when both sides were selected by one user. Each saved proposal includes its original recorded difference facts and starts `pending`.

The request recipient can **Accept** or **Dismiss** individual proposals, including changing a decision while the reference is open. These are discussion decisions, not editing commands or completion of the overall review. The existing reply and Mark reviewed actions remain separate. Archived or reviewed references expose decisions read-only.

Demo decisions use local persisted state. Realtime decisions use the authenticated `POST /api/rooms/:code/references/:id/changes/:changeId` route with `status` (`accepted`, `dismissed`, or `pending`), save through the existing room store and broadcast through SSE. Only the request recipient can decide, independent of who selected the target side. Recipient decisions do not modify canvas properties. The draft Compare inspector can preview and explicitly Apply proposed changes using the existing local editor and undo/redo history; those style edits are not synchronized between collaborators.

## Verification

`npm run lint`, `npm test`, and `npm run build` cover the integration. Design-change tests use injected mocked Responses payloads and fixture keys; they make no paid calls. Tests cover authoritative values, missing/spacing data, selected categories, invalid facts, HTTP caching, disabled fallback, demo sharing, authenticated realtime sharing/decisions/replies/review, persistence, and old references without proposals.

A live evaluation is a separate explicit test: configure the existing `OPENAI_API_KEY` and `AI_ENABLED=true` locally (plus the existing hosted-access settings on Vercel), then approve and click **Suggest changes** once. This implementation was verified with mocks only; it does not claim measured live-model recommendation quality.

Sharing is optional and follows analysis. It contains only the existing mention-enabled note and the invitation checkbox; purpose is chosen above comparison details. In the current two-user room, eligible mentions identify the other teammate; with no eligible mention, an invitation uses the existing default other-user recipient. Self-mentions never create a self invitation.

## Consolidated interaction flow

Selection shows only the anchored Compare / Share reference / Adjust interpretation menu. Rough gestures immediately offer deterministic interpretations; the semantic AI button is explicit. Existing AI selection suggestions are chosen directly, with hover/focus preview and no automatic application.

Compare contains selected-object previews, purpose, property differences, Suggested actions, then Sharing. The existing editing controls render inline in Suggested actions and are filtered by roles, object types, recorded properties and sibling layout compatibility. Mixed selections remain comparable without receiving inappropriate editing controls. Single/group local inspections retain their selection without inventing a second group.

Every edit follows Choose action → Preview → Apply. Apply is disabled before preview. Preview, Cancel, inspector close, scope/source changes, undo and redo use the existing document state and cleanup. Reference-mode transfers are limited to the chosen property categories and target side. Checked AI proposals compile to the same validated patch preview; stale values and overlapping source/target sets are rejected. Saved requests remain review/discussion surfaces, with individual proposal decisions separate from editing.

All editor buttons are non-submit controls; entering values in analysis/editing fields cannot implicitly submit the sharing form. Current document style snapshots may accompany AI/share requests for validation but are not stored as reference data or broadcast as document edits.
