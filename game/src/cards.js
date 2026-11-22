// Ember Duel — the 24-card catalogue, four elemental suits and their shape language.
// Each suit is told apart by colour AND by silhouette, never by text alone.

const svg = (body, view = '0 0 24 24') =>
  `<svg viewBox="${view}" aria-hidden="true">${body}</svg>`;

// Four bold, filled silhouettes: flame / drop / peak / swirl. Each reads on its
// own at 12px, so colour is a second cue rather than the only cue.
export const SUIT_SYMBOLS = {
  ember: svg('<path d="M13 1.4c.9 3.3-1.5 4.8-2.6 6.8-1 1.7-.9 3.1-.2 4.1-2.4-.6-3.1-2.6-3.1-4.3-1.6 2.5-2.4 4.7-2.4 7.2a8 8 0 0 0 16 0c0-4.9-3.5-7.4-5.1-10.6-.3 2-1.4 2.9-2.4 3.3.4-2.4.1-4.7-.2-6.5Z" fill="currentColor"/><path d="M12.2 13c-.4 1.6-2.1 2.3-2.1 4a2 2 0 0 0 4 0c0-1.6-1.2-2.6-1.9-4Z" fill="#fff4dc" opacity=".9"/>'),
  tide: svg('<path d="M12 1.9C12 1.9 3.5 10.5 3.5 15.3a8.5 8.5 0 0 0 17 0C20.5 10.5 12 1.9 12 1.9Z" fill="currentColor"/><path d="M7.4 15.4a4.7 4.7 0 0 0 3.3 4.5" fill="none" stroke="#eaf7ff" stroke-width="2.3" stroke-linecap="round" opacity=".9"/>'),
  stone: svg('<path d="M1.4 20.6 8.1 5.1l3.8 7.2 2.4-3.9 8.3 12.2Z" fill="currentColor"/><path d="m8.1 5.1 2.4 4.5-2.6-.9-2.2 3.2Z" fill="#fff2d4" opacity=".9"/><path d="m14.3 8.4 1.6-2.5 5.5 9.3-4.2-2Z" fill="#fff2d4" opacity=".6"/><path d="M2.6 20.6h18.8" stroke="#3a2409" stroke-width="1.5" stroke-linecap="round" opacity=".5"/>'),
  gale: svg('<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M2.8 7.3h10.7a3.2 3.2 0 1 0-3.2-3.2"/><path d="M2.8 12h15.1a3.2 3.2 0 1 1-3.2 3.2"/><path d="M2.8 16.7h8.3a3.2 3.2 0 1 1-3.2 3.2"/></g>'),
};

// Colour values mirror the CSS variables in style.css: vivid red-orange,
// cold blue, warm amber-brown and bright teal stay separable even when small.
export const SUITS = {
  ember: { label: 'Ember', color: '#ff6b36', bonus: '+1 ATTACK', blurb: 'Strike harder', icon: SUIT_SYMBOLS.ember },
  tide:  { label: 'Tide',  color: '#4ba3ff', bonus: 'HEAL 2',     blurb: 'Mend your hearth', icon: SUIT_SYMBOLS.tide },
  stone: { label: 'Stone', color: '#e6ae55', bonus: '+1 GUARD',   blurb: 'Hold the lane', icon: SUIT_SYMBOLS.stone },
  gale:  { label: 'Gale',  color: '#34e3d0', bonus: 'DRAW 1',     blurb: 'Find an answer', icon: SUIT_SYMBOLS.gale },
};

export const SUIT_KEYS = Object.keys(SUITS);

export function suitIcon(suit, size = 24, cls = '') {
  return `<span class="suit-icon ${cls}" style="width:${size}px;height:${size}px;color:${SUITS[suit].color}">${SUITS[suit].icon}</span>`;
}

