// CA Research Group: the report engine.
// Searches the CA Secretary of State, runs the automated two-step check, and builds the branded PDF.
//
// Sample (made-up data, no key needed):
//   https://caresearchgroup.com/api/report-pdf?sample=1
// Staff report (Vercel Environment Variables: LOOKUP_TOKEN required; CA_SOS_API_KEY and COURTLISTENER_TOKEN switch on those sources):
//   https://caresearchgroup.com/run-report.html
// Client report (needs AIRTABLE_TOKEN): each customer's private page posts here.
//   https://caresearchgroup.com/report.html?c=LINK_CODE

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, PDFImage, PDFString } from 'pdf-lib';

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
  mailingAddress?: string | null;
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
  people?: PeopleResult | null;
  ucc?: UccResult | null;
};

// Owners and managers, from the business's latest Statement of Information
export type Officer = { name: string; title: string; address?: string };
export type PeopleResult = { searchedAt: Date; statementDate?: string; statementUrl?: string; officers: Officer[]; note?: string };

// UCC liens (financing statements) filed against the business
export type UccFiling = { fileNumber: string; type: string; filed: string; lapse: string; status: string; securedParty: string; collateral?: string };
export type UccResult = { searchedAt: Date; searchedFor: string; status: 'searched' | 'unavailable'; filings: UccFiling[] };

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



// ---------- Statement of Information (filed with the CA Secretary of State) ----------
// Electronically filed statements are text PDFs, so the managers, members and officers can be read from them.
// Older scanned statements have no text; the report then says so and the filing is attached for review.

export type SoiParsed = { entityName: string; entityNumber: string; principalAddress: string; mailingAddress: string; people: Officer[]; readable: boolean };

const SOI_HEADINGS = /^(Agent for Service of Process|Type of Business|Email Notifications|Labor Judgment|Electronic Signature|STATE OF CALIFORNIA|Entity Details|Additional Information|Chief Executive Officer|Secretary|Chief Financial Officer|Director|Officers|Manager\(s\) or Member\(s\)|Principal Address|Mailing Address|Attention|For Office Use Only|Page \d)/i;
const looksLikeAddressLine = (l: string) => /\d/.test(l) && /,/.test(l);

export function parseSoiText(text: string): SoiParsed {
  const lines = text.split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim());
  const after = (label: RegExp) => {
    const i = lines.findIndex((l) => label.test(l));
    if (i < 0) return '';
    const first = lines[i].replace(label, '').trim();
    const next = lines[i + 1] && looksLikeAddressLine(lines[i + 1]) && !/ {3}/.test(lines[i + 1]) ? `, ${lines[i + 1].trim()}` : '';
    return (first + next).replace(/\s{2,}/g, ' ').trim();
  };
  const people: Officer[] = [];
  for (let i = 0; i < lines.length; i++) {
    // Header rows look like "Manager or Member Name   Manager or Member Address" or "CEO Name   CEO Address"
    const h = lines[i].match(/^(.+?) Name\s{2,}.*Address/);
    if (!h) continue;
    const role = h[1].trim();
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j].trim();
      if (/^None Entered$/i.test(l)) break;
      if (/ Name\s{2,}.*Address/.test(l) || (SOI_HEADINGS.test(l) && !/ {3}/.test(l))) break;
      const parts = l.split(/\s{3,}/);
      if (parts.length >= 2) {
        people.push({ name: parts[0].trim(), title: role === 'CEO' ? 'Chief Executive Officer' : role, address: parts.slice(1).join(' ').trim() });
      } else if (people.length && looksLikeAddressLine(l)) {
        const last = people[people.length - 1];
        last.address = `${last.address ? `${last.address}, ` : ''}${l}`;
      } else {
        break;
      }
      i = j;
    }
  }
  const entityName = after(/^(Limited Liability Company|Corporation|Entity) Name\s{2,}/i);
  const entityNumber = after(/^Entity No\.\s{2,}/i);
  return {
    entityName,
    entityNumber,
    principalAddress: after(/^Principal Address\s{2,}/i),
    mailingAddress: after(/^Mailing Address\s{2,}/i),
    people,
    readable: Boolean(entityName || entityNumber || people.length),
  };
}

export let lastSoiProblem = '';
export async function fetchSoi(url: string): Promise<{ pdf: Uint8Array; parsed: SoiParsed } | null> {
  lastSoiProblem = '';
  if (!/^https:\/\/bizfileonline\.sos\.ca\.gov\//.test(url)) {
    lastSoiProblem = 'not a state filing link';
    return null;
  }
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/pdf' },
      signal: timeout(25000),
    });
    if (!res.ok) {
      lastSoiProblem = `state site returned ${res.status}`;
      return null;
    }
    const pdf = new Uint8Array(await res.arrayBuffer());
    const head = String.fromCharCode(...pdf.subarray(0, 5));
    if (head !== '%PDF-') {
      lastSoiProblem = `state site did not send a PDF (${res.headers.get('content-type') ?? '?'}, ${pdf.length} bytes): ${new TextDecoder().decode(pdf.subarray(0, 160)).replace(/\s+/g, ' ')}`;
      return null;
    }
    let text = '';
    try {
      const { getDocumentProxy } = await import('unpdf');
      const doc = await getDocumentProxy(new Uint8Array(pdf));
      for (let p = 1; p <= doc.numPages; p++) {
        const tc = await (await doc.getPage(p)).getTextContent();
        text += tc.items.map((it: any) => `${it.str ?? ''}${it.hasEOL ? '\n' : ' '}`).join('') + '\n';
      }
    } catch (err) {
      lastSoiProblem = `text reader: ${err instanceof Error ? err.message : String(err)}`;
      console.error('Statement of Information text could not be read', lastSoiProblem);
    }
    if (!lastSoiProblem && !text.trim()) lastSoiProblem = 'no text in the filing (scanned?)';
    return { pdf, parsed: parseSoiText(text) };
  } catch (err) {
    lastSoiProblem = `download: ${err instanceof Error ? err.message : String(err)}`;
    return null;
  }
}

const sameAddr = (a: string, b: string) => {
  const n = (x: string) => x.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return Boolean(a && b) && (n(a).startsWith(n(b).slice(0, 12)) || n(b).startsWith(n(a).slice(0, 12)));
};

// ---------- Official California state business records (via our records provider) ----------
// Never name the provider in reports or marketing. Reports say "official California state business records".

const COBALT_BASE = 'https://apigateway.cobaltintelligence.com';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
type Raw = Record<string, any>;

