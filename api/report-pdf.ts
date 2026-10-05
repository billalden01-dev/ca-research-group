// CA Research Group: the report engine.
// Searches the CA Secretary of State, runs the automated two-step check, and builds the branded PDF.
//
// Sample (made-up data, no key needed):
//   https://caresearchgroup.com/api/report-pdf?sample=1
// Real report (Vercel Environment Variables: LOOKUP_TOKEN required; CA_SOS_API_KEY and COURTLISTENER_TOKEN switch on those sources):
//   https://caresearchgroup.com/api/report-pdf?token=...&name=Acme Holdings LLC&address=123 Main St&company=Your Firm&email=you@firm.com&county=Los Angeles

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, PDFImage } from 'pdf-lib';

declare const process: { env: Record<string, string | undefined> };

// ---------- Report data shape ----------

export type EntityRecord = {
  name?: string | null;
  entityNumber?: string | null;
  type?: string | null;
  status?: string | null;
  statusDate?: string | null;
  filingDate?: string | null;
  jurisdiction?: string | null;
  standingSOS?: string | null;
  standingFTB?: string | null;
  standingAgent?: string | null;
  address?: string | null;
  agent?: string | null;
  agentAddress?: string | null;
};

export type ReportInput = {
  sample: boolean;
  reportId: string;
  generatedAt: Date;
  preparedFor: { company: string; email: string; role?: string };
  request: { propertyAddress: string; entityName?: string; county?: string; reportUse?: string };
  entitySearch: { searchedAt: Date; searchedFor: string; records: EntityRecord[] } | null;
  entityNote?: string;
  verification: Verification | null;
  sanctions: SanctionsResult | null;
  courts: CourtResult | null;
};

export type Check = { label: string; result: 'Passed' | 'Flagged'; detail: string };
export type Verification = { overall: 'Verified' | 'Needs attention'; checks: Check[] };

export type SanctionsMatch = { checkedName: string; listedName: string; type: string; programs: string; score: number };
export type SanctionsResult = { searchedAt: Date; namesChecked: string[]; available: boolean; matches: SanctionsMatch[] };

export type CourtCase = { caseName: string; court: string; dateFiled: string; dateTerminated: string; docketNumber: string; url: string; bankruptcy: boolean; chapter: string; kind: string };
export type CourtResult = {
  searchedAt: Date;
  searchedFor: string;
  status: 'searched' | 'unavailable' | 'not_connected';
  total: number;
  bankruptcyTotal: number;
  bankruptcyCases: CourtCase[];
  otherCases: CourtCase[];
};

const timeout = (ms: number) => AbortSignal.timeout(ms);

// ---------- U.S. Treasury OFAC sanctions list (free, official) ----------

const OFAC_BASE = 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports';
type OfacEntry = { name: string; type: string; programs: string; tokens: Set<string> };
let ofacCache: { loadedAt: number; entries: OfacEntry[] } | null = null;

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows;
}

const ofacClean = (v: string | undefined) => {
  const s = (v ?? '').trim();
  return s === '-0-' ? '' : s;
};

async function loadOfac(): Promise<OfacEntry[]> {
  if (ofacCache && Date.now() - ofacCache.loadedAt < 12 * 60 * 60 * 1000) return ofacCache.entries;
  const [sdnRes, altRes] = await Promise.all([
    fetch(`${OFAC_BASE}/SDN.CSV`, { signal: timeout(20000) }),
    fetch(`${OFAC_BASE}/ALT.CSV`, { signal: timeout(20000) }),
  ]);
  if (!sdnRes.ok || !altRes.ok) throw new Error('OFAC list unavailable');
  const byEnt = new Map<string, { type: string; programs: string }>();
  const entries: OfacEntry[] = [];
  for (const r of parseCsv(await sdnRes.text())) {
    const name = ofacClean(r[1]);
    if (!name) continue;
    const meta = { type: ofacClean(r[2]) || 'entity', programs: ofacClean(r[3]) };
    byEnt.set(ofacClean(r[0]), meta);
    entries.push({ name, ...meta, tokens: new Set(normalizeName(name)) });
  }
  for (const r of parseCsv(await altRes.text())) {
    const name = ofacClean(r[3]);
    const meta = byEnt.get(ofacClean(r[0]));
    if (!name || !meta) continue;
    entries.push({ name: `${name} (alternate name)`, ...meta, tokens: new Set(normalizeName(name)) });
  }
  if (entries.length < 1000) throw new Error('OFAC list looked incomplete');
  ofacCache = { loadedAt: Date.now(), entries };
  return entries;
}

function tokenSimilarity(x: Set<string>, y: Set<string>): number {
  if (!x.size || !y.size) return 0;
  let shared = 0;
  x.forEach((w) => {
    if (y.has(w)) shared++;
  });
  return shared / new Set([...x, ...y]).size;
}

export async function screenSanctions(names: string[]): Promise<SanctionsResult> {
  const unique: string[] = [];
  const seenNames = new Set<string>();
  for (const n of names.map((x) => x.trim()).filter(Boolean)) {
    const key = normalizeName(n).join(' ');
    if (!seenNames.has(key)) {
      seenNames.add(key);
      unique.push(n);
    }
  }
  const searchedAt = new Date();
  let entries: OfacEntry[];
  try {
    entries = await loadOfac();
  } catch {
    return { searchedAt, namesChecked: unique, available: false, matches: [] };
  }
  const matches: SanctionsMatch[] = [];
  for (const checkedName of unique) {
    const tokens = new Set(normalizeName(checkedName));
    for (const e of entries) {
      const score = tokenSimilarity(tokens, e.tokens);
      if (score >= 0.8) matches.push({ checkedName, listedName: e.name, type: e.type, programs: e.programs, score });
    }
  }
  matches.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const deduped = matches.filter((m) => !seen.has(m.listedName) && !!seen.add(m.listedName));
  return { searchedAt, namesChecked: unique, available: true, matches: deduped.slice(0, 10) };
}

