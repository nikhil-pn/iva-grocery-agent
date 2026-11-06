#!/usr/bin/env bash
# Demo helper: move Iva's thresholds so the budget-aware behaviour is visible on camera.
# Uses her REAL balance: it only changes where the tier lines are, then restarts the bot.
#   scripts/demo-tier.sh lean      → rich line just above her balance: she thinks on the cheap model
#   scripts/demo-tier.sh survival  → her own daily cap just under today's spend: no LLM, still answers
#   scripts/demo-tier.sh reset     → back to normal (rich ≥ 1 0G, cap 0.5 0G/day)
set -euo pipefail
F="${IVA_ENV_FILE:-$HOME/.config/pi/iva-agent.env}"
cd "$(dirname "$0")/.."
N=~/.nvm/versions/node/v24.14.1/bin/node
setv() { sed -i "/^$1=/d" "$F"; [ -n "${2:-}" ] && echo "$1=$2" >> "$F"; return 0; }
case "${1:-}" in
  lean)
    C=$($N -e "import('./src/zg/account.mjs').then(async a=>console.log((await a.funds()).spendable.toFixed(4)))")
    setv IVA_RICH_MIN "$($N -e "console.log(($C + 0.05).toFixed(3))")"; setv IVA_DAILY_CAP ;;
  survival)
    S=$($N -e "import('./src/brain.mjs').then(async b=>console.log(((await b.brainState({fresh:true})).spentToday * 0.99).toFixed(6)))")
    setv IVA_DAILY_CAP "$S"; setv IVA_RICH_MIN ;;
  reset) setv IVA_RICH_MIN; setv IVA_DAILY_CAP ;;
  *) echo "usage: $0 lean|survival|reset"; exit 1 ;;
esac
systemctl --user restart iva-grocery-agent
sleep 3
$N scripts/brain-status.mjs | grep -E "tier|why"