// Calls the provider, waiting (retryId) when the state's website is slow. Failed searches are not charged.
async function cobaltGet(path: string, params: Record<string, string>, key: string, maxWaitMs = 100000): Promise<Raw> {
  const started = Date.now();
  let retryId = '';
  for (;;) {
    const qs = new URLSearchParams(retryId ? { retryId, state: params.state, ...(params.test ? { test: params.test } : {}) } : params);
    const res = await fetch(`${COBALT_BASE}${path}?${qs}`, { headers: { 'x-api-key': key, Accept: 'application/json' }, signal: timeout(60000) });
    const body = (await res.json().catch(() => ({}))) as Raw;
    const code = Number(body.statusCode ?? res.status);
    if (code === 202 && body.retryId) {
      retryId = String(body.retryId);
      if (Date.now() - started > maxWaitMs) throw new Error('The state records website is taking longer than usual. Please try again in a few minutes.');
      await sleep(5000);
      continue;
    }
    if (code === 429) throw new Error('State records lookup limit reached. Please contact CA Research Group.');
    if (code === 401 || code === 403) throw new Error('State records connection is not authorized (check COBALT_API_KEY in Vercel).');
    return { ...body, statusCode: code };
  }
}

// One lookup: the business record plus its UCC liens.
// `dummy` asks the provider for free made-up answers ('complete', 'incomplete', 'failed', ...) to test our handling.
export async function cobaltLookup(name: string, key: string, dummy?: string): Promise<Raw> {
  return cobaltGet('/v1/search', { searchQuery: name, state: 'california', liveData: 'true', uccData: 'true', ...(dummy ? { test: dummy } : {}) }, key, dummy ? 30000 : 100000);
}

const niceDay = (v: string) => {
  const t = Date.parse(v);
  return v && Number.isFinite(t) ? new Date(t).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }) : '';
};
const joinAddr = (...parts: unknown[]) => parts.map(str).filter(Boolean).join(', ');
const pct = (n: unknown) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.round((v <= 1 ? v * 100 : v)) : null;
};

function cobaltRecord(r: Raw): EntityRecord {
  return {
    name: str(r.title),
    entityNumber: str(r.sosId),
    type: [str(r.entityType), str(r.entitySubType)].filter(Boolean).join(' - '),
    status: str(r.status),
    statusDate: str(r.inactiveDate) || null,
    filingDate: niceDay(str(r.normalizedFilingDate)) || str(r.filingDate),
    jurisdiction: str(r.stateOfFormation),
    address: joinAddr(r.physicalAddressStreet, r.physicalAddressCity, r.physicalAddressState, r.physicalAddressZip),
    mailingAddress: joinAddr(r.mailingAddressStreet, r.mailingAddressCity, r.mailingAddressState, r.mailingAddressZip),
    agent: str(r.agentName),
    agentAddress: joinAddr(r.agentStreetAddress, r.agentCity, r.agentState, r.agentZip),
  };
}

// Turns the provider's answer into report sections. Works on a saved answer too, so tests don't spend lookups.
export function soiUrlFrom(raw: Raw): { url: string; date: string } | null {
  const top = Array.isArray(raw.results) ? raw.results[0] : null;
  const docs: Raw[] = top && Array.isArray(top.documents) ? top.documents : [];
  const soi = docs
    .filter((d) => /statement of information/i.test(str(d.name)) && str(d.url))
    .sort((a, b) => (Date.parse(str(b.date)) || 0) - (Date.parse(str(a.date)) || 0))[0];
  return soi ? { url: str(soi.url), date: str(soi.date) } : null;
}