// ---------- Federal court and bankruptcy cases (CourtListener, free account) ----------

const CL_SEARCH = 'https://www.courtlistener.com/api/rest/v4/search/';

// All U.S. bankruptcy courts in CourtListener (jurisdiction FB).
const BANKRUPTCY_COURTS =
  'almb alnb alsb akb arb areb arwb cacb caeb canb casb cob ctb deb dcb flmb flnb flsb gamb ganb gasb hib idb ilcb ilnb ilsb innb insb ianb iasb ksb kyeb kywb laeb lamb lawb meb mdb mab mieb miwb mnb msnb mssb moeb mowb mtb nebraskab nvb nhb njb nmb nyeb nynb nysb nywb nceb ncmb ncwb ndb ohnb ohsb okeb oknb okwb orb paeb pamb pawb rib scb sdb tneb tnmb tnwb tennesseeb txeb txnb txsb txwb utb vtb vaeb vawb waeb wawb wvnb wvsb wieb wiwb wyb gub nmib prb vib';
const BK_SET = new Set(BANKRUPTCY_COURTS.split(' '));

function toCourtCase(r: Record<string, unknown>, searchedFor: string): CourtCase {
  const court = str(r.court);
  const courtId = str(r.court_id);
  const url = str(r.docket_absolute_url);
  const caseName = str(r.caseName ?? r.case_name);
  const docketNumber = str(r.docketNumber);
  const bankruptcy = BK_SET.has(courtId) || /bankruptcy/i.test(court);
  let kind = 'Lawsuit or other federal case';
  if (bankruptcy) {
    const adversary = /-ap-/i.test(docketNumber) || /\sv\.?\s/i.test(caseName);
    const looksLikeDebtor = !adversary && nameSimilarity(caseName.replace(/^in re:?\s*/i, ''), searchedFor) >= 0.8;
    kind = adversary ? 'Adversary proceeding (lawsuit inside a bankruptcy)' : looksLikeDebtor ? 'Bankruptcy filing - company may be the debtor' : 'Bankruptcy case';
  }
  return {
    caseName,
    court,
    dateFiled: str(r.dateFiled).slice(0, 10),
    dateTerminated: str(r.dateTerminated).slice(0, 10),
    docketNumber,
    url: url ? `https://www.courtlistener.com${url}` : '',
    bankruptcy,
    chapter: str(r.chapter),
    kind,
  };
}

async function clSearch(params: Record<string, string>, token: string) {
  const res = await fetch(`${CL_SEARCH}?${new URLSearchParams({ type: 'r', order_by: 'dateFiled desc', ...params })}`, {
    headers: { Authorization: `Token ${token}`, Accept: 'application/json' },
    signal: timeout(20000),
  });
  if (!res.ok) throw new Error(`CourtListener returned ${res.status}`);
  return (await res.json()) as { count?: number; results?: Record<string, unknown>[] };
}

export async function searchFederalCases(name: string, token: string | undefined): Promise<CourtResult> {
  const searchedAt = new Date();
  const empty = { total: 0, bankruptcyTotal: 0, bankruptcyCases: [], otherCases: [] };
  if (!token) return { searchedAt, searchedFor: name, status: 'not_connected', ...empty };
  try {
    const party = `"${name}"`;
    const [all, bk] = await Promise.all([clSearch({ party_name: party }, token), clSearch({ party_name: party, court: BANKRUPTCY_COURTS }, token)]);
    const bankruptcyCases = (bk.results ?? []).slice(0, 10).map((r) => toCourtCase(r, name));
    // Possible debtor filings first, then newest.
    const rank = (c: CourtCase) => (c.kind.includes('debtor') ? 0 : c.kind === 'Bankruptcy case' ? 1 : 2);
    bankruptcyCases.sort((a, b) => rank(a) - rank(b));
    const otherCases = (all.results ?? [])
      .map((r) => toCourtCase(r, name))
      .filter((c) => !c.bankruptcy)
      .slice(0, 10);
    const bankruptcyTotal = typeof bk.count === 'number' ? bk.count : bankruptcyCases.length;
    const total = typeof all.count === 'number' ? all.count : otherCases.length + bankruptcyTotal;
    return { searchedAt, searchedFor: name, status: 'searched', total, bankruptcyTotal, bankruptcyCases, otherCases };
  } catch {
    return { searchedAt, searchedFor: name, status: 'unavailable', ...empty };
  }
}

// ---------- Secretary of State lookups ----------

const SOS_BASE = 'https://calico.sos.ca.gov/cbc/v1/api';
type SosRaw = Record<string, unknown>;

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());
const joinParts = (...parts: unknown[]) => parts.map(str).filter(Boolean).join(', ');

