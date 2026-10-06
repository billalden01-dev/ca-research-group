// CA Research Group - Stripe subscriptions.
//
// One file, three jobs:
//   POST JSON from the pricing form      -> creates a Stripe Checkout page and returns its URL
//   POST from Stripe (stripe-signature)  -> webhook: adds the customer to Airtable, emails their private link,
//                                           and keeps Subscription Status in step with Stripe
//   GET ?session_id=cs_...               -> the welcome page asks whether the new account is ready
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
const PLANS: Record<string, { label: string; name: string; cents: number }> = {
  standard: { label: 'Standard Concierge ($499)', name: 'Standard Concierge', cents: 49900 },
  enterprise: { label: 'Enterprise Preferred ($799)', name: 'Enterprise Preferred', cents: 79900 },
  institutional: { label: 'Institutional ($999)', name: 'Institutional', cents: 99900 },
};

const ROLES = [
  'Hard money lender or lending institution',
  'Attorney or legal counsel',
  'Commercial real estate broker',
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

async function sendWelcomeEmail(to: string, company: string, plan: string, code: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is missing in Vercel.');
  const link = privateLink(code);
  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;color:#1e293b;line-height:1.6;max-width:560px">
<h2 style="font-family:Georgia,serif;color:#1e1b4b">Welcome to CA Research Group</h2>
<p>Thank you for subscribing${company ? `, ${escapeHtml(company)}` : ''}. Your plan: <strong>${escapeHtml(plan)}</strong>.</p>
<p>This is your company's private report link. No login is needed. Bookmark it and keep it private:</p>
<p><a href="${link}" style="display:inline-block;background:#1e1b4b;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Open my report page</a></p>
<p style="font-size:13px;color:#64748b;word-break:break-all">${link}</p>
<p>Enter a property address or business name, and your PDF report opens right away and is emailed to you.</p>
<p style="font-size:12px;color:#64748b">To cancel or change plans, reply to this email. See our <a href="${SITE}/terms.html">Terms of Service</a> and <a href="${SITE}/privacy.html">Privacy Policy</a>. CA Research Group is not a law firm and does not provide legal advice.</p>
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
  if (session.mode !== 'subscription') return 'ignored: not a subscription';
  const customerId = str(session.customer);
  if (!customerId) return 'ignored: no customer';
  const existing = await findByStripeCustomer(customerId);
  if (existing) return `already added: ${existing.id}`;

  const meta = (session.metadata ?? {}) as Record<string, string>;
  const details = (session.customer_details ?? {}) as { email?: string; name?: string };
  const plan = PLANS[meta.plan] ?? null;
  const email = clip(details.email || session.customer_email, 200);
  const code = newLinkCode();
  const notes = [`Signed up through Stripe Checkout.`, `Subscription ${str(session.subscription)}`, `Checkout ${str(session.id)}`];
  if (meta.address) notes.push(`First property: ${meta.address}${meta.entity ? ` / ${meta.entity}` : ''}${meta.county ? ` / ${meta.county}` : ''}`);

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
          'Link Code': code,
          'Stripe Customer ID': customerId,
          'Signed Up': new Date().toISOString().slice(0, 10),
          Notes: notes.join('\n'),
        },
      }],
    }),
  });
  const recId = created.records?.[0]?.id ?? '';
  try {
    if (email) await sendWelcomeEmail(email, clip(meta.company), plan?.label ?? 'your plan', code);
  } catch (err) {
    console.error('Welcome email failed', err);
    await airtable(CUSTOMERS_TABLE, {
      method: 'PATCH',
      body: JSON.stringify({ records: [{ id: recId, fields: { Notes: `${notes.join('\n')}\nWelcome email NOT sent: ${err instanceof Error ? err.message : 'error'}` } }] }),
    }).catch(() => undefined);
  }
  return `added: ${recId}`;
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
  if (!company || !role || !address) return json({ error: 'Please fill in your company, role, and the property address.' }, 400);
  if (b.certified !== true) return json({ error: 'Please check the purpose certification box.' }, 400);

  const meta = {
    plan: str(b.plan),
    company,
    role,
    address,
    entity: clip(b.entity, 150),
    county: clip(b.county, 60) === 'All Counties' ? '' : clip(b.county, 60),
    use: clip(b.use, 60),
    certified: 'yes',
  };
  try {
    const session = await stripe('checkout/sessions', {
      mode: 'subscription',
      customer_email: email,
      line_items: { 0: { quantity: 1, price_data: { currency: 'usd', unit_amount: plan.cents, recurring: { interval: 'month' }, product_data: { name: `CA Research Group - ${plan.name}` } } } },
      metadata: meta,
      subscription_data: { metadata: { plan: meta.plan, company } },
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

// ---------- Handlers ----------

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  if (signature) return handleWebhook(request, signature);
  return createCheckout(request);
}

// Welcome page: is the new account ready yet?
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get('session_id') ?? '';
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return json({ error: 'Missing or invalid session.' }, 400);
  try {
    const session = await stripe(`checkout/sessions/${sessionId}`);
    if (session.status !== 'complete') return json({ ready: false, paid: false });
    const rec = await findByStripeCustomer(str(session.customer));
    if (!rec) return json({ ready: false, paid: true });
    const meta = (session.metadata ?? {}) as Record<string, string>;
    const code = str(rec.fields['Link Code']);
    return json({
      ready: true,
      company: str(rec.fields['Company']),
      email: str(rec.fields['Contact Email']),
      link: privateLink(code),
      code,
      first: { address: meta.address ?? '', name: meta.entity ?? '', county: meta.county ?? '', use: meta.use ?? '' },
    });
  } catch (err) {
    console.error('Welcome lookup failed', err);
    return json({ error: 'Could not check your account just now.' }, 503);
  }
}
