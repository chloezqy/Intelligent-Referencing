# First live semantic interpretation test — 2026-10-26

Model: `gpt-4.1-mini`, real OpenAI Responses API through the local Node endpoint. No mock fetcher was installed in the live server. The private key was read server-side and never printed or sent to the browser.

## Usage and result

Two upstream calls were made with explicit user approval: the initial call failed application validation, then one additional call was approved and succeeded. No further paid calls were made. Replays used the server cache.

Successful response ID:

`resp_053ea5ca07053c15016aded6cf540c87d2b66f6a7c14b0df2e`

- Initial successful result: HTTP 200, `cached:false`, three validated suggestions, no rejected suggestions.
- Exact request replay: HTTP 200, `cached:true`, identical response ID and model.
- Input: selectedIds/exemplarIds `["hc1-title"]`, scope `exemplars` (Touched).
- The browser's inspected `data-semantic-input` matched those IDs and scope before the cached UI request. Context ID is an echo/correlation field, not part of the model payload/cache key.

## Actual model output versus rules

The model returned:

1. Product Card Components Relationship on Home Screen — title, card, image, prices, rating, badge, favorite and CTA. This mostly overlaps the existing parent-card rule; it is not evidence of added value by itself.
2. Cross-Screen Product Title Consistency — `hc1-title`, `fav1-title`, `cart1-title`, grounded in the repeated Nordic Lounge Chair product name across browsing, wishlist and cart.
3. Interaction Elements Grouped Within Product Card — `hc1-title`, `hc1-cta`, `hc1-fav`, `hc1-img`.

For exactly this input, deterministic alternatives were only the touched title and its complete parent-card group. The selective cross-screen same-product title group and four-object interaction group were absent. This is one observed example, not a general quality/accuracy claim.

## Browser verification

- Pressing AI suggestions inside Refine Selection displayed the real cached results in the existing dropdown.
- Each option was labeled `semantic · AI` and included its metadata-grounded reason.
- The current selection stayed at `hc1-title` when results arrived.
- Choosing Cross-Screen Product Title Consistency explicitly selected all three title IDs, preserving `hc1-title` as evidence.
- On a separate server started with `AI_ENABLED=false`, the AI button returned a clear disabled message. Screen scope still selected all four Home titles without AI.
- Real-time rooms, cursors and sharing were not changed by this test.

## Validation correction

The initial error path discarded the response ID and rejected an entire response if any suggestion failed. It also unnecessarily required selected evidence to be inside the suggested target list. Evidence and targets are separate concepts in SemanticCandidate.

The handler now validates evidence against selected IDs and targets against supplied candidates independently, deduplicates IDs, keeps valid suggestions when another is invalid, and includes safe response-ID/rejection-code diagnostics on total failure. It never admits invented IDs. The initial raw output/response ID was not retained, so the precise failing clause on that first call cannot be reconstructed.

## Next selections to evaluate — not run

- Nordic Lounge Chair title on Home: repeat the same-product linkage across Home/Favorites/Cart, comparing relevant matches and unwanted extras against the role-based title expansion.
- Detail's Add to Bag, Cart's Proceed to Checkout, Checkout's Place Order: test whether the model distinguishes stages of the purchase flow instead of grouping every primaryCTA indiscriminately.
- Checkout Shipping Address Card plus the oversized-freight warning: test whether the model recognizes delivery context across different roles/components.

Only the first selection was sent to the live model. New selections, cache expiry after ten minutes, or a server restart can incur a new paid call. No additional live evaluations are authorized by this report.
