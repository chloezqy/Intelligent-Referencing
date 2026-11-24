# Documentation

The root [README](../README.md) describes the current prototype and how to run it. Guides here cover distinct tasks rather than repeating its overview.

## Current guides

| Document | Use it for |
| --- | --- |
| [DEMO.md](DEMO.md) | Rehearsing selection, library matching, selective copying, AI commands, and reference handoff |
| [TECHNICAL.md](TECHNICAL.md) | Architecture, authoritative document data, editing contracts, AI triggers, reference state, and persistence |
| [AI_RELIABILITY.md](AI_RELIABILITY.md) | Request limits, queue/cache behavior, diagnostics, and operational checks |
| [VERCEL.md](VERCEL.md) | Frontend + serverless AI deployment for the local A/B demo |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Persistent Node hosting for real-time rooms and SSE |

## Research and history

| Document | Status |
| --- | --- |
| [Study protocol](research/USER_STUDY_PROTOCOL.md) | Retained facilitator material. Study modules exist, but the current simplified UI does not expose their launcher. Requires a fresh pilot before use. |
| [October 26 live AI test](research/AI_LIVE_TEST_2026-10-26.md) | Dated observation and validation evidence; not a current quality benchmark. |
| [Design-change notes](archive/DESIGN_CHANGES.md) | Earlier proposal/comparison design rationale. Current interaction contracts are in TECHNICAL.md. |

## November 24 cleanup

- Rewrote README.md for the current sidebar, AI actions, demo workflow, setup, limitations, and team.
- Replaced the accumulated TECHNICAL.md history with a concise implementation guide.
- Removed FEATURE_INVENTORY.md and INTELLIGENT_EDITING.md after consolidating their useful architecture/workflow information into README, DEMO, and TECHNICAL. Their old UI instructions and test-count claims were stale; Git retains their history.
- Moved the root DESIGN_CHANGES.md into archive, with a historical-status notice.
- Moved the protocol and dated live-test report into research; preserved their evidence and identified current UI/baseline limitations.
- Kept Vercel and persistent-Node deployment guides separate because they deploy different backend capabilities. Updated stale AI-trigger and task-launcher instructions.
- Kept AI reliability details as an operational reference and aligned its trigger description with the current code.

Only README.md remains at the repository root. Historical documents are clearly labeled and should not be used as current demo instructions.
