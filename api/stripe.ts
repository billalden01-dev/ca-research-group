// CA Research Group - Stripe subscriptions.
//
// One file, three jobs:
//   POST JSON from the pricing form      -> creates a Stripe Checkout page and returns its URL
//   POST from Stripe (stripe-signature)  -> webhook: adds the customer to Airtable, emails their private link,
//                                           and keeps Subscription Status in step with Stripe
//   GET ?session_id=cs_...               -> the welcome page asks whether the new account is ready
//   GET ?release=rec...                  -> after Bill pastes the client's Data Key in Airtable, emails the client their private link
//
// New paying clients wait for their Data Key (Bill makes each one by hand in the data provider console).
// Their record gets Setup Status "Waiting for data key"; Bill gets an alert email; the private link goes out
// only once the key is in Airtable (an Airtable automation calls ?release=, or Bill clicks the link in the alert).
//
// Vercel Environment Variables:
//   STRIPE_SECRET_KEY      (required) sk_test_... while testing, sk_live_... when live
//   STRIPE_WEBHOOK_SECRET  (required for the webhook) whsec_... from the Stripe webhook endpoint
//   AIRTABLE_TOKEN, RESEND_API_KEY, RESEND_FROM  (already set for reports)
//   NOTIFY_EMAIL           (optional) gets a copy of each welcome email
//
// Stripe webhook endpoint: https://www.caresearchgroup.com/api/stripe
// Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted

declare const process: { env: Record<string, string | undefined> };

const SITE = 'https://www.caresearchgroup.com';

// Prices live here on the server, so nobody can change them from the browser.
// oneTime: a single report paid once (no subscription). The labels must match the Plan choices in Airtable.
const PLANS: Record<string, { label: string; name: string; cents: number; oneTime?: boolean }> = {
  single: { label: 'Single Report ($59)', name: 'Single Report', cents: 5900, oneTime: true },
  five: { label: '5 Reports ($199/mo)', name: '5 Reports per Month', cents: 19900 },
  ten: { label: '10 Reports ($299/mo)', name: '10 Reports per Month', cents: 29900 },
  twentyfive: { label: '25 Reports ($499/mo)', name: '25 Reports per Month', cents: 49900 },
};

// The two required order-form checkboxes, word for word (keep in sync with App.tsx). Saved with each customer.
const AGREEMENT_TEXT = [
  'I agree to the Terms of Service and Privacy Policy.',
  'I understand reports are based on official public records, which may occasionally be incomplete or outdated, and that CA Research Group recommends doing my own due diligence before making any decision.',
];
const TERMS_VERSION = 'Terms of Service effective November 4, 2026';

const ROLES = [
  'Hard money lender or lending institution',
  'Attorney or legal counsel',
  'Commercial real estate broker',
  'Commercial real estate brokerage',
  'Business broker',
  'Real estate investor',
  'Title or escrow company',
  'Other',
];

const timeout = (ms: number) => AbortSignal.timeout(ms);
const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const clip = (v: unknown, n = 200) => str(v).trim().slice(0, n);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

// ---------- Stripe ----------

type StripeObj = Record<string, unknown>;

function formEncode(data: Record<string, unknown>, prefix = ''): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null || v === '') continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') out.push(...formEncode(v as Record<string, unknown>, key));
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return out;
}

async function stripe(path: string, body?: Record<string, unknown>): Promise<StripeObj> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is missing in Vercel.');
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body ? formEncode(body).join('&') : undefined,
    signal: timeout(20000),
  });
  const data = (await res.json()) as StripeObj;
  if (!res.ok) {
    const err = data.error as { message?: string } | undefined;
    throw new Error(`Stripe returned ${res.status}: ${err?.message ?? 'unknown error'}`);
  }
  return data;
}

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

