import { useState, useMemo } from 'react'
import { useHistoryStore } from '../../stores/historyStore'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const RANGES = [
  { id: '7d', label: '7 Days', days: 7 },
  { id: '30d', label: '30 Days', days: 30 },
  { id: '90d', label: '90 Days', days: 90 },
  { id: '1y', label: '1 Year', days: 365 }
]

export function HistoryView() {
  const [range, setRange] = useState('30d')
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)

  const { getRecentRecords, dailyRecords } = useHistoryStore()

  const selectedRange = RANGES.find(r => r.id === range)
  const records = useMemo(() => getRecentRecords(selectedRange.days), [getRecentRecords, selectedRange.days])

  // Prepare chart data
  const daylightData = useMemo(() => {
    return records.map(r => ({
      date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      daylight: r.solar?.daylightMinutes ? Math.round(r.solar.daylightMinutes / 60 * 10) / 10 : null,
      fullDate: r.date
    })).filter(d => d.daylight !== null)
  }, [records])

  const sunTimesData = useMemo(() => {
    return records.map(r => {
      const sunrise = r.solar?.sunrise ? new Date(r.solar.sunrise) : null
      const sunset = r.solar?.sunset ? new Date(r.solar.sunset) : null
      return {
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sunrise: sunrise ? sunrise.getHours() + sunrise.getMinutes() / 60 : null,
        sunset: sunset ? sunset.getHours() + sunset.getMinutes() / 60 : null,
        fullDate: r.date
      }
    }).filter(d => d.sunrise !== null)
  }, [records])

  const moonData = useMemo(() => {
    return records.map(r => ({
      date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      illumination: r.lunar?.illumination || 0,
      phase: r.lunar?.phaseName || 'Unknown',
      fullDate: r.date
    }))
  }, [records])

  // Calendar data
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()

    const days = []

    // Padding for start of month
    for (let i = 0; i < startPadding; i++) {
      days.push(null)
    }

    // Days of month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        day: d,
        dateKey,
        record: dailyRecords[dateKey] || null
      })
    }

    return days
  }, [calendarMonth, dailyRecords])

  const navigateMonth = (delta) => {
    const newMonth = new Date(calendarMonth)
    newMonth.setMonth(newMonth.getMonth() + delta)
    setCalendarMonth(newMonth)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">History</h2>
          <p className="text-sm text-gray-500">
            Track astronomical patterns over time
          </p>
        </div>

        {/* Range selector */}
        <div className="flex gap-2">
          {RANGES.map(r => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                range === r.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {records.length === 0 ? (
        <div className="bg-gray-900/60 rounded-xl p-12 text-center border border-gray-700/50">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-400">No historical data yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Data is recorded daily as you use the app.
          </p>
        </div>
      ) : (
        <>
          {/* Daylight Duration Chart */}
          <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Daylight Duration
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daylightData}>
                  <defs>
                    <linearGradient id="daylightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} unit="h" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(value) => [`${value} hours`, 'Daylight']}
                  />
                  <Area
                    type="monotone"
                    dataKey="daylight"
                    stroke="#f59e0b"
                    fill="url(#daylightGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sunrise/Sunset Times Chart */}
          <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Sunrise & Sunset Times
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sunTimesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={11}
                    domain={[4, 22]}
                    tickFormatter={(v) => `${Math.floor(v)}:00`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(value) => {
                      const h = Math.floor(value)
                      const m = Math.round((value - h) * 60)
                      return [`${h}:${String(m).padStart(2, '0')}`, '']
                    }}
                  />
                  <Line type="monotone" dataKey="sunrise" stroke="#f59e0b" name="Sunrise" dot={false} />
                  <Line type="monotone" dataKey="sunset" stroke="#ef4444" name="Sunset" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded"></div>
                <span className="text-gray-400">Sunrise</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-gray-400">Sunset</span>
              </div>
            </div>
          </div>

          {/* Moon Illumination Chart */}
          <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Moon Illumination Cycle
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={moonData}>
                  <defs>
                    <linearGradient id="moonGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#9ca3af" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(value, name, props) => [`${value}%`, props.payload.phase]}
                  />
                  <Area
                    type="monotone"
                    dataKey="illumination"
                    stroke="#9ca3af"
                    fill="url(#moonGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Calendar
              </h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                >
                  ←
                </button>
                <span className="text-white font-medium w-32 text-center">
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                >
                  →
                </button>
              </div>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-xs text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, i) => (
                <div key={i} className="aspect-square">
                  {day && (
                    <button
                      onClick={() => day.record && setSelectedDay(day)}
                      disabled={!day.record}
                      className={`w-full h-full rounded-lg text-sm flex flex-col items-center justify-center transition-colors ${
                        day.record
                          ? 'bg-blue-900/30 hover:bg-blue-800/40 text-blue-300 cursor-pointer'
                          : 'text-gray-600 cursor-default'
                      } ${
                        selectedDay?.dateKey === day.dateKey ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <span>{day.day}</span>
                      {day.record?.lunar?.phaseName && (
                        <span className="text-xs opacity-75">
                          {getMoonEmoji(day.record.lunar.phaseName)}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Day Detail */}
          {selectedDay && selectedDay.record && (
            <DayDetailModal
              day={selectedDay}
              onClose={() => setSelectedDay(null)}
            />
          )}
        </>
      )}
    </div>
  )
}

function getMoonEmoji(phaseName) {
  const emojis = {
    'New Moon': '🌑',
    'Waxing Crescent': '🌒',
    'First Quarter': '🌓',
    'Waxing Gibbous': '🌔',
    'Full Moon': '🌕',
    'Waning Gibbous': '🌖',
    'Last Quarter': '🌗',
    'Waning Crescent': '🌘'
  }
  return emojis[phaseName] || '🌙'
}

function DayDetailModal({ day, onClose }) {
  const record = day.record
  const date = new Date(day.dateKey + 'T12:00:00')

  const formatDuration = (minutes) => {
    if (!minutes) return '--'
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}h ${m}m`
  }

  const formatTime = (isoString) => {
    if (!isoString) return '--:--'
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700/50 rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">
            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Location */}
          <div className="text-sm text-gray-500">
            📍 {record.location?.name || 'Unknown location'}
          </div>

          {/* Solar */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-400 mb-3">☀️ Solar</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Sunrise</span>
                <div className="text-white">{formatTime(record.solar?.sunrise)}</div>
              </div>
              <div>
                <span className="text-gray-500">Sunset</span>
                <div className="text-white">{formatTime(record.solar?.sunset)}</div>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Daylight</span>
                <div className="text-white">{formatDuration(record.solar?.daylightMinutes)}</div>
              </div>
            </div>
          </div>

          {/* Lunar */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">🌙 Lunar</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Phase</span>
                <div className="text-white">{getMoonEmoji(record.lunar?.phaseName)} {record.lunar?.phaseName}</div>
              </div>
              <div>
                <span className="text-gray-500">Illumination</span>
                <div className="text-white">{record.lunar?.illumination}%</div>
              </div>
              <div>
                <span className="text-gray-500">Moonrise</span>
                <div className="text-white">{formatTime(record.lunar?.moonrise)}</div>
              </div>
              <div>
                <span className="text-gray-500">Moonset</span>
                <div className="text-white">{formatTime(record.lunar?.moonset)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
