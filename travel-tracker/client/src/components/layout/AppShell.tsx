import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MapPin, Plus } from 'lucide-react'

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const isTripPage = location.pathname.startsWith('/trips/') && location.pathname !== '/trips/new'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!isTripPage && (
        <header className="border-b border-border px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
            <MapPin className="w-6 h-6 text-blue-400" />
            Travel Tracker
          </Link>
          <Link
            to="/trips/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Trip
          </Link>
        </header>
      )}
      <main className={isTripPage ? 'flex-1 flex flex-col' : 'flex-1'}>{children}</main>
    </div>
  )
}
