import { useMemo } from 'react'
import { useHistoryStore } from '../stores/historyStore'

/**
 * Format minutes as hours and minutes
 */
function formatDuration(minutes) {
  if (minutes == null) return '--'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Mini bar chart for daylight duration
 */
function DaylightChart({ records }) {
  if (!records || records.length === 0) return null

  const maxMinutes = Math.max(...records.map(r => r.solar?.daylightMinutes || 0))
  const minMinutes = Math.min(...records.filter(r => r.solar?.daylightMinutes).map(r => r.solar.daylightMinutes))

  // Normalize to show variation better
  const range = maxMinutes - minMinutes
  const baseline = range > 60 ? minMinutes - 30 : minMinutes - 10

  return (
    <div className="mt-4">
      <div className="text-xs text-gray-500 mb-2">Daylight Duration (Last {records.length} days)</div>
      <div className="flex items-end gap-px h-24 bg-gray-800/30 rounded p-2">
        {records.map((record, i) => {
          const minutes = record.solar?.daylightMinutes || 0
          const height = range > 0
            ? ((minutes - baseline) / (maxMinutes - baseline)) * 100
            : 50

          return (
            <div
              key={record.date}
              className="flex-1 bg-gradient-to-t from-orange-600 to-yellow-500 rounded-t transition-all hover:from-orange-500 hover:to-yellow-400"
              style={{ height: `${Math.max(5, height)}%` }}
              title={`${formatDate(record.date)}: ${formatDuration(minutes)}`}
            />
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>{formatDate(records[0]?.date)}</span>
        <span>{formatDate(records[records.length - 1]?.date)}</span>
      </div>
    </div>
  )
}

/**
 * Moon phase distribution chart
 */
function PhaseChart({ distribution }) {
  if (!distribution || Object.keys(distribution).length === 0) return null

  const phases = [
    { name: 'New Moon', icon: '🌑', color: 'bg-gray-600' },
    { name: 'Waxing Crescent', icon: '🌒', color: 'bg-gray-500' },
    { name: 'First Quarter', icon: '🌓', color: 'bg-gray-400' },
    { name: 'Waxing Gibbous', icon: '🌔', color: 'bg-gray-300' },
    { name: 'Full Moon', icon: '🌕', color: 'bg-yellow-300' },
    { name: 'Waning Gibbous', icon: '🌖', color: 'bg-gray-300' },
    { name: 'Last Quarter', icon: '🌗', color: 'bg-gray-400' },
    { name: 'Waning Crescent', icon: '🌘', color: 'bg-gray-500' }
  ]

  const total = Object.values(distribution).reduce((a, b) => a + b, 0)

  return (
    <div className="mt-4">
      <div className="text-xs text-gray-500 mb-2">Moon Phase Distribution</div>
      <div className="space-y-1">
        {phases.map(phase => {
          const count = distribution[phase.name] || 0
          const percent = total > 0 ? (count / total) * 100 : 0

          if (count === 0) return null

          return (
            <div key={phase.name} className="flex items-center gap-2">
              <span className="w-6 text-center">{phase.icon}</span>
              <div className="flex-1 h-4 bg-gray-800/50 rounded overflow-hidden">
                <div
                  className={`h-full ${phase.color} transition-all`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Statistics dashboard component
 */
export function Statistics({ isOpen, onClose }) {
  const { getStatistics, getRecentRecords, clearHistory } = useHistoryStore()

  const stats = useMemo(() => getStatistics(), [getStatistics])
  const recentRecords = useMemo(() => getRecentRecords(30), [getRecentRecords])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700/50 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Tracking Statistics</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!stats || stats.totalDaysTracked === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <p>No data recorded yet.</p>
              <p className="text-sm mt-2">Statistics will appear as you use the app daily.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{stats.totalDaysTracked}</div>
                  <div className="text-xs text-gray-500">Days Tracked</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{stats.lunar.fullMoonCount}</div>
                  <div className="text-xs text-gray-500">Full Moons</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-400">{stats.lunar.newMoonCount}</div>
                  <div className="text-xs text-gray-500">New Moons</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-orange-400">{formatDuration(stats.daylight.average)}</div>
                  <div className="text-xs text-gray-500">Avg Daylight</div>
                </div>
              </div>

              {/* Daylight Stats */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                  Daylight Duration
                </h3>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Longest Day</div>
                    <div className="text-lg font-mono text-green-400">{formatDuration(stats.daylight.longest)}</div>
                    <div className="text-xs text-gray-600">{formatDate(stats.daylight.longestDate)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Today</div>
                    <div className="text-lg font-mono text-blue-400">{formatDuration(stats.daylight.current)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Shortest Day</div>
                    <div className="text-lg font-mono text-purple-400">{formatDuration(stats.daylight.shortest)}</div>
                    <div className="text-xs text-gray-600">{formatDate(stats.daylight.shortestDate)}</div>
                  </div>
                </div>

                <DaylightChart records={recentRecords} />
              </div>

              {/* Lunar Stats */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                  Lunar Cycles
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Last Full Moon</div>
                    <div className="text-2xl mb-1">🌕</div>
                    <div className="text-sm text-gray-300">{formatDate(stats.lunar.lastFullMoon) || 'None recorded'}</div>
                  </div>
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Last New Moon</div>
                    <div className="text-2xl mb-1">🌑</div>
                    <div className="text-sm text-gray-300">{formatDate(stats.lunar.lastNewMoon) || 'None recorded'}</div>
                  </div>
                </div>

                <PhaseChart distribution={stats.lunar.phaseDistribution} />
              </div>

              {/* Tracking Period */}
              <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-800">
                Tracking since {formatDate(stats.firstRecordDate)}
              </div>

              {/* Clear History */}
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    if (confirm('Clear all tracking history? This cannot be undone.')) {
                      clearHistory()
                    }
                  }}
                  className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                >
                  Clear History
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
