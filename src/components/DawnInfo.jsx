import { formatTime } from '../utils/dawn'

/**
 * Display dawn/sunrise times info
 */
export function DawnInfo({ civilTwilight, sunrise, isToday }) {
  const dayLabel = isToday ? 'Today' : 'Tomorrow'

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
        <span className="text-2xl">🌅</span>
        {dayLabel}'s Dawn Schedule
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Civil Twilight - the "butt crack" */}
        <div className="text-center p-4 bg-gradient-to-br from-purple-900/30 to-orange-900/30 rounded-lg">
          <div className="text-3xl mb-2">🍑</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Butt Crack of Dawn
          </div>
          <div className="text-2xl font-bold text-orange-400">
            {civilTwilight ? formatTime(civilTwilight) : '--:--'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Civil Twilight
          </div>
        </div>

        {/* Official Sunrise */}
        <div className="text-center p-4 bg-gradient-to-br from-orange-900/30 to-yellow-900/30 rounded-lg">
          <div className="text-3xl mb-2">☀️</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Official Sunrise
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {sunrise ? formatTime(sunrise) : '--:--'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Sun appears
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-gray-500">
        📍 Bakersfield, CA (35.37°N, 119.02°W)
      </div>
    </div>
  )
}
