import { create } from 'zustand'
import { Trip, Stop } from '../types'

interface TripStore {
  trips: Trip[]
  currentTrip: Trip | null
  currentStops: Stop[]
  activeStopId: string | null
  setTrips: (trips: Trip[]) => void
  setCurrentTrip: (trip: Trip | null) => void
  setCurrentStops: (stops: Stop[]) => void
  setActiveStopId: (id: string | null) => void
  updateStop: (stop: Stop) => void
}

export const useTripStore = create<TripStore>((set) => ({
  trips: [],
  currentTrip: null,
  currentStops: [],
  activeStopId: null,
  setTrips: (trips) => set({ trips }),
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setCurrentStops: (stops) => set({ currentStops: stops }),
  setActiveStopId: (id) => set({ activeStopId: id }),
  updateStop: (stop) =>
    set((state) => ({
      currentStops: state.currentStops.map((s) => (s.id === stop.id ? stop : s)),
    })),
}))