function toRecord(e: SosRaw): EntityRecord {
  return {
    name: str(e.EntityName),
    entityNumber: str(e.EntityID),
    type: str(e.EntityType),
    status: str(e.StatusDescription),
    statusDate: str(e.StatusDate),
    filingDate: str(e.FilingDate),
    jurisdiction: str(e.Jurisdiction),
    standingSOS: str(e.StandingSOS),
    standingFTB: str(e.StandingFTB),
    standingAgent: str(e.StandingAgent),
    address: joinParts(e.EntityStreetAddress1, e.EntityStreetAddress2, e.EntityCity, e.EntityState, e.EntityZipCode),
    agent: str(e.AgentName),
    agentAddress: joinParts(e.AgentAddress1, e.AgentAddress2, e.AgentCity, e.AgentState, e.AgentZipCode),
  };
}

function entityList(data: unknown): SosRaw[] {
  if (Array.isArray(data)) return data as SosRaw[];
  if (data && typeof data === 'object') {
    const d = data as SosRaw;
    if (Array.isArray(d.EntityData)) return d.EntityData as SosRaw[];
    if ('EntityID' in d || 'EntityName' in d) return [d];
  }
  return [];
}

async function sosGet(path: string, apiKey: string): Promise<unknown> {
  const res = await fetch(`${SOS_BASE}/${path}`, { headers: { 'Ocp-Apim-Subscription-Key': apiKey }, signal: timeout(20000) });
  if (!res.ok) throw new Error(`Secretary of State API returned ${res.status}`);
  return res.json();
}

export async function searchEntities(name: string, apiKey: string): Promise<EntityRecord[]> {
  return entityList(await sosGet(`BusinessEntityKeywordSearch?search-term=${encodeURIComponent(name)}`, apiKey)).map(toRecord);
}

export async function getEntityDetails(entityNumber: string, apiKey: string): Promise<EntityRecord | null> {
  const list = entityList(await sosGet(`BusinessEntityDetails?entity-number=${encodeURIComponent(entityNumber)}`, apiKey));
  return list.length ? toRecord(list[0]) : null;
}

// ---------- Automated two-step check ----------

const SUFFIXES = new Set(['LLC', 'L L C', 'INC', 'INCORPORATED', 'CORP', 'CORPORATION', 'CO', 'COMPANY', 'LTD', 'LIMITED', 'LP', 'LLP', 'PC', 'THE']);

export function normalizeName(name: string): string[] {
  return name
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !SUFFIXES.has(w));
}

export function nameSimilarity(a: string, b: string): number {
  const x = new Set(normalizeName(a));
  const y = new Set(normalizeName(b));
  if (!x.size || !y.size) return 0;
  let shared = 0;
  x.forEach((w) => {
    if (y.has(w)) shared++;
  });
  return shared / new Set([...x, ...y]).size;
}

const same = (a: unknown, b: unknown) => str(a).toUpperCase() === str(b).toUpperCase();

export function verifyEntity(requestedName: string, results: EntityRecord[], confirmed: EntityRecord | null): Verification {
  const checks: Check[] = [];
  const top = results[0];

  // Step 1: found in the search
  checks.push({
    label: 'Step 1: Found in Secretary of State search',
    result: top ? 'Passed' : 'Flagged',
    detail: top ? `${results.length} result${results.length === 1 ? '' : 's'} returned; top result ${str(top.name)} (#${str(top.entityNumber)}).` : 'No matching business was found.',
  });
  if (!top) return { overall: 'Needs attention', checks };

  // Step 2: confirmed by a second lookup using the entity number
  if (!confirmed) {
    checks.push({ label: 'Step 2: Confirmed by entity-number lookup', result: 'Flagged', detail: 'The second lookup by entity number returned no record.' });
  } else {
    const fields: [string, keyof EntityRecord][] = [
      ['name', 'name'],
      ['entity number', 'entityNumber'],
      ['status', 'status'],
      ['entity type', 'type'],
      ['Secretary of State standing', 'standingSOS'],
      ['Franchise Tax Board standing', 'standingFTB'],
    ];
    const diffs = fields.filter(([, k]) => !same(top[k], confirmed[k])).map(([label]) => label);
    checks.push({
      label: 'Step 2: Confirmed by entity-number lookup',
      result: diffs.length ? 'Flagged' : 'Passed',
      detail: diffs.length ? `The two lookups disagree on: ${diffs.join(', ')}. Verify directly with the Secretary of State.` : 'Second lookup matched the search result on name, number, status, type, and standing.',
    });
  }

  // Name match quality
  const score = nameSimilarity(requestedName, str(top.name));
  checks.push({
    label: 'Name match',
    result: score >= 0.8 ? 'Passed' : 'Flagged',
    detail: score === 1 ? `Exact match for "${requestedName}".` : score >= 0.8 ? `Close match for "${requestedName}" (${Math.round(score * 100)}%).` : `Weak match for "${requestedName}" (${Math.round(score * 100)}%). This may be a different business.`,
  });

  // Look-alike businesses
  const lookalikes = results.slice(1).filter((r) => nameSimilarity(requestedName, str(r.name)) >= 0.8);
  checks.push({
    label: 'Similar business names',
    result: lookalikes.length ? 'Flagged' : 'Passed',
    detail: lookalikes.length ? `${lookalikes.length} other business${lookalikes.length === 1 ? ' has' : 'es have'} a very similar name, e.g. ${str(lookalikes[0].name)} (#${str(lookalikes[0].entityNumber)}). Confirm the entity number.` : 'No other businesses with a closely similar name.',
  });

  // Status and standing
  const rec = confirmed ?? top;
  const problems: string[] = [];
  if (str(rec.status) && !/^ACTIVE$/i.test(str(rec.status))) problems.push(`status is ${str(rec.status)}`);
  if (str(rec.standingSOS) && !/^GOOD$/i.test(str(rec.standingSOS))) problems.push(`Secretary of State standing is ${str(rec.standingSOS)}`);
  if (str(rec.standingFTB) && !/^GOOD$/i.test(str(rec.standingFTB))) problems.push(`Franchise Tax Board standing is ${str(rec.standingFTB)}`);
  checks.push({
    label: 'Status and standing',
    result: problems.length ? 'Flagged' : 'Passed',
    detail: problems.length ? `Attention: ${problems.join('; ')}.` : 'Active, with good standing.',
  });

  return { overall: checks.some((c) => c.result === 'Flagged') ? 'Needs attention' : 'Verified', checks };
}

