import { FileWithExif } from '../../hooks/useExifExtraction'
import ExifBadge from './ExifBadge'
import { X } from 'lucide-react'
import { format } from 'date-fns'

interface UploadPreviewProps {
  files: FileWithExif[]
  onRemove?: (index: number) => void
}

export default function UploadPreview({ files, onRemove }: UploadPreviewProps) {
  if (files.length === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {files.map((f, idx) => (
        <div key={idx} className="relative group rounded-lg overflow-hidden bg-accent aspect-square">
          <img
            src={f.preview}
            alt={f.file.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
            <ExifBadge status={f.status} />
            {f.exif?.takenAt && (
              <p className="text-xs text-white/80 mt-0.5 truncate">
                {format(f.exif.takenAt, 'MMM d, yyyy')}
              </p>
            )}
          </div>
          {onRemove && (
            <button
              onClick={() => onRemove(idx)}
              className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
