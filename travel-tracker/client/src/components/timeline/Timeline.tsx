import { useMemo } from 'react'
import { Stop } from '../../types'
import TimelineDay from './TimelineDay'
import { parseISO, format } from 'date-fns'

interface TimelineProps {
  stops: Stop[]
}

export default function Timeline({ stops }: TimelineProps) {
  const grouped = useMemo(() => {
    const days = new Map<string, Stop[]>()
    const sorted = [...stops].sort((a, b) => a.orderIndex - b.orderIndex)
    for (const stop of sorted) {
      const key = stop.arrivalDate
        ? format(parseISO(stop.arrivalDate), 'yyyy-MM-dd')
        : 'unknown'
      if (!days.has(key)) days.set(key, [])
      days.get(key)!.push(stop)
    }
    return Array.from(days.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [stops])

  if (stops.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No stops yet
      </div>
    )
  }

  return (
    <div className="overflow-y-auto h-full px-4 py-4 space-y-6">
      {grouped.map(([day, dayStops], idx) => (
        <TimelineDay key={day} date={day} stops={dayStops} dayIndex={idx} />
      ))}
    </div>
  )
}
