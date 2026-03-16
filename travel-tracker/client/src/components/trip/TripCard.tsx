import { Link } from 'react-router-dom'
import { Trip } from '../../types'
import { formatDateRange } from '../../lib/utils'
import { MapPin, Image } from 'lucide-react'

export default function TripCard({ trip }: { trip: Trip }) {
  return (
    <Link
      to={`/trips/${trip.id}`}
      className="block rounded-xl overflow-hidden bg-accent border border-border hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 group"
    >
      <div className="aspect-video bg-background flex items-center justify-center">
        {trip.coverImageId ? (
          <img
            src={`/thumbnails/cover_${trip.coverImageId}.jpg`}
            alt={trip.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <MapPin className="w-12 h-12 text-muted-foreground" />
        )}
      </div>
      <div className="p-4">
        <h2 className="font-semibold text-foreground text-lg mb-1 group-hover:text-blue-400 transition-colors">
          {trip.name}
        </h2>
        {(trip.startDate || trip.endDate) && (
          <p className="text-sm text-muted-foreground mb-2">
            {formatDateRange(trip.startDate, trip.endDate)}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {trip.stopCount != null && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {trip.stopCount} stop{trip.stopCount !== 1 ? 's' : ''}
            </span>
          )}
          {trip.imageCount != null && (
            <span className="flex items-center gap-1">
              <Image className="w-3 h-3" />
              {trip.imageCount} photo{trip.imageCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
