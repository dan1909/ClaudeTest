import { useCallback, useRef } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '../../lib/utils'

interface UploadZoneProps {
  onFiles: (files: File[]) => void
  disabled?: boolean
}

export default function UploadZone({ onFiles, disabled }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (disabled) return
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        /\.(jpe?g|png|heic|tiff?)$/i.test(f.name)
      )
      if (files.length) onFiles(files)
    },
    [onFiles, disabled]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length) onFiles(files)
      e.target.value = ''
    },
    [onFiles]
  )

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer transition-colors',
        'hover:border-blue-500/50 hover:bg-blue-500/5',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
      <p className="text-foreground font-medium mb-1">Drop photos here or click to browse</p>
      <p className="text-muted-foreground text-sm">JPEG, PNG, HEIC, TIFF supported</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.heic,.heif,.tiff,.tif"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
