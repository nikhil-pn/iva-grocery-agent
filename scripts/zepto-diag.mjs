// Diagnose ordering WITHOUT placing an order: one session, address -> cart view -> payment methods -> preview.
import { connectZepto } from '../src/zepto/mcp.mjs';
const text = (r) => (r.content || []).map((c) => c.text || '').join('\n');
const c = await connectZepto({ interactive: false });
const show = async (name, args = {}) => {
  const r = await c.callTool({ name, arguments: args });
  console.log(`\n===== ${name} ${JSON.stringify(args)} isError=${!!r.isError}\n${text(r).slice(0, 2500)}`);
  if (r.structuredContent) console.log('structured:', JSON.stringify(r.structuredContent).slice(0, 1500));
  return r;
};
await show('select_saved_address', { addressId: process.argv[2] });
await show('view_cart');
await show('get_payment_methods');
await show('create_order', { confirmOrder: false, userAddressId: process.argv[2] });
await c.close(); process.exit(0);
