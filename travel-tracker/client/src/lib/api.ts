import { Trip, Stop, Image, ClusterThresholds, ExifData } from '../types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Trips
  getTrips: () => request<Trip[]>('/trips'),
  getTrip: (id: string) => request<{ trip: Trip; stops: Stop[]; images: Image[] }>(`/trips/${id}`),
  createTrip: (data: { name: string; description?: string }) =>
    request<Trip>('/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updateTrip: (id: string, data: Partial<Trip>) =>
    request<Trip>(`/trips/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteTrip: (id: string) =>
    request<void>(`/trips/${id}`, { method: 'DELETE' }),

  // Images
  uploadImages: (
    tripId: string,
    items: Array<{ file: File; exif: ExifData | null }>,
    onProgress?: (n: number, total: number) => void
  ) => {
    const chunks: Array<{ file: File; exif: ExifData | null }>[] = []
    for (let i = 0; i < items.length; i += 10) {
      chunks.push(items.slice(i, i + 10))
    }
    return chunks.reduce(async (prev, chunk, idx) => {
      const results = await prev
      const formData = new FormData()
      chunk.forEach(({ file }) => formData.append('images', file))
      formData.append(
        'exif',
        JSON.stringify(
          chunk.map(({ exif }) => ({
            lat: exif?.lat ?? null,
            lng: exif?.lng ?? null,
            takenAt: exif?.takenAt ? exif.takenAt.toISOString() : null,
            cameraMake: exif?.make ?? null,
            cameraModel: exif?.model ?? null,
            width: exif?.width ?? null,
            height: exif?.height ?? null,
          }))
        )
      )
      const res = await fetch(`${BASE}/trips/${tripId}/images`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`)
      const data = await res.json()
      onProgress?.(Math.min((idx + 1) * 10, items.length), items.length)
      return [...results, ...data]
    }, Promise.resolve([] as Image[]))
  },
  getImages: (tripId: string) => request<Image[]>(`/trips/${tripId}/images`),
  deleteImage: (id: string) => request<void>(`/images/${id}`, { method: 'DELETE' }),

  // Build / Stops
  buildTrip: (tripId: string, thresholds?: Partial<ClusterThresholds>) =>
    request<Stop[]>(`/trips/${tripId}/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(thresholds || {}),
    }),
  updateStop: (id: string, data: Partial<Stop>) =>
    request<Stop>(`/stops/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteStop: (id: string) => request<void>(`/stops/${id}`, { method: 'DELETE' }),
  reorderStops: (tripId: string, stopIds: string[]) =>
    request<void>(`/trips/${tripId}/stops/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stopIds }),
    }),

  // Geocode
  geocode: (lat: number, lng: number) =>
    request<{ name: string; address: string }>(`/geocode?lat=${lat}&lng=${lng}`),
}
