import { useState, useCallback } from 'react'
import { api } from '../lib/api'

export function useReverseGeocode() {
  const [cache, setCache] = useState<Record<string, { name: string; address: string }>>({})

  const geocode = useCallback(
    async (lat: number, lng: number): Promise<{ name: string; address: string }> => {
      const key = `${lat.toFixed(3)},${lng.toFixed(3)}`
      if (cache[key]) return cache[key]
      const result = await api.geocode(lat, lng)
      setCache((prev) => ({ ...prev, [key]: result }))
      return result
    },
    [cache]
  )

  return { geocode }
}
