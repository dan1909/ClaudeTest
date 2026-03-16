import db from '../db/db'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'
let lastRequestTime = 0

function round3(n: number): string {
  return n.toFixed(3)
}

function extractName(data: Record<string, unknown>): { name: string; address: string } {
  const addr = data.address as Record<string, string> | undefined
  const displayName = data.display_name as string || ''

  if (!addr) return { name: 'Unknown location', address: displayName }

  const name =
    addr.tourism ||
    addr.amenity ||
    addr.leisure ||
    (addr.suburb && addr.city ? `${addr.suburb}, ${addr.city}` : null) ||
    addr.city ||
    addr.town ||
    addr.village ||
    (addr.county && addr.country ? `${addr.county}, ${addr.country}` : null) ||
    addr.county ||
    addr.country ||
    'Unknown location'

  const addressParts = [
    addr.road,
    addr.suburb,
    addr.city || addr.town || addr.village,
    addr.country,
  ].filter(Boolean)

  return { name, address: addressParts.join(', ') || displayName }
}

export async function reverseGeocode(lat: number, lng: number): Promise<{ name: string; address: string }> {
  const latR = round3(lat)
  const lngR = round3(lng)

  // Check cache
  const cached = db.prepare(
    'SELECT result_json FROM geocode_cache WHERE lat_rounded = ? AND lng_rounded = ?'
  ).get(latR, lngR) as { result_json: string } | undefined

  if (cached) {
    return JSON.parse(cached.result_json)
  }

  // Rate limit: Nominatim requires max 1 req/sec
  const now = Date.now()
  const wait = 1100 - (now - lastRequestTime)
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait))
  }
  lastRequestTime = Date.now()

  try {
    const res = await fetch(
      `${NOMINATIM_URL}?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'User-Agent': 'TravelTracker/1.0 (local-app)',
          'Accept': 'application/json',
        },
      }
    )

    if (!res.ok) {
      return { name: 'Unknown location', address: '' }
    }

    const data = await res.json() as Record<string, unknown>
    const result = extractName(data)

    // Cache result
    db.prepare(
      'INSERT OR REPLACE INTO geocode_cache (lat_rounded, lng_rounded, result_json) VALUES (?, ?, ?)'
    ).run(latR, lngR, JSON.stringify(result))

    return result
  } catch {
    return { name: 'Unknown location', address: '' }
  }
}
