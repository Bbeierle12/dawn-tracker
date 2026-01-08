import { useMemo } from 'react'
import { useHistoryStore } from '../../stores/historyStore'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

function formatDuration(minutes) {
  if (minutes == null) return '--'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

function formatDate(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const MOON_COLORS = {
  'New Moon': '#374151',
  'Waxing Crescent': '#4b5563',
  'First Quarter': '#6b7280',
  'Waxing Gibbous': '#9ca3af',
  'Full Moon': '#fbbf24',
  'Waning Gibbous': '#9ca3af',
  'Last Quarter': '#6b7280',
  'Waning Crescent': '#4b5563'
}

export function StatsView() {
  const { getStatistics, getRecentRecords, clearHistory } = useHistoryStore()

  const stats = useMemo(() => getStatistics(), [getStatistics])
  const recentRecords = useMemo(() => getRecentRecords(30), [getRecentRecords])

  // Prepare pie chart data for moon phases
  const moonPieData = useMemo(() => {
    if (!stats?.lunar?.phaseDistribution) return []
    return Object.entries(stats.lunar.phaseDistribution).map(([name, value]) => ({
      name,
      value,
      color: MOON_COLORS[name] || '#6b7280'
    }))
  }, [stats])

  // Prepare daylight chart data
  const daylightChartData = useMemo(() => {
    return recentRecords.map(r => ({
      date: formatDate(r.date),
      daylight: r.solar?.daylightMinutes ? Math.round(r.solar.daylightMinutes / 60 * 10) / 10 : null
    })).filter(d => d.daylight !== null)
  }, [recentRecords])

  if (!stats || stats.totalDaysTracked === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Statistics</h2>
          <p className="text-sm text-gray-500">Track your astronomical observations</p>
        </div>

        <div className="bg-gray-900/60 rounded-xl p-12 text-center border border-gray-700/50">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-400">No data recorded yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Statistics will appear as you use the app daily.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Statistics</h2>
        <p className="text-sm text-gray-500">
          Tracking since {formatDate(stats.firstRecordDate)}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Days Tracked" value={stats.totalDaysTracked} icon="📅" />
        <StatCard label="Full Moons" value={stats.lunar.fullMoonCount} icon="🌕" color="text-yellow-400" />
        <StatCard label="New Moons" value={stats.lunar.newMoonCount} icon="🌑" />
        <StatCard label="Avg Daylight" value={formatDuration(stats.daylight.average)} icon="☀️" color="text-orange-400" />
      </div>

      {/* Daylight Stats */}
      <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-6">
          Daylight Duration
        </h3>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Longest Day</div>
            <div className="text-2xl font-mono text-green-400">{formatDuration(stats.daylight.longest)}</div>
            <div className="text-xs text-gray-600">{formatDate(stats.daylight.longestDate)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Current</div>
            <div className="text-2xl font-mono text-blue-400">{formatDuration(stats.daylight.current)}</div>
            <div className="text-xs text-gray-600">Today</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Shortest Day</div>
            <div className="text-2xl font-mono text-purple-400">{formatDuration(stats.daylight.shortest)}</div>
            <div className="text-xs text-gray-600">{formatDate(stats.daylight.shortestDate)}</div>
          </div>
        </div>

        {/* Daylight chart */}
        {daylightChartData.length > 0 && (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daylightChartData}>
                <defs>
                  <linearGradient id="statsDaylightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value) => [`${value}h`, 'Daylight']}
                />
                <Area type="monotone" dataKey="daylight" stroke="#f59e0b" fill="url(#statsDaylightGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Lunar Stats */}
      <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-6">
          Lunar Cycles
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Moon events */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
              <span className="text-3xl">🌕</span>
              <div>
                <div className="text-sm text-gray-500">Last Full Moon</div>
                <div className="text-white">{formatDate(stats.lunar.lastFullMoon) || 'None recorded'}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
              <span className="text-3xl">🌑</span>
              <div>
                <div className="text-sm text-gray-500">Last New Moon</div>
                <div className="text-white">{formatDate(stats.lunar.lastNewMoon) || 'None recorded'}</div>
              </div>
            </div>
          </div>

          {/* Phase distribution pie chart */}
          {moonPieData.length > 0 && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moonPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, value }) => `${value}`}
                    labelLine={false}
                  >
                    {moonPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(value, name) => [`${value} days`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Clear History */}
      <div className="text-center pt-4">
        <button
          onClick={() => {
            if (confirm('Clear all tracking history? This cannot be undone.')) {
              clearHistory()
            }
          }}
          className="text-sm text-red-400/60 hover:text-red-400 transition-colors"
        >
          Clear All History
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color = 'text-white' }) {
  return (
    <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/50 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}
