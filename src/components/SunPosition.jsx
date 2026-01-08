import { formatTime, getCurrentPeriod } from '../utils/astronomy'

/**
 * Sun position and current period display
 */
export function SunPosition({ position, times, daylight, location }) {
  const period = getCurrentPeriod(location?.lat, location?.lng)

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Solar Data
      </h3>

      {/* Current period */}
      <div className="mb-4 p-3 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg">
        <div className="text-lg font-semibold text-yellow-300">
          {period.name}
        </div>
        <div className="text-sm text-gray-400">
          {period.description}
        </div>
      </div>

      {/* Key times */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <div className="text-xs text-gray-500 uppercase">Sunrise</div>
          <div className="text-lg font-mono text-orange-400">
            {formatTime(times?.sunrise)}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <div className="text-xs text-gray-500 uppercase">Sunset</div>
          <div className="text-lg font-mono text-orange-400">
            {formatTime(times?.sunset)}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <div className="text-xs text-gray-500 uppercase">Solar Noon</div>
          <div className="text-lg font-mono text-yellow-400">
            {formatTime(times?.solarNoon)}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <div className="text-xs text-gray-500 uppercase">Daylight</div>
          <div className="text-lg font-mono text-yellow-400">
            {daylight?.formatted || '--'}
          </div>
        </div>
      </div>

      {/* Position data */}
      {position && (
        <div className="pt-3 border-t border-gray-700/50 grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Altitude:</span>
            <span className="ml-2 text-gray-300">{position.altitude.toFixed(1)}°</span>
          </div>
          <div>
            <span className="text-gray-500">Azimuth:</span>
            <span className="ml-2 text-gray-300">{position.azimuth.toFixed(1)}°</span>
          </div>
        </div>
      )}
    </div>
  )
}
