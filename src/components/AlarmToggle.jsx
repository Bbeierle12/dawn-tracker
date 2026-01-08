import { useAlarmStore } from '../stores/alarmStore'

/**
 * Alarm enable/disable toggle
 */
export function AlarmToggle() {
  const { isEnabled, toggleAlarm } = useAlarmStore()

  return (
    <div className="flex items-center gap-4">
      <span className="text-gray-400 text-sm font-medium">
        Alarm
      </span>

      <button
        onClick={toggleAlarm}
        className={`
          relative w-16 h-8 rounded-full transition-all duration-300 ease-in-out
          ${isEnabled
            ? 'bg-gradient-to-r from-orange-500 to-yellow-500 shadow-lg shadow-orange-500/30'
            : 'bg-gray-700'
          }
        `}
        aria-label={isEnabled ? 'Disable alarm' : 'Enable alarm'}
      >
        <span
          className={`
            absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md
            transition-transform duration-300 ease-in-out
            ${isEnabled ? 'translate-x-8' : 'translate-x-0'}
          `}
        />
      </button>

      <span className={`text-sm font-medium ${isEnabled ? 'text-orange-400' : 'text-gray-500'}`}>
        {isEnabled ? 'ON' : 'OFF'}
      </span>
    </div>
  )
}
