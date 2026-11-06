// Runtime configuration. Secrets come from an env file kept OUTSIDE the repo
// (IVA_ENV_FILE, default ~/.config/pi/iva-agent.env) or from .env / process.env.
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseEnvFile(path) {
  if (!path || !existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#')) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

const fileEnv = {
  ...parseEnvFile(join(ROOT, '.env')),
  ...parseEnvFile(process.env.IVA_ENV_FILE || join(homedir(), '.config/pi/iva-agent.env')),
};
const env = (k, d = '') => process.env[k] ?? fileEnv[k] ?? d;
const num = (k, d) => Number(env(k, String(d)));

export const cfg = {
  telegramToken: env('TELEGRAM_BOT_TOKEN'),
  botUsername: env('TELEGRAM_BOT_USERNAME', ''),
  payPageUrl: env('PAY_PAGE_URL', 'https://nikhil-pn.github.io/iva-grocery-agent/pay.html'),

  ivaAddress: env('IVA_ADDRESS'),
  ivaPrivateKey: env('IVA_PRIVATE_KEY'),
  creatorAddress: env('CREATOR_ADDRESS', ''),

  // 0G mainnet
  chainId: 16661,
  rpcUrl: env('ZG_RPC_URL', 'https://evmrpc.0g.ai'),
  explorer: 'https://chainscan.0g.ai',
  // 0G Payment Layer vault: depositFor(address) payable / balanceOf(address)
  paymentVault: env('ZG_PAYMENT_VAULT', '0xA3b15Bd2aD18BFB6b5f92D8AA9F444Dd59d1cE32'),

  // 0G Router (0G Private Computer), OpenAI-compatible
  routerUrl: env('ZG_ROUTER_URL', 'https://router-api.0g.ai/v1'),
  zgApiKey: env('ZG_API_KEY'),   // sk- with a daily credit_limit (hard cap enforced by 0G)
  zgMgmtKey: env('ZG_MGMT_KEY'), // mk- with account:read (Iva reads her own balance)

  // Economics (all in 0G)
  huntFee: num('IVA_HUNT_FEE', 0.2),          // price of one hunt
  freeHunts: num('IVA_FREE_HUNTS', 1),        // free hunts per new user (funded by Iva herself)
  gasReserve: num('IVA_GAS_RESERVE', 0.02),   // never deposit below this wallet balance
  computeTarget: num('IVA_COMPUTE_TARGET', 1.5), // top compute up towards this
  minDeposit: num('IVA_MIN_DEPOSIT', 0.05),
  dividendAbove: num('IVA_DIVIDEND_ABOVE', 3), // wallet surplus above this goes to the creator
  dailySpendCap: num('IVA_DAILY_CAP', 0.5),    // Iva's own soft cap; the sk- key enforces the hard cap

  // Brain tiers (compute balance in 0G)
  richMin: num('IVA_RICH_MIN', 1.0),
  leanMin: num('IVA_LEAN_MIN', 0.2),
  models: {
    rich: { text: env('IVA_RICH_MODEL', 'glm-5.3'), vision: 'qwen3-vl-plus', audio: 'qwen3-omni-flash' },
    lean: { text: env('IVA_LEAN_MODEL', 'qwen3.7-flash'), vision: 'qwen2.5-vl-72b-instruct', audio: 'qwen3-omni-flash' },
  },

  // Default location: Mumbai (Bandra Kurla Complex). Users can share their own.
  defaultLat: num('IVA_DEFAULT_LAT', 19.0662),
  defaultLng: num('IVA_DEFAULT_LNG', 72.8697),
  chrome: env('IVA_CHROME', '/opt/google/chrome/chrome'),

  dataDir: env('IVA_DATA_DIR', join(ROOT, 'data')),
};

mkdirSync(cfg.dataDir, { recursive: true });

export function txUrl(hash) { return `${cfg.explorer}/tx/${hash}`; }
export function addrUrl(a) { return `${cfg.explorer}/address/${a}`; }
