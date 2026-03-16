import { cn } from '../../lib/utils'

type Status = 'gps' | 'date-only' | 'none'

const labels: Record<Status, string> = {
  gps: 'GPS',
  'date-only': 'Date',
  none: 'No data',
}

const colors: Record<Status, string> = {
  gps: 'bg-green-500/20 text-green-400 border-green-500/30',
  'date-only': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  none: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function ExifBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        'text-xs px-1.5 py-0.5 rounded border font-medium',
        colors[status]
      )}
    >
      {labels[status]}
    </span>
  )
}
