// Iva's wallet on 0G mainnet: verify customer payments, top up her own compute
// account (Payment Layer depositFor), and pay her creator a dividend.
import { createPublicClient, createWalletClient, http, defineChain, parseEther, formatEther, decodeEventLog } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { cfg } from './config.mjs';

export const zg = defineChain({
  id: cfg.chainId, name: '0G Mainnet',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: { default: { http: [cfg.rpcUrl] } },
  blockExplorers: { default: { name: '0G Chainscan', url: cfg.explorer } },
});

const VAULT_ABI = [
  { type: 'function', name: 'depositFor', stateMutability: 'payable', inputs: [{ name: 'user', type: 'address' }], outputs: [] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256' }] },
];

export const pub = createPublicClient({ chain: zg, transport: http(cfg.rpcUrl) });
const account = cfg.ivaPrivateKey ? privateKeyToAccount(cfg.ivaPrivateKey) : null;
const wallet = account ? createWalletClient({ account, chain: zg, transport: http(cfg.rpcUrl) }) : null;
export const ivaAddress = account?.address || cfg.ivaAddress;
// the 0G compute account Iva funds (her own address unless configured otherwise)
export const computeAccount = cfg.computeAccount || ivaAddress;

export async function walletBalance0G() {
  return Number(formatEther(await pub.getBalance({ address: ivaAddress })));
}

export async function vaultBalance0G(addr = computeAccount) {
  const b = await pub.readContract({ address: cfg.paymentVault, abi: VAULT_ABI, functionName: 'balanceOf', args: [addr] });
  return Number(formatEther(b));
}

/** Iva pays for her own brain: deposit into her own 0G compute account. */
export async function depositToCompute(amount0G) {
  if (!wallet) throw new Error('no Iva private key');
  const hash = await wallet.writeContract({
    address: cfg.paymentVault, abi: VAULT_ABI, functionName: 'depositFor',
    args: [computeAccount], value: parseEther(amount0G.toFixed(6)),
  });
  const r = await pub.waitForTransactionReceipt({ hash, timeout: 90_000 });
  if (r.status !== 'success') throw new Error(`deposit reverted ${hash}`);
  return hash;
}

export async function sendNative(to, amount0G) {
  if (!wallet) throw new Error('no Iva private key');
  const hash = await wallet.sendTransaction({ to, value: parseEther(amount0G.toFixed(6)) });
  const r = await pub.waitForTransactionReceipt({ hash, timeout: 90_000 });
  if (r.status !== 'success') throw new Error(`transfer reverted ${hash}`);
  return hash;
}

/**
 * Check a customer's payment. Accepts either a plain 0G transfer to Iva's wallet,
 * or a depositFor(iva) call that pays Iva's compute account directly.
 * → { ok, from, amount0G, kind, reason }
 */
export async function verifyPayment(hash) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) return { ok: false, reason: 'not a transaction hash' };
  let tx, rc;
  try {
    [tx, rc] = await Promise.all([pub.getTransaction({ hash }), pub.waitForTransactionReceipt({ hash, timeout: 60_000 })]);
  } catch { return { ok: false, reason: 'transaction not found on 0G mainnet (yet)' }; }
  if (rc.status !== 'success') return { ok: false, reason: 'transaction failed' };
  const to = (tx.to || '').toLowerCase();
  const amount0G = Number(formatEther(tx.value));
  if (to === ivaAddress.toLowerCase()) return { ok: true, from: tx.from, amount0G, kind: 'wallet' };
  if (to === cfg.paymentVault.toLowerCase() && tx.input?.startsWith('0xaa67c919')) {
    const target = '0x' + tx.input.slice(34, 74);
    if (target.toLowerCase() === computeAccount.toLowerCase()) return { ok: true, from: tx.from, amount0G, kind: 'compute' };
  }
  return { ok: false, reason: 'that payment was not sent to Iva' };
}

/** Incoming payments to Iva's wallet, from the 0G explorer API (newest first). */
export async function incomingPayments() {
  const url = `${cfg.explorer}/open/api?module=account&action=txlist&address=${ivaAddress}&sort=desc`;
  const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const j = await r.json();
  return (j.result || []).filter((t) => t.to?.toLowerCase() === ivaAddress.toLowerCase()
    && t.isError === '0' && BigInt(t.value) > 0n)
    .map((t) => ({ tx: t.hash, from: t.from, amount0G: Number(formatEther(BigInt(t.value))), at: Number(t.timestamp) }));
}
