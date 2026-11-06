// One shared headless Chrome for all shops. Each (shop, location) gets its own
// browser context so cookies/geolocation never leak between users or shops.
// Shops have no public price API, so we load their own search page and read the
// JSON that page fetches for itself (the site signs its own requests).
import { chromium } from 'playwright-core';
import { cfg } from '../config.mjs';

let browserP = null;
const contexts = new Map();

export async function browser() {
  if (!browserP) {
    browserP = chromium.launch({
      executablePath: cfg.chrome,
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'],
    });
    browserP.then((b) => b.on('disconnected', () => { browserP = null; contexts.clear(); }));
  }
  return browserP;
}

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

/** Get (or create) a context for a shop at a location. `setup(ctx)` seeds cookies etc. */
export async function contextFor(shop, lat, lng, setup) {
  const key = `${shop}:${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (contexts.has(key)) return contexts.get(key);
  const b = await browser();
  const ctx = await b.newContext({
    userAgent: UA,
    viewport: { width: 1366, height: 900 },
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    geolocation: { latitude: lat, longitude: lng },
    permissions: ['geolocation'],
  });
  if (setup) await setup(ctx);
  contexts.set(key, ctx);
  // keep memory bounded: close the oldest location contexts beyond 12
  while (contexts.size > 12) {
    const [oldKey, oldCtx] = contexts.entries().next().value;
    contexts.delete(oldKey);
    oldCtx.close().catch(() => {});
  }
  return ctx;
}

/**
 * Open `url` in a fresh page and collect JSON bodies of responses whose URL
 * passes `match`. Resolves after the first hit settles (or the timeout).
 */
export async function captureJson(ctx, url, match, { timeoutMs = 25000, settleMs = 2500, onLoad } = {}) {
  const page = await ctx.newPage();
  const bodies = [];
  let firstHitAt = 0;
  page.on('response', async (resp) => {
    if (!match(resp.url())) return;
    try {
      const text = await resp.text();
      bodies.push(JSON.parse(text));
      firstHitAt ||= Date.now();
    } catch { /* preflight / non-JSON */ }
  });
  const started = Date.now();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    if (onLoad) await onLoad(page).catch(() => {});
    while (Date.now() - started < timeoutMs) {
      if (firstHitAt && Date.now() - firstHitAt > settleMs) break;
      await page.waitForTimeout(400);
    }
  } finally {
    await page.close().catch(() => {});
  }
  return bodies;
}

/** Walk any JSON tree, calling fn(node) on every object. */
export function walk(node, fn) {
  if (node == null || typeof node !== 'object') return;
  if (Array.isArray(node)) { for (const x of node) walk(x, fn); return; }
  fn(node);
  for (const k in node) walk(node[k], fn);
}

export async function closeAll() {
  const b = await browserP;
  if (b) await b.close().catch(() => {});
  browserP = null; contexts.clear();
}
