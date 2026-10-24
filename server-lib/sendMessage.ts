// ---------------------------------------------------------------------------
// Sends the Finance Health Check-up report to the customer's phone automatically:
//   1. WhatsApp (Meta WhatsApp Cloud API) - the PDF plus the full report text
//   2. SMS (Twilio) - a short text with the score and main points (used when WhatsApp is not set up or fails)
// Environment variables (set on the hosting project, never in the code):
//   WHATSAPP_TOKEN, WHATSAPP_PHONE_ID            - WhatsApp Cloud API access token and the sending phone number ID
//   WHATSAPP_TEMPLATE, WHATSAPP_TEMPLATE_LANG    - (recommended) approved template with a DOCUMENT header and 2 body variables:
//                                                  {{1}} = customer name, {{2}} = score. Needed to message people who have not
//                                                  written to your number in the last 24 hours.
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (or TWILIO_MESSAGING_SERVICE_SID) - SMS
// ---------------------------------------------------------------------------
import type { SendReportResult } from './sendReport';

const MOBILE_RE = /^[6-9][0-9]{9}$/;
const MAX_BASE64_LENGTH = 4_000_000;
const GRAPH = 'https://graph.facebook.com/v21.0';

const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
const rateLimited = (key: string) => {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
};

type Env = Record<string, string | undefined>;
const whatsappReady = (e: Env) => !!(e.WHATSAPP_TOKEN && e.WHATSAPP_PHONE_ID);
const smsReady = (e: Env) => !!(e.TWILIO_ACCOUNT_SID && e.TWILIO_AUTH_TOKEN && (e.TWILIO_FROM || e.TWILIO_MESSAGING_SERVICE_SID));

const errText = async (res: Response) => {
  try {
    const j = (await res.json()) as { error?: { message?: string }; message?: string };
    return String(j?.error?.message || j?.message || '').slice(0, 200);
  } catch (_e) {
    return '';
  }
};

