# UI wording

**Status: agreed on 2026-11-28.** The UI strings follow this list.

The interface currently uses several words for the same idea. Participants read these words in research tasks, so one word per idea matters more here than in a typical product.

Each section records the decision and the strings that changed.

---

## 1. Library or design system

The Studio Blue board is called both. The main button says "Match library", but the card it opens says "Design System has 36 style changes".

**Proposal:** use **library** in the UI. "Design system" can stay in documentation and research write-ups.

| Current | Proposed |
| --- | --- |
| Design System has N style changes | Library has N style changes |
| Find design system matches | Find library matches |
| Preview design system changes | Preview library changes |
| Proposed design system properties | Proposed library styles |
| Optional design system assistance | Optional library help |
| Use existing design system properties | Use existing library styles |
| No meaningful design system suggestions… | No useful library suggestions… |
| Match these to the design system… | Match these to the library… |
| Nordic Living design system colors | Nordic Living colors |

Already consistent: Match library, View library, With library styles, Choose a library style, Applied library styles.

**Decision:** ☑ library (decided)

---

## 2. Layer, object or element

Counts mostly say "layers", but buttons and messages switch to "objects", and a few say "element".

**Proposal:** use **layer** everywhere. It's the Figma word participants already know.

| Current | Proposed |
| --- | --- |
| Select N objects | Select N layers |
| N selected objects / N touched objects | N selected layers / N touched layers |
| N objects (shared reference, comparison) | N layers |
| N unavailable objects | N unavailable layers |
| No objects selected / No selected objects | No layers selected |
| Element unavailable / Unavailable object | Layer unavailable |
| Select two objects and choose Compare | Select two layers and choose Compare |
| Some referenced objects are unavailable… | Some referenced layers are unavailable… |

**Open question:** should a whole product card count as a "layer"? In Figma it would be a frame or group. "Layer" still works because cards appear in the Layers panel, but say so if it feels wrong.

**Decision:** ☑ layer (decided)

---

## 3. Source or reference

"Reference" currently means two different things:

- **What you share with a teammate:** Share reference, Shared references, Send reference, View reference.
- **The layer you copy styles from:** Choose Reference, Choose another reference, Swap reference and target, Choose one reference object…

The second meaning also shows up as "source": Pick source, Style source, Find source in file, Choose a source….

**Proposal:** keep **reference** for what you share, which matches the product name. Use **source** for the layer you copy from.

| Current | Proposed |
| --- | --- |
| Choose Reference | Choose source |
| Choose another reference | Choose another source |
| Swap reference and target | Swap source and target |
| Choose one reference object to transfer properties. | Choose one source layer to copy properties from. |
| …current target and proposed reference values | …current target and proposed source values |
| No suggested reference. Choose one below. | No suggested source. Choose one below. |
| Finding a typography reference… | Finding a typography source… |
| Source object / Source layer | Source layer |

**Exception:** "Design reference" / "Use as a design reference" in the comparison flow keeps its name for now. It's treated as its own feature, separate from "Pick source". Revisit if participants confuse the two. Its workflow strings also keep "reference": Swap reference and target, Choose one reference layer…, and the Reference / Target cards. Only the Pick source and text-style strings changed to "source".

**Decision:** ☑ as proposed (decided)  Design reference: ☑ keep (decided)

---

## 4. Capitalization

**Proposal:** sentence case for every label, heading and button. Proper names and feature names keep their capitals (Smart Gesture, Studio Blue, User A / User B, AI Actions).

| Current | Proposed |
| --- | --- |
| Shared References (panel title) | Shared references |
| Choose Reference | Choose source *(see section 3)* |
| Next Task | Next task |
| Research Tasks | Research tasks |
| First Selected | First selected |
| All Text | All text |
| Product Titles | Product titles |
| Primary CTA buttons | Primary buttons |
| Design System (some places) | Library *(see section 1)* |

Also: use the single "…" character in all placeholders and loading text. "Add people...", "Add a message (optional)..." and "Interpreting reference..." use three dots.

**Decision:** ☑ sentence case (decided)  "AI Actions": ☑ keep as a feature name (decided)

---

## 5. Preview labels

Five versions of the same button:

- Preview changes
- Preview selected changes
- Preview selected suggestions
- Preview selected AI suggestions
- Preview design system changes

**Proposal:** **Preview changes** everywhere. The panel the button sits in already says what's being previewed.

**Decision:** ☑ Preview changes (decided)

---

## 6. Loading messages

- On the canvas, after a gesture: "Interpreting reference..."
- In the Adjust interpretation panel: "Understanding your selection…"

**Proposal:** **Understanding your selection…** in both places. It's plainer and doesn't reuse "reference".

**Decision:** ☑ as proposed (decided)

---

## 7. Other wording

| Current | Proposed | Why |
| --- | --- | --- |
| Resume share popup | Continue sharing | "Popup" is developer wording |
| Product name: "Smart Reference", "Shared referencing", "Smart Reference Prototype" | Smart Reference | One product name. The help dialog already uses it. |

**Decision:** ☑ as proposed (decided)

---

## After sign-off

1. Update every UI string to match. Tests that check exact wording get updated in the same commit.
2. Update README.md and DEMO.md. The README still lists the old scope names (Touched / This Screen / Whole File).
3. Check the research task scripts in `docs/research/` for any words that changed.
