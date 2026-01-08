import { useMemo } from 'react'
import { useHistoryStore } from '../../stores/historyStore'
import { usePatternsStore } from '../../stores/patternsStore'
import { PatternsList } from '../PatternsList'
import { PATTERN_TYPES } from '../../utils/patterns'

export function PatternsView() {
  const { getRecentRecords, dailyRecords } = useHistoryStore()
  const { patterns, detectPatterns, clearPatterns, atmosphereHistory, lastDetection } = usePatternsStore()

  const records = useMemo(() => getRecentRecords(90), [getRecentRecords])

  const handleRescan = () => {
    detectPatterns(records)
  }

  // Group patterns by type for summary
  const patternsByType = useMemo(() => {
    const grouped = {}
    Object.values(PATTERN_TYPES).forEach(type => {
      grouped[type] = patterns.filter(p => p.type === type)
    })
    return grouped
  }, [patterns])

  const totalRecords = Object.keys(dailyRecords).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Pattern Analysis</h2>
          <p className="text-sm text-gray-500">
            Cross-referencing astronomical and atmospheric data
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRescan}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors"
          >
            Rescan Data
          </button>
          {patterns.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all discovered patterns?')) {
                  clearPatterns()
                }
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Data Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DataCard
          label="Days Tracked"
          value={totalRecords}
          icon="📅"
          subtitle="solar/lunar data"
        />
        <DataCard
          label="Atmosphere Readings"
          value={atmosphereHistory.length}
          icon="🌡️"
          subtitle="for cross-reference"
        />
        <DataCard
          label="Patterns Found"
          value={patterns.length}
          icon="🔍"
          subtitle={lastDetection ? `Last: ${new Date(lastDetection).toLocaleDateString()}` : 'Run scan'}
        />
        <DataCard
          label="High Confidence"
          value={patterns.filter(p => p.confidence >= 0.85).length}
          icon="✓"
          subtitle="≥85% confidence"
        />
      </div>

      {/* Pattern Type Summary */}
      {patterns.length > 0 && (
        <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/50">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
            Pattern Categories
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(patternsByType).map(([type, typePatterns]) => (
              typePatterns.length > 0 && (
                <span
                  key={type}
                  className={`px-3 py-1 rounded-full text-sm ${getTypeBadgeStyle(type)}`}
                >
                  {getTypeEmoji(type)} {getTypeName(type)}: {typePatterns.length}
                </span>
              )
            ))}
          </div>
        </div>
      )}

      {/* Minimum Data Notice */}
      {totalRecords < 7 && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="text-yellow-400 font-medium">Limited Data</h4>
              <p className="text-sm text-gray-400">
                Pattern detection works best with at least 7 days of data.
                Currently tracking {totalRecords} day{totalRecords !== 1 ? 's' : ''}.
                Keep using the app to discover more patterns!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Patterns List */}
      <PatternsList />

      {/* Algorithm Info */}
      <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-800/50">
        <h4 className="text-sm font-medium text-gray-400 mb-2">Detection Algorithms</h4>
        <div className="grid md:grid-cols-2 gap-2 text-xs text-gray-500">
          <div>• <strong>Daylight Trends</strong>: Linear regression on daily duration</div>
          <div>• <strong>Sun Time Shifts</strong>: Tracks sunrise/sunset changes</div>
          <div>• <strong>Moon Cycles</strong>: Full/new moon frequency analysis</div>
          <div>• <strong>Visibility Patterns</strong>: Statistical analysis of atmospheric clarity</div>
          <div>• <strong>Moon-Cloud Correlation</strong>: Pearson correlation coefficient</div>
          <div>• <strong>Optimal Conditions</strong>: Best observation time aggregation</div>
        </div>
      </div>
    </div>
  )
}

function DataCard({ label, value, icon, subtitle }) {
  return (
    <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/50">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-600">{subtitle}</div>
    </div>
  )
}

function getTypeName(type) {
  const names = {
    [PATTERN_TYPES.TREND]: 'Trends',
    [PATTERN_TYPES.CORRELATION]: 'Correlations',
    [PATTERN_TYPES.CYCLE]: 'Cycles',
    [PATTERN_TYPES.ANOMALY]: 'Anomalies',
    [PATTERN_TYPES.OPTIMAL]: 'Optimal',
    [PATTERN_TYPES.SEASONAL]: 'Seasonal'
  }
  return names[type] || type
}

function getTypeEmoji(type) {
  const emojis = {
    [PATTERN_TYPES.TREND]: '📈',
    [PATTERN_TYPES.CORRELATION]: '🔗',
    [PATTERN_TYPES.CYCLE]: '🔄',
    [PATTERN_TYPES.ANOMALY]: '⚡',
    [PATTERN_TYPES.OPTIMAL]: '🎯',
    [PATTERN_TYPES.SEASONAL]: '🍂'
  }
  return emojis[type] || '📊'
}

function getTypeBadgeStyle(type) {
  const styles = {
    [PATTERN_TYPES.TREND]: 'bg-blue-900/30 text-blue-400',
    [PATTERN_TYPES.CORRELATION]: 'bg-purple-900/30 text-purple-400',
    [PATTERN_TYPES.CYCLE]: 'bg-cyan-900/30 text-cyan-400',
    [PATTERN_TYPES.ANOMALY]: 'bg-red-900/30 text-red-400',
    [PATTERN_TYPES.OPTIMAL]: 'bg-green-900/30 text-green-400',
    [PATTERN_TYPES.SEASONAL]: 'bg-orange-900/30 text-orange-400'
  }
  return styles[type] || 'bg-gray-800 text-gray-400'
}
