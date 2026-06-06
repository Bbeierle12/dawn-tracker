/**
 * Crop knowledge base for the planting calendar.
 *
 * Each crop's planting windows are expressed RELATIVE TO FROST DATES so the
 * calendar adapts to any location once we know its last spring frost (LSF) and
 * first fall frost (FFF):
 *
 *   ref:   'LSF' = last spring frost,  'FFF' = first fall frost
 *   start: signed week offset from that frost date for the EARLIEST sensible planting
 *   end:   signed week offset for the LATEST. Negative = before the frost, positive = after.
 *
 * For `tender` (frost-sensitive) crops the late end is also trimmed by a maturity
 * guard in utils/planting.js — a planting is only recommended if it can reach
 * harvest before the first fall frost. That lets us set generous `end` offsets on
 * tender crops and let the guard do the location-aware trimming.
 *
 * `daysToMaturity` is a typical value for a common variety; real seed packets vary.
 * Sources: USDA/extension planting guides, Johnny's & Old Farmer's Almanac calendars.
 */

export const CROPS = [
  // ---------------- Warm-season / frost-tender ----------------
  {
    id: 'tomato', name: 'Tomato', emoji: '🍅', category: 'Fruiting vegetable',
    tender: true, daysToMaturity: 75,
    windows: [
      { method: 'start-indoors', ref: 'LSF', start: -8, end: -6 },
      { method: 'transplant', ref: 'LSF', start: 1, end: 30 },
    ],
    notes: 'Start indoors, then transplant after frost into warm soil. Harden off first.',
  },
  {
    id: 'pepper', name: 'Pepper', emoji: '🌶️', category: 'Fruiting vegetable',
    tender: true, daysToMaturity: 70,
    windows: [
      { method: 'start-indoors', ref: 'LSF', start: -10, end: -8 },
      { method: 'transplant', ref: 'LSF', start: 2, end: 28 },
    ],
    notes: 'Loves heat. Wait until nights stay above 55°F before transplanting.',
  },
  {
    id: 'eggplant', name: 'Eggplant', emoji: '🍆', category: 'Fruiting vegetable',
    tender: true, daysToMaturity: 80,
    windows: [
      { method: 'start-indoors', ref: 'LSF', start: -9, end: -7 },
      { method: 'transplant', ref: 'LSF', start: 2, end: 26 },
    ],
    notes: 'Heat lover; one of the last to go out in spring.',
  },
  {
    id: 'cucumber', name: 'Cucumber', emoji: '🥒', category: 'Fruiting vegetable',
    tender: true, daysToMaturity: 55,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: 1, end: 30 },
    ],
    notes: 'Direct-sow once soil is warm. Succession-sow every few weeks.',
  },
  {
    id: 'zucchini', name: 'Zucchini / Summer Squash', emoji: '🥒', category: 'Fruiting vegetable',
    tender: true, daysToMaturity: 50,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: 1, end: 30 },
    ],
    notes: 'Fast and prolific. A mid-summer second sowing dodges squash bugs.',
  },
  {
    id: 'winter-squash', name: 'Winter Squash', emoji: '🎃', category: 'Fruiting vegetable',
    tender: true, daysToMaturity: 95,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: 2, end: 20 },
    ],
    notes: 'Long season; needs to cure on the vine before first frost.',
  },
  {
    id: 'pumpkin', name: 'Pumpkin', emoji: '🎃', category: 'Fruiting vegetable',
    tender: true, daysToMaturity: 100,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: 2, end: 18 },
    ],
    notes: 'Count back ~100 days from when you want ripe pumpkins.',
  },
  {
    id: 'melon', name: 'Cantaloupe / Melon', emoji: '🍈', category: 'Fruiting vegetable',
    tender: true, daysToMaturity: 80,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: 2, end: 22 },
    ],
    notes: 'Needs steady heat to sweeten. Black plastic mulch helps in cool springs.',
  },
  {
    id: 'watermelon', name: 'Watermelon', emoji: '🍉', category: 'Fruiting vegetable',
    tender: true, daysToMaturity: 85,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: 2, end: 22 },
    ],
    notes: 'Long, hot season required. Ideal for low-desert and Central Valley summers.',
  },
  {
    id: 'bush-bean', name: 'Bush Bean', emoji: '🫘', category: 'Legume',
    tender: true, daysToMaturity: 55,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: 0, end: 34 },
    ],
    notes: 'Quick and forgiving. Succession-sow every 2–3 weeks for a steady supply.',
  },
  {
    id: 'pole-bean', name: 'Pole Bean', emoji: '🫛', category: 'Legume',
    tender: true, daysToMaturity: 65,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: 1, end: 28 },
    ],
    notes: 'Needs a trellis; produces over a longer window than bush beans.',
  },
  {
    id: 'corn', name: 'Sweet Corn', emoji: '🌽', category: 'Grain',
    tender: true, daysToMaturity: 75,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: 1, end: 26 },
    ],
    notes: 'Plant in blocks of short rows for good pollination, not a single long row.',
  },
  {
    id: 'okra', name: 'Okra', emoji: '🌿', category: 'Fruiting vegetable',
    tender: true, daysToMaturity: 60,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: 3, end: 30 },
    ],
    notes: 'Thrives in extreme heat; one of the few crops happy in peak summer.',
  },
  {
    id: 'southern-pea', name: 'Southern Pea (Cowpea)', emoji: '🫛', category: 'Legume',
    tender: true, daysToMaturity: 65,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: 3, end: 28 },
    ],
    notes: 'Heat- and drought-tolerant; fixes nitrogen for the next crop.',
  },
  {
    id: 'sweet-potato', name: 'Sweet Potato', emoji: '🍠', category: 'Root',
    tender: true, daysToMaturity: 100,
    windows: [
      { method: 'transplant', ref: 'LSF', start: 3, end: 16 },
    ],
    notes: 'Plant rooted slips into warm soil. Needs a long, frost-free season.',
  },
  {
    id: 'basil', name: 'Basil', emoji: '🌿', category: 'Herb',
    tender: true, daysToMaturity: 60,
    windows: [
      { method: 'start-indoors', ref: 'LSF', start: -6, end: -4 },
      { method: 'direct-sow', ref: 'LSF', start: 1, end: 28 },
    ],
    notes: 'Cold-sensitive; pinch flowers to keep leaves coming.',
  },

  // ---------------- Cool-season / frost-hardy ----------------
  {
    id: 'lettuce', name: 'Lettuce', emoji: '🥬', category: 'Leafy green',
    tender: false, daysToMaturity: 50,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: -4, end: 2, season: 'spring' },
      { method: 'direct-sow', ref: 'FFF', start: -16, end: -7, season: 'fall' },
    ],
    notes: 'Bolts in heat — grow in spring and fall, with afternoon shade if warm.',
  },
  {
    id: 'spinach', name: 'Spinach', emoji: '🥬', category: 'Leafy green',
    tender: false, daysToMaturity: 45,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: -6, end: -1, season: 'spring' },
      { method: 'direct-sow', ref: 'FFF', start: -14, end: -6, season: 'fall' },
    ],
    notes: 'Very cold-hardy; overwinters under mulch in mild zones.',
  },
  {
    id: 'kale', name: 'Kale', emoji: '🥬', category: 'Brassica',
    tender: false, daysToMaturity: 60,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: -5, end: -2, season: 'spring' },
      { method: 'direct-sow', ref: 'FFF', start: -14, end: -8, season: 'fall' },
    ],
    notes: 'Frost sweetens the leaves; a top fall and winter crop.',
  },
  {
    id: 'broccoli', name: 'Broccoli', emoji: '🥦', category: 'Brassica',
    tender: false, daysToMaturity: 65,
    windows: [
      { method: 'transplant', ref: 'LSF', start: -5, end: -2, season: 'spring' },
      { method: 'transplant', ref: 'FFF', start: -15, end: -10, season: 'fall' },
    ],
    notes: 'Heads best in cool weather; fall crops usually outperform spring.',
  },
  {
    id: 'cabbage', name: 'Cabbage', emoji: '🥬', category: 'Brassica',
    tender: false, daysToMaturity: 70,
    windows: [
      { method: 'transplant', ref: 'LSF', start: -5, end: -2, season: 'spring' },
      { method: 'transplant', ref: 'FFF', start: -15, end: -10, season: 'fall' },
    ],
    notes: 'Hardy; even-moisture prevents split heads.',
  },
  {
    id: 'cauliflower', name: 'Cauliflower', emoji: '🥦', category: 'Brassica',
    tender: false, daysToMaturity: 68,
    windows: [
      { method: 'transplant', ref: 'LSF', start: -5, end: -2, season: 'spring' },
      { method: 'transplant', ref: 'FFF', start: -15, end: -10, season: 'fall' },
    ],
    notes: 'Fussier than broccoli; dislikes heat and stress.',
  },
  {
    id: 'pea', name: 'Garden / Snap Pea', emoji: '🫛', category: 'Legume',
    tender: false, daysToMaturity: 60,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: -6, end: -1, season: 'spring' },
      { method: 'direct-sow', ref: 'FFF', start: -12, end: -8, season: 'fall' },
    ],
    notes: 'Sow as soon as soil can be worked; quits once it turns hot.',
  },
  {
    id: 'carrot', name: 'Carrot', emoji: '🥕', category: 'Root',
    tender: false, daysToMaturity: 70,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: -4, end: 1, season: 'spring' },
      { method: 'direct-sow', ref: 'FFF', start: -13, end: -8, season: 'fall' },
    ],
    notes: 'Keep the surface moist until germination; fall roots are sweetest.',
  },
  {
    id: 'beet', name: 'Beet', emoji: '🫜', category: 'Root',
    tender: false, daysToMaturity: 55,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: -5, end: -1, season: 'spring' },
      { method: 'direct-sow', ref: 'FFF', start: -11, end: -7, season: 'fall' },
    ],
    notes: 'Greens and roots are both edible; thin seedlings to one per cluster.',
  },
  {
    id: 'radish', name: 'Radish', emoji: '🌶️', category: 'Root',
    tender: false, daysToMaturity: 28,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: -4, end: 1, season: 'spring' },
      { method: 'direct-sow', ref: 'FFF', start: -9, end: -4, season: 'fall' },
    ],
    notes: 'Fastest crop in the garden; great for filling gaps and succession-sowing.',
  },
  {
    id: 'swiss-chard', name: 'Swiss Chard', emoji: '🥬', category: 'Leafy green',
    tender: false, daysToMaturity: 55,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: -3, end: 2, season: 'spring' },
      { method: 'direct-sow', ref: 'FFF', start: -13, end: -8, season: 'fall' },
    ],
    notes: 'Heat- and cold-tolerant; cut outer leaves and it keeps producing.',
  },
  {
    id: 'turnip', name: 'Turnip', emoji: '🫜', category: 'Root',
    tender: false, daysToMaturity: 50,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: -4, end: -1, season: 'spring' },
      { method: 'direct-sow', ref: 'FFF', start: -10, end: -6, season: 'fall' },
    ],
    notes: 'Dual-purpose greens and roots; fall crops are mildest.',
  },
  {
    id: 'cilantro', name: 'Cilantro', emoji: '🌿', category: 'Herb',
    tender: false, daysToMaturity: 50,
    windows: [
      { method: 'direct-sow', ref: 'LSF', start: -3, end: 2, season: 'spring' },
      { method: 'direct-sow', ref: 'FFF', start: -11, end: -6, season: 'fall' },
    ],
    notes: 'Bolts fast in heat; sow a pinch every few weeks during cool seasons.',
  },
  {
    id: 'onion', name: 'Onion', emoji: '🧅', category: 'Allium',
    tender: false, daysToMaturity: 100,
    windows: [
      { method: 'transplant', ref: 'LSF', start: -4, end: -1, season: 'spring' },
    ],
    notes: 'Day-length sensitive — match short/intermediate/long-day types to your latitude.',
  },
  {
    id: 'garlic', name: 'Garlic', emoji: '🧄', category: 'Allium',
    tender: false, daysToMaturity: 240,
    windows: [
      { method: 'plant-cloves', ref: 'FFF', start: -6, end: 2, season: 'fall' },
    ],
    notes: 'Plant cloves in fall around first frost; harvest the following summer.',
  },
]
