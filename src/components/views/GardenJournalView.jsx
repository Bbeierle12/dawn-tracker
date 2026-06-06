import { useMemo, useState } from 'react'
import { useJournalStore } from '../../stores/journalStore'
import { useGddData } from '../../hooks/useGddData'
import { useLocationStore } from '../../stores/locationStore'
import { CROPS } from '../../data/crops'
import { computeGdd } from '../../utils/gdd'
import { formatMonthDay } from '../../utils/planting'

const STATUS_ORDER = ['growing', 'planned', 'harvested', 'failed']
const STATUS_LABELS = {
  planned: 'Planned',
  growing: 'Growing',
  harvested: 'Harvested',
  failed: 'Failed',
}
const STATUS_STYLES = {
  planned: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
  growing: 'text-green-300 bg-green-500/10 border-green-500/30',
  harvested: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  failed: 'text-gray-400 bg-gray-700/30 border-gray-600/40',
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function sowDateToDate(sowDate) {
  return sowDate ? new Date(`${sowDate}T12:00:00`) : null
}

function estHarvestDate(sowDate, dtm) {
  const d = sowDateToDate(sowDate)
  if (!d || !dtm) return null
  d.setDate(d.getDate() + dtm)
  return d
}

export function GardenJournalView() {
  const { plantings, addPlanting, updatePlanting, setStatus, addHarvest, removePlanting } = useJournalStore()
  const { location } = useLocationStore()
  const { dailyTemps } = useGddData(location.lat, location.lng)

  const grouped = useMemo(() => {
    const g = { growing: [], planned: [], harvested: [], failed: [] }
    for (const p of plantings) (g[p.status] || g.growing).push(p)
    return g
  }, [plantings])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Garden Journal</h2>
        <p className="text-sm text-gray-500">What you've planted in {location.name}, and how it's doing</p>
      </div>

      <AddPlantingForm onAdd={addPlanting} />

      {plantings.length === 0 ? (
        <div className="bg-gray-900/60 rounded-xl p-12 text-center border border-gray-700/50">
          <div className="text-4xl mb-4">🪴</div>
          <p className="text-gray-400">Your journal is empty.</p>
          <p className="text-sm text-gray-500 mt-2">Add a planting above to start tracking it.</p>
        </div>
      ) : (
        STATUS_ORDER.filter((s) => grouped[s].length > 0).map((status) => (
          <div key={status}>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              {STATUS_LABELS[status]}
              <span className="text-xs text-gray-600 normal-case font-normal">{grouped[status].length}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {grouped[status].map((p) => (
                <PlantingCard
                  key={p.id}
                  planting={p}
                  dailyTemps={dailyTemps}
                  onStatus={setStatus}
                  onUpdate={updatePlanting}
                  onHarvest={addHarvest}
                  onRemove={removePlanting}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function AddPlantingForm({ onAdd }) {
  const [cropId, setCropId] = useState(CROPS[0].id)
  const [customName, setCustomName] = useState('')
  const [location, setLocation] = useState('')
  const [sowDate, setSowDate] = useState(todayISO())
  const [method, setMethod] = useState('')

  const isCustom = cropId === '__custom__'
  const crop = CROPS.find((c) => c.id === cropId)
  const methodOptions = crop ? [...new Set(crop.windows.map((w) => w.method))] : ['direct-sow', 'transplant', 'start-indoors']

  const submit = (e) => {
    e.preventDefault()
    const name = isCustom ? customName.trim() : crop.name
    if (!name) return
    onAdd({
      cropId: isCustom ? null : crop.id,
      cropName: name,
      emoji: isCustom ? '🌱' : crop.emoji,
      location: location.trim(),
      sowDate,
      method: method || (crop ? methodOptions[methodOptions.length - 1] : ''),
      daysToMaturity: isCustom ? null : crop.daysToMaturity,
      tender: isCustom ? null : crop.tender,
      status: sowDate > todayISO() ? 'planned' : 'growing',
    })
    setCustomName('')
    setLocation('')
    setSowDate(todayISO())
    setMethod('')
  }

  return (
    <form onSubmit={submit} className="bg-gray-900/60 rounded-xl p-5 border border-gray-700/50 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-gray-500">Crop</span>
          <select
            value={cropId}
            onChange={(e) => setCropId(e.target.value)}
            className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
          >
            {CROPS.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
            <option value="__custom__">＋ Other (custom)</option>
          </select>
        </label>

        {isCustom ? (
          <label className="block">
            <span className="text-xs text-gray-500">Crop name</span>
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Artichoke"
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600"
            />
          </label>
        ) : (
          <label className="block">
            <span className="text-xs text-gray-500">Method</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
            >
              {methodOptions.map((m) => (
                <option key={m} value={m}>{m.replace('-', ' ')}</option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="text-xs text-gray-500">Location / bed</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Front raised bed"
            className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600"
          />
        </label>

        <label className="block">
          <span className="text-xs text-gray-500">Sow / plant date</span>
          <input
            type="date"
            value={sowDate}
            onChange={(e) => setSowDate(e.target.value)}
            className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
          />
        </label>
      </div>

      <button
        type="submit"
        className="px-4 py-2 rounded-lg bg-green-600/20 text-green-300 border border-green-500/30 hover:bg-green-600/30 text-sm font-medium"
      >
        Add planting
      </button>
    </form>
  )
}

function PlantingCard({ planting, dailyTemps, onStatus, onUpdate, onHarvest, onRemove }) {
  const [logging, setLogging] = useState(false)
  const [noteDraft, setNoteDraft] = useState(planting.notes)

  const est = estHarvestDate(planting.sowDate, planting.daysToMaturity)
  const gdd = useMemo(() => {
    if (!dailyTemps || !planting.daysToMaturity) return null
    return computeGdd(dailyTemps, planting.sowDate, { daysToMaturity: planting.daysToMaturity, tender: planting.tender })
  }, [dailyTemps, planting.sowDate, planting.daysToMaturity, planting.tender])

  return (
    <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/50">
      <div className="flex gap-3">
        <div className="text-3xl shrink-0" aria-hidden="true">{planting.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-white truncate">{planting.cropName}</span>
            <select
              value={planting.status}
              onChange={(e) => onStatus(planting.id, e.target.value)}
              className={`text-xs px-2 py-1 rounded-full border ${STATUS_STYLES[planting.status]} bg-transparent`}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s} className="bg-gray-800 text-gray-200">{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-400 mt-1">
            {planting.location || 'No location'} · sowed {formatMonthDay(sowDateToDate(planting.sowDate))}
            {planting.method ? ` · ${planting.method.replace('-', ' ')}` : ''}
          </div>

          {/* Harvest estimate — GDD-refined when temperature data is available */}
          {planting.status !== 'harvested' && est && (
            <div className="text-xs mt-1">
              {gdd && gdd.predictedHarvestDate ? (
                <span className="text-green-400">
                  ~{Math.round(gdd.progress * 100)}% to harvest · on pace → {formatMonthDay(gdd.predictedHarvestDate)}
                  {gdd.deltaDays !== 0 && (
                    <span className="text-gray-500">
                      {' '}({gdd.deltaDays > 0 ? `${gdd.deltaDays}d ahead` : `${-gdd.deltaDays}d behind`})
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-gray-500">est. harvest {formatMonthDay(est)} · {planting.daysToMaturity} days</span>
              )}
            </div>
          )}
          {gdd && planting.status !== 'harvested' && (
            <div className="text-xs text-gray-600 mt-0.5">
              {Math.round(gdd.accumulatedGDD)} / {Math.round(gdd.targetGDD)} GDD · {gdd.dailyPace.toFixed(1)}/day recent
            </div>
          )}
        </div>
      </div>

      {/* Harvest log */}
      {planting.harvests.length > 0 && (
        <div className="mt-3 pl-12 space-y-1">
          {planting.harvests.map((h, i) => (
            <div key={i} className="text-xs text-amber-300/90">
              🧺 {formatMonthDay(sowDateToDate(h.date))}{h.amount ? ` · ${h.amount}` : ''}{h.note ? ` · ${h.note}` : ''}
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      <textarea
        value={noteDraft}
        onChange={(e) => setNoteDraft(e.target.value)}
        onBlur={() => noteDraft !== planting.notes && onUpdate(planting.id, { notes: noteDraft })}
        placeholder="Notes…"
        rows={1}
        className="mt-3 w-full bg-gray-800/40 border border-gray-700/50 rounded-lg px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 resize-y"
      />

      {/* Actions */}
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={() => setLogging((v) => !v)}
          className="text-xs text-amber-300/80 hover:text-amber-300"
        >
          + Log harvest
        </button>
        <button
          onClick={() => { if (confirm(`Remove ${planting.cropName} from the journal?`)) onRemove(planting.id) }}
          className="text-xs text-red-400/60 hover:text-red-400 ml-auto"
        >
          Delete
        </button>
      </div>

      {logging && <HarvestForm onSave={(h) => { onHarvest(planting.id, h); setLogging(false) }} />}
    </div>
  )
}

function HarvestForm({ onSave }) {
  const [date, setDate] = useState(todayISO())
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  return (
    <div className="mt-2 flex flex-wrap gap-2 items-center bg-gray-800/40 rounded-lg p-2">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
      />
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="amount (e.g. 2 lb)"
        className="w-28 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600"
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="note"
        className="flex-1 min-w-[8rem] bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600"
      />
      <button
        onClick={() => onSave({ date, amount, note })}
        className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-medium"
      >
        Save
      </button>
    </div>
  )
}
