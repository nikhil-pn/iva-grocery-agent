// Zepto's official MCP server (mcp.zepto.co.in) as an MCP client for Iva.
// Owner-only demo: one Zepto account, logged in once with "log in with Zepto" (OAuth + OTP).
// The login lands on a tiny local callback server on devbox; tokens are stored outside
// the repo (~/.config/pi/iva-zepto.json, chmod 600) and refreshed by the SDK.
import http from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { UnauthorizedError, registerClient, discoverAuthorizationServerMetadata } from '@modelcontextprotocol/sdk/client/auth.js';

export const ZEPTO_MCP = process.env.ZEPTO_MCP_URL || 'https://mcp.zepto.co.in/mcp';
const STORE = process.env.IVA_ZEPTO_STORE || join(homedir(), '.config/pi/iva-zepto.json');
const AUTH_SERVER = process.env.ZEPTO_AUTH_URL || 'https://auth.zepto.co.in';
const PORT = Number(process.env.IVA_ZEPTO_CALLBACK_PORT || 8766);
const REDIRECT = `http://localhost:${PORT}/callback`;
const SCOPES = [
  'tools:read', 'tools:write',
  'dev.ucp.shopping.catalog.search:read', 'dev.ucp.shopping.catalog.lookup:read',
  'dev.ucp.common.location.search:read', 'dev.ucp.common.location.lookup:read',
  'dev.ucp.shopping.cart:manage', 'dev.ucp.shopping.checkout:manage', 'dev.ucp.shopping.order:manage',
].join(' ');

const load = () => (existsSync(STORE) ? JSON.parse(readFileSync(STORE, 'utf8')) : {});
const save = (patch) => writeFileSync(STORE, JSON.stringify({ ...load(), ...patch }, null, 1), { mode: 0o600 });

export function isConnected() { return !!load().tokens?.access_token; }

class Provider {
  constructor(openUrl) { this.openUrl = openUrl; }
  get redirectUrl() { return REDIRECT; }
  get clientMetadata() {
    return {
      client_name: 'Iva Grocery Agent', redirect_uris: [REDIRECT],
      grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'],
      token_endpoint_auth_method: 'none', scope: SCOPES,
    };
  }
  clientInformation() { return load().client; }
  saveClientInformation(client) { save({ client }); }
  tokens() { return load().tokens; }
  saveTokens(tokens) { save({ tokens, tokensAt: new Date().toISOString() }); }
  saveCodeVerifier(verifier) { save({ verifier }); }
  codeVerifier() { return load().verifier; }
  async redirectToAuthorization(url) {
    // Zepto's 401 suggests only tools:read; ask once for everything ordering needs (cart, checkout, order).
    url.searchParams.set('scope', SCOPES);
    this.authUrl = url;
    if (this.openUrl) await this.openUrl(url.toString());
  }
  invalidateCredentials(scope) {
    const s = load();
    if (scope === 'all' || scope === 'tokens') delete s.tokens;
    if (scope === 'all' || scope === 'client') delete s.client;
    if (scope === 'all' || scope === 'verifier') delete s.verifier;
    writeFileSync(STORE, JSON.stringify(s, null, 1), { mode: 0o600 });
  }
}

function waitForCode(timeoutMs = 10 * 60_000) {
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      const u = new URL(req.url, REDIRECT);
      if (u.pathname !== '/callback') { res.writeHead(404).end(); return; }
      const code = u.searchParams.get('code');
      const err = u.searchParams.get('error');
      res.writeHead(200, { 'content-type': 'text/html' }).end(code
        ? '<h2>✅ Zepto connected to Iva. You can close this tab.</h2>'
        : `<h2>❌ Zepto login failed: ${String(err).replace(/[<>]/g, '')}</h2>`);
      srv.close();
      clearTimeout(t);
      code ? resolve(code) : reject(new Error(`zepto login: ${err}`));
    });
    const t = setTimeout(() => { srv.close(); reject(new Error('zepto login timed out')); }, timeoutMs);
    srv.listen(PORT, '127.0.0.1');
  });
}

/** Connect to Zepto's MCP. If not logged in, opens the login (openUrl) and waits for the OTP login. */
export async function connectZepto({ openUrl, interactive = true } = {}) {
  const provider = new Provider(openUrl);
  // Register Iva with Zepto's login server ourselves, with the full scope list
  // (the SDK would otherwise register with just the tools:read the 401 suggests).
  if (!load().client) {
    const metadata = await discoverAuthorizationServerMetadata(AUTH_SERVER);
    const client = await registerClient(AUTH_SERVER, { metadata, clientMetadata: provider.clientMetadata, scope: SCOPES });
    save({ client });
  }
  const attempt = async () => {
    const client = new Client({ name: 'iva-grocery-agent', version: '0.1.0' });
    const transport = new StreamableHTTPClientTransport(new URL(ZEPTO_MCP), { authProvider: provider });
    await client.connect(transport);
    return { client, transport };
  };
  try {
    return (await attempt()).client;
  } catch (e) {
    if (!(e instanceof UnauthorizedError) || !interactive) throw e;
    const codeP = waitForCode();
    // the first attempt already triggered redirectToAuthorization (and opened the login)
    const code = await codeP;
    const transport = new StreamableHTTPClientTransport(new URL(ZEPTO_MCP), { authProvider: provider });
    await transport.finishAuth(code);
    return (await attempt()).client;
  }
}