const SAMPLE_INPUT: ReportInput = {
  sample: true,
  reportId: 'CARG-SAMPLE-0001',
  generatedAt: new Date(),
  preparedFor: { company: 'Example Bridge Lending (sample)', email: 'analyst@example.com', role: 'Hard money lender or lending institution' },
  request: {
    propertyAddress: '123 Example Street, Los Angeles, CA 90000',
    entityName: 'Sample Holdings LLC',
    county: 'Los Angeles',
    reportUse: 'Loan underwriting',
  },
  entitySearch: {
    searchedAt: new Date(),
    searchedFor: 'Sample Holdings LLC',
    records: [
      {
        name: 'SAMPLE HOLDINGS LLC',
        entityNumber: '000000000000',
        type: 'Limited Liability Company - CA',
        status: 'Active',
        statusDate: '2021-03-15',
        filingDate: '2019-06-01',
        jurisdiction: 'California',
        standingSOS: 'Good',
        standingFTB: 'Good',
        standingAgent: 'Good',
        address: '456 Sample Ave, Suite 100, Los Angeles, CA 90000',
        agent: 'Example Registered Agent Inc.',
        agentAddress: '789 Placeholder Blvd, Sacramento, CA 95800',
      },
    ],
  },
  verification: {
    overall: 'Verified',
    checks: [
      { label: 'Step 1: Found in Secretary of State search', result: 'Passed', detail: '1 result returned; top result SAMPLE HOLDINGS LLC (#000000000000).' },
      { label: 'Step 2: Confirmed by entity-number lookup', result: 'Passed', detail: 'Second lookup matched the search result on name, number, status, type, and standing.' },
      { label: 'Name match', result: 'Passed', detail: 'Exact match for "Sample Holdings LLC".' },
      { label: 'Similar business names', result: 'Passed', detail: 'No other businesses with a closely similar name.' },
      { label: 'Status and standing', result: 'Passed', detail: 'Active, with good standing.' },
    ],
  },
  sanctions: { searchedAt: new Date(), namesChecked: ['Sample Holdings LLC'], available: true, matches: [] },
  courts: {
    searchedAt: new Date(),
    searchedFor: 'Sample Holdings LLC',
    status: 'searched',
    total: 2,
    bankruptcyTotal: 1,
    bankruptcyCases: [
      {
        caseName: 'Example Creditor v. Sample Holdings LLC',
        court: 'United States Bankruptcy Court, C.D. California',
        dateFiled: '2022-08-09',
        dateTerminated: '2023-02-14',
        docketNumber: '2:22-ap-00000',
        url: '',
        bankruptcy: true,
        chapter: '',
        kind: 'Adversary proceeding (lawsuit inside a bankruptcy)',
      },
    ],
    otherCases: [
      {
        caseName: 'Sample Holdings LLC v. Example Contractor Inc.',
        court: 'District Court, C.D. California',
        dateFiled: '2021-05-03',
        dateTerminated: '',
        docketNumber: '2:21-cv-00000',
        url: '',
        bankruptcy: false,
        chapter: '',
        kind: 'Lawsuit or other federal case',
      },
    ],
  },
};

// ---------- Look and feel ----------

const NAVY = rgb(30 / 255, 27 / 255, 75 / 255);
const GOLD = rgb(217 / 255, 119 / 255, 6 / 255);
const TEXT = rgb(51 / 255, 65 / 255, 85 / 255);
const MUTED = rgb(100 / 255, 116 / 255, 139 / 255);
const LINE = rgb(226 / 255, 232 / 255, 240 / 255);
const PANEL = rgb(248 / 255, 250 / 255, 252 / 255);
const SAMPLE_BG = rgb(255 / 255, 247 / 255, 237 / 255);
const WHITE = rgb(1, 1, 1);

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_SPACE = 60;

const LIMITS_TEXT =
  'This report is compiled from publicly available government and court records and is only as accurate and complete as those sources at the time of the search. Public records can be incomplete, delayed, or contain errors. Verify all information against the original sources before relying on it for any lending, investment, title, or legal decision. CA Research Group is not a law firm and does not provide legal advice. This report is not a title search, title commitment, title insurance, appraisal, or legal opinion. It is not a consumer report and may not be used to determine any individual\'s eligibility for credit, employment, insurance, or housing.';

const fmtDate = (d: Date) =>
  d.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });

const clean = (v: string | null | undefined) => (v && String(v).trim() ? String(v).trim() : 'Not listed');

// ---------- Small layout engine ----------

class Writer {
  doc: PDFDocument;
  page!: PDFPage;
  y = 0;
  regular: PDFFont;
  bold: PDFFont;
  serif: PDFFont;

  constructor(doc: PDFDocument, regular: PDFFont, bold: PDFFont, serif: PDFFont) {
    this.doc = doc;
    this.regular = regular;
    this.bold = bold;
    this.serif = serif;
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }

