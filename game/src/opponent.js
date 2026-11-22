// Ember Duel — the rival's readable, seeded plan. Every committed card is shown
// face-up before the player moves, so the threat can be countered rather than guessed.
import { LANE_COUNT, MAX_ENERGY } from './rules.js';

export function planIntent(state) {
  const hand = state.f.hand;
  if (!hand.length) {
    state.foeMood = 'RIVAL IS RESHUFFLING';
    return [];
  }
  const desperate = state.life.p <= 10;
  const last = state.lastClash;
  const focus = last
    ? last.reduce((best, r, i) => (r.pDmg > last[best].pDmg ? i : best), 0)
    : Math.floor(state.rng() * LANE_COUNT);

  // The rival works to the same three-energy budget as the player: its telegraph
  // is a promise it can actually keep, and every threat has a countably fair answer.
  const ranked = hand
    .map((c) => ({
      c,
      score: (c.atk * (desperate ? 1.6 : 1.15) + c.guard * 0.9
        + (c.kw === 'pierce' ? 0.8 : 0) + (c.kw === 'rally' ? 0.5 : 0)) / c.cost
        + state.rng() * 0.7,
    }))
    .sort((a, b) => b.score - a.score);
  const picks = [];
  let budget = MAX_ENERGY;
  for (const entry of ranked) {
    if (picks.length >= 3) break;
    if (entry.c.cost <= budget) { picks.push(entry.c); budget -= entry.c.cost; }
  }

  let lanes;
  if (picks.length === 1) lanes = [focus];
  else if (picks.length === 2) lanes = [focus, (focus + 1 + Math.floor(state.rng() * 2)) % LANE_COUNT];
  else if (desperate || state.turn % 3 === 0) {
    lanes = [0, 1, 2];
    if (state.rng() < 0.5) lanes.reverse();
  } else {
    lanes = [focus, focus, (focus + 1 + Math.floor(state.rng() * 2)) % LANE_COUNT];
  }

  state.foeMood = desperate
    ? 'RIVAL SMEETS VICTORY — ALL LANES PUSH'
    : last ? `RIVAL ANSWERS YOUR PRESSURE IN LANE ${['I', 'II', 'III'][focus]}`
      : 'RIVAL SURVEYS THE THREE LANES';

  return picks.map((c, i) => ({ lane: lanes[i], uid: c.uid }));
}