export function fromCobalt(name: string, raw: Raw, searchedAt: Date, soiParsed?: SoiParsed | null): Pick<ReportInput, 'entitySearch' | 'entityNote' | 'verification' | 'people' | 'ucc'> {
  const results: Raw[] = Array.isArray(raw.results) ? raw.results : [];
  const alternatives: Raw[] = Array.isArray(raw.alternativeResults) ? raw.alternativeResults : [];
  const message = str(raw.message);
  if (Number(raw.statusCode) >= 500 && results.length === 0) {
    return {
      entitySearch: null,
      entityNote: 'The California state business records search could not be completed at the time of this report. Please run the report again shortly.',
      verification: null,
      people: null,
      ucc: null,
    };
  }

  const top = results[0];
  // When the live state search was unavailable, records come from the most recent stored copy; show that date.
  const stored = /recent results|maintenance|database/i.test(message) && top && Number(top.updatedAt) > 0;
  const asOf = stored ? new Date(Number(top.updatedAt)) : searchedAt;

  const records = results.map(cobaltRecord);
  if (!top && alternatives.length) {
    alternatives.slice(0, 3).forEach((a) =>
      records.push({ name: str(a.businessName), entityNumber: str(a.sosId), status: str(a.status), address: joinAddr(a.street, a.city, a.state, a.zip), agent: str(a.agentName) }),
    );
  }
  const entitySearch = { searchedAt: asOf, searchedFor: name, records };

  // Owners and managers + Statement of Information
  const docs: Raw[] = top && Array.isArray(top.documents) ? top.documents : [];
  const soi = docs
    .filter((d) => /statement of information/i.test(str(d.name)))
    .sort((a, b) => (Date.parse(str(b.date)) || 0) - (Date.parse(str(a.date)) || 0))[0];
  const listed: Officer[] = (top && Array.isArray(top.officers) ? top.officers : [])
    .filter((o: Raw) => str(o.name) && !/^(false|no|former)$/i.test(str(o.current)))
    .map((o: Raw) => ({ name: str(o.name), title: str(o.title) || 'Not listed', address: joinAddr(o.streetAddress, o.city, o.state, o.zip) || undefined }));
  const officers: Officer[] = soiParsed?.people.length ? soiParsed.people : listed;
  const soiUnreadable = Boolean(soi) && (!soiParsed || !soiParsed.readable);
  const people: PeopleResult | null = top
    ? {
        searchedAt: asOf,
        statementDate: soi ? str(soi.date) : undefined,
        statementUrl: soi && /^https:\/\/bizfileonline\.sos\.ca\.gov\//.test(str(soi.url)) ? str(soi.url) : undefined,
        officers,
        note: soiUnreadable && !officers.length
          ? `The owners and managers are listed on the business's Statement of Information${soi && str(soi.date) ? ` filed ${str(soi.date)}` : ''}. Download it from the California Secretary of State using the link below.`
          : undefined,
      }
    : null;

  // UCC liens
  let ucc: UccResult | null = null;
  if (top) {
    const filings: Raw[] = Array.isArray(top.uccData) ? top.uccData : [];
    const failed = top.uccSucceeded === false;
    ucc = {
      searchedAt: asOf,
      searchedFor: str(top.title) || name,
      status: failed ? 'unavailable' : 'searched',
      filings: filings
        .slice()
        .sort((a, b) => Number(/active/i.test(str(b.status))) - Number(/active/i.test(str(a.status))) || (Date.parse(str(b.filingDate)) || 0) - (Date.parse(str(a.filingDate)) || 0))
        .map((f) => ({
        fileNumber: str(f.fileNumber),
        type: str(f.type),
        filed: str(f.filingDate),
        lapse: str(f.lapseDate),
        status: str(f.status) || 'Not listed',
        securedParty: (Array.isArray(f.securedParties) ? f.securedParties : []).map((p: Raw) => str(p.name)).filter(Boolean).join('; ') || 'Not listed',
      })),
    };
  }

  // Automated two-step check
  const checks: Check[] = [];
  if (!top) {
    checks.push({
      label: 'Step 1: Name match',
      result: 'Flagged',
      detail: alternatives.length
        ? `No exact match for "${name}". ${alternatives.length} similar name${alternatives.length === 1 ? ' was' : 's were'} found and ${alternatives.length === 1 ? 'is' : 'are'} listed below. Confirm the exact registered name.`
        : `No business named "${name}" was found in California state business records.`,
    });
  } else {
    const ours = Math.round(nameSimilarity(name, str(top.title)) * 100);
    const theirs = pct(top.confidenceLevel);
    const score = theirs === null ? ours : Math.max(ours, theirs);
    checks.push({
      label: 'Step 1: Name match',
      result: score >= 80 ? 'Passed' : 'Flagged',
      detail: score >= 80
        ? `${ours === 100 ? 'Exact' : 'Close'} match for "${name}": ${str(top.title)} (#${str(top.sosId)}), match confidence ${score}%.`
        : `Weak match for "${name}" (match confidence ${score}%). The record found, ${str(top.title)}, may be a different business.`,
    });
    const filed = soi && str(soi.date) ? ` filed ${str(soi.date)}` : '';
    let step2: Check;
    if (!soi) {
      step2 = { label: 'Step 2: Checked against the filed Statement of Information', result: 'Flagged', detail: 'No Statement of Information was found in the state record. California businesses must file one every one or two years; a missing filing can be a warning sign.' };
    } else if (!soiParsed || !soiParsed.readable) {
      const due = Date.parse(str(top.nextReportDueDate));
      const filedAt = Date.parse(str(soi.date));
      const current = Number.isFinite(due) ? due > Date.now() : Number.isFinite(filedAt) && Date.now() - filedAt < 2 * 365 * 86400000;
      const dueText = Number.isFinite(due) ? niceDay(new Date(due).toISOString()) : '';
      step2 = {
        label: 'Step 2: Statement of Information on file and current',
        result: current ? 'Passed' : 'Flagged',
        detail: current
          ? `A Statement of Information was filed${filed.replace(' filed', '')} and is current${dueText ? ` (the next one is due ${dueText})` : ''}.`
          : `The business's Statement of Information appears overdue${dueText ? ` (it was due ${dueText})` : ''}. Overdue filings can lead to penalties or suspension of the business.`,
      };
    } else {
      const diffs: string[] = [];
      if (soiParsed.entityNumber && str(top.sosId) && soiParsed.entityNumber.replace(/\D/g, '') !== str(top.sosId).replace(/\D/g, '')) diffs.push('entity number');
      if (soiParsed.entityName && nameSimilarity(soiParsed.entityName, str(top.title)) < 0.8) diffs.push('business name');
      const recAddr = joinAddr(top.physicalAddressStreet, top.physicalAddressCity);
      if (soiParsed.principalAddress && recAddr && !sameAddr(soiParsed.principalAddress, recAddr)) diffs.push('principal address');
      step2 = {
        label: 'Step 2: Checked against the filed Statement of Information',
        result: diffs.length || !officers.length ? 'Flagged' : 'Passed',
        detail: diffs.length
          ? `The Statement of Information${filed} does not match the state record on: ${diffs.join(', ')}. Review both before relying on this report.`
          : officers.length
            ? `The Statement of Information${filed} matches the state record on business name, entity number, and principal address. It lists ${officers.length} ${officers.length === 1 ? 'owner or manager' : 'owners or managers'}, shown in this report.`
            : `The Statement of Information${filed} matches the state record, but lists no owners or managers. Review the attached copy.`,
      };
    }
    checks.push(step2);
    const lookalikes = [...results.slice(1).map((r) => str(r.title)), ...alternatives.map((a) => str(a.businessName))].filter((t) => t && nameSimilarity(name, t) >= 0.8);
    checks.push({
      label: 'Similar business names',
      result: lookalikes.length ? 'Flagged' : 'Passed',
      detail: lookalikes.length ? `${lookalikes.length} other business${lookalikes.length === 1 ? ' has' : 'es have'} a very similar name, e.g. ${lookalikes[0]}. Confirm the entity number.` : 'No other businesses with a closely similar name.',
    });
    const active = /^active$/i.test(str(top.normalizedStatus)) || /^active$/i.test(str(top.status));
    checks.push({
      label: 'Status',
      result: active ? 'Passed' : 'Flagged',
      detail: active ? `Status is ${str(top.status) || 'Active'}.` : `Attention: status is ${str(top.status) || 'not listed'}.`,
    });
    if (stored) {
      checks.push({ label: 'Live state search', result: 'Flagged', detail: `The state's website could not be searched live, so the most recent stored record (${fmtDate(asOf)}) was used.` });
    }
  }
  const verification: Verification = { overall: checks.some((c) => c.result === 'Flagged') ? 'Needs attention' : 'Verified', checks };

  return { entitySearch, entityNote: undefined, verification, people, ucc };
}

