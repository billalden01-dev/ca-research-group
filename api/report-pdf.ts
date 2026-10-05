// CA Research Group: Step 2 of the report engine.
// Builds the branded PDF report.
// Right now it only produces a clearly-labeled SAMPLE report:
//   https://caresearchgroup.com/api/report-pdf?sample=1
// Once the Secretary of State key works, real lookups will feed into buildReportPdf().

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, PDFImage } from 'pdf-lib';

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
};

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
  'This report is compiled from publicly available California government records and is only as accurate and complete as those sources at the time of the search. Public records can be incomplete, delayed, or contain errors. Verify all information against the original sources before relying on it for any lending, investment, title, or legal decision. CA Research Group is not a law firm and does not provide legal advice. This report is not a title search, title commitment, title insurance, appraisal, or legal opinion. It is not a consumer report and may not be used to determine any individual\'s eligibility for credit, employment, insurance, or housing.';

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

  heading(text: string) {
    this.ensure(48);
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
    ? 'Not searched (no business or entity name provided).'
    : records.length === 0
      ? `No matching entity found for "${input.entitySearch.searchedFor}".`
      : `${records.length} match${records.length === 1 ? '' : 'es'}. Top match: ${clean(records[0].name)}, status ${clean(records[0].status)}.`;

  w.heading('Summary of findings');
  w.table(
    ['Source', 'Searched', 'Result'],
    [190, 80, CONTENT_W - 270],
    [
      ['CA Secretary of State - business entity', input.entitySearch ? 'Yes' : 'No', entitySummary],
      ['CA Secretary of State - UCC liens', 'Coming soon', 'Not yet included in reports.'],
      ['County recorder - recorded documents', 'Coming soon', 'Not yet included in reports.'],
      ['Court records', 'Coming soon', 'Not yet included in reports.'],
    ],
  );

  // Section 1: entity detail
  w.heading('1. Business entity status');
  if (!input.entitySearch) {
    w.paragraph('No business or entity name was provided with this request, so the Secretary of State business search was not run.');
  } else if (records.length === 0) {
    w.paragraph(`The California Secretary of State business search returned no match for "${input.entitySearch.searchedFor}". Check the spelling or try the exact registered name.`);
  } else {
    records.slice(0, 3).forEach((e, i) => {
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

  // Limits
  w.heading('Sources and limits');
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

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.get('sample') !== '1') {
    return new Response(JSON.stringify({ ok: false, error: 'Only the sample report is available right now. Add ?sample=1 to the address.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let logo: Uint8Array | undefined;
  try {
    const res = await fetch(new URL('/logo-tight.png', url.origin));
    if (res.ok) logo = new Uint8Array(await res.arrayBuffer());
  } catch {
    logo = undefined;
  }

  const pdf = await buildReportPdf({ ...SAMPLE_INPUT, generatedAt: new Date(), entitySearch: SAMPLE_INPUT.entitySearch && { ...SAMPLE_INPUT.entitySearch, searchedAt: new Date() } }, logo);

  return new Response(pdf as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="CA-Research-Group-Sample-Report.pdf"',
      'Cache-Control': 'no-store',
    },
  });
}
