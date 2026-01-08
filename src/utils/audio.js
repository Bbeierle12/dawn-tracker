import { Howl, Howler } from 'howler'

// Sound instances
let sounds = {}

// Sound configurations
const SOUND_CONFIG = {
  gentle: {
    src: ['/sounds/gentle-dawn.mp3'],
    volume: 0.5,
    loop: true
  },
  rooster: {
    src: ['/sounds/rooster.mp3'],
    volume: 0.7,
    loop: true
  },
  chaos: {
    src: ['/sounds/chaos-choir.mp3'],
    volume: 0.8,
    loop: true
  },
  airhorn: {
    src: ['/sounds/airhorn.mp3'],
    volume: 1.0,
    loop: true
  },
  nope: {
    src: ['/sounds/nope.mp3'],
    volume: 0.6,
    loop: false
  },
  victory: {
    src: ['/sounds/victory.mp3'],
    volume: 0.7,
    loop: false
  }
}

/**
 * Initialize a sound by name
 */
function initSound(name) {
  if (!sounds[name] && SOUND_CONFIG[name]) {
    try {
      sounds[name] = new Howl({
        ...SOUND_CONFIG[name],
        onloaderror: () => {
          console.warn(`Sound file not found: ${name}. Add sound files to /public/sounds/`)
        }
      })
    } catch (e) {
      console.warn(`Failed to initialize sound: ${name}`, e)
      return null
    }
  }
  return sounds[name]
}

/**
 * Play a sound by name
 */
export function playSound(name) {
  const sound = initSound(name)
  if (sound) {
    sound.play()
  }
  return sound
}

/**
 * Stop a sound by name
 */
export function stopSound(name) {
  if (sounds[name]) {
    sounds[name].stop()
  }
}

/**
 * Stop all sounds
 */
export function stopAllSounds() {
  Object.values(sounds).forEach(sound => sound.stop())
  Howler.stop()
}

/**
 * Escalating alarm sequence
 * Returns a cleanup function
 */
export function startAlarmSequence(onEscalate) {
  let currentPhase = 0
  let timeouts = []

  const phases = [
    { sound: 'gentle', delay: 0 },
    { sound: 'rooster', delay: 30000 },   // 30 seconds
    { sound: 'chaos', delay: 60000 },     // 60 seconds
    { sound: 'airhorn', delay: 90000 }    // 90 seconds
  ]

  // Play first sound immediately
  playSound(phases[0].sound)
  currentPhase = 0
  onEscalate?.(0)

  // Schedule escalations
  phases.slice(1).forEach((phase, index) => {
    const timeout = setTimeout(() => {
      stopSound(phases[currentPhase].sound)
      playSound(phase.sound)
      currentPhase = index + 1
      onEscalate?.(currentPhase)
    }, phase.delay)
    timeouts.push(timeout)
  })

  // Return cleanup function
  return () => {
    timeouts.forEach(t => clearTimeout(t))
    stopAllSounds()
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

/**
 * Show a notification
 */
export function showNotification(title, options = {}) {
  if (Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      ...options
    })
  }
}

/**
 * Trigger device vibration (mobile)
 */
export function vibrate(pattern = [200, 100, 200]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}
