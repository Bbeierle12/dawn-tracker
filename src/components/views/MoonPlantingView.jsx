import { CROPS } from '../../data/crops'
import { getMoonPlantingGuidance, getUpcomingWindows, cropsForCategories } from '../../utils/moonPlanting'
import { formatMonthDay } from '../../utils/planting'

export function MoonPlantingView() {
  // Cheap, render-stable computations (SunCalc over ~32 days) — no memo needed.
  const today = new Date()
  const guidance = getMoonPlantingGuidance(today)
  const windows = getUpcomingWindows(today, 32)
  const favoredCrops = cropsForCategories(CROPS, guidance.favors)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Moon Planting</h2>
        <p className="text-sm text-gray-500">Sow by the moon — the Almanac's traditional planting rhythm</p>
      </div>

      {/* Current phase */}
      <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center gap-4">
          <div className="text-6xl" aria-hidden="true">{guidance.phaseIcon}</div>
          <div>
            <div className="text-xl font-bold text-white">{guidance.phaseName}</div>
            <div className="text-sm text-gray-400">
              {guidance.percentIlluminated}% illuminated · {guidance.trend}
            </div>
            <div className="text-xs text-gray-500 mt-1">{guidance.name}</div>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700/40">
          <div className="text-sm font-medium text-green-300">Favors {guidance.favorsLabel}</div>
          <p className="text-sm text-gray-400 mt-1">{guidance.advice}</p>
        </div>

        {favoredCrops.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Good to sow now</div>
            <div className="flex flex-wrap gap-2">
              {favoredCrops.map((c) => (
                <span key={c.id} className="text-sm px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700/50 text-gray-300">
                  {c.emoji} {c.name}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Cross-check the Planting Calendar — moon timing is a refinement, not a substitute for the season.
            </p>
          </div>
        )}
      </div>

      {/* Upcoming windows */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Next 30 days</h3>
        <div className="space-y-3">
          {windows.map((w, i) => (
            <div
              key={i}
              className={`bg-gray-900/60 rounded-xl p-4 border ${w.isCurrent ? 'border-green-500/40' : 'border-gray-700/50'}`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="font-medium text-white">
                  {formatMonthDay(w.start)} – {formatMonthDay(w.end)}
                  {w.isCurrent && <span className="ml-2 text-xs text-green-400">now</span>}
                </div>
                <div className="text-sm text-gray-400">{w.trend} · favors {w.favorsLabel}</div>
              </div>
              {w.favors.length > 0 && (
                <div className="text-xs text-gray-500 mt-2">
                  {cropsForCategories(CROPS, w.favors).slice(0, 8).map((c) => c.emoji).join(' ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center pt-2">
        Moon-planting is a traditional almanac practice, not established agronomy — treat it as a gentle scheduling guide.
      </p>
    </div>
  )
}
