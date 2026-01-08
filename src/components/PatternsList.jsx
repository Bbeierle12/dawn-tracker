import { usePatternsStore } from '../stores/patternsStore'
import { PATTERN_TYPES, getConfidenceLevel } from '../utils/patterns'

export function PatternsList({ compact = false }) {
  const { patterns, dismissPattern, lastDetection } = usePatternsStore()

  if (patterns.length === 0) {
    return (
      <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700/50 text-center">
        <div className="text-3xl mb-3">🔍</div>
        <p className="text-gray-400">No patterns detected yet</p>
        <p className="text-sm text-gray-500 mt-2">
          Patterns will be discovered as more data is collected over time.
        </p>
      </div>
    )
  }

  if (compact) {
    // Compact view for sidebar or summary
    const topPatterns = patterns.slice(0, 3)
    return (
      <div className="space-y-2">
        {topPatterns.map(pattern => (
          <CompactPatternCard key={pattern.id} pattern={pattern} />
        ))}
        {patterns.length > 3 && (
          <div className="text-xs text-gray-500 text-center">
            +{patterns.length - 3} more patterns
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Discovered Patterns</h3>
          <p className="text-xs text-gray-500">
            {patterns.length} pattern{patterns.length !== 1 ? 's' : ''} detected
            {lastDetection && ` • Last scan: ${new Date(lastDetection).toLocaleTimeString()}`}
          </p>
        </div>
      </div>

      {/* Pattern cards */}
      <div className="grid gap-4">
        {patterns.map(pattern => (
          <PatternCard
            key={pattern.id}
            pattern={pattern}
            onDismiss={() => dismissPattern(pattern.id)}
          />
        ))}
      </div>
    </div>
  )
}

function PatternCard({ pattern, onDismiss }) {
  const confidence = getConfidenceLevel(pattern.confidence)
  const typeLabel = getTypeLabel(pattern.type)

  return (
    <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/50 hover:border-gray-600/50 transition-colors">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="text-3xl">{pattern.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-white">{pattern.title}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeBadgeColor(pattern.type)}`}>
              {typeLabel}
            </span>
          </div>

          <p className="text-sm text-gray-400 mb-3">
            {pattern.description}
          </p>

          {/* Confidence meter */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getConfidenceBarColor(pattern.confidence)}`}
                style={{ width: `${pattern.confidence * 100}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${confidence.color}`}>
              {confidence.label} ({Math.round(pattern.confidence * 100)}%)
            </span>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="text-gray-600 hover:text-gray-400 transition-colors p-1"
          title="Dismiss pattern"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function CompactPatternCard({ pattern }) {
  const confidence = getConfidenceLevel(pattern.confidence)

  return (
    <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
      <span className="text-xl">{pattern.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">{pattern.title}</div>
        <div className={`text-xs ${confidence.color}`}>
          {confidence.label}
        </div>
      </div>
    </div>
  )
}

function getTypeLabel(type) {
  const labels = {
    [PATTERN_TYPES.TREND]: 'Trend',
    [PATTERN_TYPES.CORRELATION]: 'Correlation',
    [PATTERN_TYPES.CYCLE]: 'Cycle',
    [PATTERN_TYPES.ANOMALY]: 'Anomaly',
    [PATTERN_TYPES.OPTIMAL]: 'Optimal',
    [PATTERN_TYPES.SEASONAL]: 'Seasonal'
  }
  return labels[type] || 'Pattern'
}

function getTypeBadgeColor(type) {
  const colors = {
    [PATTERN_TYPES.TREND]: 'bg-blue-900/50 text-blue-400',
    [PATTERN_TYPES.CORRELATION]: 'bg-purple-900/50 text-purple-400',
    [PATTERN_TYPES.CYCLE]: 'bg-cyan-900/50 text-cyan-400',
    [PATTERN_TYPES.ANOMALY]: 'bg-red-900/50 text-red-400',
    [PATTERN_TYPES.OPTIMAL]: 'bg-green-900/50 text-green-400',
    [PATTERN_TYPES.SEASONAL]: 'bg-orange-900/50 text-orange-400'
  }
  return colors[type] || 'bg-gray-800 text-gray-400'
}

function getConfidenceBarColor(confidence) {
  if (confidence >= 0.85) return 'bg-green-500'
  if (confidence >= 0.7) return 'bg-yellow-500'
  return 'bg-gray-500'
}
