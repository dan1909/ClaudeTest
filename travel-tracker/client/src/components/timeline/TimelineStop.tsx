import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Stop } from '../../types'
import { useTripStore } from '../../store/tripStore'
import { cn, formatDate } from '../../lib/utils'
import { MapPin, Hotel, Utensils, Activity, Car, Clock } from 'lucide-react'

function daysSpent(arrivalDate: string | null, departureDate: string | null): number | null {
  if (!arrivalDate || !departureDate) return null
  const diff = differenceInCalendarDays(parseISO(departureDate), parseISO(arrivalDate))
  return Math.max(1, diff + 1) // same-day visit = 1 day
}

const typeIcons: Record<Stop['type'], React.ReactNode> = {
  hotel: <Hotel className="w-3.5 h-3.5" />,
  restaurant: <Utensils className="w-3.5 h-3.5" />,
  activity: <Activity className="w-3.5 h-3.5" />,
  transport: <Car className="w-3.5 h-3.5" />,
  other: <MapPin className="w-3.5 h-3.5" />,
}

const typeColors: Record<Stop['type'], string> = {
  hotel: 'bg-purple-500/20 text-purple-400',
  restaurant: 'bg-orange-500/20 text-orange-400',
  activity: 'bg-green-500/20 text-green-400',
  transport: 'bg-blue-500/20 text-blue-400',
  other: 'bg-gray-500/20 text-gray-400',
}

interface TimelineStopProps {
  stop: Stop
}

export default function TimelineStop({ stop }: TimelineStopProps) {
  const { activeStopId, setActiveStopId } = useTripStore()
  const isActive = activeStopId === stop.id
  const days = daysSpent(stop.arrivalDate, stop.departureDate)

  return (
    <div
      onClick={() => setActiveStopId(isActive ? null : stop.id)}
      className={cn(
        'rounded-lg p-3 cursor-pointer transition-colors border',
        isActive
          ? 'bg-blue-600/20 border-blue-500/50'
          : 'bg-accent/50 border-transparent hover:bg-accent hover:border-border'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground text-sm truncate">{stop.name}</h3>
            <span
              className={cn(
                'flex items-center gap-1 text-xs px-1.5 py-0.5 rounded flex-shrink-0',
                typeColors[stop.type]
              )}
            >
              {typeIcons[stop.type]}
              {stop.type}
            </span>
          </div>
          {stop.address && (
            <p className="text-xs text-muted-foreground truncate mb-1">{stop.address}</p>
          )}
          {(stop.arrivalDate || stop.departureDate) && (
            <p className="text-xs text-muted-foreground">
              {formatDate(stop.arrivalDate)}
              {stop.departureDate && stop.departureDate !== stop.arrivalDate
                ? ` – ${formatDate(stop.departureDate)}`
                : ''}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {days != null && (
            <span className="flex items-center gap-1 text-xs text-blue-400 font-medium">
              <Clock className="w-3 h-3" />
              {days} day{days !== 1 ? 's' : ''}
            </span>
          )}
          {stop.imageCount != null && stop.imageCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {stop.imageCount} photo{stop.imageCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      {stop.images && stop.images.length > 0 && (
        <div className="flex gap-1 mt-2 overflow-x-auto">
          {stop.images.slice(0, 4).map((img) => (
            <img
              key={img.id}
              src={`/thumbnails/${img.thumbnailFilename}`}
              alt={img.filename}
              className="w-12 h-12 object-cover rounded flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ))}
          {stop.images.length > 4 && (
            <div className="w-12 h-12 bg-background rounded flex-shrink-0 flex items-center justify-center text-xs text-muted-foreground">
              +{stop.images.length - 4}
            </div>
          )}
        </div>
      )}
      {stop.notes && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{stop.notes}</p>
      )}
    </div>
  )
}
