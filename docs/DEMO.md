# Demo guide

## Prepare

Run `npm run dev` with Node 24. Configure the server-only AI settings from the root README if demonstrating model interpretation or natural-language edits. No model call is needed for library/source matching.

Use References → Reset demo before rehearsing. It restores the latest authored dataset and fresh A/B demo state. Keep a clean baseline for each take; old local patches can hide the visual refresh.

The six screens use a warm commerce style with furniture illustrations. Studio Blue, below the screens, uses blue actions, Inter typography, cooler surfaces, 16px insets, and shadows. The contrast is intentional. Product names, artwork, screen layouts, and IDs should survive edits.

## 1. Select by meaning

Choose Smart Gesture (G) and draw through two Home product examples. In Adjust interpretation, try This Screen or Whole File, inspect the candidate highlights, and confirm the intended group. A useful example is selecting primary shopping actions without including favorites or color swatches.

AI candidates depend on the live model. Inspect the actual result rather than promising a specific group. If AI is unavailable, explicitly confirm touched objects or use normal selection; explain which method is being shown.

## 2. Make a visible library transformation

Select `hc1`, `hc2`, `hc3`, and `hc4` through Layers or a confirmed gesture.

1. In AI Actions, choose Match library.
2. Select Colors, Text, Corners, Shadow, and Spacing when offered.
3. Expand Review before & after. Toggle the eye to compare on the canvas.
4. Apply. Brown actions become blue; serif titles use library typography; card surfaces, borders, corner shapes, shadows, and insets change together.
5. Undo and redo to demonstrate control.

The matching step is deterministic and reads the actual library nodes. AI helps interpret intent and natural-language commands; do not call deterministic token copying a model-generated design.

## 3. Copy only one aspect

After restoring the baseline, select a Home card, choose Pick source, and pick a Search card. Choose Corners only, then Copy. Explain that a grid card and a list card can share a style property without becoming the same layout or copying product content.

Alternatively compare `hc1` and `sc1`, resolve only Corner radius in the intended direction, preview, and apply. Home starts at 16px and Search at 14px; Studio Blue cards use 12px.

## 4. Ask AI to act

Select a card and submit “Make the buttons pill-shaped.” The command is interpreted relative to the selected card and its descendants. Inspect the result and Undo. Selection/document changes cancel obsolete requests.

For a whole-file example, first confirm the intended primary-CTA selection, then ask for a color change. Keep favorites, secondary controls, and library samples out of the target set.

## 5. Hand off a reference

Share from the canvas context menu, optionally add a note or mention, and send to User B. Switch perspective with the right-sidebar profile control. Open the saved request in References and reply or Mark reviewed.

Active also displays the current local selection. That entry is temporary and is not a sent request. A/B demo roles are controlled by one person; real two-person collaboration requires the Node room backend and independent browser identities.

## What to watch

- Layer selection follows hierarchy; double-click or Cmd/Ctrl-click reaches nested content.
- Preview is temporary; Apply/Copy commits changes. Natural-language and layout actions apply directly with Undo.
- Source and target stay independent during picking.
- Distinct grid/list layouts remain intentional comparison context.
- Product illustrations scale with their image layers and are reused in review previews.
- Saved requests and applied document changes are separate kinds of state.
