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
- ~Nov 20: one real $59 test purchase with Bill's Mercury IO card, check welcome email, refund in Stripe.

## Open items
- Baselayer (Alan) pricing/agreement pending; if chosen, use its court search (fed + CA) and drop CourtListener.
- CourtListener: free account; Bill asked Free Law Project about a commercial plan for paid reports.
- NOTIFY_EMAIL now william@caresearchgroup.com (Production).
- Environmental check (GeoTracker + EnviroStor) is on preview-report-v2; optional property address on report.html.
