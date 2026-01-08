import { useMemo } from 'react'

/**
 * Animated dawn gradient background
 */
export function SunriseBackground({ progress = 0, isRinging = false, children }) {
  // Calculate gradient based on night progress (0 = full night, 1 = dawn)
  const gradientStyle = useMemo(() => {
    // Night colors -> Dawn colors
    const nightColors = ['#0a0a1a', '#1a0a2e', '#0f0f23']
    const dawnColors = ['#ff6b35', '#f7931e', '#ffcc02', '#87ceeb']

    // Interpolate based on progress
    if (progress < 0.7) {
      // Still deep night
      return {
        background: `linear-gradient(to top, ${nightColors[0]}, ${nightColors[1]}, ${nightColors[2]})`
      }
    } else if (progress < 0.85) {
      // Pre-dawn purple
      return {
        background: `linear-gradient(to top, #1a0a2e, #2d1b4e, #4a2c6a, #1a0a2e)`
      }
    } else if (progress < 0.95) {
      // Early dawn - orange on horizon
      return {
        background: `linear-gradient(to top, #1a0a2e, #4a2c6a, #ff6b35 80%, #1a0a2e)`
      }
    } else {
      // Dawn breaking
      return {
        background: `linear-gradient(to top, ${dawnColors[0]}, ${dawnColors[1]}, ${dawnColors[2]}, ${dawnColors[3]})`
      }
    }
  }, [progress])

  return (
    <div
      style={gradientStyle}
      className={`
        min-h-screen w-full transition-all duration-1000
        ${isRinging ? 'animate-pulse' : ''}
      `}
    >
      {/* Stars overlay for night */}
      {progress < 0.9 && (
        <div className="fixed inset-0 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
                opacity: Math.random() * 0.8 + 0.2,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 2 + 1}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
