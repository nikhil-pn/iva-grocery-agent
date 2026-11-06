// Iva's treasury loop: no human tops her up. Every tick she looks at her wallet
// (where customers pay) and her 0G compute balance, then:
//  1. keeps a small gas reserve,
//  2. deposits into her OWN 0G compute account when it's below target (depositFor),
//  3. once compute is full, sends surplus above a ceiling to her creator (dividend).
import { cfg } from './config.mjs';
import { walletBalance0G, depositToCompute, sendNative } from './chain.mjs';
import { funds } from './zg/account.mjs';
import { logEvent } from './ledger.mjs';
import { invalidate } from './brain.mjs';

let running = false;

export async function treasuryTick(reason = 'tick') {
  if (running) return null;
  running = true;
  try {
    const wallet = await walletBalance0G();
    const f = await funds();
    const compute = f.spendable;
    const free = wallet - cfg.gasReserve;
    if (free >= cfg.minDeposit && compute < cfg.computeTarget) {
      const amount = Math.min(free, cfg.computeTarget - compute + 0.1);
      if (amount >= cfg.minDeposit) {
        const tx = await depositToCompute(amount);
        invalidate();
        return logEvent('deposit', { tx, amount0G: Number(amount.toFixed(6)), computeBefore: compute, walletBefore: wallet, reason });
      }
    }
    if (cfg.creatorAddress && compute >= cfg.computeTarget && wallet > cfg.dividendAbove + cfg.gasReserve) {
      const amount = wallet - cfg.dividendAbove;
      const tx = await sendNative(cfg.creatorAddress, amount);
      return logEvent('dividend', { tx, amount0G: Number(amount.toFixed(6)), to: cfg.creatorAddress, computeBefore: compute });
    }
    return null;
  } catch (e) {
    console.error('[treasury]', e.shortMessage || e.message);
    return null;
  } finally {
    running = false;
  }
}

export function startTreasury(onEvent) {
  const loop = async () => {
    const ev = await treasuryTick();
    if (ev && onEvent) onEvent(ev);
  };
  loop();
  return setInterval(loop, 30_000);
}