  ensure(space: number) {
    if (this.y - space < FOOTER_SPACE) this.newPage();
  }

  wrap(text: string, font: PDFFont, size: number, width: number): string[] {
    const lines: string[] = [];
    for (const para of text.split('\n')) {
      let line = '';
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, size) <= width) {
          line = test;
        } else {
          if (line) lines.push(line);
          line = word;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  paragraph(text: string, opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; x?: number; width?: number; gap?: number } = {}) {
    const size = opts.size ?? 10;
    const font = opts.font ?? this.regular;
    const x = opts.x ?? MARGIN;
    const width = opts.width ?? CONTENT_W;
    const lh = size * 1.45;
    for (const line of this.wrap(text, font, size, width)) {
      this.ensure(lh);
      this.page.drawText(line, { x, y: this.y - size, size, font, color: opts.color ?? TEXT });
      this.y -= lh;
    }
    this.y -= opts.gap ?? 6;
  }

  heading(text: string, keepWith = 80) {
    this.ensure(44 + keepWith);
    this.y -= 10;
    this.page.drawText(text, { x: MARGIN, y: this.y - 15, size: 15, font: this.serif, color: NAVY });
    this.y -= 22;
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: MARGIN + 40, y: this.y }, thickness: 2, color: GOLD });
    this.y -= 12;
  }

  // Two-column label/value table
  keyValues(rows: [string, string][]) {
    const labelW = 175;
    const valueW = CONTENT_W - labelW - 20;
    const size = 10;
    const lh = size * 1.4;
    for (const [label, value] of rows) {
      const lines = this.wrap(value, this.regular, size, valueW);
      const rowH = Math.max(1, lines.length) * lh + 10;
      this.ensure(rowH);
      this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: MARGIN + CONTENT_W, y: this.y }, thickness: 0.75, color: LINE });
      this.page.drawText(label, { x: MARGIN + 8, y: this.y - 5 - size, size, font: this.bold, color: NAVY });
      lines.forEach((ln, i) => {
        this.page.drawText(ln, { x: MARGIN + labelW + 12, y: this.y - 5 - size - i * lh, size, font: this.regular, color: TEXT });
      });
      this.y -= rowH;
    }
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: MARGIN + CONTENT_W, y: this.y }, thickness: 0.75, color: LINE });
    this.y -= 10;
  }

  // Simple table with header row
  table(headers: string[], widths: number[], rows: string[][]) {
    const size = 9.5;
    const lh = size * 1.4;
    const headH = 22;
    this.ensure(headH + 30);
    this.page.drawRectangle({ x: MARGIN, y: this.y - headH, width: CONTENT_W, height: headH, color: NAVY });
    let x = MARGIN;
    headers.forEach((h, i) => {
      this.page.drawText(h, { x: x + 8, y: this.y - 15, size: 9.5, font: this.bold, color: WHITE });
      x += widths[i];
    });
    this.y -= headH;
    rows.forEach((row, r) => {
      const wrapped = row.map((cell, i) => this.wrap(cell, i === 0 ? this.bold : this.regular, size, widths[i] - 16));
      const rowH = Math.max(...wrapped.map((w) => w.length)) * lh + 12;
      this.ensure(rowH);
      if (r % 2 === 1) this.page.drawRectangle({ x: MARGIN, y: this.y - rowH, width: CONTENT_W, height: rowH, color: PANEL });
      let cx = MARGIN;
      wrapped.forEach((lines, i) => {
        lines.forEach((ln, j) => {
          this.page.drawText(ln, { x: cx + 8, y: this.y - 6 - size - j * lh, size, font: i === 0 ? this.bold : this.regular, color: i === 0 ? NAVY : TEXT });
        });
        cx += widths[i];
      });
      this.y -= rowH;
      this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: MARGIN + CONTENT_W, y: this.y }, thickness: 0.75, color: LINE });
    });
    this.y -= 12;
  }

  callout(title: string, body: string, bg: ReturnType<typeof rgb>, accent: ReturnType<typeof rgb>) {
    const size = 9.5;
    const lh = size * 1.45;
    const lines = this.wrap(body, this.regular, size, CONTENT_W - 30);
    const h = 16 + 14 + lines.length * lh + 10;
    this.ensure(h);
    this.page.drawRectangle({ x: MARGIN, y: this.y - h, width: CONTENT_W, height: h, color: bg });
    this.page.drawRectangle({ x: MARGIN, y: this.y - h, width: 4, height: h, color: accent });
    this.page.drawText(title, { x: MARGIN + 16, y: this.y - 22, size: 10.5, font: this.bold, color: accent });
    lines.forEach((ln, i) => {
      this.page.drawText(ln, { x: MARGIN + 16, y: this.y - 38 - i * lh, size, font: this.regular, color: TEXT });
    });
    this.y -= h + 14;
  }
}

// ---------- The report ----------

