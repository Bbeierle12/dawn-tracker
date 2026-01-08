import { useAlarmStore } from '../stores/alarmStore'

/**
 * Display the shameful snooze statistics
 */
export function ShameCounter() {
  const { totalSnoozeCount, snoozeCount } = useAlarmStore()

  const getShameMessage = () => {
    if (totalSnoozeCount === 0) return "Perfect record! 👑"
    if (totalSnoozeCount < 5) return "Not bad... yet 😏"
    if (totalSnoozeCount < 15) return "Getting sleepy? 😴"
    if (totalSnoozeCount < 30) return "Professional snoozer 😅"
    if (totalSnoozeCount < 50) return "Snooze champion 🏆"
    if (totalSnoozeCount < 100) return "Dawn's nemesis 😈"
    return "Legendary sleep enthusiast 🛏️"
  }

  const getSunFace = () => {
    if (snoozeCount === 0) return '😊'
    if (snoozeCount <= 2) return '😐'
    if (snoozeCount <= 4) return '😤'
    return '😡'
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 text-center">
      <div className="text-4xl mb-2">{getSunFace()}</div>

      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
        Lifetime Snooze Shame
      </div>

      <div className="text-3xl font-bold text-red-400">
        {totalSnoozeCount}
      </div>

      <div className="text-sm text-gray-500 mt-2 italic">
        {getShameMessage()}
      </div>

      {snoozeCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="text-xs text-gray-400">
            Today's snoozes: <span className="text-orange-400 font-bold">{snoozeCount}</span>
          </div>
        </div>
      )}
    </div>
  )
}
