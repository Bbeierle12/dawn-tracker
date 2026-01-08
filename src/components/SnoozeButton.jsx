import { useState, useRef, useCallback, useEffect } from 'react'
import { playSound } from '../utils/audio'

/**
 * The infamous fleeing snooze button
 */
export function SnoozeButton({ onSnooze, snoozeCount }) {
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [clicksNeeded, setClicksNeeded] = useState(3)
  const [isHovering, setIsHovering] = useState(false)
  const buttonRef = useRef(null)
  const containerRef = useRef(null)

  // Generate random position within container bounds
  const getRandomPosition = useCallback(() => {
    const container = containerRef.current
    const button = buttonRef.current
    if (!container || !button) return { x: 50, y: 50 }

    const containerRect = container.getBoundingClientRect()
    const buttonRect = button.getBoundingClientRect()

    // Keep button within bounds with padding
    const padding = 20
    const maxX = containerRect.width - buttonRect.width - padding
    const maxY = containerRect.height - buttonRect.height - padding

    return {
      x: Math.max(padding, Math.random() * maxX),
      y: Math.max(padding, Math.random() * maxY)
    }
  }, [])

  // Flee from cursor on hover
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
    playSound('nope')
    setPosition(getRandomPosition())
  }, [getRandomPosition])

  // Handle successful click
  const handleClick = useCallback(() => {
    if (clicksNeeded > 1) {
      setClicksNeeded(prev => prev - 1)
      playSound('nope')
      setPosition(getRandomPosition())
    } else {
      // Actually snooze
      setClicksNeeded(3) // Reset for next time
      onSnooze()
    }
  }, [clicksNeeded, getRandomPosition, onSnooze])

  // Reset clicks needed when snooze count changes
  useEffect(() => {
    setClicksNeeded(3 + snoozeCount) // Gets harder each snooze
  }, [snoozeCount])

  return (
    <div
      ref={containerRef}
      className="relative w-64 h-32 mx-auto"
    >
      <button
        ref={buttonRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleClick}
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          transition: isHovering ? 'none' : 'all 0.3s ease-out'
        }}
        className={`
          px-6 py-3 rounded-lg font-bold text-lg
          bg-gradient-to-r from-blue-600 to-blue-700
          hover:from-blue-500 hover:to-blue-600
          text-white shadow-lg
          active:scale-95 transition-transform
        `}
      >
        SNOOZE ({clicksNeeded})
      </button>
    </div>
  )
}
