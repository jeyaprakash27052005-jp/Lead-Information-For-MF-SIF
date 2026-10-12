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

export async function sendReportHandler(
  body: unknown,
  clientKey: string,
  env: Record<string, string | undefined>,
  fetchImpl: typeof fetch = fetch
): Promise<SendReportResult> {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const name = typeof b.name === 'string' ? b.name.trim().slice(0, 100) : '';
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const mobile = typeof b.mobile === 'string' ? b.mobile.trim() : '';
  const pdf = typeof b.pdfBase64 === 'string' ? b.pdfBase64 : '';
  const score = typeof b.score === 'number' ? Math.round(b.score) : null;
  const band = typeof b.band === 'string' ? b.band.slice(0, 30) : '';

  if (!name) return { status: 400, json: { error: 'Name is required.' } };
  if (!EMAIL_RE.test(email) || email.length > 120) return { status: 400, json: { error: 'Enter a valid e-mail address.' } };
  if (!MOBILE_RE.test(mobile)) return { status: 400, json: { error: 'Enter a valid 10-digit mobile number.' } };
  if (!pdf || pdf.length > MAX_BASE64_LENGTH || !pdf.startsWith('JVBERi')) {
    return { status: 400, json: { error: 'The report file is missing or too large.' } };
  }
  if (rateLimited(`${clientKey}|${email}`)) {
    return { status: 429, json: { error: 'Too many requests. Please try again in a few minutes.' } };
  }

  const apiKey = env.BREVO_API_KEY;
  const fromEmail = env.REPORT_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    return { status: 503, json: { error: 'EMAIL_NOT_CONFIGURED', emailSent: false } };
  }

  const subject = 'Your Finance Health Check-up Report';
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
        htmlContent: html,
        attachment: [{ name: 'Finance-Health-Check-up-Report.pdf', content: pdf }],
      }),
    });
  } catch (_e) {
    return { status: 502, json: { error: 'The e-mail service could not be reached.', emailSent: false } };
  }
  if (!res.ok) {
    return { status: 502, json: { error: 'The e-mail service did not accept the message.', emailSent: false } };
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
