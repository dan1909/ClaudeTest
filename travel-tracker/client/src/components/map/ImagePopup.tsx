import { Image } from '../../types'

export default function ImagePopup({ images }: { images: Image[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mt-2 max-w-xs">
      {images.slice(0, 6).map((img) => (
        <img
          key={img.id}
          src={`/thumbnails/${img.thumbnailFilename}`}
          alt={img.filename}
          className="w-16 h-16 object-cover rounded flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ))}
      {images.length > 6 && (
        <div className="w-16 h-16 bg-accent rounded flex-shrink-0 flex items-center justify-center text-xs text-muted-foreground">
          +{images.length - 6}
        </div>
      )}
    </div>
  )
}
