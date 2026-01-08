import { useMemo } from 'react'
import { formatTime } from '../utils/astronomy'

/**
 * Visual timeline of astronomical events
 */
export function Timeline({ events, currentTime = new Date() }) {
  // Find the current/next event
  const { pastEvents, futureEvents, currentEvent } = useMemo(() => {
    const now = currentTime.getTime()
    const past = []
    const future = []
    let current = null

    events.forEach((event, index) => {
      const eventTime = event.time.getTime()
      if (eventTime < now) {
        past.push(event)
      } else {
        if (!current && future.length === 0) {
          current = event
        }
        future.push(event)
      }
    })

    return { pastEvents: past, futureEvents: future, currentEvent: current }
  }, [events, currentTime])

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Today's Timeline
      </h3>

      <div className="space-y-1 max-h-80 overflow-y-auto pr-2">
        {events.map((event, index) => {
          const isPast = event.time < currentTime
          const isCurrent = event === currentEvent
          const isSolar = event.type === 'solar'

          return (
            <div
              key={`${event.label}-${index}`}
              className={`
                flex items-center gap-3 py-2 px-3 rounded-lg transition-all
                ${isCurrent ? 'bg-blue-900/40 border border-blue-500/50' : ''}
                ${isPast ? 'opacity-50' : ''}
              `}
            >
              {/* Time indicator line */}
              <div className="flex flex-col items-center w-1">
                <div
                  className={`
                    w-2 h-2 rounded-full
                    ${isCurrent ? 'bg-blue-400 ring-2 ring-blue-400/50' : ''}
                    ${isPast ? 'bg-gray-600' : ''}
                    ${!isPast && !isCurrent ? (isSolar ? 'bg-yellow-500' : 'bg-gray-400') : ''}
                  `}
                />
              </div>

              {/* Icon */}
              <div className="w-8 text-center text-lg">
                {event.icon || (isSolar ? '☀️' : '🌙')}
              </div>

              {/* Event details */}
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${event.major ? 'text-white' : 'text-gray-300'} ${isPast ? '' : ''}`}>
                  {event.label}
                </div>
                {event.description && (
                  <div className="text-xs text-gray-500 truncate">
                    {event.description}
                  </div>
                )}
              </div>

              {/* Time */}
              <div className={`text-sm font-mono ${isCurrent ? 'text-blue-300' : 'text-gray-400'}`}>
                {formatTime(event.time)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
