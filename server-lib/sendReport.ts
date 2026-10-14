// ---------------------------------------------------------------------------
// E-mails the Finance Health Check-up PDF to the customer.
// Runs as a serverless function (Vercel `api/send-report`). It uses Brevo's transactional e-mail API,
// so it only needs HTTPS - no extra packages. Set these environment variables on the hosting project:
//   BREVO_API_KEY       - API key from your Brevo account (free plan is enough to start)
//   REPORT_FROM_EMAIL   - a sender e-mail address that is verified in Brevo (a Gmail address works)
//   REPORT_FROM_NAME    - (optional) sender name shown to the customer
// ---------------------------------------------------------------------------

export interface SendReportResult {
  status: number;
  json: Record<string, unknown>;
}

const MAX_BASE64_LENGTH = 4_000_000; // about 3 MB of PDF
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE_RE = /^[6-9][0-9]{9}$/;

// Simple per-instance limit so the form cannot be used to flood someone's inbox
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

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));


const brevoMessage = async (res: Response): Promise<string> => {
  try {
    const j = (await res.json()) as { message?: unknown; code?: unknown };
    return `${typeof j.code === 'string' ? j.code + ': ' : ''}${typeof j.message === 'string' ? j.message : ''}`.slice(0, 250);
  } catch (_e) {
    return '';
  }
};

const reasonFor = (status: number, detail: string): string => {
  if (status === 401 || status === 403) return 'BREVO_KEY_INVALID';
  if (/sender/i.test(detail)) return 'SENDER_NOT_VERIFIED';
  return 'BREVO_REJECTED';
};

/** Checks the e-mail settings without sending anything to a customer */
async function checkSetup(env: Record<string, string | undefined>, fetchImpl: typeof fetch): Promise<SendReportResult> {
  const missing: string[] = [];
  if (!env.BREVO_API_KEY) missing.push('BREVO_API_KEY');
  if (!env.REPORT_FROM_EMAIL) missing.push('REPORT_FROM_EMAIL');
  if (missing.length) return { status: 200, json: { ok: false, reason: 'EMAIL_NOT_CONFIGURED', missing } };
  try {
    const acc = await fetchImpl('https://api.brevo.com/v3/account', {
      headers: { 'api-key': env.BREVO_API_KEY as string, accept: 'application/json' },
    });
    if (!acc.ok) {
      const detail = await brevoMessage(acc);
      return { status: 200, json: { ok: false, reason: reasonFor(acc.status, detail), detail } };
    }
    const sen = await fetchImpl('https://api.brevo.com/v3/senders', {
      headers: { 'api-key': env.BREVO_API_KEY as string, accept: 'application/json' },
    });
    if (sen.ok) {
      const j = (await sen.json()) as { senders?: { email?: string; active?: boolean }[] };
      const mine = (j.senders || []).find((x) => (x.email || '').toLowerCase() === (env.REPORT_FROM_EMAIL as string).toLowerCase());
      if (!mine) return { status: 200, json: { ok: false, reason: 'SENDER_NOT_VERIFIED', detail: 'This sender address is not added in Brevo.' } };
      if (mine.active === false) return { status: 200, json: { ok: false, reason: 'SENDER_NOT_VERIFIED', detail: 'This sender address is added but not verified yet.' } };
    }
    return { status: 200, json: { ok: true } };
  } catch (_e) {
    return { status: 200, json: { ok: false, reason: 'UNREACHABLE', detail: 'The e-mail service could not be reached.' } };
  }
}

export async function sendReportHandler(
  body: unknown,
  clientKey: string,
  env: Record<string, string | undefined>,
  fetchImpl: typeof fetch = fetch
): Promise<SendReportResult> {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (b.action === 'check') return checkSetup(env, fetchImpl);
  const isTest = b.action === 'test';

  const name = typeof b.name === 'string' ? b.name.trim().slice(0, 100) : '';
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const mobile = typeof b.mobile === 'string' ? b.mobile.trim() : '';
  const pdf = typeof b.pdfBase64 === 'string' ? b.pdfBase64 : '';
  const score = typeof b.score === 'number' ? Math.round(b.score) : null;
  const band = typeof b.band === 'string' ? b.band.slice(0, 30) : '';

  if (!name) return { status: 400, json: { error: 'Name is required.' } };
  if (!EMAIL_RE.test(email) || email.length > 120) return { status: 400, json: { error: 'Enter a valid e-mail address.' } };
  if (!isTest && !MOBILE_RE.test(mobile)) return { status: 400, json: { error: 'Enter a valid 10-digit mobile number.' } };
  if (!isTest && (!pdf || pdf.length > MAX_BASE64_LENGTH || !pdf.startsWith('JVBERi'))) {
    return { status: 400, json: { error: 'The report file is missing or too large.' } };
  }
  if (rateLimited(`${clientKey}|${email}`)) {
    return { status: 429, json: { error: 'Too many requests. Please try again in a few minutes.' } };
  }

  const apiKey = env.BREVO_API_KEY;
  const fromEmail = env.REPORT_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    return { status: 503, json: { error: 'EMAIL_NOT_CONFIGURED', reason: 'EMAIL_NOT_CONFIGURED', emailSent: false } };
  }

  const subject = isTest ? 'Test e-mail from the Finance Health Check-up site' : 'Your Finance Health Check-up Report';
  const html = `<p>Dear ${esc(name)},</p>
<p>Thank you for taking the Finance Health Check-up. Your report is attached to this e-mail as a PDF${
    score !== null ? ` (financial health score: <b>${score}/100${band ? ' - ' + esc(band) : ''}</b>)` : ''
  }.</p>
<p>Our team may contact you on <b>${esc(mobile)}</b> to help you with your next steps.</p>
<p style="color:#64748b;font-size:12px">This report is based only on your own answers and is for general awareness. It is not financial, tax or legal advice.</p>`;

  let res: Response;
  try {
    res = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: env.REPORT_FROM_NAME || 'Finance Health Check-up', email: fromEmail },
        to: [{ email, name }],
        subject,
        htmlContent: isTest ? '<p>This is a test. Your e-mail settings work, and health check-up reports can be e-mailed.</p>' : html,
        ...(isTest ? {} : { attachment: [{ name: 'Finance-Health-Check-up-Report.pdf', content: pdf }] }),
      }),
    });
  } catch (_e) {
    return { status: 502, json: { error: 'The e-mail service could not be reached.', reason: 'UNREACHABLE', emailSent: false } };
  }
  if (!res.ok) {
    const detail = await brevoMessage(res);
    return { status: 502, json: { error: 'The e-mail service did not accept the message.', reason: reasonFor(res.status, detail), detail, emailSent: false } };
  }
  return { status: 200, json: { emailSent: true } };
}

/** Express / Vercel style (req, res) wrapper */
export async function nodeHandler(
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
  const out = await sendReportHandler(req.body, ip, process.env as Record<string, string | undefined>);
  return res.status(out.status).json(out.json);
}
