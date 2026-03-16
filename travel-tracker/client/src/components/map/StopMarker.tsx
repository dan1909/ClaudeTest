import { useEffect, useRef } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Stop } from '../../types'
import { useTripStore } from '../../store/tripStore'
import ImagePopup from './ImagePopup'
import { formatDate } from '../../lib/utils'

interface StopMarkerProps {
  stop: Stop
  index: number
}

export default function StopMarker({ stop, index }: StopMarkerProps) {
  const { activeStopId, setActiveStopId } = useTripStore()
  const markerRef = useRef<L.Marker>(null)
  const map = useMap()
  const isActive = activeStopId === stop.id

  useEffect(() => {
    if (isActive && markerRef.current) {
      map.panTo([stop.lat, stop.lng], { animate: true })
      markerRef.current.openPopup()
    }
  }, [isActive, map, stop.lat, stop.lng])

  const icon = L.divIcon({
    className: '',
    html: `<div style="
      width: 32px; height: 32px;
      background: ${isActive ? '#3b82f6' : '#1e40af'};
      border: 2px solid ${isActive ? '#93c5fd' : '#3b82f6'};
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: bold; font-size: 13px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      cursor: pointer;
      transition: all 0.2s;
    ">${index}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  })

  return (
    <Marker
      ref={markerRef}
      position={[stop.lat, stop.lng]}
      icon={icon}
      eventHandlers={{
        click: () => setActiveStopId(stop.id),
      }}
    >
      <Popup minWidth={300}>
        <div className="text-foreground">
          <h3 className="font-semibold text-base mb-1">{stop.name}</h3>
          {stop.address && (
            <p className="text-xs text-muted-foreground mb-2">{stop.address}</p>
          )}
          {(stop.arrivalDate || stop.departureDate) && (
            <p className="text-xs text-muted-foreground mb-2">
              {formatDate(stop.arrivalDate)}
              {stop.departureDate && stop.departureDate !== stop.arrivalDate
                ? ` – ${formatDate(stop.departureDate)}`
                : ''}
            </p>
          )}
          {stop.images && stop.images.length > 0 && (
            <ImagePopup images={stop.images} />
          )}
        </div>
      </Popup>
    </Marker>
  )
}