async function sendWhatsApp(
  env: Env,
  f: typeof fetch,
  p: { mobile: string; name: string; text: string; pdf: string; score: number | null; band: string }
): Promise<{ ok: boolean; detail?: string }> {
  const auth = { Authorization: `Bearer ${env.WHATSAPP_TOKEN}` };
  const to = `91${p.mobile}`;
  const filename = 'Finance-Health-Check-up-Report.pdf';
  try {
    // 1) upload the PDF
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', 'application/pdf');
    form.append('file', new Blob([Buffer.from(p.pdf, 'base64')], { type: 'application/pdf' }), filename);
    const up = await f(`${GRAPH}/${env.WHATSAPP_PHONE_ID}/media`, { method: 'POST', headers: auth, body: form });
    if (!up.ok) return { ok: false, detail: await errText(up) };
    const mediaId = ((await up.json()) as { id?: string }).id;
    if (!mediaId) return { ok: false, detail: 'WhatsApp did not accept the PDF.' };

    const send = (body: Record<string, unknown>) =>
      f(`${GRAPH}/${env.WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST',
        headers: { ...auth, 'content-type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to, ...body }),
      });

    // 2) the PDF: with the approved template when set (works for any customer), otherwise as a normal document message
    const first = env.WHATSAPP_TEMPLATE
      ? await send({
          type: 'template',
          template: {
            name: env.WHATSAPP_TEMPLATE,
            language: { code: env.WHATSAPP_TEMPLATE_LANG || 'en' },
            components: [
              { type: 'header', parameters: [{ type: 'document', document: { id: mediaId, filename } }] },
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: p.name },
                  { type: 'text', text: p.score !== null ? `${p.score}/100${p.band ? ' (' + p.band + ')' : ''}` : '-' },
                ],
              },
            ],
          },
        })
      : await send({ type: 'document', document: { id: mediaId, filename, caption: `Finance Health Check-up Report - ${p.name}` } });
    if (!first.ok) return { ok: false, detail: await errText(first) };

    // 3) the full report as text (allowed because the first message opened the conversation)
    await send({ type: 'text', text: { body: p.text.slice(0, 4000), preview_url: false } }).catch(() => undefined);
    return { ok: true };
  } catch (_e) {
    return { ok: false, detail: 'WhatsApp could not be reached.' };
  }
}

async function sendSms(env: Env, f: typeof fetch, p: { mobile: string; text: string }): Promise<{ ok: boolean; detail?: string }> {
  try {
    const body = new URLSearchParams({ To: `+91${p.mobile}`, Body: p.text.slice(0, 600) });
    if (env.TWILIO_MESSAGING_SERVICE_SID) body.set('MessagingServiceSid', env.TWILIO_MESSAGING_SERVICE_SID);
    else body.set('From', env.TWILIO_FROM as string);
    const res = await f(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    return res.ok ? { ok: true } : { ok: false, detail: await errText(res) };
  } catch (_e) {
    return { ok: false, detail: 'The SMS service could not be reached.' };
  }
}

export async function sendMessageHandler(
  body: unknown,
  clientKey: string,
  env: Env,
  fetchImpl: typeof fetch = fetch
): Promise<SendReportResult> {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const wa = whatsappReady(env);
  const sms = smsReady(env);
  if (b.action === 'check') return { status: 200, json: { ok: wa || sms, whatsapp: wa, sms, template: !!env.WHATSAPP_TEMPLATE } };

  const name = typeof b.name === 'string' ? b.name.trim().slice(0, 100) : '';
  const mobile = typeof b.mobile === 'string' ? b.mobile.trim() : '';
  const text = typeof b.text === 'string' ? b.text.slice(0, 4000) : '';
  const smsText = typeof b.smsText === 'string' ? b.smsText.slice(0, 600) : text.slice(0, 600);
  const pdf = typeof b.pdfBase64 === 'string' ? b.pdfBase64 : '';
  const score = typeof b.score === 'number' ? Math.round(b.score) : null;
  const band = typeof b.band === 'string' ? b.band.slice(0, 30) : '';

  if (!name) return { status: 400, json: { error: 'Name is required.' } };
  if (!MOBILE_RE.test(mobile)) return { status: 400, json: { error: 'Enter a valid 10-digit mobile number.' } };
  if (!text) return { status: 400, json: { error: 'The message is empty.' } };
  if (!wa && !sms) return { status: 200, json: { sent: false, reason: 'MESSAGE_NOT_CONFIGURED' } };
  if (rateLimited(`${clientKey}|${mobile}`)) return { status: 429, json: { error: 'Too many requests. Please try again in a few minutes.' } };

  let waDetail: string | undefined;
  if (wa && pdf && pdf.length <= MAX_BASE64_LENGTH && pdf.startsWith('JVBERi')) {
    const r = await sendWhatsApp(env, fetchImpl, { mobile, name, text, pdf, score, band });
    if (r.ok) return { status: 200, json: { sent: true, channel: 'whatsapp' } };
    waDetail = r.detail;
  }
  if (sms) {
    const r = await sendSms(env, fetchImpl, { mobile, text: smsText });
    if (r.ok) return { status: 200, json: { sent: true, channel: 'sms' } };
    return { status: 200, json: { sent: false, reason: 'SEND_FAILED', detail: r.detail || waDetail } };
  }
  return { status: 200, json: { sent: false, reason: 'SEND_FAILED', detail: waDetail } };
}

/** Express / Vercel style (req, res) wrapper */
export async function messageNodeHandler(
  req: { method?: string; body?: unknown; headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } },
  res: { status: (c: number) => { json: (b: unknown) => void }; setHeader: (k: string, v: string) => void }
) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }
  const fwd = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  const out = await sendMessageHandler(req.body, ip, process.env as Record<string, string | undefined>);
  return res.status(out.status).json(out.json);
}