export async function buildReportPdf(input: ReportInput, logoPng?: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`CA Research Group Public Records Report ${input.reportId}`);
  doc.setAuthor('CA Research Group');
  doc.setCreator('CA Research Group report engine');

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const serif = await doc.embedFont(StandardFonts.TimesRomanBold);

  let logo: PDFImage | undefined;
  if (logoPng) {
    try {
      logo = await doc.embedPng(logoPng);
    } catch {
      logo = undefined;
    }
  }

  const w = new Writer(doc, regular, bold, serif);

  // Header
  if (logo) {
    const dims = logo.scaleToFit(250, 48);
    w.page.drawImage(logo, { x: MARGIN, y: w.y - dims.height, width: dims.width, height: dims.height });
  } else {
    w.page.drawText('CA RESEARCH GROUP', { x: MARGIN, y: w.y - 22, size: 20, font: bold, color: NAVY });
  }
  const rightX = MARGIN + CONTENT_W;
  const label = 'PUBLIC RECORDS REPORT';
  w.page.drawText(label, { x: rightX - bold.widthOfTextAtSize(label, 10), y: w.y - 14, size: 10, font: bold, color: GOLD });
  const idText = `Report ID: ${input.reportId}`;
  w.page.drawText(idText, { x: rightX - regular.widthOfTextAtSize(idText, 9), y: w.y - 28, size: 9, font: regular, color: MUTED });
  const dateText = fmtDate(input.generatedAt);
  w.page.drawText(dateText, { x: rightX - regular.widthOfTextAtSize(dateText, 9), y: w.y - 41, size: 9, font: regular, color: MUTED });
  w.y -= 58;
  w.page.drawLine({ start: { x: MARGIN, y: w.y }, end: { x: MARGIN + CONTENT_W, y: w.y }, thickness: 2, color: GOLD });
  w.y -= 22;

  // Title
  w.page.drawText('Public Records Report', { x: MARGIN, y: w.y - 24, size: 24, font: serif, color: NAVY });
  w.y -= 34;
  w.paragraph(`Prepared for ${input.preparedFor.company}`, { size: 11, color: MUTED, gap: 14 });

  if (input.sample) {
    w.callout(
      'SAMPLE REPORT - NOT A REAL SEARCH',
      'Every name, number, and address in this report is made up to show the layout. No government records were searched to produce it.',
      SAMPLE_BG,
      GOLD,
    );
  }

  // Request details
  w.heading('Request details');
  w.keyValues([
    ['Prepared for', input.preparedFor.company],
    ['Contact email', input.preparedFor.email],
    ...(input.preparedFor.role ? ([['Role', input.preparedFor.role]] as [string, string][]) : []),
    ['Property address / APN', input.request.propertyAddress],
    ['Business or entity', input.request.entityName || 'None provided'],
    ['County', input.request.county || 'Not specified'],
    ['Intended use', input.request.reportUse || 'Not specified'],
    ['Report generated', fmtDate(input.generatedAt)],
  ]);

  // Summary
  const records = input.entitySearch?.records ?? [];
  const entitySummary = !input.entitySearch
    ? input.entityNote ?? 'Not searched (no business or entity name provided).'
    : records.length === 0
      ? `No matching entity found for "${input.entitySearch.searchedFor}".`
      : `${records.length} match${records.length === 1 ? '' : 'es'}. Top match: ${clean(records[0].name)}, status ${clean(records[0].status)}.`;

  const v = input.verification;
  const sx = input.sanctions;
  const sanctionsSummary = !sx
    ? 'Not searched.'
    : !sx.available
      ? 'The sanctions list could not be reached at the time of the search. Search it directly before relying on this report.'
      : sx.matches.length === 0
        ? `No matches on the OFAC Specially Designated Nationals list for ${sx.namesChecked.map((n) => `"${n}"`).join(' or ')}.`
        : `${sx.matches.length} possible name match${sx.matches.length === 1 ? '' : 'es'}. Review required (see section 2).`;
  const ct = input.courts;
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const debtorCount = ct ? ct.bankruptcyCases.filter((c) => c.kind.includes('debtor')).length : 0;
  const courtSummary = !ct
    ? 'Not searched (no business name provided).'
    : ct.status === 'not_connected'
      ? 'Not yet included in reports.'
      : ct.status === 'unavailable'
        ? 'The court archive could not be reached at the time of the search.'
        : ct.total === 0
          ? 'No federal or bankruptcy cases found in the CourtListener archive.'
          : `${plural(ct.total, 'federal case')} found, including ${plural(ct.bankruptcyTotal, 'case')} in bankruptcy courts${debtorCount ? `. ${plural(debtorCount, 'filing')} where the company may be the debtor - review` : ''} (see sections 3 and 4).`;
  w.heading('Summary of findings');
  w.table(
    ['Source', 'Searched', 'Result'],
    [190, 80, CONTENT_W - 270],
    [
      ['CA Secretary of State - business entity', input.entitySearch ? 'Yes' : 'No', v ? `${entitySummary} Two-step check: ${v.overall}.` : entitySummary],
      ['U.S. Treasury OFAC sanctions list', sx ? (sx.available ? 'Yes' : 'Failed') : 'No', sanctionsSummary],
      ['Federal court and bankruptcy cases', ct ? (ct.status === 'searched' ? 'Yes' : ct.status === 'not_connected' ? 'Coming soon' : 'Failed') : 'No', courtSummary],
      ['CA Secretary of State - UCC liens', 'Coming soon', 'Not yet included in reports.'],
      ['County recorder - recorded documents', 'Coming soon', 'Not yet included in reports.'],
      ['California state court records', 'Coming soon', 'Not yet included in reports.'],
    ],
  );

  // Verification
  if (v) {
    w.heading('Automated two-step verification', 190);
    const ok = v.overall === 'Verified';
    w.callout(
      ok ? 'RESULT: VERIFIED' : 'RESULT: NEEDS ATTENTION',
      ok
        ? 'The business record was found by name, then confirmed by a second, separate lookup using its official entity number. All checks passed.'
        : 'One or more checks were flagged below. Review the flagged items and confirm them directly with the Secretary of State before relying on this report.',
      ok ? rgb(240 / 255, 253 / 255, 244 / 255) : SAMPLE_BG,
      ok ? rgb(21 / 255, 128 / 255, 61 / 255) : rgb(185 / 255, 28 / 255, 28 / 255),
    );
    w.table(
      ['Check', 'Result', 'Details'],
      [170, 70, CONTENT_W - 240],
      v.checks.map((c) => [c.label, c.result, c.detail]),
    );
  }

  // Section 1: entity detail
  w.heading('1. Business entity status');
  if (!input.entitySearch) {
    w.paragraph(input.entityNote ?? 'No business or entity name was provided with this request, so the Secretary of State business search was not run.');
  } else if (records.length === 0) {
    w.paragraph(`The California Secretary of State business search returned no match for "${input.entitySearch.searchedFor}". Check the spelling or try the exact registered name.`);
  } else {
    records.slice(0, 3).forEach((e, i) => {
      w.ensure(100);
      if (records.length > 1) w.paragraph(`Match ${i + 1} of ${records.length}`, { font: bold, color: GOLD, size: 10, gap: 2 });
      w.keyValues([
        ['Entity name', clean(e.name)],
        ['Entity number', clean(e.entityNumber)],
        ['Entity type', clean(e.type)],
        ['Status', `${clean(e.status)}${e.statusDate ? ` (as of ${e.statusDate})` : ''}`],
        ['Date formed / registered', clean(e.filingDate)],
        ['Jurisdiction', clean(e.jurisdiction)],
        ['Standing - Secretary of State', clean(e.standingSOS)],
        ['Standing - Franchise Tax Board', clean(e.standingFTB)],
        ['Standing - Registered agent', clean(e.standingAgent)],
        ['Principal address', clean(e.address)],
        ['Registered agent', clean(e.agent)],
        ['Agent address', clean(e.agentAddress)],
      ]);
    });
    if (records.length > 3) w.paragraph(`${records.length - 3} more possible matches were found and are not shown.`, { color: MUTED, size: 9 });
    w.paragraph(
      `Source: California Secretary of State, Business Entity Public Search. Searched for "${input.entitySearch.searchedFor}" on ${fmtDate(input.entitySearch.searchedAt)}.`,
      { size: 8.5, color: MUTED },
    );
  }

  // Section 2: sanctions
  if (sx) {
    w.heading('2. Sanctions screening', 50);
    if (!sx.available) {
      w.paragraph('The U.S. Treasury OFAC sanctions list could not be downloaded at the time of this search, so no screening result is available. Search it directly at sanctionssearch.ofac.treas.gov before relying on this report.');
    } else if (sx.matches.length === 0) {
      w.paragraph(`No matches were found on the U.S. Treasury OFAC Specially Designated Nationals (SDN) list, including alternate names, for: ${sx.namesChecked.map((n) => `"${n}"`).join(', ')}.`);
    } else {
      w.paragraph('The names below closely match entries on the OFAC SDN list. A name match alone does not mean this business is the sanctioned party. Confirm using addresses, identification numbers, and other details before taking action.', { gap: 8 });
      w.table(
        ['Name checked', 'Listed name', 'Program'],
        [150, 220, CONTENT_W - 370],
        sx.matches.map((m) => [m.checkedName, `${m.listedName} (${Math.round(m.score * 100)}% name match)`, m.programs || m.type]),
      );
    }
    w.paragraph(`Source: U.S. Department of the Treasury, Office of Foreign Assets Control, SDN list. Screened on ${fmtDate(sx.searchedAt)}.`, { size: 8.5, color: MUTED });
  }

  // Sections 3 and 4: bankruptcy and other federal courts
  if (ct && ct.status !== 'not_connected') {
    const caseTable = (cases: CourtCase[]) =>
      w.table(
        ['Case', 'Court', 'Filed', 'Closed', 'Docket'],
        [168, 128, 58, 58, CONTENT_W - 412],
        cases.map((c) => [
          `${c.caseName}${c.chapter ? ` (Chapter ${c.chapter})` : ''}${c.bankruptcy ? `\n${c.kind}` : ''}`,
          c.court,
          c.dateFiled || '-',
          c.dateTerminated || '-',
          c.docketNumber || '-',
        ]),
      );

    w.heading('3. Bankruptcy court cases', 70);
    if (ct.status === 'unavailable') {
      w.paragraph('The CourtListener federal court archive could not be reached at the time of this search. Search PACER (pacer.uscourts.gov) directly before relying on this report.');
    } else if (ct.bankruptcyCases.length === 0) {
      w.paragraph(`No bankruptcy court cases naming "${ct.searchedFor}" as a party were found in the CourtListener archive.`);
    } else {
      w.paragraph(
        `${plural(ct.bankruptcyTotal, 'bankruptcy court case')} name this business as a party. ${ct.bankruptcyTotal > ct.bankruptcyCases.length ? `Showing ${ct.bankruptcyCases.length}, with possible debtor filings first, then the most recent.` : ''} An adversary proceeding is a lawsuit inside someone's bankruptcy and does not by itself mean this business went bankrupt.`,
        { size: 9, color: MUTED, gap: 6 },
      );
      caseTable(ct.bankruptcyCases);
    }

    if (ct.status === 'searched') {
      w.heading('4. Other federal court cases', 70);
      if (ct.otherCases.length === 0) {
        w.paragraph(`No other federal court cases naming "${ct.searchedFor}" as a party were found in the CourtListener archive.`);
      } else {
        const otherTotal = Math.max(ct.total - ct.bankruptcyTotal, ct.otherCases.length);
        if (otherTotal > ct.otherCases.length) w.paragraph(`Showing the ${ct.otherCases.length} most recent of about ${otherTotal} cases.`, { size: 9, color: MUTED, gap: 4 });
        caseTable(ct.otherCases);
      }
    }
    w.paragraph(
      `Source: CourtListener (Free Law Project) archive of federal court and bankruptcy records, searched for party name "${ct.searchedFor}" on ${fmtDate(ct.searchedAt)}. This archive holds many but not all federal cases, so a "no cases found" result does not prove none exist. PACER is the complete federal source.`,
      { size: 8.5, color: MUTED },
    );
  }

  // Limits
  w.heading('Sources and limits', 60);
  w.paragraph(LIMITS_TEXT, { size: 9, color: MUTED });

  // Footers with page numbers
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: MARGIN, y: 42 }, end: { x: MARGIN + CONTENT_W, y: 42 }, thickness: 0.75, color: LINE });
    const left = `CA Research Group  |  caresearchgroup.com  |  ${input.reportId}${input.sample ? '  |  SAMPLE' : ''}`;
    p.drawText(left, { x: MARGIN, y: 28, size: 8, font: regular, color: MUTED });
    const right = `Page ${i + 1} of ${pages.length}`;
    p.drawText(right, { x: MARGIN + CONTENT_W - regular.widthOfTextAtSize(right, 8), y: 28, size: 8, font: regular, color: MUTED });
  });

  return doc.save();
}