// Checks that a webhook really came from Stripe (signed with STRIPE_WEBHOOK_SECRET, sent in the last 5 minutes).
export async function verifyStripeSignature(rawBody: string, header: string, secret: string, nowSec = Math.floor(Date.now() / 1000)): Promise<boolean> {
  const parts = header.split(',').map((p) => p.trim().split('='));
  const t = parts.find(([k]) => k === 't')?.[1];
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || !sigs.length || Math.abs(nowSec - Number(t)) > 300) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = hex(await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${rawBody}`)));
  return sigs.some((s) => s.length === expected.length && [...s].reduce((d, c, i) => d | (c.charCodeAt(0) ^ expected.charCodeAt(i)), 0) === 0);
}

// ---------- Airtable ----------

const AIRTABLE_BASE = 'appi5Q5zd611aH9P3';
const CUSTOMERS_TABLE = 'tblPwePeCA9vco2Oi';

type AirtableRecord = { id: string; fields: Record<string, unknown> };

async function airtable(path: string, init: { method?: string; body?: string } = {}): Promise<{ records?: AirtableRecord[] }> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error('AIRTABLE_TOKEN is missing in Vercel.');
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${path}`, {
    method: init.method ?? 'GET',
    body: init.body,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    signal: timeout(15000),
  });
  if (!res.ok) throw new Error(`Airtable returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as { records?: AirtableRecord[] };
}

async function findByStripeCustomer(customerId: string): Promise<AirtableRecord | null> {
  // Stripe customer IDs are letters, numbers and underscores only, so they are safe inside the formula.
  if (!/^cus_[A-Za-z0-9]+$/.test(customerId)) return null;
  const formula = encodeURIComponent(`{Stripe Customer ID}='${customerId}'`);
  const d = await airtable(`${CUSTOMERS_TABLE}?maxRecords=1&filterByFormula=${formula}`);
  return d.records?.[0] ?? null;
}

function newLinkCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((b) => chars[b % chars.length]).join('');
}

const privateLink = (code: string) => `${SITE}/report.html?c=${code}`;
const manageLink = (code: string) => `${SITE}/api/stripe?portal=${code}`;

export const SETUP_WAITING = 'Waiting for data key';
export const SETUP_SENT = 'Link sent';
export const SETUP_TEXT = "One-time setup: after you sign up, we'll email your private report link, usually within an hour during business hours. From then on, just use your link to get reports in under a minute.";
const ALERT_TO = () => process.env.ALERT_EMAIL || 'william@caresearchgroup.com';
const recordUrl = (id: string) => `https://airtable.com/${AIRTABLE_BASE}/${CUSTOMERS_TABLE}/${id}`;
const releaseLink = (id: string) => `${SITE}/api/stripe?release=${id}`;

// Opens the client's own account on the data provider's side with our account key (see api/report-pdf.ts).
const federationKey = () => (process.env.BASELAYER_FEDERATION_KEY || '').trim() || undefined;
const providerIdFor = (airtableId: string) => `carg-${airtableId}`;
async function createProviderClient(name: string, extId: string, key: string, email?: string): Promise<{ ok: boolean; status: number; detail: string }> {
  const res = await fetch('https://api.baselayer.com/organizations', {
    method: 'POST',
    headers: { 'X-API-Key': key, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ name: name.slice(0, 120) || extId, type: process.env.BASELAYER_ORG_TYPE || 'OTHER', external_id: extId, ...(email ? { contact: { name: name.slice(0, 120), email } } : {}) }),
    signal: timeout(20000),
  });
  const text = await res.text();
  return { ok: res.ok || res.status === 409 || /already exists/i.test(text), status: res.status, detail: text.slice(0, 300) };
}

