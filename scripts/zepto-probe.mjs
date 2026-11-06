// Read-only probe in ONE MCP session: pick an address, then search. No cart, no order.
import { connectZepto } from '../src/zepto/mcp.mjs';
const text = (r) => (r.content || []).map((c) => c.text || '').join('\n');
const c = await connectZepto({ interactive: false });
const addr = process.argv[2];
console.log(text(await c.callTool({ name: 'select_saved_address', arguments: { addressId: addr } })).slice(0, 400));
const r = await c.callTool({ name: 'search_multiple_products', arguments: { queries: ['eggs', 'onion'] } });
const t = text(r);
console.log(t.slice(0, 2500));
console.log(JSON.stringify(r.structuredContent).slice(0, 1500));
await c.close(); process.exit(0);