export const KEYWORDS = {
  pierce: { label: 'PIERCE', glyph: '↯', hint: 'Ignores the guard in its lane' },
  ward:   { label: 'WARD',   glyph: '◇', hint: 'Shields the neighbouring lanes with half its guard' },
  rally:  { label: 'RALLY',  glyph: '✦', hint: '+1 attack for each ally in the lane' },
  siphon: { label: 'SIPHON', glyph: '✚', hint: 'Heal 1 when this side wins the lane' },
};

export const SWORD = svg('<path d="m20.4 2.6-3.9 1.2-9.6 9.6 3.9 3.9 9.6-9.6Zm-11.4 12-2.1 2.1m-.8-5.2 2.4 2.4M2 22l4.4-1.4-2.9-2.9Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>');
export const SHIELD = svg('<path d="M12 2 3.5 5.3v6.2c0 5.1 3.4 8.6 8.5 10.5 5.1-1.9 8.5-5.4 8.5-10.5V5.3Z" fill="currentColor" opacity=".9"/><path d="M12 5.6 6.2 7.6v4c0 3.5 2.2 6 5.8 7.4 3.6-1.4 5.8-3.9 5.8-7.4v-4Z" fill="#0c1420" opacity=".5"/>');

// id, name, suit, energy cost, attack, guard, optional keyword — six designs per element.
const RAW = [
  ['cinder-squire',  'Cinder Squire',  'ember', 1, 2, 0, ''],
  ['ember-lancer',   'Ember Lancer',   'ember', 2, 4, 0, ''],
  ['furnace-guard',  'Furnace Guard',  'ember', 2, 2, 2, ''],
  ['ashen-duelist',  'Ashen Duelist',  'ember', 1, 1, 1, 'rally'],
  ['pyre-hydra',     'Pyre Hydra',     'ember', 3, 5, 1, ''],
  ['spark-runner',   'Spark Runner',   'ember', 1, 3, 0, 'pierce'],
  ['mist-acolyte',   'Mist Acolyte',   'tide',  1, 1, 2, ''],
  ['tide-sentinel',  'Tide Sentinel',  'tide',  2, 1, 4, ''],
  ['coral-lancer',   'Coral Lancer',   'tide',  2, 3, 1, ''],
  ['ripple-seer',    'Ripple Seer',    'tide',  1, 0, 2, 'ward'],
  ['deepcurrent',    'Deepcurrent',    'tide',  3, 4, 2, ''],
  ['brine-warden',   'Brine Warden',   'tide',  1, 2, 1, 'siphon'],
  ['pebble-guard',   'Pebble Guard',   'stone', 1, 0, 3, ''],
  ['granite-fist',   'Granite Fist',   'stone', 2, 3, 2, ''],
  ['mossbound-oak',  'Mossbound Oak',  'stone', 3, 2, 5, ''],
  ['quake-hound',    'Quake Hound',    'stone', 2, 4, 1, 'rally'],
  ['shale-sentinel', 'Shale Sentinel', 'stone', 1, 1, 2, 'ward'],
  ['mountain-vow',   'Mountain Vow',   'stone', 3, 4, 3, ''],
  ['gale-courier',   'Gale Courier',   'gale',  1, 2, 0, ''],
  ['wind-dancer',    'Wind Dancer',    'gale',  1, 1, 1, 'rally'],
  ['storm-archer',   'Storm Archer',   'gale',  2, 4, 0, 'pierce'],
  ['zephyr-veil',    'Zephyr Veil',    'gale',  2, 0, 3, 'ward'],
  ['tempest-herald', 'Tempest Herald', 'gale',  3, 5, 1, ''],
  ['cyclone-sage',   'Cyclone Sage',   'gale',  2, 3, 1, 'siphon'],
];

export const CARDS = RAW.map(([id, name, suit, cost, atk, guard, kw]) => ({ id, name, suit, cost, atk, guard, kw }));
export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));
export const instance = (id, uid) => ({ ...CARD_BY_ID[id], uid });

let nextUid = 1;
export function freshDeck() {
  return CARDS.map((c) => ({ ...c, uid: nextUid++ }));
}
