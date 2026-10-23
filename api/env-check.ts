// CA Research Group: TEST ONLY (preview links). Checks whether the free official
// environmental lists can be reached from our server. Not used in any report yet.
//   /api/env-check?address=1 Main St, San Jose, CA

declare const process: { env: Record<string, string | undefined> };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { 'Content-Type': 'application/json' } });

async function timed(label: string, url: string) {
  const t = Date.now();
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    const text = await r.text();
    let body: any = null;
    try { body = JSON.parse(text); } catch { body = text.slice(0, 300); }
    return { label, ok: r.ok, status: r.status, ms: Date.now() - t, body };
  } catch (e) {
    return { label, ok: false, status: 0, ms: Date.now() - t, error: String(e) };
  }
}

const GEOTRACKER = 'https://gispublic.waterboards.ca.gov/portalserver/rest/services/Hosted/geotracker_sites_download/FeatureServer/371/query';
const ENVIROSTOR_ITEM = 'https://www.arcgis.com/sharing/rest/content/items/aaa6a5dcf4d349ac8fd7b8e58e88f974?f=json';

function arcQuery(base: string, lng: number, lat: number, meters: number) {
  const p = new URLSearchParams({
    geometry: `${lng},${lat}`, geometryType: 'esriGeometryPoint', inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects', distance: String(meters), units: 'esriSRUnit_Meter',
    outFields: '*', returnGeometry: 'false', f: 'json',
  });
  return `${base}?${p}`;
}

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV !== 'preview') return json({ ok: false, error: 'Preview only.' }, 404);
  const address = (new URL(request.url).searchParams.get('address') ?? '').trim();
  if (address.length < 5) return json({ ok: false, error: 'Add ?address=...' }, 400);

  const geo = await timed('census_geocoder',
    `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`);
  const match = geo.body?.result?.addressMatches?.[0];
  if (!match) return json({ ok: false, step: 'geocode', geo });
  const { x: lng, y: lat } = match.coordinates;

  const meters = 400; // about a quarter mile
  const item = await timed('envirostor_item', ENVIROSTOR_ITEM);
  const envBase = item.body?.url ? `${item.body.url.replace(/\/$/, '')}/0/query` : null;

  const [gt, epa, env] = await Promise.all([
    timed('geotracker', arcQuery(GEOTRACKER, lng, lat, meters)),
    timed('epa_frs', `https://ofmpub.epa.gov/frs_public2/frs_rest_services.get_facilities?latitude83=${lat}&longitude83=${lng}&search_radius=0.25&program_output=yes&output=JSON`),
    envBase ? timed('envirostor', arcQuery(envBase, lng, lat, meters)) : Promise.resolve({ label: 'envirostor', ok: false, error: 'no service url', item }),
  ]);

  const summarize = (r: any) => ({
    ok: r.ok, status: r.status, ms: r.ms, error: r.error ?? r.body?.error,
    count: r.body?.features?.length ?? r.body?.Results?.FRSFacility?.length,
    sample: (r.body?.features ?? r.body?.Results?.FRSFacility ?? []).slice(0, 5).map((f: any) => f.attributes ?? f),
  });

  return json({
    ok: true, address: match.matchedAddress, lat, lng,
    geotracker: summarize(gt), envirostor: { url: envBase, ...summarize(env) }, epa: summarize(epa),
  });
}