// Sets up the client's provider account automatically. Returns true when it worked.
async function autoSetup(recId: string, company: string, email: string): Promise<{ ok: boolean; note: string }> {
  const fed = federationKey();
  if (!fed) return { ok: false, note: '' };
  try {
    const extId = providerIdFor(recId);
    const r = await createProviderClient(company, extId, fed, email || undefined);
    if (!r.ok) return { ok: false, note: `Automatic setup failed (HTTP ${r.status}): ${r.detail.slice(0, 200)}` };
    await airtable(CUSTOMERS_TABLE, { method: 'PATCH', body: JSON.stringify({ typecast: true, records: [{ id: recId, fields: { 'Provider Client ID': extId } }] }) });
    return { ok: true, note: `Provider client ${extId} set up automatically.` };
  } catch (e) {
    return { ok: false, note: `Automatic setup failed: ${e instanceof Error ? e.message : String(e)}` };
  }
}

async function getRecord(id: string): Promise<AirtableRecord | null> {
  if (!/^rec[A-Za-z0-9]{14}$/.test(id)) return null;
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error('AIRTABLE_TOKEN is missing in Vercel.');
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${CUSTOMERS_TABLE}/${id}`, { headers: { Authorization: `Bearer ${token}` }, signal: timeout(15000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Airtable returned ${res.status}`);
  return (await res.json()) as AirtableRecord;
}

async function findByLinkCode(code: string): Promise<AirtableRecord | null> {
  // Link codes are letters, numbers, dashes and underscores only, so they are safe inside the formula.
  if (!/^[A-Za-z0-9_-]{12,64}$/.test(code)) return null;
  const formula = encodeURIComponent(`{Link Code}='${code}'`);
  const d = await airtable(`${CUSTOMERS_TABLE}?maxRecords=1&filterByFormula=${formula}`);
  return d.records?.[0] ?? null;
}

// Stripe's hosted "manage subscription" page needs a saved configuration. Reuse one if it exists, otherwise make it once.
async function portalConfiguration(): Promise<string> {
  const list = await stripe('billing_portal/configurations?active=true&limit=1');
  const existing = (list.data as { id: string }[] | undefined)?.[0]?.id;
  if (existing) return existing;
  const created = await stripe('billing_portal/configurations', {
    business_profile: { headline: 'CA Research Group: manage your subscription', privacy_policy_url: `${SITE}/privacy.html`, terms_of_service_url: `${SITE}/terms.html` },
    features: {
      subscription_cancel: { enabled: true, mode: 'at_period_end', proration_behavior: 'none' },
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
      customer_update: { enabled: true, allowed_updates: { 0: 'email', 1: 'address', 2: 'name' } },
    },
  });
  return String(created.id);
}

