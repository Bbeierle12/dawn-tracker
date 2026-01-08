/**
 * Pattern Detection & Cross-Referencing Engine
 * Analyzes astronomical and atmospheric data to discover patterns
 */

/**
 * Pattern types
 */
export const PATTERN_TYPES = {
  TREND: 'trend',           // Increasing/decreasing over time
  CORRELATION: 'correlation', // Two variables move together
  CYCLE: 'cycle',           // Repeating pattern
  ANOMALY: 'anomaly',       // Unusual deviation
  OPTIMAL: 'optimal',       // Best conditions identified
  SEASONAL: 'seasonal'      // Season-based pattern
}

/**
 * Confidence levels
 */
export const CONFIDENCE = {
  LOW: { level: 'low', min: 0.5, label: 'Possible', color: 'text-gray-400' },
  MEDIUM: { level: 'medium', min: 0.7, label: 'Likely', color: 'text-yellow-400' },
  HIGH: { level: 'high', min: 0.85, label: 'Strong', color: 'text-green-400' }
}

/**
 * Calculate linear regression for trend detection
 */
function linearRegression(data) {
  const n = data.length
  if (n < 3) return null

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0

  data.forEach((y, x) => {
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
  })

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Calculate R-squared
  const yMean = sumY / n
  let ssTotal = 0, ssResidual = 0

  data.forEach((y, x) => {
    const yPredicted = slope * x + intercept
    ssTotal += Math.pow(y - yMean, 2)
    ssResidual += Math.pow(y - yPredicted, 2)
  })

  const rSquared = ssTotal === 0 ? 0 : 1 - (ssResidual / ssTotal)

  return { slope, intercept, rSquared, confidence: Math.sqrt(Math.abs(rSquared)) }
}

/**
 * Calculate Pearson correlation coefficient
 */
function correlation(x, y) {
  if (x.length !== y.length || x.length < 3) return null

  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  if (denominator === 0) return null

  return numerator / denominator
}

/**
 * Detect daylight duration trends
 */
export function detectDaylightTrend(records) {
  if (records.length < 7) return null

  const daylightMinutes = records
    .map(r => r.solar?.daylightMinutes)
    .filter(d => d != null)

  if (daylightMinutes.length < 7) return null

  const regression = linearRegression(daylightMinutes)
  if (!regression || regression.confidence < 0.5) return null

  const dailyChange = regression.slope
  const weeklyChange = dailyChange * 7

  if (Math.abs(dailyChange) < 0.5) return null // Less than 30 seconds change per day

  return {
    id: 'daylight-trend',
    type: PATTERN_TYPES.TREND,
    title: dailyChange > 0 ? 'Daylight Increasing' : 'Daylight Decreasing',
    description: `Daylight is ${dailyChange > 0 ? 'increasing' : 'decreasing'} by approximately ${Math.abs(Math.round(dailyChange))} minutes per day (${Math.abs(Math.round(weeklyChange))} min/week).`,
    confidence: regression.confidence,
    data: { dailyChange, weeklyChange, rSquared: regression.rSquared },
    icon: dailyChange > 0 ? '📈' : '📉',
    detectedAt: new Date().toISOString()
  }
}

/**
 * Detect moon phase cycle patterns
 */
export function detectMoonCyclePatterns(records) {
  if (records.length < 14) return null

  const patterns = []

  // Find full moon occurrences
  const fullMoons = records.filter(r => r.lunar?.phaseName === 'Full Moon')
  const newMoons = records.filter(r => r.lunar?.phaseName === 'New Moon')

  if (fullMoons.length >= 2) {
    // Calculate average cycle length
    const fullMoonDates = fullMoons.map(r => new Date(r.date).getTime())
    const cycles = []
    for (let i = 1; i < fullMoonDates.length; i++) {
      cycles.push((fullMoonDates[i] - fullMoonDates[i-1]) / (1000 * 60 * 60 * 24))
    }

    if (cycles.length > 0) {
      const avgCycle = cycles.reduce((a, b) => a + b, 0) / cycles.length

      patterns.push({
        id: 'moon-cycle',
        type: PATTERN_TYPES.CYCLE,
        title: 'Lunar Cycle Tracked',
        description: `Average lunar cycle: ${avgCycle.toFixed(1)} days. Full moons recorded: ${fullMoons.length}. New moons: ${newMoons.length}.`,
        confidence: Math.min(0.95, 0.5 + fullMoons.length * 0.1),
        data: { avgCycle, fullMoonCount: fullMoons.length, newMoonCount: newMoons.length },
        icon: '🌕',
        detectedAt: new Date().toISOString()
      })
    }
  }

  return patterns.length > 0 ? patterns : null
}