// ---------- Automated two-step check (older direct Secretary of State connection) ----------

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
        mailingAddress: 'PO Box 0000, Los Angeles, CA 90000',
        agent: 'Example Registered Agent Inc.',
        agentAddress: '789 Placeholder Blvd, Sacramento, CA 95800',
      },
    ],
  },
  verification: {
    overall: 'Verified',
    checks: [
      { label: 'Step 1: Name match', result: 'Passed', detail: 'Exact match for "Sample Holdings LLC" (match confidence 100%).' },
      { label: 'Step 2: Checked against the filed Statement of Information', result: 'Passed', detail: 'Business name, entity number, address, and managers on the filed Statement of Information match the state record.' },
      { label: 'Similar business names', result: 'Passed', detail: 'No other businesses with a closely similar name.' },
      { label: 'Status and standing', result: 'Passed', detail: 'Active, with good standing.' },
    ],
  },
  people: {
    searchedAt: new Date(),
    statementDate: '2025-04-10',
    officers: [
      { name: 'Alex Sample', title: 'Manager', address: '456 Sample Ave, Suite 100, Los Angeles, CA 90000' },
      { name: 'Sample Capital Partners LLC', title: 'Managing Member', address: '900 Example Way, Irvine, CA 92600' },
      { name: 'Jordan Example', title: 'Chief Executive Officer', address: '456 Sample Ave, Suite 100, Los Angeles, CA 90000' },
    ],
  },
  ucc: {
    searchedAt: new Date(),
    searchedFor: 'Sample Holdings LLC',
    status: 'searched',
    filings: [
      { fileNumber: 'U000000000000', type: 'UCC-1 Financing Statement', filed: '2023-09-12', lapse: '2028-09-12', status: 'Active', securedParty: 'Example Community Bank', collateral: 'All assets of the debtor' },
      { fileNumber: 'U000000000001', type: 'UCC-1 Financing Statement', filed: '2018-02-20', lapse: '2023-02-20', status: 'Lapsed', securedParty: 'Sample Equipment Finance Co.', collateral: 'Equipment' },
    ],
  },
  sanctions: { searchedAt: new Date(), namesChecked: ['Sample Holdings LLC', 'Sample Capital Partners LLC'], available: true, matches: [] },
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
const GOLD = rgb(184 / 255, 150 / 255, 63 / 255); // brand gold (matches the website)
const TEXT = rgb(51 / 255, 65 / 255, 85 / 255);
const MUTED = rgb(100 / 255, 116 / 255, 139 / 255);
const LINE = rgb(226 / 255, 232 / 255, 240 / 255);
const PANEL = rgb(248 / 255, 250 / 255, 252 / 255);
const SAMPLE_BG = rgb(251 / 255, 247 / 255, 234 / 255); // soft cream
const WHITE = rgb(1, 1, 1);

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_SPACE = 60;

const LIMITS_TEXT =
  'This report does not include county recorder documents (such as deeds or liens recorded with a county) or California state court cases. This report is compiled from publicly available government and court records and is only as accurate and complete as those sources at the time of the search. Public records can be incomplete, delayed, or contain errors. Verify all information against the original sources before relying on it for any lending, investment, title, or legal decision. CA Research Group is not a law firm and does not provide legal advice. This report is not a title search, title commitment, title insurance, appraisal, or legal opinion. It is not a consumer report and may not be used to determine any individual\'s eligibility for credit, employment, insurance, or housing.';

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

  // Blue underlined text that opens a web address when clicked
  link(text: string, url: string, size = 10) {
    this.ensure(size * 2);
    const width = this.bold.widthOfTextAtSize(text, size);
    const y = this.y - size;
    const color = rgb(29 / 255, 78 / 255, 216 / 255);
    this.page.drawText(text, { x: MARGIN, y, size, font: this.bold, color });
    this.page.drawLine({ start: { x: MARGIN, y: y - 1.5 }, end: { x: MARGIN + width, y: y - 1.5 }, thickness: 0.6, color });
    const annot = this.doc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [MARGIN, y - 3, MARGIN + width, y + size],
      Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
    });
    this.page.node.addAnnot(this.doc.context.register(annot));
    this.y -= size * 1.45 + 8;
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
  w.paragraph(`Prepared for ${input.preparedFor.company}`, { size: 11, color: MUTED, gap: 4 });
  w.paragraph(`Records current as of ${fmtDate(input.entitySearch?.searchedAt ?? input.generatedAt)}`, { size: 10.5, font: bold, color: NAVY, gap: 14 });

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
    ['Business name', input.request.entityName || 'None provided'],
    ['Property address (optional)', input.request.propertyAddress || 'Not provided'],
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
        : `${sx.matches.length} possible name match${sx.matches.length === 1 ? '' : 'es'}. Review required (see Sanctions screening below).`;
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
          : `${plural(ct.total, 'federal case')} found, including ${plural(ct.bankruptcyTotal, 'case')} in bankruptcy courts${debtorCount ? `. ${plural(debtorCount, 'filing')} where the company may be the debtor - review` : ''} (see the court sections below).`;
  const pp = input.people;
  const peopleSummary = !pp
    ? 'Not yet included in reports.'
    : pp.officers.length === 0
      ? pp.statementUrl
        ? `Listed on the Statement of Information${pp.statementDate ? ` filed ${pp.statementDate}` : ''} (link in this report).`
        : 'No owners or managers are listed on the latest Statement of Information.'
      : `${pp.officers.length} ${pp.officers.length === 1 ? 'owner or manager' : 'owners or managers'} listed${pp.statementDate ? ` on the Statement of Information filed ${pp.statementDate}` : ''}: ${pp.officers.slice(0, 3).map((o) => o.name).join('; ')}${pp.officers.length > 3 ? '; and others' : ''}.`;
  const uc = input.ucc;
  const activeUcc = uc ? uc.filings.filter((f) => /active/i.test(f.status)).length : 0;
  const uccSummary = !uc
    ? 'Not yet included in reports.'
    : uc.status === 'unavailable'
      ? 'UCC records could not be reached at the time of the search.'
      : uc.filings.length === 0
        ? 'No UCC liens found against this business.'
        : `${plural(activeUcc, 'active UCC lien')} and ${plural(uc.filings.length - activeUcc, 'lapsed or ended filing')} found.`;
  w.heading('Summary of findings');
  w.table(
    ['Source', 'Searched', 'Result'],
    [190, 80, CONTENT_W - 270],
    [
      ['CA Secretary of State - business entity', input.entitySearch ? 'Yes' : 'No', v ? `${entitySummary} Two-step check: ${v.overall}.` : entitySummary],
      ['Owners and managers', pp ? 'Yes' : 'Coming soon', peopleSummary],
      ['CA Secretary of State - UCC liens', uc ? (uc.status === 'searched' ? 'Yes' : 'Failed') : 'Coming soon', uccSummary],
      ['U.S. Treasury OFAC sanctions list', sx ? (sx.available ? 'Yes' : 'Failed') : 'No', sanctionsSummary],
      ...(ct && ct.status === 'not_connected' ? [] : [['Federal court and bankruptcy cases', ct ? (ct.status === 'searched' ? 'Yes' : 'Failed') : 'No', courtSummary]]),
    ],
  );
  w.callout(
    'Verify before you rely on this report',
    'These are automated search results from public records. Public records can be incomplete, out of date, or wrong, and the same name can belong to unrelated businesses. Confirm anything important with the original source (the agency, court, or county) before making a lending, investment, or legal decision.',
    SAMPLE_BG,
    GOLD,
  );

  // Verification
  if (v) {
    w.heading('Automated two-step check', 190);
    const ok = v.overall === 'Verified';
    w.callout(
      ok ? 'RESULT: VERIFIED' : 'RESULT: NEEDS ATTENTION',
      ok
        ? 'The business was matched by name, then checked against its filed Statement of Information. All checks passed.'
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

  let sec = 0;
  const section = (title: string, keepWith?: number) => w.heading(`${++sec}. ${title}`, keepWith);

  // Business entity detail
  section('Business entity status', 330);
  if (!input.entitySearch) {
    w.paragraph(input.entityNote ?? 'No business or entity name was provided with this request, so the Secretary of State business search was not run.');
  } else if (records.length === 0) {
    w.paragraph(`The California Secretary of State business search returned no match for "${input.entitySearch.searchedFor}". Check the spelling or try the exact registered name.`);
  } else {
    records.slice(0, 3).forEach((e, i) => {
      w.ensure(330); // keep one business's details together on one page
      if (records.length > 1) w.paragraph(`Match ${i + 1} of ${records.length}`, { font: bold, color: GOLD, size: 10, gap: 2 });
      w.keyValues([
        ['Entity name', clean(e.name)],
        ['Entity number', clean(e.entityNumber)],
        ['Entity type', clean(e.type)],
        ['Status', `${clean(e.status)}${e.statusDate ? ` (as of ${e.statusDate})` : ''}`],
        ['Date formed / registered', clean(e.filingDate)],
        ['Jurisdiction', clean(e.jurisdiction)],
        ...(([
          ['Standing - Secretary of State', e.standingSOS],
          ['Standing - Franchise Tax Board', e.standingFTB],
          ['Standing - Registered agent', e.standingAgent],
        ] as [string, string | null | undefined][]).filter(([, val]) => str(val)).map(([k, val]) => [k, clean(val)] as [string, string])),
        ['Principal address', clean(e.address)],
        ...(e.mailingAddress ? ([['Mailing address', clean(e.mailingAddress)]] as [string, string][]) : []),
        ['Registered agent', clean(e.agent)],
        ['Agent address', clean(e.agentAddress)],
      ]);
    });
    if (records.length > 3) w.paragraph(`${records.length - 3} more possible matches were found and are not shown.`, { color: MUTED, size: 9 });
    w.paragraph(
      `Source: official California state business records (Secretary of State). Searched for "${input.entitySearch.searchedFor}" on ${fmtDate(input.entitySearch.searchedAt)}.`,
      { size: 8.5, color: MUTED },
    );
  }

  // Owners and managers
  if (pp) {
    section('Owners and managers', 70);
    if (pp.officers.length === 0) {
      if (!pp.note) w.paragraph('No owners, managers, or officers are listed on the latest Statement of Information on file.');
    } else {
      w.table(
        ['Name', 'Role', 'Address on file'],
        [170, 120, CONTENT_W - 290],
        pp.officers.map((o) => [o.name, o.title, o.address || 'Not listed']),
      );
    }
    if (pp.note) w.paragraph(pp.note, { gap: 4 });
    if (pp.statementUrl) w.link('Download the official Statement of Information (lists the managers)', pp.statementUrl);
    w.paragraph(
      `Source: the business's Statement of Information${pp.statementDate ? ` filed ${pp.statementDate}` : ''}, from official California state business records. Checked on ${fmtDate(pp.searchedAt)}. A business can change its owners or managers before filing a new statement.`,
      { size: 8.5, color: MUTED },
    );
  }

  // UCC liens
  if (uc) {
    section('UCC liens', 70);
    if (uc.status === 'unavailable') {
      w.paragraph('UCC records could not be reached at the time of this search. Search them directly with the California Secretary of State before relying on this report.');
    } else if (uc.filings.length === 0) {
      w.paragraph(`No UCC financing statements naming "${uc.searchedFor}" as the debtor were found.`);
    } else {
      w.paragraph('A UCC lien shows that a lender or vendor has claimed a security interest in the business\'s property, such as equipment or all of its assets. An active lien means that claim is still on file.', { size: 9, color: MUTED, gap: 6 });
      w.table(
        ['Secured party', 'Status', 'Filed', 'Lapses', 'File number'],
        [170, 62, 66, 66, CONTENT_W - 364],
        uc.filings.map((f) => [`${f.securedParty}${f.collateral ? `\nCollateral: ${f.collateral}` : ''}`, f.status, f.filed || '-', f.lapse || '-', f.fileNumber || '-']),
      );
    }
    w.paragraph(`Source: official California state business records (Secretary of State UCC filings). Searched for debtor name "${uc.searchedFor}" on ${fmtDate(uc.searchedAt)}.`, { size: 8.5, color: MUTED });
  }

  // Sanctions
  if (sx) {
    section('Sanctions screening', 50);
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

    section('Bankruptcy court cases', 70);
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
      section('Other federal court cases', 70);
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
    p.drawText('Public-record search results only. Verify with the original sources before relying on them.', { x: MARGIN, y: 16, size: 7, font: regular, color: MUTED });
  });

  return doc.save();
}

