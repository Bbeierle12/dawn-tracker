import { useState, useEffect, memo } from 'react'

/**
 * Single animated digit display
 */
const Digit = memo(function Digit({ value, prevValue }) {
  const [isFlipping, setIsFlipping] = useState(false)

  useEffect(() => {
    if (value !== prevValue) {
      setIsFlipping(true)
      const timer = setTimeout(() => setIsFlipping(false), 300)
      return () => clearTimeout(timer)
    }
  }, [value, prevValue])

  return (
    <div className="digit-container inline-block">
      <span
        className={`
          inline-block w-16 h-20 md:w-24 md:h-28
          bg-gradient-to-b from-gray-800 to-gray-900
          rounded-lg shadow-lg
          text-5xl md:text-7xl font-bold text-white
          flex items-center justify-center
          border border-gray-700
          ${isFlipping ? 'animate-flip' : ''}
        `}
      >
        {value}
      </span>
    </div>
  )
})

/**
 * Separator between digit groups
 */
function Separator() {
  return (
    <span className="text-4xl md:text-6xl font-bold text-orange-400 mx-2 animate-pulse">
      :
    </span>
  )
}

/**
 * Main countdown display component
 */
export function Countdown({ hours, minutes, seconds, isRinging }) {
  const [prevValues, setPrevValues] = useState({ hours, minutes, seconds })

  useEffect(() => {
    // Store previous values for animation
    const timer = setTimeout(() => {
      setPrevValues({ hours, minutes, seconds })
    }, 300)
    return () => clearTimeout(timer)
  }, [hours, minutes, seconds])

  return (
    <div className={`flex items-center justify-center ${isRinging ? 'animate-shake-intense' : ''}`}>
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1">
          {/* Hours */}
          <div className="flex gap-1">
            <Digit value={hours[0]} prevValue={prevValues.hours[0]} />
            <Digit value={hours[1]} prevValue={prevValues.hours[1]} />
          </div>

          <Separator />

          {/* Minutes */}
          <div className="flex gap-1">
            <Digit value={minutes[0]} prevValue={prevValues.minutes[0]} />
            <Digit value={minutes[1]} prevValue={prevValues.minutes[1]} />
          </div>

          <Separator />

          {/* Seconds */}
          <div className="flex gap-1">
            <Digit value={seconds[0]} prevValue={prevValues.seconds[0]} />
            <Digit value={seconds[1]} prevValue={prevValues.seconds[1]} />
          </div>
        </div>

        {/* Labels */}
        <div className="flex mt-4 text-sm text-gray-400 font-medium tracking-widest">
          <span className="w-32 md:w-48 text-center">HOURS</span>
          <span className="w-32 md:w-48 text-center">MINUTES</span>
          <span className="w-32 md:w-48 text-center">SECONDS</span>
        </div>
      </div>
    </div>
  )
}