const htmlMessage = (title: string, message: string, status: number) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)} - CA Research Group</title><style>body{margin:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.k{max-width:520px;margin:60px auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;text-align:center}img{height:48px;margin-bottom:16px}h1{font-family:Georgia,serif;color:#1e1b4b;font-size:22px;margin:0 0 12px}p{color:#475569;line-height:1.6;margin:0}</style></head><body><div class="k"><img src="/logo-tight.png" alt="CA Research Group"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></div></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  );

// Opens Stripe's secure page where a client can cancel, update their card, or see invoices.
async function openPortal(code: string): Promise<Response> {
  try {
    const rec = await findByLinkCode(code);
    if (!rec) return htmlMessage('Link not recognized', 'This link is not valid. Please contact william@caresearchgroup.com.', 404);
    const customerId = str(rec.fields['Stripe Customer ID']);
    if (!/^cus_[A-Za-z0-9]+$/.test(customerId)) {
      return htmlMessage('Manage your plan', 'Your plan was not set up through online checkout. Please email william@caresearchgroup.com and we will help you change or cancel it.', 200);
    }
    const session = await stripe('billing_portal/sessions', { customer: customerId, return_url: privateLink(code), configuration: await portalConfiguration() });
    return new Response(null, { status: 303, headers: { Location: str(session.url), 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('Portal failed', err);
    return htmlMessage('Temporarily unavailable', 'We could not open the subscription page just now. Please try again shortly or email william@caresearchgroup.com.', 503);
  }
}

const STATUS_FROM_STRIPE: Record<string, string> = {
  active: 'Active',
  trialing: 'Active',
  past_due: 'Past due',
  unpaid: 'Past due',
  incomplete: 'Past due',
  canceled: 'Canceled',
  incomplete_expired: 'Canceled',
  paused: 'Past due',
};

// ---------- Email ----------

const escapeHtml = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

async function sendEmail(to: string, subject: string, html: string, bccNotify = false) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is missing in Vercel.');
  const notify = bccNotify ? process.env.NOTIFY_EMAIL : undefined;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.RESEND_FROM || 'CA Research Group <onboarding@resend.dev>', to: [to], bcc: notify ? [notify] : undefined, reply_to: 'william@caresearchgroup.com', subject, html }),
    signal: timeout(15000),
  });
  if (!res.ok) throw new Error(`Resend returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

// Right after payment: thank-you note to the client (no link yet).
async function sendSetupEmail(to: string, company: string, plan: string, oneTime: boolean) {
  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;color:#1e293b;line-height:1.6;max-width:560px">
<h2 style="font-family:Georgia,serif;color:#1e1b4b">Thank you for your order</h2>
<p>Thank you for ${oneTime ? 'your order' : 'subscribing'}${company ? `, ${escapeHtml(company)}` : ''}. Your ${oneTime ? 'purchase' : 'plan'}: <strong>${escapeHtml(plan)}</strong>.</p>
<p><strong>${escapeHtml(SETUP_TEXT)}</strong></p>
<p>Questions? Just reply to this email.</p>
<p style="font-size:12px;color:#64748b">See our <a href="${SITE}/terms.html">Terms of Service</a> and <a href="${SITE}/privacy.html">Privacy Policy</a>. CA Research Group is not a law firm and does not provide legal advice.</p>
</div>`;
  await sendEmail(to, 'Thank you for your CA Research Group order', html);
}

// Alert to Bill: a new client paid and needs a Data Key.
async function sendNewClientAlert(recId: string, f: { name: string; company: string; email: string; plan: string }, autoNote = '') {
  const row = (k: string, v: string) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${k}</td><td style="padding:4px 0"><b>${escapeHtml(v || '-')}</b></td></tr>`;
  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;color:#1e293b;line-height:1.6;max-width:560px">
<h2 style="font-family:Georgia,serif;color:#1e1b4b">New paying client: add their Data Key</h2>
<table>${row('Name', f.name)}${row('Company', f.company)}${row('Email', f.email)}${row('Plan', f.plan)}</table>
${autoNote ? `<p style="color:#b91c1c">${escapeHtml(autoNote)}</p><p>Clicking the link at the bottom tries the automatic setup again and sends their link if it works. Otherwise, do these steps:</p>` : ''}
<ol>
<li>Create their data key in the provider console.</li>
<li>Paste it into the <b>Data Key</b> field of <a href="${recordUrl(recId)}">their Airtable record</a>.</li>
<li>Their private link is emailed to them automatically.</li>
</ol>
<p style="font-size:13px;color:#64748b">If the link hasn't gone out a few minutes after you paste the key, <a href="${releaseLink(recId)}">click here to send it</a>. (It only sends once, and only after the key is in Airtable.)</p>
</div>`;
  await sendEmail(ALERT_TO(), `New client: ${f.company || f.email} (${f.plan}) needs a Data Key`, html);
}

// FYI to Bill when everything was automatic.
async function sendNewClientFyi(f: { name: string; company: string; email: string; plan: string }) {
  const row = (k: string, v: string) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${k}</td><td style="padding:4px 0"><b>${escapeHtml(v || '-')}</b></td></tr>`;
  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;color:#1e293b;line-height:1.6;max-width:560px">
<h2 style="font-family:Georgia,serif;color:#1e1b4b">New paying client (all set, nothing to do)</h2>
<table>${row('Name', f.name)}${row('Company', f.company)}${row('Email', f.email)}${row('Plan', f.plan)}</table>
<p>Their account was set up automatically and their private link has been emailed to them.</p>
</div>`;
  await sendEmail(ALERT_TO(), `New client: ${f.company || f.email} (${f.plan}), all set`, html);
}

async function sendWelcomeEmail(to: string, company: string, plan: string, code: string, oneTime = false) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is missing in Vercel.');
  const link = privateLink(code);
  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;color:#1e293b;line-height:1.6;max-width:560px">
<h2 style="font-family:Georgia,serif;color:#1e1b4b">Welcome to CA Research Group</h2>
<p>Thank you for ${oneTime ? 'your order' : 'subscribing'}${company ? `, ${escapeHtml(company)}` : ''}. Your ${oneTime ? 'purchase' : 'plan'}: <strong>${escapeHtml(plan)}</strong>.</p>
<p>This is your company's private report link. No login is needed. Bookmark it and keep it private:</p>
<p><a href="${link}" style="display:inline-block;background:#1e1b4b;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Request a Report &rarr;</a></p>
<p style="font-size:13px;color:#64748b;word-break:break-all">${link}</p>
<p>Use this button anytime you need a report. Enter the business name, and your PDF report opens right away and is emailed to you. Save this email so you can always find your link.</p>
${oneTime ? '<p style="font-size:13px;color:#475569">Your single report can be run once from this link. Want more? Reply to this email to start a monthly plan.</p>' : `<p style="font-size:13px;color:#475569">You can update your card or cancel online any time: <a href="${manageLink(code)}">manage your subscription</a>.</p>`}
<p style="font-size:12px;color:#64748b">To change plans, reply to this email. See our <a href="${SITE}/terms.html">Terms of Service</a> and <a href="${SITE}/privacy.html">Privacy Policy</a>. CA Research Group is not a law firm and does not provide legal advice.</p>
</div>`;
  const notify = process.env.NOTIFY_EMAIL;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'CA Research Group <onboarding@resend.dev>',
      to: [to],
      bcc: notify ? [notify] : undefined,
      reply_to: 'william@caresearchgroup.com',
      subject: 'Your CA Research Group private report link',
      html,
    }),
    signal: timeout(15000),
  });
  if (!res.ok) throw new Error(`Resend returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

// ---------- Webhook handlers ----------

export async function handleCheckoutCompleted(session: StripeObj): Promise<string> {
  const sessionPlan = PLANS[str(((session.metadata ?? {}) as Record<string, string>).plan)];
  const isOneTime = session.mode === 'payment' && !!sessionPlan?.oneTime;
  if (session.mode !== 'subscription' && !isOneTime) return 'ignored: not a subscription or single report';
  const customerId = str(session.customer);
  if (!customerId) return 'ignored: no customer';
  const existing = await findByStripeCustomer(customerId);
  if (existing) return `already added: ${existing.id}`;

  const meta = (session.metadata ?? {}) as Record<string, string>;
  const details = (session.customer_details ?? {}) as { email?: string; name?: string };
  const plan = PLANS[meta.plan] ?? null;
  const email = clip(details.email || session.customer_email, 200);
  const code = newLinkCode();
  const notes = [`Signed up through Stripe Checkout.`, isOneTime ? 'Single report (one-time payment)' : `Subscription ${str(session.subscription)}`, `Checkout ${str(session.id)}`];
  if (meta.entity || meta.address) notes.push(`First report: ${[meta.entity, meta.address, meta.county].filter(Boolean).join(' / ')}`);

  const created = await airtable(CUSTOMERS_TABLE, {
    method: 'POST',
    body: JSON.stringify({
      typecast: true,
      records: [{
        fields: {
          Company: clip(meta.company) || clip(details.name) || email,
          'Contact Name': clip(details.name),
          'Contact Email': email,
          Role: ROLES.includes(meta.role) ? meta.role : undefined,
          Plan: plan?.label,
          'Subscription Status': 'Active',
          'Setup Status': SETUP_WAITING,
          'Link Code': code,
          'Stripe Customer ID': customerId,
          'Signed Up': new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
          'Referred By': clip(meta.referredBy, 100) || undefined,
          'Agreed At': meta.agreedAt || undefined,
          'Agreement Record': meta.agreedAt
            ? [`Checked both boxes on ${meta.agreedAt} (UTC)`, `By: ${email}${meta.company ? ` for ${clip(meta.company)}` : ''}${meta.agreedIp ? ` from IP ${meta.agreedIp}` : ''}`, `Version: ${TERMS_VERSION}`, ...AGREEMENT_TEXT.map((t, i) => `[x] ${i + 1}. ${t}`)].join('\n')
            : undefined,
          Notes: notes.join('\n'),
        },
      }],
    }),
  });
  const recId = created.records?.[0]?.id ?? '';
  const who = { name: clip(details.name), company: clip(meta.company), email, plan: plan?.label ?? '' };
  // Best case: open the client's provider account automatically and send their private link right away.
  const auto = await autoSetup(recId, clip(meta.company) || clip(details.name) || email, email);
  if (auto.ok) {
    const done: string[] = [auto.note];
    try {
      await airtable(CUSTOMERS_TABLE, { method: 'PATCH', body: JSON.stringify({ typecast: true, records: [{ id: recId, fields: { 'Setup Status': SETUP_SENT } }] }) });
      if (email) await sendWelcomeEmail(email, clip(meta.company), plan?.label ?? 'your plan', code, isOneTime);
    } catch (err) {
      console.error('Welcome email failed', err);
      done.push(`Welcome email NOT sent: ${err instanceof Error ? err.message : 'error'}`);
      await airtable(CUSTOMERS_TABLE, { method: 'PATCH', body: JSON.stringify({ typecast: true, records: [{ id: recId, fields: { 'Setup Status': SETUP_WAITING } }] }) }).catch(() => undefined);
    }
    await sendNewClientFyi(who).catch(() => undefined);
    await airtable(CUSTOMERS_TABLE, { method: 'PATCH', body: JSON.stringify({ records: [{ id: recId, fields: { Notes: [...notes, ...done].join('\n') } }] }) }).catch(() => undefined);
    return `added and link sent: ${recId}`;
  }
  // Otherwise the private link waits for setup (see ?release=). Tell the client, alert Bill.
  const problems: string[] = auto.note ? [auto.note] : [];
  try {
    if (email) await sendSetupEmail(email, clip(meta.company), plan?.label ?? 'your plan', isOneTime);
  } catch (err) {
    console.error('Setup email failed', err);
    problems.push(`Thank-you email NOT sent: ${err instanceof Error ? err.message : 'error'}`);
  }
  try {
    await sendNewClientAlert(recId, who, auto.note);
  } catch (err) {
    console.error('New client alert failed', err);
    problems.push(`Alert to Bill NOT sent: ${err instanceof Error ? err.message : 'error'}`);
  }
  if (problems.length) {
    await airtable(CUSTOMERS_TABLE, {
      method: 'PATCH',
      body: JSON.stringify({ records: [{ id: recId, fields: { Notes: [...notes, ...problems].join('\n') } }] }),
    }).catch(() => undefined);
  }
  return `added (waiting for data key): ${recId}`;
}

export async function handleSubscriptionChange(sub: StripeObj): Promise<string> {
  const status = STATUS_FROM_STRIPE[str(sub.status)];
  const rec = await findByStripeCustomer(str(sub.customer));
  if (!rec || !status) return 'ignored';
  const fields: Record<string, unknown> = { 'Subscription Status': status };
  const items = ((sub.items as { data?: { price?: { unit_amount?: number } }[] })?.data ?? []);
  const cents = items[0]?.price?.unit_amount;
  const plan = Object.values(PLANS).find((p) => p.cents === cents);
  if (plan) fields.Plan = plan.label;
  await airtable(CUSTOMERS_TABLE, { method: 'PATCH', body: JSON.stringify({ typecast: true, records: [{ id: rec.id, fields }] }) });
  return `updated ${rec.id}: ${status}`;
}

async function handleWebhook(request: Request, signature: string): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return json({ error: 'STRIPE_WEBHOOK_SECRET is missing in Vercel.' }, 500);
  const raw = await request.text();
  if (!(await verifyStripeSignature(raw, signature, secret))) return json({ error: 'Bad signature' }, 400);
  const event = JSON.parse(raw) as { type: string; data: { object: StripeObj } };
  try {
    let result = 'ignored';
    if (event.type === 'checkout.session.completed') result = await handleCheckoutCompleted(event.data.object);
    else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') result = await handleSubscriptionChange(event.data.object);
    console.log('Stripe webhook', event.type, result);
    return json({ received: true, result });
  } catch (err) {
    console.error('Stripe webhook failed', event.type, err);
    return json({ error: 'Webhook handling failed' }, 500); // Stripe will retry
  }
}

