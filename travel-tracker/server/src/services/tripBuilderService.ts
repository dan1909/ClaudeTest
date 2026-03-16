import db from '../db/db'
import { v4 as uuidv4 } from 'uuid'
import { reverseGeocode } from './geocodeService'

interface ImageRow {
  id: string
  tripId: string
  lat: number | null
  lng: number | null
  takenAt: string | null
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface Thresholds {
  timeGapHours?: number
  distanceKm?: number
  mergeDistanceKm?: number
  mergeTimeHours?: number
}

interface ClusterStop {
  id: string
  lat: number
  lng: number
  arrivalDate: string
  departureDate: string
  images: ImageRow[]
}

export async function buildTrip(tripId: string, thresholds: Thresholds = {}) {
  const {
    timeGapHours = 4,
    distanceKm = 50,
    mergeDistanceKm = 2,
    mergeTimeHours = 12,
  } = thresholds

  // Delete existing stops
  db.prepare('DELETE FROM stops WHERE tripId = ?').run(tripId)

  // Get all images for this trip
  const images = db.prepare(
    'SELECT id, tripId, lat, lng, takenAt FROM images WHERE tripId = ? ORDER BY takenAt ASC'
  ).all(tripId) as ImageRow[]

  const withGps = images.filter((img) => img.lat != null && img.lng != null && img.takenAt)
  const withoutGps = images.filter((img) => img.lat == null || img.lng == null)

  if (withGps.length === 0) return []

  // Step 1: Cluster by time and distance
  const clusters: ImageRow[][] = [[withGps[0]]]

  for (let i = 1; i < withGps.length; i++) {
    const img = withGps[i]
    const last = clusters[clusters.length - 1]
    const lastImg = last[last.length - 1]
    const timeDiff =
      (new Date(img.takenAt!).getTime() - new Date(lastImg.takenAt!).getTime()) / 3600000
    const dist = haversineKm(img.lat!, img.lng!, lastImg.lat!, lastImg.lng!)

    if (timeDiff > timeGapHours || dist > distanceKm) {
      clusters.push([img])
    } else {
      last.push(img)
    }
  }

  // Step 2: Compute centroids
  let stops: ClusterStop[] = clusters.map((cluster) => {
    const lat = cluster.reduce((s, i) => s + i.lat!, 0) / cluster.length
    const lng = cluster.reduce((s, i) => s + i.lng!, 0) / cluster.length
    const times = cluster.map((i) => new Date(i.takenAt!).getTime())
    return {
      id: uuidv4(),
      lat,
      lng,
      arrivalDate: new Date(Math.min(...times)).toISOString(),
      departureDate: new Date(Math.max(...times)).toISOString(),
      images: cluster,
    }
  })

  // Step 3a: Merge consecutive nearby stops (within time window)
  let merged = true
  while (merged) {
    merged = false
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i]
      const b = stops[i + 1]
      const dist = haversineKm(a.lat, a.lng, b.lat, b.lng)
      const timeDiff =
        (new Date(b.arrivalDate).getTime() - new Date(a.departureDate).getTime()) / 3600000
      if (dist < mergeDistanceKm && timeDiff < mergeTimeHours) {
        stops[i] = {
          id: a.id,
          lat: (a.lat + b.lat) / 2,
          lng: (a.lng + b.lng) / 2,
          arrivalDate: a.arrivalDate,
          departureDate: b.departureDate,
          images: [...a.images, ...b.images],
        }
        stops.splice(i + 1, 1)
        merged = true
        break
      }
    }
  }

  // Step 3b: Merge non-consecutive stops at the same place (e.g. returning
  // to the same hotel each night). Compare every pair; absorb later stop
  // into the earlier one regardless of time gap.
  merged = true
  while (merged) {
    merged = false
    for (let i = 0; i < stops.length && !merged; i++) {
      for (let j = i + 1; j < stops.length && !merged; j++) {
        const dist = haversineKm(stops[i].lat, stops[i].lng, stops[j].lat, stops[j].lng)
        if (dist < mergeDistanceKm) {
          // Keep the earlier stop's centroid (it's the "base"), combine images & widen date range
          stops[i] = {
            id: stops[i].id,
            lat: stops[i].lat,
            lng: stops[i].lng,
            arrivalDate:
              stops[i].arrivalDate < stops[j].arrivalDate
                ? stops[i].arrivalDate
                : stops[j].arrivalDate,
            departureDate:
              stops[i].departureDate > stops[j].departureDate
                ? stops[i].departureDate
                : stops[j].departureDate,
            images: [...stops[i].images, ...stops[j].images],
          }
          stops.splice(j, 1)
          merged = true
        }
      }
    }
  }

  // Step 4: Geocode stops (sequentially due to rate limiting) + prepare data
  const stopsWithNames: Array<ClusterStop & { name: string; address: string; orderIndex: number }> = []
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i]
    const geo = await reverseGeocode(stop.lat, stop.lng)
    stopsWithNames.push({
      ...stop,
      name: geo.name,
      address: geo.address,
      orderIndex: i,
    })
  }

  // Step 5: Insert stops and assign images in a transaction
  const insertStop = db.prepare(`
    INSERT INTO stops (id, tripId, name, type, lat, lng, address, arrivalDate, departureDate, notes, orderIndex)
    VALUES (?, ?, ?, 'other', ?, ?, ?, ?, ?, '', ?)
  `)
  const updateImage = db.prepare('UPDATE images SET stopId = ? WHERE id = ?')

  const insertAll = db.transaction(() => {
    for (const s of stopsWithNames) {
      insertStop.run(s.id, tripId, s.name, s.lat, s.lng, s.address, s.arrivalDate, s.departureDate, s.orderIndex)
      for (const img of s.images) {
        updateImage.run(s.id, img.id)
      }
    }
  })

  insertAll()

  // Step 6: Assign images without GPS to nearest stop by time
  for (const img of withoutGps) {
    if (!img.takenAt) continue
    const imgTime = new Date(img.takenAt).getTime()
    let nearest: { id: string; diff: number } | null = null
    for (const stop of stopsWithNames) {
      const arrival = new Date(stop.arrivalDate).getTime()
      const departure = new Date(stop.departureDate).getTime()
      const diff = Math.min(Math.abs(imgTime - arrival), Math.abs(imgTime - departure))
      if (!nearest || diff < nearest.diff) {
        nearest = { id: stop.id, diff }
      }
    }
    if (nearest) {
      db.prepare('UPDATE images SET stopId = ? WHERE id = ?').run(nearest.id, img.id)
    }
  }

  // Update trip dates
  if (stopsWithNames.length > 0) {
    const first = stopsWithNames[0]
    const last = stopsWithNames[stopsWithNames.length - 1]
    db.prepare('UPDATE trips SET startDate = ?, endDate = ? WHERE id = ?').run(
      first.arrivalDate.split('T')[0],
      last.departureDate.split('T')[0],
      tripId
    )
  }

  return db.prepare('SELECT * FROM stops WHERE tripId = ? ORDER BY orderIndex').all(tripId)
}
