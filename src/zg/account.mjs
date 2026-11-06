// Iva reads her own balances. Two sources, so she still knows where she stands
// even if one is down:
//  - 0G Router /account/funds (management key): router ledger + Payment Layer vault
//  - the Payment Layer vault onchain: balanceOf(iva), no key needed
import { cfg } from '../config.mjs';
import { vaultBalance0G } from '../chain.mjs';

export async function funds() {
  let router = null, vault = null, total = null, err = null;
  if (cfg.zgMgmtKey) {
    try {
      const r = await fetch(`${cfg.routerUrl}/account/funds`, {
        headers: { Authorization: `Bearer ${cfg.zgMgmtKey}` }, signal: AbortSignal.timeout(15000),
      });
      const j = await r.json();
      if (r.ok) {
        const n = (x) => (x == null ? null : Number(BigInt(String(x).split('.')[0])) / 1e18);
        router = n(j.router?.subtotal ?? j.router?.deposit);
        vault = n(j.payment_layer?.balance);
        total = n(j.total);
      } else err = `funds ${r.status}`;
    } catch (e) { err = e.message; }
  }
  if (vault == null) {
    try { vault = await vaultBalance0G(); } catch (e) { err ||= e.message; }
  }
  // What the Router will actually let Iva spend: ledger + 80% of the vault.
  const spendable = total ?? ((router || 0) + (vault || 0) * 0.8);
  return { router, vault, total, spendable, err };
}

/** Today's usage on the capped sk- key, if the management key can read keys. */
export async function keyUsage() {
  if (!cfg.zgMgmtKey) return null;
  try {
    const r = await fetch(`${cfg.routerUrl}/api-keys`, {
      headers: { Authorization: `Bearer ${cfg.zgMgmtKey}` }, signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const keys = j.data || j.keys || j;
    return Array.isArray(keys) ? keys.map((k) => ({ name: k.name, used: k.used, limit: k.credit_limit, reset: k.reset_period })) : null;
  } catch { return null; }
}