// ---------- Checkout (from the pricing form) ----------

async function createCheckout(request: Request): Promise<Response> {
  let b: Record<string, unknown>;
  try {
    b = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'The form could not be read. Please try again.' }, 400);
  }
  const plan = PLANS[str(b.plan)];
  const email = clip(b.email, 200);
  const company = clip(b.company, 150);
  const role = clip(b.role, 100);
  const address = clip(b.address, 300);
  if (!plan) return json({ error: 'Please choose a plan.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter a valid work email.' }, 400);
  const entity = clip(b.entity, 150);
  if (!company || !role || !entity) return json({ error: 'Please fill in your company, role, and the business name.' }, 400);
  if (b.certified !== true) return json({ error: 'Please check the purpose certification box.' }, 400);
  if (b.agreedTerms !== true || b.agreedAccuracy !== true) return json({ error: 'Please go back and check both agreement boxes.' }, 400);
  const ip = clip((request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim(), 60);

  const meta = {
    plan: str(b.plan),
    company,
    role,
    address,
    entity,
    county: clip(b.county, 60) === 'All Counties' ? '' : clip(b.county, 60),
    use: clip(b.use, 60),
    referredBy: clip(b.referredBy, 100),
    certified: 'yes',
    agreedAt: new Date().toISOString(),
    agreedIp: ip,
  };
  try {
    const product_data = { name: `CA Research Group - ${plan.name}` };
    const session = await stripe('checkout/sessions', {
      mode: plan.oneTime ? 'payment' : 'subscription',
      customer_email: email,
      line_items: { 0: { quantity: 1, price_data: plan.oneTime ? { currency: 'usd', unit_amount: plan.cents, product_data } : { currency: 'usd', unit_amount: plan.cents, recurring: { interval: 'month' }, product_data } } },
      metadata: meta,
      ...(plan.oneTime ? { customer_creation: 'always' } : { subscription_data: { metadata: { plan: meta.plan, company } } }),
      success_url: `${SITE}/welcome.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/?checkout=canceled`,
      billing_address_collection: 'auto',
    });
    return json({ url: session.url });
  } catch (err) {
    console.error('Checkout failed', err);
    return json({ error: 'Payment page could not be opened. Please try again in a few minutes.' }, 502);
  }
}

