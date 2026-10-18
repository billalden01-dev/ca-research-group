// CA Research Group - contact form.
// POST JSON { name, company, email, message, website } from /contact.html.
// Emails the message to william@caresearchgroup.com and saves a copy in Airtable (Prospects table),
// so nothing is lost if one of the two fails.
//
// Uses the Vercel Environment Variables already set for reports: RESEND_API_KEY, RESEND_FROM, AIRTABLE_TOKEN.

declare const process: { env: Record<string, string | undefined> };

const TO = 'william@caresearchgroup.com';
const AIRTABLE_BASE = 'appi5Q5zd611aH9P3';
const PROSPECTS_TABLE = 'tblq5Jnyur6LBpfN1';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const clip = (v: unknown, n = 200) => str(v).trim().slice(0, n);
const escapeHtml = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

async function sendEmail(name: string, company: string, email: string, message: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is missing in Vercel.');
  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;color:#1e293b;line-height:1.6;max-width:560px">
<h2 style="font-family:Georgia,serif;color:#1e1b4b;margin:0 0 12px">New message from the website</h2>
<p style="margin:0"><strong>Name:</strong> ${escapeHtml(name)}</p>
${company ? `<p style="margin:0"><strong>Company:</strong> ${escapeHtml(company)}</p>` : ''}
<p style="margin:0 0 14px"><strong>Email:</strong> ${escapeHtml(email)}</p>
<div style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px">${escapeHtml(message)}</div>
<p style="font-size:12px;color:#64748b">Reply to this email to answer them directly. A copy is saved in Airtable (Prospects).</p>
</div>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'CA Research Group <onboarding@resend.dev>',
      to: [TO],
      reply_to: email,
      subject: `Website message from ${name}${company ? ` (${company})` : ''}`,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function saveToAirtable(name: string, company: string, email: string, message: string, emailed: boolean): Promise<void> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error('AIRTABLE_TOKEN is missing in Vercel.');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${PROSPECTS_TABLE}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      typecast: true,
      records: [{
        fields: {
          Name: company ? `${name} (${company})` : name,
          Email: email,
          Channel: 'Inbound - our Contact page',
          'Date Contacted': today,
          Notes: `${message}${emailed ? '' : '\n\n[Email notification failed. Reply from here.]'}`,
        },
      }],
    }),
  });
  if (!res.ok) throw new Error(`Airtable returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

export async function POST(request: Request) {
  let b: Record<string, unknown>;
  try {
    b = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'The form could not be read. Please try again.' }, 400);
  }
  // Hidden "website" field: real people never fill it in, spam bots usually do.
  if (clip(b.website)) return json({ ok: true });

  const name = clip(b.name, 100);
  const company = clip(b.company, 150);
  const email = clip(b.email, 200);
  const message = clip(b.message, 4000);
  if (!name || !message) return json({ error: 'Please enter your name and a message.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter a valid email address.' }, 400);

  let emailed = false;
  try {
    await sendEmail(name, company, email, message);
    emailed = true;
  } catch (err) {
    console.error('Contact email failed', err);
  }
  let saved = false;
  try {
    await saveToAirtable(name, company, email, message, emailed);
    saved = true;
  } catch (err) {
    console.error('Contact save failed', err);
  }
  if (!emailed && !saved) return json({ error: `Your message could not be sent just now. Please email us at ${TO}.` }, 502);
  return json({ ok: true });
}
