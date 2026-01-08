/**
 * Moon phase display component
 */
export function MoonPhase({ illumination, position }) {
  if (!illumination) return null

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Lunar Phase
      </h3>

      <div className="flex items-center gap-4">
        {/* Moon icon */}
        <div className="text-6xl">
          {illumination.phaseIcon}
        </div>

        {/* Phase info */}
        <div className="flex-1">
          <div className="text-xl font-semibold text-white">
            {illumination.phaseName}
          </div>
          <div className="text-sm text-gray-400">
            {illumination.percentIlluminated}% illuminated
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gray-600 to-gray-300 rounded-full transition-all"
              style={{ width: `${illumination.percentIlluminated}%` }}
            />
          </div>
        </div>
      </div>

      {/* Position data */}
      {position && (
        <div className="mt-4 pt-4 border-t border-gray-700/50 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Altitude:</span>
            <span className="ml-2 text-gray-300">{position.altitude.toFixed(1)}°</span>
          </div>
          <div>
            <span className="text-gray-500">Azimuth:</span>
            <span className="ml-2 text-gray-300">{position.azimuth.toFixed(1)}°</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Distance:</span>
            <span className="ml-2 text-gray-300">{Math.round(position.distance).toLocaleString()} km</span>
          </div>
        </div>
      )}
    </div>
  )
}