// ---------- Release the private link once the Data Key is in ----------

// Safe to call any number of times: it only emails the client on file, only once, and only when their Data Key is in Airtable.
export async function releaseLinkFor(recId: string): Promise<{ status: string; message: string }> {
  const rec = await getRecord(recId);
  if (!rec) return { status: 'not_found', message: 'Customer record not found.' };
  const f = rec.fields;
  const setup = str((f['Setup Status'] as { name?: string } | undefined)?.name ?? f['Setup Status']);
  const company = str(f['Company']);
  if (setup === SETUP_SENT) return { status: 'already_sent', message: `The private link was already sent to ${company || 'this client'}.` };
  if (setup !== SETUP_WAITING) return { status: 'not_waiting', message: 'This client is not waiting for a link (nothing was sent).' };
  if (!str(f['Data Key']).trim() && !str(f['Provider Client ID'])) {
    const auto = await autoSetup(recId, str(f['Company']) || str(f['Contact Email']), str(f['Contact Email']));
    if (!auto.ok) return { status: 'no_key', message: auto.note || 'No Data Key yet. Paste it into the Data Key field in Airtable, then try again.' };
  }
  const email = str(f['Contact Email']);
  const code = str(f['Link Code']);
  if (!email || !code) return { status: 'missing', message: 'This record has no email or link code. Please check it in Airtable.' };
  // Mark it sent first, so two calls at once cannot send two emails.
  await airtable(CUSTOMERS_TABLE, { method: 'PATCH', body: JSON.stringify({ typecast: true, records: [{ id: recId, fields: { 'Setup Status': SETUP_SENT } }] }) });
  const planName = str((f['Plan'] as { name?: string } | undefined)?.name ?? f['Plan']);
  try {
    await sendWelcomeEmail(email, company, planName || 'your plan', code, /Single Report/i.test(planName));
  } catch (err) {
    await airtable(CUSTOMERS_TABLE, { method: 'PATCH', body: JSON.stringify({ typecast: true, records: [{ id: recId, fields: { 'Setup Status': SETUP_WAITING } }] }) }).catch(() => undefined);
    throw err;
  }
  return { status: 'sent', message: `Private link emailed to ${email}.` };
}

