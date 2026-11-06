// 0G Router (0G Private Computer): OpenAI-compatible inference.
// Every call returns the 0G request_id and its exact cost, and is logged.
import { randomUUID } from 'node:crypto';
import { cfg } from '../config.mjs';
import { logEvent, addSpend } from '../ledger.mjs';

export class BrokeError extends Error { constructor(m, code) { super(m); this.code = code; } }

export const toOG = (neuron) => Number(BigInt(neuron || 0)) / 1e18;

/**
 * chat({ model, messages, maxTokens, json, purpose, tier, privateTee })
 * → { text, requestId, cost0G, model, teeVerified }
 */
export async function chat({ model, messages, maxTokens = 700, json = false, purpose = '', tier = '', privateTee = false }) {
  if (!cfg.zgApiKey) throw new BrokeError('no 0G API key configured', 'no_key');
  const clientId = `iva-${randomUUID()}`;
  const body = {
    model, messages, max_tokens: maxTokens, temperature: 0.2,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
    ...(model.startsWith('glm-5') ? { reasoning_effort: 'low' } : {}),
    ...(privateTee ? { verify_tee: true } : {}),
  };
  const res = await fetch(`${cfg.routerUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.zgApiKey}`,
      'Content-Type': 'application/json',
      'X-Client-Request-Id': clientId,
      ...(privateTee ? { 'X-0G-Provider-Trust-Mode': 'private' } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });
  const raw = await res.text();
  let j; try { j = JSON.parse(raw); } catch { j = {}; }
  if (res.status === 402 || res.status === 429) {
    const code = j.error?.code || j.error?.type || (res.status === 402 ? 'insufficient_balance' : 'rate_limited');
    logEvent('inference_refused', { model, status: res.status, code, purpose });
    throw new BrokeError(`0G refused: ${res.status} ${code}`, code);
  }
  if (!res.ok) throw new Error(`0G router ${res.status}: ${raw.slice(0, 300)}`);

  const trace = j.x_0g_trace || {};
  const costNeuron = trace.billing?.total_cost ?? '0';
  const out = {
    text: j.choices?.[0]?.message?.content ?? '',
    requestId: trace.request_id || res.headers.get('x-request-id') || clientId,
    cost0G: toOG(costNeuron),
    model: j.model || model,
    teeVerified: trace.tee_verified,
    provider: trace.provider || trace.provider_identity,
    usage: j.usage,
  };
  addSpend(costNeuron);
  logEvent('inference', { requestId: out.requestId, model: out.model, tier, purpose, cost0G: out.cost0G,
    teeVerified: out.teeVerified ?? null, tokensIn: j.usage?.prompt_tokens, tokensOut: j.usage?.completion_tokens });
  return out;
}

/** Parse a JSON answer even if the model wrapped it in prose or code fences. */
export function parseJson(text) {
  const t = String(text || '').replace(/```(?:json)?/g, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('model did not return JSON');
  return JSON.parse(t.slice(a, b + 1));
}
