import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useTripStore } from '../store/tripStore'
import TripCard from '../components/trip/TripCard'
import { Plus, MapPin } from 'lucide-react'

export default function HomePage() {
  const { trips, setTrips } = useTripStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getTrips()
      .then(setTrips)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [setTrips])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading trips…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Error: {error}</div>
      </div>
    )
  }

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <MapPin className="w-16 h-16 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">No trips yet</h2>
          <p className="text-muted-foreground mb-4">Upload some photos to get started</p>
          <Link
            to="/trips/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create your first trip
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">My Trips</h1>
        <Link
          to="/trips/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Trip
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </div>
  )
}
