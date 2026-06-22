# Garden Almanac — Plan & Roadmap

Repurposes **Dawn Tracker** (a solar/lunar observation app) into a **personal
gardening almanac**, keeping the suncalc + Open-Meteo astronomy engine as the data
substrate. This is the full plan: vision, decisions, the data model, every shipped
phase, the test strategy, known limitations, and what's next.

**Stack:** React 19 + Vite 7 PWA · Zustand + localStorage · suncalc · Open-Meteo ·
Tailwind v4 · recharts · Vitest + fast-check. Offline-first, no backend.

---

## 1. Context & vision

A "proper" Farmers' Almanac is a body of validated horticultural knowledge —
planting dates, frost normals, moon timing — grounded in decades of observation.
Neither brand almanac (Old Farmer's Almanac / Farmers' Almanac) exposes a public
API, so Garden Almanac **assembles the same value from open data sources**, two of
which the app already had wired in (suncalc for moon phase, Open-Meteo for weather).

The app *leads* with gardening but does not discard the astronomy engine: moon
phase, day length, and frost-relevant temperatures are exactly what gardening
needs, so the original Today / History / Atmosphere / Patterns / Stats views remain
as the substrate.

### Locked decisions
1. **Reframe, don't pivot** — app identity becomes "Garden Almanac"; astronomy
   engine retained as the substrate.
2. **Planting Calendar is the flagship** — "what to plant now" for the user's
   location, the default landing view.
3. **Assemble data from open sources** (below), no brand-almanac scraping.
4. **Garden Journal depth** — plantings + harvest log (not full bed/activity
   modeling in v1).

---

## 2. Data sources (verified)

| Need | Source | Notes |
|---|---|---|
| USDA hardiness zone | `https://phzmapi.org/{zip}.json` | Free, no key. `{ zone, temperature_range, coordinates }`. ZIP-keyed (US-only). |
| Frost dates | `https://archive-api.open-meteo.com/v1/archive` | Free, no key. Daily `temperature_2m_min` back to 1940. **Derived**, not looked up. |
| GDD temps (history + forecast) | `https://api.open-meteo.com/v1/forecast` | `past_days=92` + `forecast_days=16`, max/min °F. |
| Live weather | `api.open-meteo.com/v1/forecast` | Pre-existing (`utils/atmosphere.js`). |
| Moon phase / day length | `suncalc` | Local, no network (`utils/astronomy.js`). |
| Crop planting rules | `src/data/crops.js` | Bundled, 32 crops, frost-relative windows. |

> **Note:** `waldoj/frostline` is hardiness *zones*, not frost dates — there is no
> clean free bundled frost-date JSON, which is why frost dates are derived from
> Open-Meteo history.

---

## 3. Architecture

Every feature is a **pure engine** (`utils/*.js`, no I/O) + a **thin Zustand
store** (fetch/cache/persist) + a **view**. The hard logic stays out of React and
is unit-testable with deterministic, injected inputs (e.g. `today`).

```
src/
├── data/crops.js                  — crop knowledge base (frost-relative windows + provenance)
├── utils/
│   ├── frost.js                   — derive frost dates + risk percentiles (hemisphere-agnostic)
│   ├── planting.js                — planting-calendar engine (+ tender maturity guard)
│   ├── gdd.js                     — Growing-Degree-Day harvest prediction
│   ├── moonPlanting.js            — moon-phase planting guidance
│   └── astronomy.js               — suncalc wrappers (shared with the tracker)
├── stores/
│   ├── gardenStore.js             — hardiness zone + frost dates (cached, persisted)
│   ├── gddStore.js                — cached daily temps for GDD
│   └── journalStore.js            — plantings + harvest log
├── hooks/useGddData.js            — loads/caches GDD temps
└── components/views/
    ├── PlantingCalendarView.jsx
    ├── GardenJournalView.jsx
    └── MoonPlantingView.jsx
```

**Crop model** (`crops.js`): each crop has frost-relative `windows`:
```js
{ id, name, emoji, category, tender, daysToMaturity, source,
  windows: [ { method: 'direct-sow'|'start-indoors'|'transplant'|'plant-cloves',
               ref: 'LSF'|'FFF', start, end, season? } ],   // start/end = signed week offsets
  notes }
```
`tender` (frost-sensitive) crops get a **maturity guard** in `planting.js`: a
planting is only recommended if it can ripen (`daysToMaturity` + buffer) before the
first fall frost. Hardy crops instead carry explicit FFF-referenced fall windows.

---

## 4. Phases & status

