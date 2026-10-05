// CA Research Group: Step 1 of the report engine.
// Looks up a business on the official California Secretary of State API.
// Address once deployed: https://caresearchgroup.com/api/entity-lookup?name=ACME&token=YOUR_LOOKUP_TOKEN
//
// Needs two Vercel Environment Variables (never put these in GitHub):
//   CA_SOS_API_KEY  - your key from calicodev.sos.ca.gov
//   LOOKUP_TOKEN    - any long password you make up, so strangers can't use your key

declare const process: { env: Record<string, string | undefined> };

const SOS_SEARCH_URL = 'https://calico.sos.ca.gov/cbc/v1/api/BusinessEntityKeywordSearch';

type SosEntity = Record<string, string | null | undefined>;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const joinParts = (...parts: (string | null | undefined)[]) =>
  parts.map((p) => (p ?? '').trim()).filter(Boolean).join(', ');

export async function GET(request: Request) {
  const url = new URL(request.url);
  const name = (url.searchParams.get('name') ?? '').trim();
  const token = url.searchParams.get('token') ?? '';

  const apiKey = process.env.CA_SOS_API_KEY;
  const lookupToken = process.env.LOOKUP_TOKEN;

  if (!apiKey || !lookupToken) {
    return json({ ok: false, error: 'Setup not finished: CA_SOS_API_KEY or LOOKUP_TOKEN is missing in Vercel.' }, 500);
  }
  if (token !== lookupToken) {
    return json({ ok: false, error: 'Not authorized.' }, 401);
  }
  if (name.length < 2) {
    return json({ ok: false, error: 'Add a business name, e.g. ?name=Acme Holdings' }, 400);
  }

  const started = Date.now();
  let res: Response;
  try {
    res = await fetch(`${SOS_SEARCH_URL}?search-term=${encodeURIComponent(name)}`, {
      headers: { 'Ocp-Apim-Subscription-Key': apiKey },
    });
  } catch {
    return json({ ok: false, error: 'Could not reach the Secretary of State API.' }, 502);
  }

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 500);
    return json({ ok: false, error: `Secretary of State API returned ${res.status}`, detail }, 502);
  }

  const data = (await res.json()) as { RecordCount?: number; EntityData?: SosEntity[] };
  const entities = (data.EntityData ?? []).map((e) => ({
    name: e.EntityName,
    entityNumber: e.EntityID,
    type: e.EntityType,
    status: e.StatusDescription,
    statusDate: e.StatusDate,
    filingDate: e.FilingDate,
    jurisdiction: e.Jurisdiction,
    standingSOS: e.StandingSOS,
    standingFTB: e.StandingFTB,
    standingAgent: e.StandingAgent,
    address: joinParts(e.EntityStreetAddress1, e.EntityStreetAddress2, e.EntityCity, e.EntityState, e.EntityZipCode),
    agent: e.AgentName,
    agentAddress: joinParts(e.AgentAddress1, e.AgentAddress2, e.AgentCity, e.AgentState, e.AgentZipCode),
  }));

  return json({
    ok: true,
    searchedFor: name,
    source: 'California Secretary of State, Business Entity Public Search API',
    searchedAt: new Date().toISOString(),
    secondsTaken: (Date.now() - started) / 1000,
    totalMatches: data.RecordCount ?? entities.length,
    entities,
  });
}
