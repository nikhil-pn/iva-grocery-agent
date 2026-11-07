// Every public constant the site uses lives here. Public addresses only: no keys, no secrets.
// To update after tonight's changes, edit this file and push (Vercel redeploys from main).

/** Iva's own wallet: customers pay here, and she signs her own depositFor txs from it. */
export const IVA_WALLET = "0xbbd2beC1DFd26272c171d174BeEb4eE0488b918d";

/**
 * The 0G compute account Iva's API key bills (the one she tops up with depositFor).
 * Today it's the pc.0g.ai account 0x91ec…; it may move to Iva's own wallet.
 * Change only this line if it does.
 */
export const COMPUTE_ACCOUNT = "0x91ecffc5fcbb3f568173fc5a74045603533d172b";

/** 0G Payment Layer vault: depositFor(address) payable · balanceOf(address) view returns (uint256). */
export const PAYMENT_LAYER = "0xA3b15Bd2aD18BFB6b5f92D8AA9F444Dd59d1cE32";
export const DEPOSIT_FOR_SELECTOR = "0xaa67c919"; // depositFor(address)
export const BALANCE_OF_SELECTOR = "0x70a08231"; // balanceOf(address)

/** Public site URL (used for link previews). */
export const SITE_URL = "https://iva-grocery-agent.vercel.app";

export const BOT_USERNAME = "IvaGroceryAgentbot";
export const BOT_URL = `https://t.me/${BOT_USERNAME}`;
export const REPO_URL = "https://github.com/nikhil-pn/iva-grocery-agent";

export const HUNT_FEE_0G = 0.2;
export const DAILY_CAP_0G = 2;

export const CHAIN = {
  id: 16661,
  idHex: "0x4115",
  name: "0G Mainnet",
  rpc: "https://evmrpc.0g.ai",
  explorer: "https://chainscan.0g.ai",
  explorerApi: "https://chainscan.0g.ai/open/api",
  currency: { name: "0G", symbol: "0G", decimals: 18 },
} as const;

/** Minimum gas price Iva's pay flow uses (0G mainnet floor is ~4 gwei; wallets sometimes underprice). */
export const GAS_PRICE_FLOOR_WEI = 4_100_000_000n;

export const ZG_ROUTER = "router-api.0g.ai";

export const LINKS = {
  zeroG: "https://0g.ai",
  zeroGCompute: "https://pc.0g.ai",
  comfy: "https://www.comfy.fun",
  arkiv: "https://arkiv.network",
  ethglobal: "https://ethglobal.com/events/mumbai",
};

/** Arkiv (Rabdi testnet): Iva's public, expiring deal feed. Writer = Iva's own wallet. */
export const ARKIV = {
  site: "https://arkiv.network",
  network: "Rabdi testnet",
  chainId: 7794095,
  explorer: "https://rabdi.explorer.arkiv.network",
  schema: "iva.deal.v1",
  dealHours: 6,
  /** The first real publish (2026-11-07, Mumbai): one hunt → 7 deals in one tx. */
  proofTx: "0x89f91c6c19c3b055bf37c3f215c57a5492aa28a4d544b00e5bcc551737bd7c56",
  proofEntity: "0xd7c8e9128990e1e45e66df6fcd5a269a3dab9f4865f66104ff62010217614d50",
};

export const txUrl = (hash: string) => `${CHAIN.explorer}/tx/${hash}`;
export const addrUrl = (addr: string) => `${CHAIN.explorer}/address/${addr}`;
export const short = (s: string, head = 6, tail = 4) =>
  s.length > head + tail + 1 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;

/** The live run on 0G mainnet (2026-11-06) and the first Arkiv publish (from the README proof). */
export const PROOF: {
  icon: string;
  step: string;
  tx?: string;
  requests?: string[];
  note?: string;
  links?: { label: string; href: string }[];
}[] = [
  {
    icon: "💰",
    step: "A customer pays Iva 4.8 0G (wallet → Iva)",
    tx: "0xdba49fc9f870bb7620adf65a6e4fef7c57ae1a7ace750905886c233befa3b51e",
  },
  {
    icon: "⚡",
    step: "7 s later Iva signs depositFor herself: 1.6 0G → her 0G compute account",
    tx: "0xce31fb72627472c3eb489c47a1597f207c3801ceb541f0e4bd78e20f466cbec6",
  },
  {
    icon: "🧠",
    step: "Inference paid from that balance (go/no-go, qwen3.7-flash, 0.000188 0G)",
    requests: ["253fd0a9-eb8b-46ec-bcd9-2d4ca1018e27"],
  },
  {
    icon: "🔒",
    step: "A rich-tier hunt: glm-5.3 sealed into a TEE provider (Intel TDX attested), 0.029 0G total",
    requests: ["15a5ecb3-3c05-4f6e-92c9-1001c73af475", "5f22cbcf-89ff-403e-8d5e-656787226141"],
  },
  {
    icon: "💰",
    step: "A second customer (OKX Wallet) pays 0.2 0G",
    tx: "0x58eec12440bd324ce894e1c03a159259471838cf1368dfa15ed1650f0524bb67",
  },
  {
    icon: "⚡",
    step: "~10 s later Iva deposits 0.19 0G into her compute account by herself",
    tx: "0x5de7f01ae836e81731268f06638b7c99dfa96d6133e01b5aa3c6b9c671c48698",
  },
  {
    icon: "🛑",
    step: "Spend cap: API key “Iva” has credit_limit 2, reset_period daily (read back from GET /v1/api-keys)",
    note: "Enforced by 0G",
  },
  {
    icon: "📡",
    step: "Arkiv (Rabdi testnet): one Mumbai hunt publishes 7 deals in one tx, each expiring 6 h later on its own",
    links: [
      { label: `tx ${short(ARKIV.proofTx, 12, 8)}`, href: `${ARKIV.explorer}/tx/${ARKIV.proofTx}` },
      { label: `entity ${short(ARKIV.proofEntity, 12, 8)}`, href: `${ARKIV.explorer}/entity/${ARKIV.proofEntity}` },
    ],
  },
];

/** A real hunt from 2026-11-06 (Mumbai): "12 eggs, 1 kg onion, 1 litre milk". */
export const SAMPLE_HUNT = {
  list: "12 eggs, 1 kg onion, 1 litre milk",
  best: { shop: "Zepto", total: 213 },
  worst: { shop: "Instamart", total: 288 },
  saving: 75,
  calls: [
    { requestId: "7dcbb0a0-881b-46a1-82c6-12f6cfc858cf", model: "glm-5.3", purpose: "read text list" },
    { requestId: "2a4ffab3-f933-4126-8514-19b2d14acfa2", model: "glm-5.3", purpose: "match products across shops" },
  ],
  cost0G: 0.02846,
};

export const TIERS = [
  {
    badge: "🟢",
    name: "rich",
    when: "≥ 1 0G of compute",
    brain: "glm-5.3 sealed end-to-end into a TEE provider, plus vision for photo lists and audio for voice notes",
  },
  {
    badge: "🟡",
    name: "lean",
    when: "≥ 0.2 0G",
    brain: "qwen3.7-flash (~50× cheaper), with cheap vision still on",
  },
  {
    badge: "🔴",
    name: "survival",
    when: "below that, today's cap reached, or 0G answers 402/429",
    brain: "No LLM. Plain keyword matching and price sorting. Typed lists still work, and paid hunts refill her.",
  },
];
