# AI usage

ETHGlobal asks teams to say how AI tools were used. Here is ours.

- **Coding assistant:** Claude Code helped with research and wrote much of the code in this repo,
  pair-programming with the team. The team chose the idea, the architecture, the safety rules
  (Iva never places orders, and spending is capped) and the demo. The team reviewed and ran every commit.
- **Research:** Claude Code read the 0G, comfy and ETHGlobal documentation and summarised it.
  Every design fact used here was checked against live endpoints (see the README proof table).
- **Inside the product:** Iva's own intelligence runs on **0G Compute**
  (`router-api.0g.ai`): reading lists, voice notes and photos; matching products across shops;
  and writing replies. No other AI provider is called at runtime.

## Pre-existing work

- No code from before the hackathon is in this repo. It was started from an empty folder on
  2026-11-06, during the event.
- Before the event, one team member built a private, personal price tracker for the same
  shops. Only domain knowledge from it was reused (which shops, and the observation that
  discounts last hours), not code.
- Third-party, public pieces used: `viem`, `playwright-core`, the 0G Router API, the
  Telegram Bot API, and Google Chrome.
