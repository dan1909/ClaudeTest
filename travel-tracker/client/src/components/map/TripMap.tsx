import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Stop } from '../../types'
import StopMarker from './StopMarker'
import RoutePolyline from './RoutePolyline'
import L from 'leaflet'

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function FitBounds({ stops }: { stops: Stop[] }) {
  const map = useMap()
  useEffect(() => {
    if (stops.length === 0) return
    const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]))
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [stops, map])
  return null
}

interface TripMapProps {
  stops: Stop[]
  className?: string
}

export default function TripMap({ stops, className }: TripMapProps) {
  const center: [number, number] = stops.length > 0
    ? [stops[0].lat, stops[0].lng]
    : [20, 0]

  return (
    <div className={className || 'h-full w-full'}>
      <MapContainer center={center} zoom={4} className="h-full w-full">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        {stops.length > 0 && <FitBounds stops={stops} />}
        <RoutePolyline stops={stops} />
        {stops.map((stop, idx) => (
          <StopMarker key={stop.id} stop={stop} index={idx + 1} />
        ))}
      </MapContainer>
    </div>
  )
}
