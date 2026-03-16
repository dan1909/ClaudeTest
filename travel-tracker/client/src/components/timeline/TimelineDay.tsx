import { Stop } from '../../types'
import TimelineStop from './TimelineStop'
import { format, parseISO } from 'date-fns'

interface TimelineDayProps {
  date: string
  stops: Stop[]
  dayIndex: number
}

export default function TimelineDay({ date, stops, dayIndex }: TimelineDayProps) {
  const formattedDate =
    date === 'unknown'
      ? 'Unknown Date'
      : format(parseISO(date), 'EEEE, MMMM d')

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {dayIndex + 1}
        </div>
        <h2 className="font-semibold text-foreground">{formattedDate}</h2>
      </div>
      <div className="ml-4 border-l border-border pl-6 space-y-3">
        {stops.map((stop) => (
          <TimelineStop key={stop.id} stop={stop} />
        ))}
      </div>
    </div>
  )
}
