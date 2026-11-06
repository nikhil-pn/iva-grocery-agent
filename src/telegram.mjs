// Minimal Telegram Bot API client (long polling). Uses node:https pinned to IPv4:
// on some networks api.telegram.org is unreachable over IPv6 and fetch()'s
// dual-stack connect stalls until it times out.
import https from 'node:https';
import { cfg } from './config.mjs';

function request(path, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = https.request({
      host: 'api.telegram.org', path, family: 4, method: data ? 'POST' : 'GET',
      headers: data ? { 'Content-Type': 'application/json', 'Content-Length': data.length } : {},
      timeout: timeoutMs,
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('timeout', () => req.destroy(new Error(`telegram timeout ${path.split('/').pop()}`)));
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

export async function tg(method, body = {}) {
  const buf = await request(`/bot${cfg.telegramToken}/${method}`, body, method === 'getUpdates' ? 60_000 : 30_000);
  const j = JSON.parse(buf.toString('utf8'));
  if (!j.ok) throw new Error(`${method}: ${j.description}`);
  return j.result;
}

export const send = (chat_id, text, extra = {}) => tg('sendMessage', {
  chat_id, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true }, ...extra,
});
export const edit = (chat_id, message_id, text, extra = {}) => tg('editMessageText', {
  chat_id, message_id, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true }, ...extra,
}).catch(() => send(chat_id, text, extra));

export async function download(fileId) {
  const f = await tg('getFile', { file_id: fileId });
  const buf = await request(`/file/bot${cfg.telegramToken}/${f.file_path}`, null, 60_000);
  return { buf, path: f.file_path };
}

export async function poll(onUpdate) {
  let offset = 0;
  for (;;) {
    try {
      const ups = await tg('getUpdates', { offset, timeout: 30, allowed_updates: ['message'] });
      for (const u of ups) {
        offset = u.update_id + 1;
        onUpdate(u).catch((e) => console.error('[update]', e));
      }
    } catch (e) {
      console.error('[poll]', e.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}
