import { useState, useCallback } from 'react'

// Preset locations
const PRESETS = [
  { name: 'Bakersfield, CA', lat: 35.3733, lng: -119.0187 },
  { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
  { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
  { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
  { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
  { name: 'Denver, CO', lat: 39.7392, lng: -104.9903 },
  { name: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
  { name: 'Miami, FL', lat: 25.7617, lng: -80.1918 },
  { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
  { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 }
]

/**
 * Location selector with geolocation support
 */
export function LocationSelector({ location, onLocationChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [error, setError] = useState(null)

  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }

    setIsLocating(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'Current Location'
        })
        setIsLocating(false)
        setIsOpen(false)
      },
      (err) => {
        setError('Unable to get location')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [onLocationChange])

  const handlePresetSelect = useCallback((preset) => {
    onLocationChange(preset)
    setIsOpen(false)
  }, [onLocationChange])

  return (
    <div className="relative">
      {/* Current location button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600/50 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-sm text-gray-200">{location?.name || 'Select Location'}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Coordinates display */}
      {location && (
        <div className="mt-1 text-xs text-gray-500 text-center">
          {location.lat.toFixed(4)}°{location.lat >= 0 ? 'N' : 'S'}, {Math.abs(location.lng).toFixed(4)}°{location.lng >= 0 ? 'E' : 'W'}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600/50 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Geolocation button */}
          <button
            onClick={handleGeolocation}
            disabled={isLocating}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 transition-colors border-b border-gray-700/50"
          >
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-300">
              {isLocating ? 'Locating...' : 'Use My Location'}
            </span>
          </button>

          {error && (
            <div className="px-4 py-2 text-xs text-red-400 bg-red-900/20">
              {error}
            </div>
          )}

          {/* Preset locations */}
          <div className="max-h-60 overflow-y-auto">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset)}
                className={`
                  w-full text-left px-4 py-2 hover:bg-gray-700/50 transition-colors
                  ${location?.name === preset.name ? 'bg-blue-900/30 text-blue-300' : 'text-gray-300'}
                `}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