// ---------- Airtable (customers and report log) ----------

const AIRTABLE_BASE = 'appi5Q5zd611aH9P3';
const CUSTOMERS_TABLE = 'tblPwePeCA9vco2Oi';
const REQUESTS_TABLE = 'tbl6xrbWaWhWetlh1';
const DO_NOT_EMAIL_TABLE = 'tblBo87wj2whW0Bqf';

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

// ---------- Businesses only: block names of individuals and tax ID / Social Security numbers ----------
const BUSINESS_WORDS = /\b(llc|lllp|llp|lp|inc|incorporated|corp|corporation|co|company|companies|ltd|limited|pc|pllc|trust|partnership|partners|holdings?|group|fund|bank|association|assn|foundation|property|properties|investments?|capital|ventures?|enterprises?|realty|development|developers?|lending|mortgage|financial|management|church|ministries|cooperative|coop)\b/i;
const ID_NUMBER = /\b(\d{3}-?\d{2}-?\d{4}|\d{2}-?\d{7})\b/;
export const BUSINESS_ONLY_MESSAGE = 'Business names only. Please enter a registered business name that includes its entity type, for example "Acme Holdings LLC". We do not search individuals.';
export const ID_NUMBER_MESSAGE = 'Please do not enter tax ID or Social Security numbers. Enter the business name only, for example "Acme Holdings LLC".';
export function businessNameProblem(name: string): string | null {
  const n = name.trim();
  if (!n) return null;
  if (ID_NUMBER.test(n)) return ID_NUMBER_MESSAGE;
  if (!BUSINESS_WORDS.test(n.replace(/\./g, ''))) return BUSINESS_ONLY_MESSAGE;
  return null;
}

export type Customer = { id: string; company: string; email: string; role: string; plan: string; used: number; limit: number; canRun: boolean; active: boolean; voucher: boolean; expires: string; expired: boolean; usedTotal: number };

// A complimentary report voucher: one free report, good through the date in Voucher Expires (Pacific time).
export const VOUCHER_PLAN = 'Complimentary Report (5-day voucher)';
export const VOUCHER_DAYS = 5;

// Today's date in California, as YYYY-MM-DD.
export const pacificToday = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

