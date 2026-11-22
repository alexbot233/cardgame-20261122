// Ember Duel — deterministic staged scenes for ?shot= captures. No timers, no randomness
// beyond the fixed seed: the DOM is painted in its final, readable state immediately.
import { instance } from './cards.js';
import { makeRng, resolveClash } from './rules.js';

const cards = (ids, firstUid) => ids.map((id, i) => instance(id, firstUid + i));

function staged(seed, outcome) {
  const hand = cards(['tide-sentinel', 'granite-fist', 'pyre-hydra', 'coral-lancer', 'zephyr-veil'], 901);
  const placed = [
    { card: instance('cinder-squire', 911), lane: 0, index: 0 },
    { card: instance('shale-sentinel', 915), lane: 1, index: 1 },
    { card: instance('gale-courier', 917), lane: 2, index: 3 },
  ];
  const foeHand = cards(['tide-sentinel', 'mist-acolyte', 'mossbound-oak', 'storm-archer'], 921);
  // A genuine mid-turn decision: 5 + 4 cards face up, all three lanes busy on
  // both sides, two life totals already worn down, and both combo bars lit.
  // The rival telegraphs tide in I/II and a gale/stone pair in III: readable,
  // and its three elements light its own Trinity chip.
  const state = {
    phase: 'table', seed, rng: makeRng(seed), turn: 4,
    life: { p: 14, f: 11 }, energy: 2,
    p: { hand, deck: [], discard: [] },
    f: { hand: foeHand, deck: [], discard: [] },
    placements: placed,
    intents: [{ lane: 0, uid: 922 }, { lane: 1, uid: 921 }, { lane: 2, uid: 923 }, { lane: 2, uid: 924 }],
    lastClash: null, selected: null, cursor: 1, fx: null,
    foeMood: 'RIVAL MASSES TIDE IN I & II · STORM & STONE IN III',
    message: 'TRINITY BOTH SIDES · RIVAL TIDE COMBO HEALS 2',
  };
  if (outcome) {
    const p = [[], [], []], f = [[], [], []];
    for (const place of placed) p[place.lane].push(place.card);
    for (const it of state.intents) {
      const c = foeHand.find((card) => card.uid === it.uid);
      if (c) f[it.lane].push(c);
    }
    state.finalCards = { p, f };
    state.lastClash = resolveClash(p, f).results;
  }
  if (outcome === 'win') {
    state.phase = 'win';
    state.life = { p: 14, f: 0 };
    state.message = 'THE RIVAL’S HEARTH IS OUT.';
  } else if (outcome === 'loss') {
    state.phase = 'loss';
    state.life = { p: 0, f: 13 };
    // The rival's announced lane I play becomes the killing blow.
    state.f.hand[1] = instance('pyre-hydra', 922);
    state.finalCards.f = [[], [], []];
    for (const it of state.intents) {
      const c = state.f.hand.find((card) => card.uid === it.uid);
      if (c) state.finalCards.f[it.lane].push(c);
    }
    state.lastClash = resolveClash(state.finalCards.p, state.finalCards.f).results;
    state.message = 'YOUR HEARTH GOES COLD.';
  }
  return state;
}

export function sceneFor(name, seed = 1) {
  const key = String(name ?? '').toLowerCase();
  if (['title', 'start', 'intro', 'cover'].includes(key)) return { screen: 'title', state: null };
  if (['win', 'end', 'victory'].includes(key)) return { screen: 'win', state: staged(seed, 'win') };
  if (['loss', 'lose', 'defeat'].includes(key)) return { screen: 'loss', state: staged(seed, 'loss') };
  return { screen: 'table', state: staged(seed) };
}
