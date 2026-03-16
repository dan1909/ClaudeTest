export interface Trip {
  id: string
  name: string
  description: string
  startDate: string | null
  endDate: string | null
  coverImageId: string | null
  createdAt: string
  stopCount?: number
  imageCount?: number
}

export interface Stop {
  id: string
  tripId: string
  name: string
  type: 'hotel' | 'restaurant' | 'activity' | 'transport' | 'other'
  lat: number
  lng: number
  address: string
  arrivalDate: string | null
  departureDate: string | null
  notes: string
  orderIndex: number
  imageCount?: number
  images?: Image[]
}

export interface Image {
  id: string
  tripId: string
  stopId: string | null
  filename: string
  storedFilename: string
  thumbnailFilename: string | null
  lat: number | null
  lng: number | null
  takenAt: string | null
  cameraMake: string | null
  cameraModel: string | null
  width: number | null
  height: number | null
  fileSize: number | null
}

export interface ExifData {
  lat?: number
  lng?: number
  takenAt?: Date
  make?: string
  model?: string
  width?: number
  height?: number
}

export interface ClusterThresholds {
  timeGapHours: number
  distanceKm: number
  mergeDistanceKm: number
  mergeTimeHours: number
}
