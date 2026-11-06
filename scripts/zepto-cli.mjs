// node scripts/zepto-cli.mjs connect      → log in (opens Zepto login on the devbox screen), list tools
// node scripts/zepto-cli.mjs tools        → list tools with their input schemas
// node scripts/zepto-cli.mjs call <tool> '<json args>'
import { writeFileSync } from 'node:fs';
import { connectZepto } from '../src/zepto/mcp.mjs';

async function openOnScreen(url) {
  console.log('\nOpen this to log in to Zepto:\n' + url + '\n');
  try {
    const { chromium } = await import('playwright-core');
    const b = await chromium.connectOverCDP('http://127.0.0.1:9334');
    const p = await b.contexts()[0].newPage();
    await p.goto(url); await p.bringToFront();
    await b.close().catch(() => {});
    console.log('(opened in the Chrome on the devbox screen)');
  } catch (e) { console.log('(could not open Chrome automatically: ' + e.message + ')'); }
}

const [cmd = 'tools', name, args] = process.argv.slice(2);
const client = await connectZepto({ openUrl: openOnScreen });
if (cmd === 'connect' || cmd === 'tools') {
  const { tools } = await client.listTools();
  writeFileSync('/tmp/zepto-tools.json', JSON.stringify(tools, null, 1));
  for (const t of tools) console.log(`- ${t.name}: ${(t.description || '').split('\n')[0].slice(0, 140)}`);
  console.log(`\n${tools.length} tools (full schemas in /tmp/zepto-tools.json)`);
}
if (cmd === 'call') {
  const res = await client.callTool({ name, arguments: args ? JSON.parse(args) : {} });
  console.log(JSON.stringify(res, null, 1).slice(0, 6000));
}
await client.close();
process.exit(0);
