// What a client is offered when they are low on (or out of) reports. Shared by api/report-pdf.ts and api/stripe.ts.
// (Files starting with "_" are not web addresses on Vercel.)
//
// Prices for one more report (Bill, Nov 14, 2026): monthly members $39, office plans $18, everyone else $59.

export const EXTRA_CENTS = { member: 3900, office: 1800, other: 5900 } as const;

export const OFFICE_PLAN = 'Office (50 reports/mo, $899)';
export const SINGLE_PLAN = 'Single Report ($59)';

// Paid monthly plans that can move up online, and the plan above each one.
export const MONTHLY = [
  { key: 'five', label: '5 Reports ($199/mo)', name: '5 Reports per Month', cents: 19900 },
  { key: 'ten', label: '10 Reports ($299/mo)', name: '10 Reports per Month', cents: 29900 },
  { key: 'twentyfive', label: '25 Reports ($499/mo)', name: '25 Reports per Month', cents: 49900 },
];

// Monthly plans with no online billing (complimentary, founding, older test plans). Members, but nothing to move up.
const OTHER_MEMBER = /\/mo\b|reports\/mo|\(\$499\)|\(\$799\)|\(\$999\)/i;

export type Offer = {
  kind: 'monthly' | 'office' | 'member' | 'oneoff'; // oneoff = trial, pilot, voucher or single report
  extraCents: number;
  extraText: string; // "$39"
  next?: { key: string; label: string; name: string; cents: number }; // the plan to move up to (paid monthly plans only)
  monthly: boolean; // reports reset on the 1st of each month
};

export function offerFor(plan: string, hasStripe: boolean): Offer {
  const money = (c: number) => `$${(c / 100).toFixed(0)}`;
  if (plan === OFFICE_PLAN) return { kind: 'office', extraCents: EXTRA_CENTS.office, extraText: money(EXTRA_CENTS.office), monthly: true };
  const i = MONTHLY.findIndex((p) => p.label === plan);
  if (i >= 0) {
    const next = hasStripe ? MONTHLY[i + 1] : undefined;
    return { kind: 'monthly', extraCents: EXTRA_CENTS.member, extraText: money(EXTRA_CENTS.member), next, monthly: true };
  }
  if (plan !== SINGLE_PLAN && OTHER_MEMBER.test(plan) && !/trial|pilot|voucher/i.test(plan)) {
    return { kind: 'member', extraCents: EXTRA_CENTS.member, extraText: money(EXTRA_CENTS.member), monthly: true };
  }
  return { kind: 'oneoff', extraCents: EXTRA_CENTS.other, extraText: money(EXTRA_CENTS.other), monthly: false };
}

// "2026-11" for today in California.
export const pacificMonth = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit' }).format(now).slice(0, 7);

// "December 1" (when monthly reports reset).
export function resetText(now = new Date()): string {
  const [y, m] = pacificMonth(now).split('-').map(Number);
  const first = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1, 12));
  return first.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
}