| Phase | What | Status |
|---|---|---|
| 1 — Planting Calendar | frost-relative windows for 32 crops; zone via phzmapi; frost dates derived; maturity guard | ✅ shipped |
| 2 — Garden Journal | log plantings (crop · location · sow date), status, harvest log, notes; localStorage | ✅ shipped |
| 3 — GDD harvest prediction | weather-adjusted harvest dates from Open-Meteo temps; shown on journal cards | ✅ shipped |
| 4 — Moon Planting | sow-by-the-moon guidance (folklore, labeled as such) from suncalc phase data | ✅ shipped |
| Polish | seedling PWA icon + manifest, README rewrite, app/nav reframe | ✅ shipped |
| Domain-validation test tier | hemisphere fix, risk percentiles, property + golden tests, provenance | ✅ shipped |

Commits: `7f3b49a` (Phases 1–4 + polish), `66495bb` (domain-validation tier).
PR: [#2](https://github.com/Bbeierle12/dawn-tracker/pull/2).

---

## 5. Test strategy

Three layers — unit (pure logic), property (invariants), and golden (external
oracle). `npm test` is offline; the network golden suite is opt-in.

- **Unit** — `frost`, `planting`, `gdd`, `moonPlanting` with deterministic fixtures
  and injected `today`. Plus `crops.test.js`: data-integrity (unique ids, valid
  category/ref/method/source, `start <= end`) and the **cross-module contract**
  (every crop category is claimed by a moon-planting quarter, or it silently
  vanishes from the moon view).
- **Property-based** (`properties.test.js`, fast-check) — bucket totality (every
  crop in exactly one bucket for any date/frost), the tender maturity guard never
  lets a "plant now" window end after first fall frost, frost monotonicity (colder
  ⇒ later last frost / earlier first frost), GDD heat-monotonicity (hotter ⇒
  earlier-or-equal harvest), moon-quarter totality over `[0,1)`.
- **Golden** (`frost.integration.test.js`, gated behind `RUN_INTEGRATION=1`,
  `npm run test:integration`) — derives frost dates live and checks them against
  published NOAA normals for 5 stations.

### Findings the validation tier surfaced
1. **Frost-season split bug (fixed).** An earlier hemisphere refactor split spring/
   fall freezes at midwinter, mis-binning early-January freezes and biasing the
   mean last-frost ~10 days late in mild-winter climates. Replaced with the standard
   NOAA definition via a half-year calendar shift (also correct for the southern
   hemisphere). Caught by re-deriving, not by the golden tolerance.
2. **ERA5 warm bias (documented).** Open-Meteo's gridded `temperature_2m_min` runs
   warm vs point stations in frost-prone valleys / high latitudes (~4 wk at
   Fairbanks) → the app under-protects there. This is a data-source limit, not a
   derivation bug. Mitigation path: conservative-risk default + microclimate caveat.

---

## 6. Known limitations

- **Frost-tender GDD targets are heuristic** — `gdd.js` sizes the target as
  `daysToMaturity × nominal GDD`, not validated GDD-to-maturity per crop. The
  Garden Journal's logged harvests are the latent dataset to calibrate this.
- **The mean frost date under-protects** (~half of years freeze later). Percentiles
  (`p10/p50/p90`) and `pickFrostDates(risk)` exist and the UI shows the "90% safe
  by" date, but the planting engine still defaults to the mean.
- **Crop provenance is self-assessed** (`source: 'standard' | 'estimate'`), not
  per-crop cited extension data.
- **Hardiness zone is ZIP-only / US-only** (phzmapi); frost dates work anywhere.
- **PWA icon is SVG-only**; raster PNG regeneration deferred (needs an image tool).
- **Pre-existing lint baseline is red** (~26 errors in untouched astronomy files);
  all new gardening files are lint-clean.

---

## 7. Roadmap (next)

Ordered by value:
1. **Risk-adjusted default** — plant on the conservative frost date (`pickFrostDates`)
   + a microclimate warning, since the mean under-protects (esp. valley/high-lat).
2. **GDD calibration loop** — backtest predicted vs logged harvests from the journal
   to replace heuristic GDD targets with empirical ones.
3. **Software-hardening test tier** — mocked fetcher tests, store/cache tests,
   jsdom + Testing Library for views, coverage, GitHub Actions CI.
4. **Richer journal** — named beds + dated activity log (watering/feeding/observations).
5. **Cross-reference moon view with the in-season calendar** — show only moon-favored
   crops that are also in their planting window.
6. **Raster PWA icons** + clean up the pre-existing astronomy lint baseline.

---

## 8. Verification (how to run)

```bash
node -v            # Node 22 (Vite 7)
npm install
npm test           # offline unit + property suite
npm run test:integration   # live golden-dataset suite (network)
npm run build && npm run lint
npm run dev        # manual: default Planting Calendar; ZIP 93301 → zone 9b
```
Bakersfield (default) derives to last frost ~Feb 4 / first frost ~Dec 9 (zone 9b).
