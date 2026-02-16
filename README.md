# Dawn Tracker

A solar and lunar almanac that tracks astronomical events, sunrise/sunset patterns, atmospheric conditions, and observation quality — built as a Progressive Web App.

## Features

- **Real-time countdown** to the next astronomical event with sun/moon position tracking
- **Moon phase visualization** with illumination percentage and 8-phase display
- **Atmospheric conditions monitoring** via Open-Meteo API — cloud cover, visibility, humidity, and observation scoring
- **Historical pattern analysis** with statistical trend detection (daylight trends, moon-cloud correlation, sunrise shifts)
- **PWA support** with background alarm notifications, escalating alarm sequence, and installable web app
- **Five views**: Today, Patterns, Stats, Atmosphere, History

## Tech Stack

- **Framework**: React 19, Vite
- **State**: Zustand (persisted to localStorage)
- **Charts**: Recharts
- **Astronomy**: SunCalc
- **Styling**: Tailwind CSS 4
- **Audio**: Howler.js
- **PWA**: vite-plugin-pwa with Workbox
- **Background Processing**: Web Workers

## Getting Started

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint
```

## Architecture

```
src/
├── components/
│   ├── views/          — TodayView, HistoryView, AtmosphereView, PatternsView, StatsView
│   ├── MoonPhase       — Moon phase SVG visualization
│   ├── SunPosition     — Sun altitude/azimuth indicator
│   ├── Countdown       — Next-event countdown timer
│   ├── Timeline        — Daily astronomical event timeline
│   └── ...             — Sidebar, AlarmModal, InstallPrompt, etc.
├── hooks/
│   ├── useAstronomy    — Solar/lunar times, positions, and event timeline
│   ├── useAtmosphere   — Atmospheric data fetching with 15-min cache
│   ├── useAlarm        — Alarm triggering with 4-phase escalation
│   ├── useCountdown    — Generic countdown timer
│   └── useSunrise      — Dawn/twilight time retrieval
├── stores/
│   ├── alarmStore      — Alarm state, snooze tracking
│   ├── locationStore   — Lat/lng persistence
│   ├── historyStore    — Daily astronomical records with backfill
│   ├── patternsStore   — Pattern detection results
│   └── atmosphereStore — Cached atmospheric data
├── utils/
│   ├── astronomy       — SunCalc wrappers for solar/lunar calculations
│   ├── atmosphere      — Open-Meteo API client and observation scoring
│   ├── patterns        — Statistical pattern detection (regression, correlation)
│   ├── dawn            — Dawn time helpers
│   └── audio           — Howler.js sound management and notifications
└── workers/
    └── alarmWorker     — Background alarm timing via Web Worker
```