export const addDays = (ymd: string, days: number) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const friendlyDate = (ymd: string) =>
  ymd ? new Date(`${ymd}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }) : '';

export function newLinkCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((b) => chars[b % chars.length]).join('');
}

const selectName = (v: unknown) => (v && typeof v === 'object' && 'name' in (v as object) ? str((v as { name: unknown }).name) : str(v));

export async function findCustomer(code: string): Promise<Customer | null> {
  // Link codes are letters, numbers, dashes and underscores only, so they are safe inside the formula.
  if (!/^[A-Za-z0-9_-]{12,64}$/.test(code)) return null;
  const formula = encodeURIComponent(`{Link Code}='${code}'`);
  const data = await airtable(`${CUSTOMERS_TABLE}?maxRecords=1&filterByFormula=${formula}`);
  const r = data.records?.[0];
  if (!r) return null;
  const f = r.fields;
  return {
    id: r.id,
    company: str(f['Company']) || 'Your company',
    email: str(f['Contact Email']),
    role: selectName(f['Role']),
    plan: selectName(f['Plan']),
    used: Number(f['Reports This Month'] ?? 0) || 0,
    limit: Number(f['Monthly Report Limit'] ?? 0) || 0,
    canRun: str(f['Can Run Report']) === 'YES',
    active: selectName(f['Subscription Status']) === 'Active',
    voucher: selectName(f['Plan']) === VOUCHER_PLAN,
    expires: str(f['Voucher Expires']).slice(0, 10),
    expired: selectName(f['Plan']) === VOUCHER_PLAN && (!str(f['Voucher Expires']) || str(f['Voucher Expires']).slice(0, 10) < pacificToday()),
    usedTotal: Number(f['Reports Total'] ?? 0) || 0,
  };
}

// Staff: create a complimentary report voucher (one free report, good for VOUCHER_DAYS days).
// ---------- Do Not Email list (CAN-SPAM opt-outs; kept forever) ----------
const EMAIL_OK = /^[^\s@'"\\]+@[^\s@'"\\]+\.[^\s@'"\\]+$/;
async function onDoNotEmail(email: string): Promise<boolean> {
  const formula = encodeURIComponent(`LOWER({Email})='${email.toLowerCase()}'`);
  const d = await airtable(`${DO_NOT_EMAIL_TABLE}?maxRecords=1&filterByFormula=${formula}`);
  return (d.records?.length ?? 0) > 0;
}
async function addDoNotEmail(email: string, how: string): Promise<void> {
  if (await onDoNotEmail(email)) return;
  await airtable(DO_NOT_EMAIL_TABLE, {
    method: 'POST',
    body: JSON.stringify({ typecast: true, records: [{ fields: { Email: email.toLowerCase(), 'Date Added': pacificToday(), How: how } }] }),
  });
}

async function createVoucher(company: string, contactName: string, email: string): Promise<{ link: string; expires: string; id: string }> {
  const code = newLinkCode();
  const expires = addDays(pacificToday(), VOUCHER_DAYS);
  const d = await airtable(CUSTOMERS_TABLE, {
    method: 'POST',
    body: JSON.stringify({
      typecast: true,
      records: [{
        fields: {
          Company: company,
          'Contact Name': contactName,
          'Contact Email': email,
          Plan: VOUCHER_PLAN,
          'Subscription Status': 'Active',
          'Link Code': code,
          'Voucher Expires': expires,
          'Signed Up': pacificToday(),
          Notes: `Complimentary report voucher created ${pacificToday()}.`,
        },
      }],
    }),
  });
  return { link: `https://www.caresearchgroup.com/report.html?c=${code}`, expires, id: d.records?.[0]?.id ?? '' };
}

async function logRequest(fields: Record<string, unknown>): Promise<string> {
  const d = await airtable(REQUESTS_TABLE, { method: 'POST', body: JSON.stringify({ records: [{ fields }], typecast: true }) });
  return d.records?.[0]?.id ?? '';
}

async function updateRequest(id: string, fields: Record<string, unknown>) {
  if (!id) return;
  await airtable(REQUESTS_TABLE, { method: 'PATCH', body: JSON.stringify({ records: [{ id, fields }], typecast: true }) });
}

const escapeHtml = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const htmlPage = (title: string, message: string, status: number) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)} - CA Research Group</title>
<style>body{margin:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1e293b}.c{max-width:520px;margin:60px auto;padding:0 16px}.k{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;text-align:center}img{height:48px;margin-bottom:16px}h1{font-family:Georgia,serif;color:#1e1b4b;font-size:22px;margin:0 0 12px}p{color:#475569;line-height:1.6;margin:0}</style></head>
<body><div class="c"><div class="k"><img src="/logo-tight.png" alt="CA Research Group"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></div></div></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  );

// ---------- Email delivery (Resend) ----------

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

