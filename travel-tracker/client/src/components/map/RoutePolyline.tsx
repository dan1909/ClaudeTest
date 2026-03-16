import { Polyline } from 'react-leaflet'
import { Stop } from '../../types'

export default function RoutePolyline({ stops }: { stops: Stop[] }) {
  if (stops.length < 2) return null
  const positions: [number, number][] = stops
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((s) => [s.lat, s.lng])

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: '#3b82f6',
        weight: 2,
        opacity: 0.6,
        dashArray: '8, 6',
      }}
    />
  )
}
