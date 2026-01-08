import { useAtmosphere } from '../../hooks/useAtmosphere'
import { useLocationStore } from '../../stores/locationStore'
import { getObservationRating } from '../../utils/atmosphere'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

export function AtmosphereView() {
  const { location } = useLocationStore()
  const { data, isLoading, error, refresh, lastFetch } = useAtmosphere(location.lat, location.lng)

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading atmospheric data...</div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
        <div className="text-red-400 mb-2">Failed to load atmospheric data</div>
        <div className="text-sm text-gray-500 mb-4">{error}</div>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  const { current, hourlyForecast, bestWindow } = data

  // Prepare chart data
  const chartData = hourlyForecast.slice(0, 24).map(h => ({
    time: h.time.toLocaleTimeString('en-US', { hour: 'numeric' }),
    cloudCover: h.cloudCover,
    score: h.score,
    visibility: Math.round(h.visibility / 1000)
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Observation Conditions</h2>
          <p className="text-sm text-gray-500">
            Atmospheric data for {location.name}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Current Conditions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Observation Score */}
        <div className={`rounded-xl p-6 border ${current.rating.bg} border-gray-700/50`}>
          <div className="text-sm text-gray-400 mb-2">Observation Score</div>
          <div className="flex items-end gap-2">
            <span className={`text-5xl font-bold ${current.rating.color}`}>
              {current.observationScore}
            </span>
            <span className="text-gray-500 mb-2">/100</span>
          </div>
          <div className={`text-lg font-medium ${current.rating.color}`}>
            {current.rating.label}
          </div>
        </div>

        {/* Visibility */}
        <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700/50">
          <div className="text-sm text-gray-400 mb-2">Visibility</div>
          <div className="text-4xl font-bold text-white">
            {Math.round(current.visibility / 1000)} <span className="text-xl text-gray-500">km</span>
          </div>
          <div className={`text-sm ${current.transparency.color}`}>
            {current.transparency.label} transparency
          </div>
        </div>

        {/* Cloud Cover */}
        <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700/50">
          <div className="text-sm text-gray-400 mb-2">Cloud Cover</div>
          <div className="text-4xl font-bold text-white">
            {current.cloudCover}<span className="text-xl text-gray-500">%</span>
          </div>
          <div className="text-sm text-gray-500">
            {current.weatherDescription}
          </div>
        </div>
      </div>

      {/* Cloud Layers */}
      <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
          Cloud Layers
        </h3>
        <div className="space-y-3">
          {hourlyForecast[0] && (
            <>
              <CloudLayerBar label="High" value={hourlyForecast[0].cloudCoverHigh} color="bg-blue-400" />
              <CloudLayerBar label="Mid" value={hourlyForecast[0].cloudCoverMid} color="bg-blue-500" />
              <CloudLayerBar label="Low" value={hourlyForecast[0].cloudCoverLow} color="bg-blue-600" />
            </>
          )}
        </div>
      </div>

      {/* Best Viewing Window */}
      {bestWindow && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-2">
            Best Viewing Window
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-2xl">🔭</div>
            <div>
              <div className="text-lg text-white">
                {bestWindow.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                {' - '}
                {bestWindow.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </div>
              <div className="text-sm text-green-400">
                Score: {bestWindow.score}/100
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 24-Hour Forecast Chart */}
      <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
          24-Hour Forecast
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cloudGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <ReferenceLine y={70} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Good', fill: '#22c55e', fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="cloudCover"
                stroke="#3b82f6"
                fill="url(#cloudGradient)"
                name="Cloud Cover %"
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#22c55e"
                fill="url(#scoreGradient)"
                name="Observation Score"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-400">Cloud Cover</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-400">Observation Score</span>
          </div>
        </div>
      </div>

      {/* Detailed Conditions */}
      <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
          Current Conditions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ConditionItem label="Humidity" value={`${current.humidity}%`} />
          <ConditionItem label="Temperature" value={`${Math.round(current.temperature)}°C`} />
          <ConditionItem label="Dew Point" value={hourlyForecast[0] ? `${Math.round(hourlyForecast[0].dewPoint)}°C` : '--'} />
          <ConditionItem label="Precip. Chance" value={hourlyForecast[0] ? `${hourlyForecast[0].precipProbability}%` : '--'} />
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-xs text-gray-600">
        Last updated: {new Date(lastFetch).toLocaleTimeString()}
        {' • '}Data from Open-Meteo
      </div>
    </div>
  )
}

function CloudLayerBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-sm text-gray-400">{label}</span>
      <div className="flex-1 h-6 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-12 text-sm text-gray-300 text-right">{value}%</span>
    </div>
  )
}

function ConditionItem({ label, value }) {
  return (
    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-mono text-gray-200">{value}</div>
    </div>
  )
}
