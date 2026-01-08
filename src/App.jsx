import { useState, useEffect } from 'react'
import { useLocationStore } from './stores/locationStore'
import { useHistoryStore } from './stores/historyStore'
import { usePatternsStore } from './stores/patternsStore'
import { useAstronomy } from './hooks/useAstronomy'
import { useAtmosphere } from './hooks/useAtmosphere'
import { Sidebar } from './components/Sidebar'
import { LocationSelector } from './components/LocationSelector'
import { InstallPrompt } from './components/InstallPrompt'
import { TodayView } from './components/views/TodayView'
import { HistoryView } from './components/views/HistoryView'
import { AtmosphereView } from './components/views/AtmosphereView'
import { PatternsView } from './components/views/PatternsView'
import { StatsView } from './components/views/StatsView'

function App() {
  const [currentView, setCurrentView] = useState('today')

  // Location state
  const { location, setLocation } = useLocationStore()

  // History tracking
  const { recordDay, getRecentRecords, backfillHistory, dailyRecords } = useHistoryStore()

  // Pattern detection
  const { recordAtmosphere, detectPatterns } = usePatternsStore()

  // Get astronomical data for recording
  const { sunTimes, moonTimes, moonIllumination, daylight } = useAstronomy(location.lat, location.lng)

  // Get atmosphere data for cross-referencing
  const { data: atmosphereData } = useAtmosphere(location.lat, location.lng)

  // Backfill historical data on first load or when location changes
  useEffect(() => {
    const recordCount = Object.keys(dailyRecords).length
    // Backfill if we have less than 30 days of data
    if (recordCount < 30) {
      backfillHistory(90, location)
    }
  }, [location.lat, location.lng])

  // Record daily data for history tracking
  useEffect(() => {
    if (sunTimes && moonIllumination && daylight) {
      recordDay({
        location,
        sunTimes,
        moonTimes,
        moonIllumination,
        daylight
      })
    }
  }, [sunTimes?.sunrise?.toISOString(), location.name])

  // Record atmosphere data for pattern cross-referencing
  useEffect(() => {
    if (atmosphereData?.current) {
      recordAtmosphere(atmosphereData)
    }
  }, [atmosphereData?.current?.cloudCover])

  // Run pattern detection when we have enough data
  useEffect(() => {
    const records = getRecentRecords(90)
    if (records.length >= 7) {
      detectPatterns(records)
    }
  }, [sunTimes?.sunrise?.toISOString()])

  // Render the current view
  const renderView = () => {
    switch (currentView) {
      case 'today':
        return <TodayView />
      case 'history':
        return <HistoryView />
      case 'atmosphere':
        return <AtmosphereView />
      case 'patterns':
        return <PatternsView />
      case 'stats':
        return <StatsView />
      default:
        return <TodayView />
    }
  }

  // Get view title for mobile
  const getViewTitle = () => {
    switch (currentView) {
      case 'today': return 'Today'
      case 'history': return 'History'
      case 'atmosphere': return 'Atmosphere'
      case 'patterns': return 'Patterns'
      case 'stats': return 'Statistics'
      default: return 'Dawn Tracker'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-30 h-[65px]">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-white">
              Dawn Tracker
            </h1>
            <span className="hidden md:inline text-xs text-gray-500">Solar & Lunar Almanac</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile nav */}
            <div className="md:hidden">
              <select
                value={currentView}
                onChange={(e) => setCurrentView(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              >
                <option value="today">Today</option>
                <option value="history">History</option>
                <option value="atmosphere">Atmosphere</option>
                <option value="patterns">Patterns</option>
                <option value="stats">Statistics</option>
              </select>
            </div>

            <LocationSelector location={location} onLocationChange={setLocation} />
          </div>
        </div>
      </header>

      {/* Main layout with sidebar */}
      <div className="flex">
        {/* Sidebar - hidden on mobile */}
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
          {renderView()}

          {/* Footer */}
          <footer className="text-center text-gray-600 text-sm py-8 mt-8 border-t border-gray-800/50">
            <p>Astronomical calculations powered by SunCalc</p>
            <p className="text-xs mt-1">
              Data for {location.name} ({location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°)
            </p>
          </footer>
        </main>
      </div>

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  )
}

export default App
