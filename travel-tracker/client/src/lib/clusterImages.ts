import { Image, Stop, ClusterThresholds } from '../types'
import { haversineKm } from './utils'

function genId(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

// This runs client-side for preview only; real clustering is done server-side
export function clusterImages(
  images: Image[],
  thresholds: ClusterThresholds
): Omit<Stop, 'tripId'>[] {
  const withGps = images
    .filter((img) => img.lat != null && img.lng != null && img.takenAt)
    .sort((a, b) => new Date(a.takenAt!).getTime() - new Date(b.takenAt!).getTime())

  if (withGps.length === 0) return []

  const clusters: Image[][] = [[withGps[0]]]

  for (let i = 1; i < withGps.length; i++) {
    const img = withGps[i]
    const last = clusters[clusters.length - 1]
    const lastImg = last[last.length - 1]
    const timeDiff =
      (new Date(img.takenAt!).getTime() - new Date(lastImg.takenAt!).getTime()) / 3600000
    const dist = haversineKm(img.lat!, img.lng!, lastImg.lat!, lastImg.lng!)

    if (timeDiff > thresholds.timeGapHours || dist > thresholds.distanceKm) {
      clusters.push([img])
    } else {
      last.push(img)
    }
  }

  // Compute centroids
  const stops: Omit<Stop, 'tripId'>[] = clusters.map((cluster, idx) => {
    const lat = cluster.reduce((s, i) => s + i.lat!, 0) / cluster.length
    const lng = cluster.reduce((s, i) => s + i.lng!, 0) / cluster.length
    const times = cluster.map((i) => new Date(i.takenAt!).getTime())
    return {
      id: genId(),
      name: `Stop ${idx + 1}`,
      type: 'other',
      lat,
      lng,
      address: '',
      arrivalDate: new Date(Math.min(...times)).toISOString(),
      departureDate: new Date(Math.max(...times)).toISOString(),
      notes: '',
      orderIndex: idx,
      imageCount: cluster.length,
    }
  })

  // Merge consecutive nearby stops (within time window)
  let merged = true
  while (merged) {
    merged = false
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i]
      const b = stops[i + 1]
      const dist = haversineKm(a.lat, a.lng, b.lat, b.lng)
      const timeDiff =
        (new Date(b.arrivalDate!).getTime() - new Date(a.departureDate!).getTime()) / 3600000
      if (dist < thresholds.mergeDistanceKm && timeDiff < thresholds.mergeTimeHours) {
        stops[i] = {
          ...a,
          lat: (a.lat + b.lat) / 2,
          lng: (a.lng + b.lng) / 2,
          departureDate: b.departureDate,
          imageCount: (a.imageCount || 0) + (b.imageCount || 0),
        }
        stops.splice(i + 1, 1)
        merged = true
        break
      }
    }
  }

  // Merge non-consecutive stops at the same place (e.g. returning to hotel each night)
  merged = true
  while (merged) {
    merged = false
    for (let i = 0; i < stops.length && !merged; i++) {
      for (let j = i + 1; j < stops.length && !merged; j++) {
        const dist = haversineKm(stops[i].lat, stops[i].lng, stops[j].lat, stops[j].lng)
        if (dist < thresholds.mergeDistanceKm) {
          stops[i] = {
            ...stops[i],
            arrivalDate:
              stops[i].arrivalDate! < stops[j].arrivalDate!
                ? stops[i].arrivalDate
                : stops[j].arrivalDate,
            departureDate:
              stops[i].departureDate! > stops[j].departureDate!
                ? stops[i].departureDate
                : stops[j].departureDate,
            imageCount: (stops[i].imageCount || 0) + (stops[j].imageCount || 0),
          }
          stops.splice(j, 1)
          merged = true
        }
      }
    }
  }

  return stops.map((s, idx) => ({ ...s, orderIndex: idx }))
}
