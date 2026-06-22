import { useEffect, useMemo, useState } from 'react'
import { useLocationStore } from '../../stores/locationStore'
import { useGardenStore } from '../../stores/gardenStore'
import { CROPS } from '../../data/crops'
import {
  getPlantingCalendar,
  methodLabel,
  formatWindowRange,
  formatMonthDay,
} from '../../utils/planting'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Render a 'MM-DD' frost-date string as 'Mon D'. */
function formatFrostDate(mmdd) {
  if (!mmdd) return '—'
  const [m, d] = mmdd.split('-').map(Number)
  return new Date(2001, m - 1, d, 12).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function PlantingCalendarView() {
  const { location } = useLocationStore()
  const {
    zip, zone, frostDates, loadingZone, loadingFrost, error,
    setZip, fetchZone, ensureFrostDates, redriveFrostDates, setManualFrostDates,
  } = useGardenStore()

  const [showSettings, setShowSettings] = useState(false)
  const [zipInput, setZipInput] = useState(zip)
  const [lsfInput, setLsfInput] = useState('')
  const [fffInput, setFffInput] = useState('')

  // Derive frost dates for the current location on mount / location change.
  useEffect(() => {
    ensureFrostDates(location.lat, location.lng)
  }, [location.lat, location.lng, ensureFrostDates])

  const today = new Date()
  const calendar = useMemo(() => {
    if (!frostDates) return null
    return getPlantingCalendar(CROPS, frostDates, today)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frostDates])

  const monthName = MONTHS[today.getMonth()]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Planting Calendar</h2>
          <p className="text-sm text-gray-500">What to plant in {location.name} right now</p>
        </div>
        <button
          onClick={() => setShowSettings((s) => !s)}
          className="text-sm text-gray-400 hover:text-gray-200 px-3 py-2 rounded-lg border border-gray-700/50 hover:bg-gray-800/50 transition-colors shrink-0"
        >
          {showSettings ? 'Done' : 'Adjust'}
        </button>
      </div>

      {/* Location summary strip */}
      <div className="bg-gray-900/60 rounded-xl p-5 border border-gray-700/50 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Fact label="Location" value={location.name} icon="📍" />
        <Fact
          label="Hardiness Zone"
          value={zone ? zone.zone : '—'}
          sub={zone ? `${zone.tempRange}°F` : 'add ZIP →'}
          icon="🌡️"
        />
        <Fact
          label="Last Spring Frost"
          value={formatFrostDate(frostDates?.lastSpringFrost)}
          sub={frostDates?.spring ? `90% safe by ${formatFrostDate(frostDates.spring.p90)}`
            : frostDates ? (frostDates.source === 'manual' ? 'manual' : `${frostDates.years}-yr avg`) : null}
          icon="❄️"
        />
        <Fact
          label="First Fall Frost"
          value={formatFrostDate(frostDates?.firstFallFrost)}
          sub={frostDates?.fall ? `90% safe by ${formatFrostDate(frostDates.fall.p10)}`
            : frostDates ? (frostDates.source === 'manual' ? 'manual' : 'avg') : null}
          icon="🍂"
        />
      </div>

      {/* Settings / setup panel */}
      {showSettings && (
        <div className="bg-gray-900/60 rounded-xl p-5 border border-gray-700/50 space-y-5">
          {/* ZIP → zone */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              USDA Hardiness Zone (US ZIP code)
            </label>
            <div className="flex gap-2">
              <input
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                placeholder="e.g. 93301"
                inputMode="numeric"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600"
              />
              <button
                onClick={() => { setZip(zipInput); fetchZone(zipInput) }}
                disabled={loadingZone}
                className="px-4 py-2 rounded-lg bg-green-600/20 text-green-300 border border-green-500/30 hover:bg-green-600/30 disabled:opacity-50 text-sm font-medium"
              >
                {loadingZone ? 'Looking up…' : 'Look up'}
              </button>
            </div>
          </div>

          {/* Manual frost dates */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Frost dates (override) <span className="text-gray-500 font-normal">— format MM-DD</span>
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                value={lsfInput}
                onChange={(e) => setLsfInput(e.target.value)}
                placeholder="Last spring · 02-15"
                className="w-40 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600"
              />
              <input
                value={fffInput}
                onChange={(e) => setFffInput(e.target.value)}
                placeholder="First fall · 12-01"
                className="w-40 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600"
              />
              <button
                onClick={() => setManualFrostDates({ lastSpringFrost: lsfInput.trim(), firstFallFrost: fffInput.trim() })}
                className="px-4 py-2 rounded-lg bg-gray-700/50 text-gray-200 border border-gray-600/50 hover:bg-gray-700 text-sm font-medium"
              >
                Apply
              </button>
              <button
                onClick={() => redriveFrostDates(location.lat, location.lng)}
                className="px-4 py-2 rounded-lg text-blue-300 hover:text-blue-200 text-sm"
              >
                Reset to auto
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      )}

      {/* Loading / empty states */}
      {!frostDates && loadingFrost && (
        <div className="bg-gray-900/60 rounded-xl p-12 text-center border border-gray-700/50">
          <div className="text-4xl mb-4 animate-pulse">🌱</div>
          <p className="text-gray-400">Deriving your frost dates…</p>
          <p className="text-sm text-gray-500 mt-2">
            Analyzing 30 years of local weather history. This happens once per location.
          </p>
        </div>
      )}

      {!frostDates && !loadingFrost && (
        <div className="bg-gray-900/60 rounded-xl p-12 text-center border border-gray-700/50">
          <div className="text-4xl mb-4">🌿</div>
          <p className="text-gray-400">No frost dates yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Open <button onClick={() => setShowSettings(true)} className="text-blue-400 hover:underline">Adjust</button> to
            enter them manually, or re-derive from weather history.
          </p>
        </div>
      )}

      {/* The calendar */}
      {calendar && (
        <>
          <Section
            title={`Plant now · ${monthName}`}
            count={calendar.plantNow.length}
            empty="Nothing is in its planting window today — check Coming soon."
            accent="text-green-400"
          >
            {calendar.plantNow.map((item) => (
              <CropCard key={item.crop.id} item={item} />
            ))}
          </Section>

          <Section
            title="Coming soon"
            count={calendar.comingSoon.length}
            empty="No new windows opening in the next 6 weeks."
            accent="text-blue-400"
          >
            {calendar.comingSoon.map((item) => (
              <CropCard key={item.crop.id} item={item} />
            ))}
          </Section>

          <LaterSection items={calendar.later} />
        </>
      )}

      {/* Attribution */}
      <p className="text-xs text-gray-600 text-center pt-2">
        Frost dates derived from Open-Meteo historical data · hardiness zone via phzmapi.org
      </p>
    </div>
  )
}

function Fact({ label, value, sub, icon }) {
  return (
    <div>
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <span>{icon}</span> {label}
      </div>
      <div className="text-lg font-semibold text-white mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-600">{sub}</div>}
    </div>
  )
}

function Section({ title, count, accent, empty, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className={accent}>{title}</span>
        <span className="text-xs text-gray-600 normal-case font-normal">{count} crops</span>
      </h3>
      {count === 0 ? (
        <p className="text-sm text-gray-600 bg-gray-900/40 rounded-lg p-4 border border-gray-800/50">{empty}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
      )}
    </div>
  )
}

function CropCard({ item }) {
  const { crop, status, method, season, windowStart, windowEnd, daysUntilStart, daysLeft, frostFree } = item

  let timing
  if (frostFree) timing = <span className="text-green-400">Plant year-round</span>
  else if (status === 'now') {
    timing = (
      <span className="text-green-400">
        {daysLeft != null ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in window` : 'In window now'}
      </span>
    )
  } else {
    timing = (
      <span className="text-gray-400">
        Starts {formatMonthDay(windowStart)} · in {daysUntilStart} day{daysUntilStart === 1 ? '' : 's'}
      </span>
    )
  }

  return (
    <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/50 flex gap-3">
      <div className="text-3xl shrink-0" aria-hidden="true">{crop.emoji}</div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-white">{crop.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{methodLabel(method)}</span>
          {season && <span className="text-xs text-gray-500">{season}</span>}
        </div>
        <div className="text-sm text-gray-400 mt-1">
          {frostFree ? 'Year-round' : formatWindowRange(windowStart, windowEnd)} · {crop.daysToMaturity} days to harvest
        </div>
        <div className="text-xs mt-1">{timing}</div>
        {crop.notes && <div className="text-xs text-gray-600 mt-1.5">{crop.notes}</div>}
      </div>
    </div>
  )
}

function LaterSection({ items }) {
  const [open, setOpen] = useState(false)
  if (!items.length) return null
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-semibold text-gray-400 hover:text-gray-200 uppercase tracking-wider flex items-center gap-2"
      >
        <span>{open ? '▾' : '▸'}</span> Out of season
        <span className="text-xs text-gray-600 normal-case font-normal">{items.length} crops</span>
      </button>
      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {items.map((item) => (
            <CropCard key={item.crop.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