// ---------- Handlers ----------

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  if (signature) return handleWebhook(request, signature);
  return createCheckout(request);
}

// Welcome page: is the new account ready yet?
export async function GET(request: Request) {
  const portalCode = new URL(request.url).searchParams.get('portal');
  if (portalCode !== null) return openPortal(portalCode);
  const release = new URL(request.url).searchParams.get('release');
  if (release !== null) {
    try {
      const r = await releaseLinkFor(release);
      if (new URL(request.url).searchParams.get('format') === 'json') return json(r, r.status === 'not_found' ? 404 : 200);
      return htmlMessage(r.status === 'sent' ? 'Link sent' : 'Nothing sent', r.message, r.status === 'not_found' ? 404 : 200);
    } catch (err) {
      console.error('Release failed', err);
      return htmlMessage('Not sent', 'The link email could not be sent just now. Please try again in a few minutes.', 503);
    }
  }
  const sessionId = new URL(request.url).searchParams.get('session_id') ?? '';
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return json({ error: 'Missing or invalid session.' }, 400);
  try {
    const session = await stripe(`checkout/sessions/${sessionId}`);
    if (session.status !== 'complete') return json({ ready: false, paid: false });
    const rec = await findByStripeCustomer(str(session.customer));
    if (!rec) return json({ ready: false, paid: true });
    const meta = (session.metadata ?? {}) as Record<string, string>;
    const setup = str((rec.fields['Setup Status'] as { name?: string } | undefined)?.name ?? rec.fields['Setup Status']);
    // New clients wait for their Data Key: no link on the thank-you page.
    if (setup === SETUP_WAITING) {
      return json({ ready: true, setup: true, company: str(rec.fields['Company']), email: str(rec.fields['Contact Email']), single: Boolean(PLANS[str(meta.plan)]?.oneTime), message: SETUP_TEXT });
    }
    const code = str(rec.fields['Link Code']);
    return json({
      ready: true,
      company: str(rec.fields['Company']),
      email: str(rec.fields['Contact Email']),
      single: Boolean(PLANS[str(meta.plan)]?.oneTime),
      link: privateLink(code),
      code,
      first: { address: meta.address ?? '', name: meta.entity ?? '', county: meta.county ?? '', use: meta.use ?? '' },
    });
  } catch (err) {
    console.error('Welcome lookup failed', err);
    return json({ error: 'Could not check your account just now.' }, 503);
  }
}
