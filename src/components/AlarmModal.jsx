import { SnoozeButton } from './SnoozeButton'

/**
 * Full-screen alarm modal when ringing
 */
export function AlarmModal({ onDismiss, onSnooze, snoozeCount }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-shake">
      <div className="bg-gradient-to-br from-orange-900 to-red-900 rounded-2xl p-8 m-4 max-w-md w-full text-center shadow-2xl border-2 border-orange-500/50 animate-pulse-glow">
        {/* Sun icon */}
        <div className="text-8xl mb-4 animate-bounce">
          ☀️
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">
          RISE AND SHINE!
        </h1>

        <p className="text-orange-200 mb-6">
          It's the butt crack of dawn in Bakersfield!
          <br />
          <span className="text-sm opacity-75">Time to seize the day... or at least try.</span>
        </p>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="w-full px-8 py-4 rounded-lg font-bold text-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white shadow-lg mb-6 transition-all hover:scale-105"
        >
          I'M AWAKE! 🌅
        </button>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-orange-500/30"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-orange-900/50 text-orange-300">or be weak...</span>
          </div>
        </div>

        {/* Fleeing snooze button */}
        <SnoozeButton onSnooze={onSnooze} snoozeCount={snoozeCount} />

        {/* Snooze shame */}
        {snoozeCount > 0 && (
          <div className="mt-4 text-orange-300/70 text-sm">
            You've already snoozed <span className="font-bold text-red-400">{snoozeCount}</span> time{snoozeCount !== 1 ? 's' : ''} today.
            <br />
            <span className="italic">The sun is judging you.</span>
          </div>
        )}
      </div>
    </div>
  )
}
