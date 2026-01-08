import { useAstronomy } from '../../hooks/useAstronomy'
import { useLocationStore } from '../../stores/locationStore'
import { formatTime, formatCountdown, getTimeUntil } from '../../utils/astronomy'
import { Timeline } from '../Timeline'
import { MoonPhase } from '../MoonPhase'
import { SunPosition } from '../SunPosition'
import { Countdown } from '../Countdown'

export function TodayView() {
  const { location } = useLocationStore()

  const {
    timeline,
    nextEvent,
    daylight,
    currentTime,
    sunTimes,
    sunPosition,
    moonTimes,
    moonPosition,
    moonIllumination
  } = useAstronomy(location.lat, location.lng)

  const countdown = nextEvent
    ? formatCountdown(getTimeUntil(nextEvent.time))
    : { hours: '00', minutes: '00', seconds: '00' }

  return (
    <div className="space-y-8">
      {/* Next Event Countdown */}
      <section>
        <div className="text-center mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Next Event
          </h2>
          {nextEvent && (
            <div className="flex items-center justify-center gap-2 text-lg text-gray-300 mb-4">
              <span className="text-2xl">{nextEvent.icon || (nextEvent.type === 'solar' ? '☀️' : '🌙')}</span>
              <span className="font-medium">{nextEvent.label}</span>
              <span className="text-gray-500">at</span>
              <span className="font-mono text-blue-400">{formatTime(nextEvent.time)}</span>
            </div>
          )}
        </div>

        <Countdown
          hours={countdown.hours}
          minutes={countdown.minutes}
          seconds={countdown.seconds}
          isRinging={false}
        />

        {nextEvent?.description && (
          <p className="text-center text-sm text-gray-500 mt-4">
            {nextEvent.description}
          </p>
        )}
      </section>

      {/* Current Time */}
      <div className="text-center">
        <div className="inline-block px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <span className="text-gray-400 text-sm">Current Time: </span>
          <span className="font-mono text-white">
            {currentTime.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            })}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SunPosition
          position={sunPosition}
          times={sunTimes}
          daylight={daylight}
          location={location}
        />

        <MoonPhase
          illumination={moonIllumination}
          position={moonPosition}
        />

        {/* Moon Times */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Moon Times
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Moonrise</span>
              <span className="font-mono text-gray-200">
                {moonTimes?.moonrise ? formatTime(moonTimes.moonrise) : '--:--'}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Moonset</span>
              <span className="font-mono text-gray-200">
                {moonTimes?.moonset ? formatTime(moonTimes.moonset) : '--:--'}
              </span>
            </div>
            {moonTimes?.alwaysUp && (
              <div className="text-center text-sm text-blue-400 py-2">
                Moon is up all day
              </div>
            )}
            {moonTimes?.alwaysDown && (
              <div className="text-center text-sm text-gray-500 py-2">
                Moon is not visible today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <Timeline events={timeline} currentTime={currentTime} />

      {/* Twilight Details */}
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
          Twilight Phases
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gradient-to-b from-indigo-900/30 to-gray-900/30 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Astronomical Dawn</div>
            <div className="font-mono text-indigo-300">{formatTime(sunTimes?.astronomicalDawn)}</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-b from-blue-900/30 to-gray-900/30 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Nautical Dawn</div>
            <div className="font-mono text-blue-300">{formatTime(sunTimes?.nauticalDawn)}</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-b from-purple-900/30 to-gray-900/30 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Civil Dawn</div>
            <div className="font-mono text-purple-300">{formatTime(sunTimes?.civilDawn)}</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-b from-orange-900/30 to-gray-900/30 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Sunrise</div>
            <div className="font-mono text-orange-300">{formatTime(sunTimes?.sunrise)}</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-b from-orange-900/30 to-gray-900/30 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Sunset</div>
            <div className="font-mono text-orange-300">{formatTime(sunTimes?.sunset)}</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-b from-purple-900/30 to-gray-900/30 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Civil Dusk</div>
            <div className="font-mono text-purple-300">{formatTime(sunTimes?.civilDusk)}</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-b from-blue-900/30 to-gray-900/30 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Nautical Dusk</div>
            <div className="font-mono text-blue-300">{formatTime(sunTimes?.nauticalDusk)}</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-b from-indigo-900/30 to-gray-900/30 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Astronomical Dusk</div>
            <div className="font-mono text-indigo-300">{formatTime(sunTimes?.astronomicalDusk)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
