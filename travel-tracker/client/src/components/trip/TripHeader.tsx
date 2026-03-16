import { Trip } from '../../types'
import { formatDateRange } from '../../lib/utils'
import { ArrowLeft, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TripHeader({ trip, stopCount, imageCount }: { trip: Trip; stopCount: number; imageCount?: number }) {
  return (
    <div className="border-b border-border px-4 py-3 flex items-center gap-4 bg-background flex-shrink-0">
      <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <div className="min-w-0">
          <h1 className="font-semibold text-foreground truncate">{trip.name}</h1>
          <p className="text-xs text-muted-foreground">
            {formatDateRange(trip.startDate, trip.endDate)}
            {stopCount > 0 && ` · ${stopCount} stops`}
            {imageCount != null && imageCount > 0 && ` · ${imageCount} photos`}
          </p>
        </div>
      </div>
    </div>
  )
}
