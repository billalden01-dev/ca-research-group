# CA Research Group: launch notes (for Claude in future sessions)

Owner: Bill Alden (not technical; short, simple answers; he types all passwords/keys himself; Claude only makes email drafts, Bill sends).
Rule: make changes on a preview link first and show Bill before anything goes live.

## Timeline
- Oct 26-27: go live (merge preview-report-v2 and preview-owners-ucc to main; check computer + phone).
- Oct 27: Bill sends Chris + Jim letters (drafts in business Gmail).
- Oct 29: Hiscox insurance starts; pilot invites go out (template draft "Your free CA Research Group pilot").
- Nov 2-20: free pilot (5 reports each, code PILOT2026, ends 2026-11-20).
- Dec 1: paid launch.

## Stripe (still in test mode)
- Nov 3: Bill activates live payments himself (business details, ID, Mercury bank).
- ~Nov 9-13: Claude creates live products/prices, turns off Cash App, Klarna and Amazon Pay (cards only), connects live checkout + webhook. Bill pastes STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET (live) into Vercel himself.
- Prices on site: 5/$199, 10/$299, 25/$499 per month, single $59, office 50/$899 + $18 extra. May change after the Baselayer decision.
- Decided Oct 27 (Bill): monthly members can buy extra reports at one flat $30 each, any plan (non-members pay the single price). Build with Stripe in November; not on the site yet.
- ~Nov 20: one real $59 test purchase with Bill's Mercury IO card, check welcome email, refund in Stripe.

## Open items
- Baselayer (Alan) pricing/agreement pending; if chosen, use its court search (fed + CA) and drop CourtListener.
- CourtListener: free account; Bill asked Free Law Project about a commercial plan for paid reports.
- NOTIFY_EMAIL now william@caresearchgroup.com (Production).
- Environmental check (GeoTracker + EnviroStor) is on preview-report-v2; optional property address on report.html.

## After go-live (Tue/Wed Oct 27-28)
- Update intro video (scratchpad video/make_video_crisp*.py builds it from screenshots + Bill's voiceover): new home-page shot showing the "Sample Report" menu link, and a shot of the made-up sample PDF when Bill says you'll get a clear report. Show Bill before replacing public/intro-video.mp4.
- Pending decisions when Baselayer (Alan) answers: provider, final prices (keep current prices preferred), state court records checkbox vs. include always.
- Attorneys removed from home page line (now "title professionals"); bring back after CA state court records + Tony's input. Builders: wait for Chris/Heather feedback.

## Bills on the Mercury debit card ending 091 (billing dates)
- Google Workspace: Oct 31 (switched to Mercury Oct 26)
- Claude: Nov 5 (switched to Mercury Oct 26)
- Airtable Team ($24/mo): 26th of each month (upgraded Oct 26)
- iPostal1 mailbox ($14.99/mo): renews Nov 16 (switched to Mercury Oct 26)
- Hiscox insurance (Professional, General, Cyber): $112.96/mo, monthly on the 29th, Mercury card x091; policy S112.558.160, 10/29/2026-10/29/2027, auto-renews, cancel anytime (bought Oct 28)
- GoDaddy domain (caresearchgroup.com): renews Sep 7, 2027 (yearly; switched to Mercury Oct 26)
- Cobalt (report data): pay-as-you-go, about $2 per lookup (Mercury, set up Oct 26)

## Outreach email style (decided Nov 3, 2026)
Plain, personal, not ad-like. Subject like a colleague would write. Open with a question about THEIR work. 3-4 short lines. One easy next step: "send me a business name and I'll run one for you." Say Bill "built" the company. Never "background check". Never promise liens/state court until Baselayer is live (then update the lines marked [after Baselayer]).
Signature: Bill Alden / CA Research Group | (408) 780-2215

Broker/agent — Subject: Who's behind the LLC?
  When a buyer or tenant shows up as an LLC, how do you check who you're really dealing with?
  I built a tool that pulls the official business records (owners on file, good standing, UCC filings, federal court cases) into one PDF in about a minute. [after Baselayer: "liens and lawsuits"]
  Send me a business name from one of your deals and I'll run one for you.

Title rep — Subject: Something for your broker clients
  Your tools tell you about the property. Ours tells you about the business behind the deal.
  I built a report that shows who owns an LLC, whether it's in good standing, UCC filings and court cases, in about a minute.
  It could be a nice extra to offer your brokers. Want me to run one on a business in one of your files?

Commercial property manager — Subject: Checking a business tenant
  Before you sign a lease with a business tenant, how do you check them out?
  I built a tool that pulls their official business records into one PDF in about a minute: owners, standing, UCC filings, court cases.
  Send me a tenant's business name and I'll run one for you.

Lender [after Baselayer] — Subject: Before you fund
  When a borrower is an LLC, how long does it take your team to check liens and lawsuits?
  I built a tool that pulls owners, standing, UCC and tax liens, judgments and California court cases into one PDF in about a minute.
  Send me a borrower's business name and I'll run one for you.

Check-in (has link, hasn't used it) — Subject: reply in thread
  Just checking in. If it's easier, send me a business name you're working with (and the address, if you like) and I'll run the first report for you. The PDF lands in your inbox within minutes.
