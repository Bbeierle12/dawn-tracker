# Garden Almanac

A personal gardening almanac — a planting calendar, garden journal, frost dates, and moon-planting guide for your location — built as an offline-first Progressive Web App. It grew out of (and still contains) a solar & lunar tracker, whose astronomy engine now doubles as the substrate for gardening (moon phases, day length, frost-relevant temperatures).

> **Is there a Farmers' Almanac API?** No — neither the Old Farmer's Almanac nor Farmers' Almanac offers a public API. So Garden Almanac *assembles* the same value from open data: USDA hardiness zone from [phzmapi.org](https://phzmapi.org), frost dates **derived** from [Open-Meteo's](https://open-meteo.com) historical archive, and moon phases computed locally with SunCalc.

## Features

### Gardening
- **Planting calendar** — "what to plant now" for your location, computed from your USDA hardiness zone and your last/first frost dates, across ~30 common crops. A maturity guard keeps it from recommending a frost-tender planting that can't ripen before the first fall frost.
- **Garden journal** — log what you plant, where, and when; track status (planned → growing → harvested); record harvests and notes. Persisted locally.
- **GDD harvest prediction** — Growing-Degree-Day accumulation from real Open-Meteo temperatures refines each planting's harvest date as the weather runs hot or cool.
- **Moon planting** — the Almanac's traditional sow-by-the-moon rhythm, driven by the moon-phase data the app already computes.

### Astronomy (the original tracker, retained)
- Real-time countdown to the next solar/lunar event, moon-phase visualization, atmospheric conditions via Open-Meteo, historical pattern analysis, and installable PWA with background alarms.

## Data sources

| Need | Source | Notes |
|------|--------|-------|
| USDA hardiness zone | `https://phzmapi.org/{zip}.json` | Free, no key. US ZIP-keyed. |
| Frost dates (last spring / first fall) | `archive-api.open-meteo.com/v1/archive` | Derived from ~30 yrs of daily minimum temperatures. Free, no key. |
| GDD temperatures | `api.open-meteo.com/v1/forecast` | Recent history + forecast for harvest prediction. |
| Moon phase / day length | SunCalc | Computed locally, no network. |
| Crop planting rules | `src/data/crops.js` | Bundled, frost-relative windows. |

## Tech Stack

- **Framework**: React 19, Vite 7
- **State**: Zustand (persisted to localStorage)
- **Astronomy**: SunCalc · **Charts**: Recharts · **Styling**: Tailwind CSS 4
- **PWA**: vite-plugin-pwa with Workbox · **Tests**: Vitest

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
npm run test     # Vitest unit tests
```

On first load the app derives your frost dates from 30 years of weather history for your location (default: Bakersfield, CA → zone 9b, last frost ~Feb 4, first frost ~Dec 9). Enter your ZIP under **Adjust** for your hardiness zone, or override frost dates manually.

## Architecture (gardening additions)

```
src/
├── data/
│   └── crops.js              — Crop knowledge base (~30 crops, frost-relative windows)
├── utils/
│   ├── frost.js              — Derive frost dates from Open-Meteo history
│   ├── planting.js           — Planting-calendar engine (+ maturity guard)
│   ├── gdd.js                — Growing-Degree-Day harvest prediction
│   ├── moonPlanting.js       — Moon-phase planting guidance
│   └── astronomy.js          — SunCalc wrappers (shared with the tracker)
├── stores/
│   ├── gardenStore.js        — Hardiness zone + frost dates (cached)
│   ├── gddStore.js           — Cached daily temperatures for GDD
│   └── journalStore.js       — Plantings + harvest log
├── hooks/
│   └── useGddData.js         — Loads/caches GDD temperatures
└── components/views/
    ├── PlantingCalendarView.jsx
    ├── GardenJournalView.jsx
    └── MoonPlantingView.jsx
```

The original astronomy modules (Today / History / Atmosphere / Patterns / Stats views, alarm worker, etc.) remain in place and power the moon and weather data the gardening features build on.
