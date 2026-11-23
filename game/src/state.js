// Ember Duel — the turn state machine: deal, commit up to three cards, clash, redraw.
import { freshDeck } from './cards.js';
import { planIntent } from './opponent.js';
import {
  LANE_COUNT, LANE_CAP, HAND_SIZE, MAX_ENERGY, START_LIFE, ROMAN,
  makeRng, shuffle, resolveClash,
} from './rules.js';

const clamp = (n) => Math.max(0, Math.min(START_LIFE, n));
const sum = (list) => list.reduce((n, v) => n + v, 0);

function drawTo(state, who, n) {
  const side = state[who];
  while (side.hand.length < n) {
    if (!side.deck.length) {
      if (!side.discard.length) break;
      side.deck = shuffle(side.discard.splice(0), state.rng);
    }
    side.hand.push(side.deck.pop());
  }
}

export function createGame(seed = 1) {
  const state = {
    phase: 'table', seed, rng: makeRng(seed), turn: 1,
    life: { p: START_LIFE, f: START_LIFE },
    energy: MAX_ENERGY,
    p: { hand: [], deck: shuffle(freshDeck(), makeRng(seed * 7 + 11)), discard: [] },
    f: { hand: [], deck: shuffle(freshDeck(), makeRng(seed * 13 + 5)), discard: [] },
    placements: [], intents: [], lastClash: null,
    totalDmg: { p: 0, f: 0 }, broke: { p: null, f: null },
    selected: null, cursor: 0, fx: null, foeMood: '',
    message: 'READ THE RIVAL’S INTENT. THEN COMMIT YOUR HAND.',
  };
  drawTo(state, 'p', HAND_SIZE);
  drawTo(state, 'f', HAND_SIZE);
  state.intents = planIntent(state);
  state.fx = { kind: 'deal' };
  return state;
}

export function toggleSelect(state, index) {
  if (state.phase !== 'table' || index < 0 || index >= state.p.hand.length) return;
  if (state.selected === index) { state.selected = null; return; }
  const card = state.p.hand[index];
  if (card.cost > state.energy) {
    state.message = `NEED ${card.cost} ENERGY FOR ${card.name.toUpperCase()}`;
    return;
  }
  state.selected = index;
  state.message = `${card.name.toUpperCase()} READY — CHOOSE A LANE`;
}

export function placeCard(state, index, lane) {
  if (state.phase !== 'table' || index === null || index < 0 || index >= state.p.hand.length) return false;
  const card = state.p.hand[index];
  if (card.cost > state.energy || state.placements.length >= 3) return false;
  if (lane < 0 || lane >= LANE_COUNT || state.placements.filter((p) => p.lane === lane).length >= LANE_CAP) return false;
  state.p.hand.splice(index, 1);
  state.energy -= card.cost;
  state.placements.push({ card, lane, index });
  state.selected = null;
  state.cursor = lane;
  state.message = `${card.name.toUpperCase()} → LANE ${ROMAN[lane]}`;
  state.fx = { kind: 'deploy', uid: card.uid };
  return true;
}

export function undoPlacement(state) {
  const last = state.placements.pop();
  if (!last) return false;
  state.p.hand.splice(Math.min(last.index, state.p.hand.length), 0, last.card);
  state.energy += last.card.cost;
  state.selected = null;
  state.message = `${last.card.name.toUpperCase()} RETURNS TO HAND`;
  return true;
}

export function endTurn(state) {
  if (state.phase !== 'table' || !state.placements.length) {
    if (state.phase === 'table') state.message = 'COMMIT AT LEAST ONE CARD TO CLASH';
    return false;
  }
  const playerLanes = [[], [], []];
  const foeLanes = [[], [], []];
  for (const p of state.placements) {
    playerLanes[p.lane].push(p.card);
    state.p.discard.push(p.card);
  }
  for (const intent of state.intents) {
    const i = state.f.hand.findIndex((c) => c.uid === intent.uid);
    if (i < 0) continue;
    const card = state.f.hand.splice(i, 1)[0];
    foeLanes[intent.lane].push(card);
    state.f.discard.push(card);
  }

  const out = resolveClash(playerLanes, foeLanes);
  const dealtP = sum(out.results.map((r) => r.fDmg));
  const dealtF = sum(out.results.map((r) => r.pDmg));
  state.totalDmg.p += dealtF;
  state.totalDmg.f += dealtP;
  for (const side of ['p', 'f']) {
    if (state.broke[side]) continue;
    const lane = out.results.findIndex((r) => r.winner === side);
    if (lane >= 0) state.broke[side] = ROMAN[lane];
  }
  state.life.p = clamp(state.life.p - dealtP + out.pHeal);
  state.life.f = clamp(state.life.f - dealtF + out.fHeal);
  state.lastClash = out.results;
  state.turn++;
  state.placements = [];
  state.intents = [];
  state.selected = null;
  state.energy = MAX_ENERGY;

  if (state.life.f <= 0 || state.life.p <= 0) {
    state.phase = state.life.f <= 0 && state.life.p > 0 ? 'win' : 'loss';
    // Keep the deciding cards for the end-screen flourish (lanes are cleared below).
    state.finalCards = { p: playerLanes, f: foeLanes };
    state.fx = { kind: state.phase };
    state.message = state.phase === 'win' ? 'THE RIVAL’S HEARTH IS OUT.' : 'YOUR HEARTH GOES COLD.';
    return true;
  }

  drawTo(state, 'p', HAND_SIZE + out.pDraw);
  drawTo(state, 'f', HAND_SIZE + out.fDraw);
  if (state.p.hand.length > 7) state.p.hand.splice(7);
  if (state.f.hand.length > 7) state.f.hand.splice(7);
  state.intents = planIntent(state);
  const best = out.results.reduce((b, r, i) => (r.pDmg > out.results[b].pDmg ? i : b), 0);
  const extra = [
    out.fxP.ember ? ' · EMBER +1 ATK' : '',
    out.fxP.stone ? ' · STONE +1 GUARD' : '',
    out.fxP.tide ? ` · TIDE HEAL ${out.pHeal}` : '',
    out.fxP.gale ? ' · GALE DRAW' : '',
    out.fxP.trinity ? ' · TRINITY +2 ATK' : '',
  ].join('');
  state.message = `LANE ${ROMAN[best]}: ${out.results[best].pDmg} DAMAGE${extra || ' · CLEAN CLASH'}`;
  state.fx = { kind: 'clash', results: out.results, dealtP, dealtF, pHeal: out.pHeal, fHeal: out.fHeal };
  return true;
}
