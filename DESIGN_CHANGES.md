# Optional design-reference proposals

Choose **Use as a design reference**, select the properties to reference, then click **Suggest changes**. The button is the only AI trigger. New suggestions are unchecked. Check only the proposals to include and share through the existing request form. Closing and resuming preserves included proposals in the draft. Changes to the frozen objects or selected property categories discard proposals; refresh the comparison and request suggestions again.

The existing same-origin `POST /api/semantic/interpret` endpoint accepts `task: "design-changes"` with `contextId`, `referenceIds`, `targetIds` and `properties`. Requests without `task` retain semantic-selection behavior. Both tasks share the existing server-side OpenAI key, model, authorization, timeouts, caching, coalescing and request budget. No additional environment variables or Vercel routes are required. Repeated identical contexts use the existing ten-minute instance cache. No request is made automatically when opening the inspector or changing a checkbox.

The server builds evidence from authoritative existing elements and their descendants (up to 24 selected roots per side and 32 objects per side). Suggested facts are restricted to explicit selected categories, recorded values on both sides, different values, and corresponding recorded roles or object types. The model returns at most three short proposals citing those fact IDs. Returned facts are validated again in the browser and when sharing, and their exact values come from application metadata, never model-generated numbers.

## Dataset limits

Font size, font weight, background/text colors and corner radius can be proposed when both sides have recorded values. Nested text and controls can supply evidence when a parent card is selected. Padding and layout gaps are not recorded; **Spacing** remains selectable as reference intent but does not generate changes. Positions and bounding boxes are not substitutes for spacing data. Matching roles/types are evidence candidates, not a guarantee that the two objects should have identical styling; proposals remain optional. Candidate evidence is bounded, so large groups may not expose every possible difference.

If AI is disabled, unavailable, or there is insufficient evidence, the existing deterministic comparison details stay usable and the request can still be shared without proposals. There is no automatic fallback presented as AI.

## Sharing and decisions

Only explicitly checked proposals are added to optional `comparison.designReference.proposedChanges`. Existing references need no migration. Frozen A/B selections and the A-reference → B-target direction remain unchanged. Each saved proposal includes its original recorded difference facts and starts `pending`.

User B can **Accept** or **Dismiss** individual proposals, including changing a decision while the reference is open. These are discussion decisions, not editing commands or completion of the overall review. The existing reply and Mark reviewed actions remain separate. Archived or reviewed references expose decisions read-only.

Demo decisions use local persisted state. Realtime decisions use the authenticated `POST /api/rooms/:code/references/:id/changes/:changeId` route with `status` (`accepted`, `dismissed`, or `pending`), save through the existing room store and broadcast through SSE. Only User B can decide. No canvas properties are modified or synchronized.

## Verification

`npm run lint`, `npm test`, and `npm run build` cover the integration. Design-change tests use injected mocked Responses payloads and fixture keys; they make no paid calls. Tests cover authoritative values, missing/spacing data, selected categories, invalid facts, HTTP caching, disabled fallback, demo sharing, authenticated realtime sharing/decisions/replies/review, persistence, and old references without proposals.

A live evaluation is a separate explicit test: configure the existing `OPENAI_API_KEY` and `AI_ENABLED=true` locally (plus the existing hosted-access settings on Vercel), then approve and click **Suggest changes** once. This implementation was verified with mocks only; it does not claim measured live-model recommendation quality.
