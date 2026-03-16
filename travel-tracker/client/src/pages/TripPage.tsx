import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useTripStore } from '../store/tripStore'
import { Stop } from '../types'
import TripHeader from '../components/trip/TripHeader'
import TripMap from '../components/map/TripMap'
import Timeline from '../components/timeline/Timeline'
import StopEditor from '../components/trip/StopEditor'
import { Loader2, Edit } from 'lucide-react'

export default function TripPage() {
  const { id } = useParams<{ id: string }>()
  const { currentTrip, currentStops, setCurrentTrip, setCurrentStops, activeStopId } = useTripStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingStop, setEditingStop] = useState<Stop | null>(null)
  const [imageCount, setImageCount] = useState(0)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.getTrip(id)
      .then(({ trip, stops, images }) => {
        setCurrentTrip(trip)
        const stopsWithImages = stops.map((s) => ({
          ...s,
          images: images.filter((img) => img.stopId === s.id),
          imageCount: images.filter((img) => img.stopId === s.id).length,
        }))
        setCurrentStops(stopsWithImages)
        setImageCount(images.length)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, setCurrentTrip, setCurrentStops])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !currentTrip) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-400">Error: {error || 'Trip not found'}</div>
      </div>
    )
  }

  const activeStop = activeStopId ? currentStops.find((s) => s.id === activeStopId) : null

  return (
    <div className="flex flex-col h-screen">
      <TripHeader trip={currentTrip} stopCount={currentStops.length} imageCount={imageCount} />
      <div className="flex flex-1 overflow-hidden">
        {/* Timeline - 40% */}
        <div className="w-2/5 border-r border-border flex flex-col overflow-hidden">
          {activeStop && (
            <div className="flex items-center justify-between px-4 py-2 bg-blue-600/10 border-b border-blue-500/20">
              <span className="text-sm text-blue-400 font-medium">{activeStop.name}</span>
              <button
                onClick={() => setEditingStop(activeStop)}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
          )}
          <Timeline stops={currentStops} />
        </div>
        {/* Map - 60% */}
        <div className="w-3/5 relative">
          <TripMap stops={currentStops} className="h-full w-full" />
        </div>
      </div>
      {editingStop && (
        <StopEditor stop={editingStop} onClose={() => setEditingStop(null)} />
      )}
    </div>
  )
}
