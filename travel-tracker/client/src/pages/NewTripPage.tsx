import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useExifExtraction } from '../hooks/useExifExtraction'
import UploadZone from '../components/upload/UploadZone'
import UploadPreview from '../components/upload/UploadPreview'
import TripMap from '../components/map/TripMap'
import { clusterImages } from '../lib/clusterImages'
import { Stop, ClusterThresholds, Image } from '../types'
import { ArrowLeft, ArrowRight, Check, Loader2, AlertTriangle, Info } from 'lucide-react'

const DEFAULT_THRESHOLDS: ClusterThresholds = {
  timeGapHours: 4,
  distanceKm: 50,
  mergeDistanceKm: 2,
  mergeTimeHours: 12,
}

type Step = 'upload' | 'review' | 'name'

export default function NewTripPage() {
  const navigate = useNavigate()
  const { files, loading: exifLoading, extractExif, clearFiles } = useExifExtraction()
  const [step, setStep] = useState<Step>('upload')
  const [thresholds, setThresholds] = useState<ClusterThresholds>(DEFAULT_THRESHOLDS)
  const [previewStops, setPreviewStops] = useState<Omit<Stop, 'tripId'>[]>([])
  const [tripName, setTripName] = useState('')
  const [creating, setCreating] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [buildError, setBuildError] = useState<string | null>(null)

  const handleFiles = async (newFiles: File[]) => {
    const extracted = await extractExif(newFiles)
    const mockImages: Image[] = extracted
      .filter((f) => f.exif?.lat != null)
      .map((f, idx) => ({
        id: String(idx),
        tripId: '',
        stopId: null,
        filename: f.file.name,
        storedFilename: '',
        thumbnailFilename: null,
        lat: f.exif!.lat!,
        lng: f.exif!.lng!,
        takenAt: f.exif!.takenAt?.toISOString() || null,
        cameraMake: f.exif?.make || null,
        cameraModel: f.exif?.model || null,
        width: null,
        height: null,
        fileSize: null,
      }))
    setPreviewStops(clusterImages(mockImages, thresholds) as Omit<Stop, 'tripId'>[])
  }

  const recalculate = () => {
    const mockImages: Image[] = files
      .filter((f) => f.exif?.lat != null)
      .map((f, idx) => ({
        id: String(idx),
        tripId: '',
        stopId: null,
        filename: f.file.name,
        storedFilename: '',
        thumbnailFilename: null,
        lat: f.exif!.lat!,
        lng: f.exif!.lng!,
        takenAt: f.exif!.takenAt?.toISOString() || null,
        cameraMake: null,
        cameraModel: null,
        width: null,
        height: null,
        fileSize: null,
      }))
    setPreviewStops(clusterImages(mockImages, thresholds) as Omit<Stop, 'tripId'>[])
  }

  const handleCreate = async () => {
    if (!tripName.trim()) return
    setCreating(true)
    setBuildError(null)
    try {
      const trip = await api.createTrip({ name: tripName.trim() })
      await api.uploadImages(trip.id, files.map((f) => ({ file: f.file, exif: f.exif })), (done, total) => {
        setUploadProgress({ done, total })
      })
      const stops = await api.buildTrip(trip.id, thresholds)
      if (!stops || stops.length === 0) {
        const gpsCount = files.filter((f) => f.status === 'gps').length
        setBuildError(
          gpsCount === 0
            ? 'None of your photos have GPS data, so no stops could be created. The trip was saved but the map will be empty. You can add stops manually from the trip page.'
            : 'No stops were created from your photos. Try adjusting the clustering thresholds and re-uploading.'
        )
        setCreating(false)
        setUploadProgress(null)
        // Still navigate — trip exists, just empty
        navigate(`/trips/${trip.id}`)
        return
      }
      navigate(`/trips/${trip.id}`)
    } catch (err) {
      console.error(err)
      setBuildError(`Something went wrong: ${err instanceof Error ? err.message : String(err)}`)
      setCreating(false)
      setUploadProgress(null)
    }
  }

  const mapStops = previewStops.map((s, idx) => ({
    ...s,
    tripId: '',
    id: s.id || String(idx),
  })) as Stop[]

  const STEPS: Step[] = ['upload', 'review', 'name']

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      {/* Steps indicator */}
      <div className="flex items-center gap-4 mb-8">
        {STEPS.map((s, idx) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s
                  ? 'bg-blue-600 text-white'
                  : STEPS.indexOf(step) > idx
                  ? 'bg-green-600 text-white'
                  : 'bg-accent text-muted-foreground'
              }`}
            >
              {STEPS.indexOf(step) > idx ? (
                <Check className="w-4 h-4" />
              ) : (
                idx + 1
              )}
            </div>
            <span className={`text-sm font-medium ${step === s ? 'text-foreground' : 'text-muted-foreground'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
            {idx < 2 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {step === 'upload' && (
        <div className="space-y-6 pb-24">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Upload Photos</h1>
            <p className="text-muted-foreground">Add photos from your trip. EXIF metadata will be extracted automatically.</p>
          </div>
          <UploadZone onFiles={handleFiles} disabled={exifLoading} />
          {exifLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Reading EXIF data…
            </div>
          )}
          {files.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {files.length} photo{files.length !== 1 ? 's' : ''} added
                  {' · '}
                  {files.filter((f) => f.status === 'gps').length} with GPS
                </p>
                <button onClick={clearFiles} className="text-sm text-red-400 hover:text-red-300">
                  Clear all
                </button>
              </div>
              {(() => {
                const noGps = files.filter((f) => f.status !== 'gps')
                const noData = files.filter((f) => f.status === 'none')
                if (noGps.length === 0) return null
                return (
                  <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 text-sm text-yellow-400">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      {noGps.length} photo{noGps.length !== 1 ? 's' : ''} have no GPS data
                      {noData.length > 0 && ` (${noData.length} with no metadata at all)`}.
                      {' '}Photos with a timestamp will be assigned to the nearest stop by time.
                      Photos with no metadata will be ignored.
                    </span>
                  </div>
                )
              })()}
              <UploadPreview files={files} />
            </>
          )}
          {/* Sticky bottom bar — always visible even with many photos */}
          {files.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-6 py-4 z-40">
              <div className="container mx-auto max-w-4xl flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {files.length} photo{files.length !== 1 ? 's' : ''} ready
                  {' · '}
                  {files.filter((f) => f.status === 'gps').length} with GPS
                </p>
                <button
                  onClick={() => setStep('review')}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Next: Review Stops
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Review Stops</h1>
            <p className="text-muted-foreground">
              Found {previewStops.length} stop{previewStops.length !== 1 ? 's' : ''} based on your photos.
              Adjust thresholds to refine.
            </p>
          </div>

          {/* Threshold sliders */}
          <div className="bg-accent rounded-xl p-4 space-y-4">
            <h3 className="font-medium text-foreground text-sm">Clustering Thresholds</h3>
            {[
              { key: 'timeGapHours', label: 'Time gap (hours)', min: 1, max: 24, step: 1 },
              { key: 'distanceKm', label: 'Distance (km)', min: 1, max: 200, step: 1 },
              { key: 'mergeDistanceKm', label: 'Merge within (km)', min: 0.5, max: 20, step: 0.5 },
              { key: 'mergeTimeHours', label: 'Merge within (hours)', min: 1, max: 48, step: 1 },
            ].map(({ key, label, min, max, step: s }) => (
              <div key={key} className="flex items-center gap-4">
                <label className="text-sm text-muted-foreground w-44 flex-shrink-0">{label}</label>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={s}
                  value={thresholds[key as keyof ClusterThresholds]}
                  onChange={(e) => {
                    setThresholds((t) => ({ ...t, [key]: parseFloat(e.target.value) }))
                  }}
                  className="flex-1 accent-blue-500"
                />
                <span className="text-sm text-foreground w-10 text-right">
                  {thresholds[key as keyof ClusterThresholds]}
                </span>
              </div>
            ))}
            <button
              onClick={recalculate}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              Recalculate
            </button>
          </div>

          {/* Map preview */}
          {mapStops.length > 0 && (
            <div className="h-64 rounded-xl overflow-hidden border border-border">
              <TripMap stops={mapStops} />
            </div>
          )}

          {/* Stop list */}
          <div className="space-y-2">
            {mapStops.map((stop, idx) => (
              <div key={stop.id} className="flex items-center gap-3 bg-accent rounded-lg px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{stop.name}</p>
                  {stop.arrivalDate && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(stop.arrivalDate).toLocaleDateString()}
                      {stop.imageCount != null && ` · ${stop.imageCount} photos`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('upload')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => setStep('name')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Next: Name Trip
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 'name' && (
        <div className="space-y-6 max-w-md">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Name Your Trip</h1>
            <p className="text-muted-foreground">Give your trip a memorable name.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Trip Name</label>
            <input
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="e.g. Italy Summer 2024"
              onKeyDown={(e) => e.key === 'Enter' && tripName.trim() && handleCreate()}
              className="w-full bg-accent border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-blue-500 text-lg"
              autoFocus
            />
          </div>

          {buildError && (
            <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 text-sm text-yellow-400">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{buildError}</span>
            </div>
          )}

          {uploadProgress && (
            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Uploading photos…</span>
                <span>{uploadProgress.done}/{uploadProgress.total}</span>
              </div>
              <div className="h-2 bg-accent rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep('review')}
              disabled={creating}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleCreate}
              disabled={!tripName.trim() || creating}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Trip
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