/**
 * Detect optimal observation conditions
 */
export function detectOptimalConditions(atmosphereHistory) {
  if (!atmosphereHistory || atmosphereHistory.length < 3) return null

  const goodConditions = atmosphereHistory.filter(a => a.current?.observationScore >= 70)

  if (goodConditions.length < 2) return null

  // Analyze when good conditions occur
  const hours = goodConditions.map(a => new Date(a.timestamp).getHours())
  const hourCounts = {}
  hours.forEach(h => { hourCounts[h] = (hourCounts[h] || 0) + 1 })

  const bestHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([h]) => parseInt(h))

  if (bestHours.length === 0) return null

  const formatHour = (h) => {
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour} ${period}`
  }

  return {
    id: 'optimal-viewing',
    type: PATTERN_TYPES.OPTIMAL,
    title: 'Best Viewing Times Identified',
    description: `Optimal observation conditions most frequently occur around ${bestHours.map(formatHour).join(', ')}.`,
    confidence: Math.min(0.9, 0.5 + goodConditions.length * 0.05),
    data: { bestHours, goodConditionCount: goodConditions.length },
    icon: '🔭',
    detectedAt: new Date().toISOString()
  }
}

/**
 * Detect correlation between moon phase and cloud cover
 */
export function detectMoonCloudCorrelation(records, atmosphereHistory) {
  if (records.length < 14 || !atmosphereHistory || atmosphereHistory.length < 7) return null

  // Match records with atmosphere data by date
  const paired = []
  records.forEach(r => {
    const atmo = atmosphereHistory.find(a => {
      const aDate = new Date(a.timestamp).toDateString()
      const rDate = new Date(r.date).toDateString()
      return aDate === rDate
    })

    if (atmo && r.lunar?.illumination != null && atmo.current?.cloudCover != null) {
      paired.push({
        illumination: r.lunar.illumination,
        cloudCover: atmo.current.cloudCover
      })
    }
  })

  if (paired.length < 7) return null

  const corr = correlation(
    paired.map(p => p.illumination),
    paired.map(p => p.cloudCover)
  )

  if (corr === null || Math.abs(corr) < 0.3) return null

  const direction = corr > 0 ? 'higher' : 'lower'

  return {
    id: 'moon-cloud-correlation',
    type: PATTERN_TYPES.CORRELATION,
    title: 'Moon-Cloud Correlation Detected',
    description: `Cloud cover tends to be ${direction} during ${corr > 0 ? 'fuller' : 'darker'} moon phases (correlation: ${(corr * 100).toFixed(0)}%).`,
    confidence: Math.abs(corr),
    data: { correlation: corr, sampleSize: paired.length },
    icon: corr > 0 ? '🌥️' : '🌙',
    detectedAt: new Date().toISOString()
  }
}

/**
 * Detect sunrise/sunset time shifts
 */
export function detectSunTimeShifts(records) {
  if (records.length < 7) return null

  const patterns = []

  // Extract sunrise times as minutes from midnight
  const sunrises = records
    .map(r => {
      if (!r.solar?.sunrise) return null
      const d = new Date(r.solar.sunrise)
      return d.getHours() * 60 + d.getMinutes()
    })
    .filter(t => t != null)

  if (sunrises.length >= 7) {
    const regression = linearRegression(sunrises)
    if (regression && regression.confidence > 0.6 && Math.abs(regression.slope) > 0.3) {
      const direction = regression.slope > 0 ? 'later' : 'earlier'
      const minutesPerWeek = Math.abs(regression.slope * 7)

      patterns.push({
        id: 'sunrise-shift',
        type: PATTERN_TYPES.TREND,
        title: `Sunrise Getting ${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
        description: `Sunrise is shifting ${direction} by approximately ${minutesPerWeek.toFixed(0)} minutes per week.`,
        confidence: regression.confidence,
        data: { direction, minutesPerWeek, slope: regression.slope },
        icon: '🌅',
        detectedAt: new Date().toISOString()
      })
    }
  }

  // Extract sunset times
  const sunsets = records
    .map(r => {
      if (!r.solar?.sunset) return null
      const d = new Date(r.solar.sunset)
      return d.getHours() * 60 + d.getMinutes()
    })
    .filter(t => t != null)

  if (sunsets.length >= 7) {
    const regression = linearRegression(sunsets)
    if (regression && regression.confidence > 0.6 && Math.abs(regression.slope) > 0.3) {
      const direction = regression.slope > 0 ? 'later' : 'earlier'
      const minutesPerWeek = Math.abs(regression.slope * 7)

      patterns.push({
        id: 'sunset-shift',
        type: PATTERN_TYPES.TREND,
        title: `Sunset Getting ${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
        description: `Sunset is shifting ${direction} by approximately ${minutesPerWeek.toFixed(0)} minutes per week.`,
        confidence: regression.confidence,
        data: { direction, minutesPerWeek, slope: regression.slope },
        icon: '🌇',
        detectedAt: new Date().toISOString()
      })
    }
  }

  return patterns.length > 0 ? patterns : null
}

/**
 * Detect visibility patterns
 */
export function detectVisibilityPatterns(atmosphereHistory) {
  if (!atmosphereHistory || atmosphereHistory.length < 5) return null

  const visibilities = atmosphereHistory
    .map(a => a.current?.visibility)
    .filter(v => v != null)

  if (visibilities.length < 5) return null

  const avgVisibility = visibilities.reduce((a, b) => a + b, 0) / visibilities.length
  const avgKm = avgVisibility / 1000

  // Check for consistently good or poor visibility
  const goodCount = visibilities.filter(v => v > 15000).length
  const poorCount = visibilities.filter(v => v < 8000).length

  if (goodCount / visibilities.length > 0.7) {
    return {
      id: 'good-visibility',
      type: PATTERN_TYPES.OPTIMAL,
      title: 'Consistently Good Visibility',
      description: `This location has excellent visibility (>${15}km) ${Math.round(goodCount / visibilities.length * 100)}% of the time. Average: ${avgKm.toFixed(1)}km.`,
      confidence: goodCount / visibilities.length,
      data: { avgVisibility: avgKm, goodPercentage: goodCount / visibilities.length },
      icon: '👁️',
      detectedAt: new Date().toISOString()
    }
  }

  if (poorCount / visibilities.length > 0.5) {
    return {
      id: 'poor-visibility',
      type: PATTERN_TYPES.ANOMALY,
      title: 'Frequent Low Visibility',
      description: `This location experiences reduced visibility (<8km) ${Math.round(poorCount / visibilities.length * 100)}% of the time. Consider timing observations carefully.`,
      confidence: poorCount / visibilities.length,
      data: { avgVisibility: avgKm, poorPercentage: poorCount / visibilities.length },
      icon: '🌫️',
      detectedAt: new Date().toISOString()
    }
  }

  return null
}

/**
 * Run all pattern detection algorithms
 */
export function detectAllPatterns(records, atmosphereHistory = []) {
  const patterns = []

  // Daylight trend
  const daylightTrend = detectDaylightTrend(records)
  if (daylightTrend) patterns.push(daylightTrend)

  // Moon cycles
  const moonPatterns = detectMoonCyclePatterns(records)
  if (moonPatterns) patterns.push(...moonPatterns)

  // Sun time shifts
  const sunShifts = detectSunTimeShifts(records)
  if (sunShifts) patterns.push(...sunShifts)

  // Optimal conditions (needs atmosphere data)
  const optimal = detectOptimalConditions(atmosphereHistory)
  if (optimal) patterns.push(optimal)

  // Moon-cloud correlation
  const moonCloud = detectMoonCloudCorrelation(records, atmosphereHistory)
  if (moonCloud) patterns.push(moonCloud)

  // Visibility patterns
  const visibility = detectVisibilityPatterns(atmosphereHistory)
  if (visibility) patterns.push(visibility)

  // Sort by confidence
  patterns.sort((a, b) => b.confidence - a.confidence)

  return patterns
}

/**
 * Get confidence level object from numeric confidence
 */
export function getConfidenceLevel(confidence) {
  if (confidence >= CONFIDENCE.HIGH.min) return CONFIDENCE.HIGH
  if (confidence >= CONFIDENCE.MEDIUM.min) return CONFIDENCE.MEDIUM
  return CONFIDENCE.LOW
}
