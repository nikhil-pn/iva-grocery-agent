// Go/no-go for the self-funding loop. Proves, with real hashes and request IDs:
//  1. Iva's compute balance before
//  2. one cheap 0G inference billed to Iva's account (request_id + cost)
//  3. the balance after
// Run after Iva has some compute (a customer paid and the treasury deposited).
import { funds } from '../src/zg/account.mjs';
import { chat } from '../src/zg/router.mjs';
import { cfg } from '../src/config.mjs';
const before = await funds();
console.log('before', before);
const r = await chat({ model: cfg.models.lean.text, purpose: 'go/no-go', tier: 'lean', maxTokens: 30,
  messages: [{ role: 'user', content: 'Reply with exactly: Iva is alive.' }] });
console.log('reply', JSON.stringify(r.text), 'request_id', r.requestId, 'cost', r.cost0G, '0G');
await new Promise((res) => setTimeout(res, 12000));
console.log('after', await funds());