// Sends the finished PDF. Until caresearchgroup.com is verified in Resend, set no RESEND_FROM:
// Resend's test sender (onboarding@resend.dev) can only deliver to the Resend account owner's own email.
export async function emailReport(to: string, input: ReportInput, pdf: Uint8Array, opts: { voucher?: boolean; soiPdf?: { pdf: Uint8Array; date: string } } = {}): Promise<{ sent: boolean; detail: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, detail: 'RESEND_API_KEY is not set.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { sent: false, detail: 'No valid contact email on file.' };
  const from = process.env.RESEND_FROM || 'CA Research Group <onboarding@resend.dev>';
  const what = [input.request.entityName, input.request.propertyAddress].filter(Boolean).join(' - ') || 'your request';
  const html = `<div style="font-family:Arial,sans-serif;color:#1e293b;max-width:560px">
<p style="font-size:18px;color:#1e1b4b;font-weight:bold;margin:0 0 12px">Your public records report is ready</p>
<p style="margin:0 0 12px">Attached is report <strong>${escapeHtml(input.reportId)}</strong> for <strong>${escapeHtml(what)}</strong>.</p>
${input.people?.statementUrl ? `<p style="margin:0 0 6px">The business's managers and members are listed on its official Statement of Information${input.people.statementDate ? `, filed ${escapeHtml(input.people.statementDate)}` : ''}:</p>
<p style="margin:0 0 16px"><a href="${escapeHtml(input.people.statementUrl)}" style="display:inline-block;background:#1e1b4b;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:8px">Download the official Statement of Information</a></p>` : ''}
<p style="margin:0 0 12px">Please review any flagged items and verify findings against the original sources before relying on them.</p>
${opts.voucher ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;margin:16px 0">
<p style="margin:0 0 8px;font-weight:bold;color:#1e1b4b">Thanks for trying CA Research Group</p>
<p style="margin:0 0 10px">This was your complimentary report. To run reports on every deal, choose a monthly plan. Your private link and reports arrive in about a minute.</p>
<a href="https://www.caresearchgroup.com/" style="display:inline-block;background:#1e1b4b;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold">See plans</a>
<p style="margin:10px 0 0;font-size:13px">Questions? Just reply to this email.</p>
</div>` : ''}
<p style="font-size:12px;color:#64748b;margin:16px 0 0">CA Research Group is not a law firm and does not provide legal advice. This report is not a title search, title insurance, appraisal, legal opinion, or consumer report.</p>
</div>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Your CA Research Group report ${input.reportId}`,
        reply_to: 'william@caresearchgroup.com',
        html,
        attachments: [
          { filename: `CA-Research-Group-${input.reportId}.pdf`, content: toBase64(pdf) },
          ...(opts.soiPdf ? [{ filename: `Statement-of-Information${opts.soiPdf.date ? `-${opts.soiPdf.date.replace(/\//g, '-')}` : ''}.pdf`, content: toBase64(opts.soiPdf.pdf) }] : []),
        ],
      }),
      signal: timeout(20000),
    });
    if (!res.ok) {
      const detail = `Resend returned ${res.status}: ${(await res.text()).slice(0, 200)}`;
      console.error(detail);
      return { sent: false, detail };
    }
    return { sent: true, detail: `Emailed to ${to}` };
  } catch (err) {
    return { sent: false, detail: err instanceof Error ? err.message : 'Email failed.' };
  }
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
  keys: { sosApiKey?: string; courtListenerToken?: string; cobaltKey?: string; cobaltRaw?: Raw; cobaltDummy?: string },
): Promise<ReportInput & { cobaltRaw?: Raw; soiPdf?: { pdf: Uint8Array; date: string } }> {
  const now = new Date();
  const name = (form.entityName ?? '').trim();
  let entitySearch: ReportInput['entitySearch'] = null;
  let entityNote: string | undefined;
  let verification: Verification | null = null;
  let people: PeopleResult | null = null;
  let ucc: UccResult | null = null;
  let cobaltRaw: Raw | undefined;
  let soiPdf: { pdf: Uint8Array; date: string } | undefined;

  const entityTask = (async () => {
    if (!name) return;
    if (keys.cobaltRaw || keys.cobaltKey) {
      if (keys.cobaltRaw) {
        cobaltRaw = keys.cobaltRaw;
      } else {
        cobaltRaw = await cobaltLookup(name, keys.cobaltKey as string, keys.cobaltDummy);
        // A failed search is not charged by the provider; try once more before giving up.
        if (Number(cobaltRaw.statusCode) >= 500 && !(cobaltRaw.results?.length)) {
          await sleep(3000);
          cobaltRaw = await cobaltLookup(name, keys.cobaltKey as string, keys.cobaltDummy);
        }
      }
      const code = Number(cobaltRaw.statusCode);
      if (code !== 200 && !(Array.isArray(cobaltRaw.results) && cobaltRaw.results.length)) {
        // Never send a report that looks like "no business found" when the search itself failed.
        throw new Error(`The California state business records search could not be completed (${str(cobaltRaw.message) || str(cobaltRaw.status) || code}). No report was charged. Please try again shortly.`);
      }
      const soiRef = soiUrlFrom(cobaltRaw);
      const soi = soiRef ? await fetchSoi(soiRef.url) : null;
      if (soi) soiPdf = { pdf: soi.pdf, date: soiRef?.date ?? '' };
      const parts = fromCobalt(name, cobaltRaw, now, soi?.parsed ?? null);
      entitySearch = parts.entitySearch;
      entityNote = parts.entityNote;
      verification = parts.verification;
      people = parts.people ?? null;
      ucc = parts.ucc ?? null;
      return;
    }
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
    people,
    ucc,
    cobaltRaw,
    soiPdf,
  };
}

async function loadLogo(_origin: string): Promise<Uint8Array | undefined> {
  // The logo is built in (LOGO_PNG_BASE64 at the bottom of this file), so it shows on every report, including preview links.
  try {
    const bin = atob(LOGO_PNG_BASE64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return undefined; // falls back to text
  }
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

  if (q('client')) {
    try {
      const c = await findCustomer(q('client'));
      if (!c) return jsonError('This link is not recognized.', 404);
      return new Response(
        JSON.stringify({
          ok: true, company: c.company, plan: c.plan, active: c.active, used: c.used, limit: c.limit >= 999999 ? null : c.limit, canRun: c.canRun,
          voucher: c.voucher, expires: c.expires, expiresText: friendlyDate(c.expires), expired: c.expired, voucherUsed: c.voucher && c.usedTotal > 0,
        }),
        { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
      );
    } catch {
      return jsonError('Customer records are temporarily unavailable.', 503);
    }
  }

  // Preview links only (never the live site): test real lookups. &format=json returns the saved answer
  // so later layout fixes can re-use it (POST it back) without spending another lookup.
  if (q('test') === '1' && process.env.VERCEL_ENV === 'preview') {
    if (!q('name')) return jsonError('Add &name=Business Name', 400);
    try {
      const input = await runReport(
        { company: 'CA Research Group (internal test)', email: 'william@caresearchgroup.com', propertyAddress: q('address'), entityName: q('name'), reportUse: 'Internal test' },
        {
          courtListenerToken: process.env.COURTLISTENER_TOKEN,
          cobaltKey: process.env.COBALT_API_KEY,
          cobaltDummy: q('dummy') || undefined,
          // &saved=<base64 of a saved answer> re-renders without spending a lookup
          cobaltRaw: q('saved') ? (JSON.parse(atob(q('saved').replace(/-/g, '+').replace(/_/g, '/'))) as Raw) : undefined,
        },
      );
      if (q('format') === 'json') return new Response(JSON.stringify({ ok: true, name: q('name'), cobaltRaw: input.cobaltRaw }, null, 2), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
      const res = pdfResponse(await buildReportPdf(input, await loadLogo(url.origin)), `CA-Research-Group-TEST-${input.reportId}.pdf`);
      res.headers.set('X-Soi-Status', lastSoiProblem || (input.soiPdf ? 'read' : 'none'));
      return res;
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : 'Test failed.', 502);
    }
  }

  const lookupToken = process.env.LOOKUP_TOKEN;
  if (!lookupToken) return jsonError('Setup not finished: LOOKUP_TOKEN is missing in Vercel. Add ?sample=1 to see the sample report.', 500);
  if (q('token') !== lookupToken) return jsonError('Not authorized.', 401);

  if (q('voucher') === '1') {
    const company = q('company').slice(0, 150);
    const email = q('email').slice(0, 200);
    if (!company || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError('Enter the company name and a valid email.', 400);
    try {
      if (EMAIL_OK.test(email) && (await onDoNotEmail(email))) return jsonError('This email is on the Do Not Email list because they asked not to be contacted. No voucher was made.', 409);
      const v = await createVoucher(company, q('contact').slice(0, 150), email);
      return new Response(JSON.stringify({ ok: true, link: v.link, expires: v.expires, expiresText: friendlyDate(v.expires) }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : 'Voucher could not be created.', 502);
    }
  }
  if (!q('name')) return jsonError('Add a business name, e.g. &name=Acme Holdings LLC', 400);
  const staffNameProblem = businessNameProblem(q('name'));
  if (staffNameProblem) return jsonError(staffNameProblem, 400);

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
      { sosApiKey: process.env.CA_SOS_API_KEY, courtListenerToken: process.env.COURTLISTENER_TOKEN, cobaltKey: process.env.COBALT_API_KEY },
    );
    return pdfResponse(await buildReportPdf(input, await loadLogo(url.origin)), `CA-Research-Group-${input.reportId}.pdf`);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Report failed.', 502);
  }
}

// Client reports: posted from each customer's private page (public/report.html).
export async function POST(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('test') === '1' && process.env.VERCEL_ENV === 'preview') {
    try {
      const b = (await request.json()) as { name?: string; cobaltRaw?: Raw };
      if (!b.name || !b.cobaltRaw) return jsonError('Send { name, cobaltRaw }', 400);
      const input = await runReport(
        { company: 'CA Research Group (internal test)', email: 'william@caresearchgroup.com', propertyAddress: '', entityName: b.name, reportUse: 'Internal test' },
        { courtListenerToken: process.env.COURTLISTENER_TOKEN, cobaltRaw: b.cobaltRaw },
      );
      const res = pdfResponse(await buildReportPdf(input, await loadLogo(url.origin)), `CA-Research-Group-TEST-${input.reportId}.pdf`);
      res.headers.set('X-Soi-Status', lastSoiProblem || (input.soiPdf ? 'read' : 'none'));
      return res;
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : 'Test failed.', 502);
    }
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return htmlPage('Something went wrong', 'The request could not be read. Please go back and try again.', 400);
  }
  const g = (k: string) => String(form.get(k) ?? '').trim().slice(0, 300);

  // Unsubscribe form (public/unsubscribe.html)
  if (g('unsubscribe') === '1') {
    const email = g('email').toLowerCase();
    if (!EMAIL_OK.test(email)) return htmlPage('Check your email address', 'Please go back and enter a valid email address.', 400);
    try {
      await addDoNotEmail(email, 'Unsubscribe page');
    } catch {
      return htmlPage('Temporarily unavailable', 'We could not save your request just now. Please try again, or reply "no thanks" to any of our emails.', 503);
    }
    return htmlPage('You are unsubscribed', `We will not send marketing emails to ${email} again. If you are a subscriber, you will still get your report emails.`, 200);
  }

  let customer: Customer | null;
  try {
    customer = await findCustomer(g('c'));
  } catch {
    return htmlPage('Temporarily unavailable', 'We could not check your account just now. Please try again in a few minutes.', 503);
  }
  if (!customer) return htmlPage('Link not recognized', 'This report link is not valid. Please contact CA Research Group for your current private link.', 404);
  if (!customer.active) return htmlPage('Subscription not active', 'Your subscription is not active right now. Please contact CA Research Group to reactivate it.', 403);

  const address = g('address');
  const entityName = g('name');
  if (!entityName.trim()) return htmlPage('Business name needed', 'Please go back and enter the business name, for example "Acme Holdings LLC".', 400);
  if (g('certify') !== 'yes') return htmlPage('Certification needed', 'Please go back and check the purpose certification box.', 400);
  const nameProblem = businessNameProblem(entityName);
  if (nameProblem) return htmlPage('Business names only', nameProblem, 400);

  const base = {
    Customer: [customer.id],
    'Requested At': new Date().toISOString(),
    'Business Name': entityName,
    'Property Address': address,
    County: g('county'),
    'Report Use': g('use'),
    'Purpose Certified': true,
  };

  if (!customer.canRun) {
    await logRequest({ ...base, Status: 'Over plan limit' }).catch(() => '');
    if (customer.voucher) {
      return customer.usedTotal > 0
        ? htmlPage('Complimentary report already used', 'Thank you for trying CA Research Group. To keep running reports, choose a monthly plan at caresearchgroup.com, or reply to our email and we will set you up.', 429)
        : htmlPage('This voucher has expired', 'This complimentary report link has expired. Reply to our email or contact william@caresearchgroup.com and we will be happy to help.', 410);
    }
    return htmlPage(
      'Monthly report limit reached',
      `Your plan includes ${customer.limit} reports per month and this month's reports have been used. Please contact CA Research Group to upgrade your plan or add reports.`,
      429,
    );
  }

  let requestId = '';
  try {
    requestId = await logRequest({ ...base, Status: 'Received' });
  } catch {
    return htmlPage('Temporarily unavailable', 'We could not record your request just now. Please try again in a few minutes.', 503);
  }

  try {
    const input = await runReport(
      { company: customer.company, email: customer.email || 'Not provided', role: customer.role || undefined, propertyAddress: address, entityName: entityName || undefined, county: g('county') || undefined, reportUse: g('use') || undefined },
      { sosApiKey: process.env.CA_SOS_API_KEY, courtListenerToken: process.env.COURTLISTENER_TOKEN, cobaltKey: process.env.COBALT_API_KEY },
    );
    const pdf = await buildReportPdf(input, await loadLogo(url.origin));
    const courtsSearched = input.courts?.status === 'searched';
    const mail = await emailReport(customer.email, input, pdf, { voucher: customer.voucher, soiPdf: input.soiPdf });
    await updateRequest(requestId, {
      Notes: mail.sent ? mail.detail : `Email not sent: ${mail.detail}`,
      'Report ID': input.reportId,
      Status: 'Completed',
      'Two-Step Check': input.verification?.overall ?? 'Not run',
      'Sanctions Matches': input.sanctions?.available ? input.sanctions.matches.length : null,
      'Federal Cases': courtsSearched ? input.courts?.total ?? null : null,
      'Bankruptcy Cases': courtsSearched ? input.courts?.bankruptcyTotal ?? null : null,
    }).catch((e) => console.error('Airtable update failed:', e instanceof Error ? e.message : e));
    console.log('Report', input.reportId, mail.sent ? 'emailed' : `email not sent: ${mail.detail}`);
    return pdfResponse(pdf, `CA-Research-Group-${input.reportId}.pdf`);
  } catch (err) {
    await updateRequest(requestId, { Status: 'Failed', Notes: err instanceof Error ? err.message : 'Report failed.' }).catch(() => undefined);
    return htmlPage('Report could not be completed', 'Something went wrong while building your report. It has not been counted against your plan. Please try again shortly.', 502);
  }
}

// CA Research Group logo (public/logo-tight.png), built in so every report shows it.
const LOGO_PNG_BASE64 =
  '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';