// ---------- Web address handler ----------

const jsonError = (error: string, status: number) =>
  new Response(JSON.stringify({ ok: false, error }, null, 2), { status, headers: { 'Content-Type': 'application/json' } });

const newReportId = (d: Date) => {
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CARG-${ymd}-${rand}`;
};

// Runs the full engine: entity search + two-step check, sanctions screening, federal court search.
export async function runReport(
  form: { company: string; email: string; role?: string; propertyAddress: string; entityName?: string; county?: string; reportUse?: string },
  keys: { sosApiKey?: string; courtListenerToken?: string },
): Promise<ReportInput> {
  const now = new Date();
  const name = (form.entityName ?? '').trim();
  let entitySearch: ReportInput['entitySearch'] = null;
  let entityNote: string | undefined;
  let verification: Verification | null = null;

  const entityTask = (async () => {
    if (!name) return;
    if (!keys.sosApiKey) {
      entityNote = 'Not yet included: the Secretary of State connection is still being set up.';
      return;
    }
    const records = await searchEntities(name, keys.sosApiKey);
    const confirmed = records[0]?.entityNumber ? await getEntityDetails(String(records[0].entityNumber), keys.sosApiKey) : null;
    entitySearch = { searchedAt: new Date(), searchedFor: name, records };
    verification = verifyEntity(name, records, confirmed);
  })();
  const courtTask = name ? searchFederalCases(name, keys.courtListenerToken) : Promise.resolve(null);

  await entityTask;
  const topName = (entitySearch as ReportInput['entitySearch'])?.records[0]?.name ?? '';
  const [sanctions, courts] = await Promise.all([name ? screenSanctions([name, topName]) : Promise.resolve(null), courtTask]);

  return {
    sample: false,
    reportId: newReportId(now),
    generatedAt: now,
    preparedFor: { company: form.company, email: form.email, role: form.role },
    request: { propertyAddress: form.propertyAddress, entityName: name || undefined, county: form.county, reportUse: form.reportUse },
    entitySearch,
    entityNote,
    verification,
    sanctions,
    courts,
  };
}

async function loadLogo(origin: string): Promise<Uint8Array | undefined> {
  try {
    const res = await fetch(new URL('/logo-tight.png', origin));
    if (res.ok) return new Uint8Array(await res.arrayBuffer());
  } catch {
    // no logo, the report falls back to text
  }
  return undefined;
}

const pdfResponse = (pdf: Uint8Array, filename: string) =>
  new Response(pdf as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (k: string) => (url.searchParams.get(k) ?? '').trim();

  if (q('sample') === '1') {
    const input: ReportInput = {
      ...SAMPLE_INPUT,
      generatedAt: new Date(),
      entitySearch: SAMPLE_INPUT.entitySearch && { ...SAMPLE_INPUT.entitySearch, searchedAt: new Date() },
    };
    return pdfResponse(await buildReportPdf(input, await loadLogo(url.origin)), 'CA-Research-Group-Sample-Report.pdf');
  }

  const lookupToken = process.env.LOOKUP_TOKEN;
  if (!lookupToken) return jsonError('Setup not finished: LOOKUP_TOKEN is missing in Vercel. Add ?sample=1 to see the sample report.', 500);
  if (q('token') !== lookupToken) return jsonError('Not authorized.', 401);
  if (!q('address')) return jsonError('Add a property address, e.g. &address=123 Main St, Los Angeles', 400);

  try {
    const input = await runReport(
      {
        company: q('company') || 'Not provided',
        email: q('email') || 'Not provided',
        role: q('role') || undefined,
        propertyAddress: q('address'),
        entityName: q('name') || undefined,
        county: q('county') || undefined,
        reportUse: q('use') || undefined,
      },
      { sosApiKey: process.env.CA_SOS_API_KEY, courtListenerToken: process.env.COURTLISTENER_TOKEN },
    );
    return pdfResponse(await buildReportPdf(input, await loadLogo(url.origin)), `CA-Research-Group-${input.reportId}.pdf`);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Report failed.', 502);
  }
}
