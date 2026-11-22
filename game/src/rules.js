// Ember Duel — deterministic randomness, combo effects and the three-lane clash.
// Pure rules: nothing here touches the DOM.
import { SUIT_KEYS } from './cards.js';

export const LANE_COUNT = 3;
export const START_LIFE = 20;
export const MAX_ENERGY = 3;
export const HAND_SIZE = 5;
export const LANE_CAP = 2;
export const ROMAN = ['I', 'II', 'III'];

export function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list, rng) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// Two or more of one suit in a single turn ignite that suit's bonus.
export function effectsOf(cards) {
  const tally = {};
  for (const c of cards) tally[c.suit] = (tally[c.suit] ?? 0) + 1;
  const combos = SUIT_KEYS.filter((s) => (tally[s] ?? 0) >= 2)
    .map((suit) => ({ suit, count: tally[suit] }));
  // Three different elements in one turn are a Trinity: +2 attack in the
  // busiest lane. Four suits still count once — the bonus is a single flourish.
  const distinct = SUIT_KEYS.filter((s) => (tally[s] ?? 0) > 0);
  const trinity = distinct.length >= 3 ? 2 : 0;
  const fx = { combos, ember: 0, tide: 0, stone: 0, gale: 0, trinity };
  for (const c of combos) {
    if (c.suit === 'ember') fx.ember = 1;
    if (c.suit === 'tide') fx.tide = 2 + Math.max(0, c.count - 2);
    if (c.suit === 'stone') fx.stone = 1;
    if (c.suit === 'gale') fx.gale = 1 + Math.max(0, c.count - 2);
  }
  return fx;
}

function laneBase(cards, fx) {
  let atk = 0;
  let guard = 0;
  let pierce = false;
  let siphon = false;
  const ward = [];
  for (const c of cards) {
    atk += c.atk + (c.kw === 'rally' ? cards.length - 1 : 0) + (c.suit === 'ember' ? fx.ember : 0);
    guard += c.guard + (c.suit === 'stone' ? fx.stone : 0);
    if (c.kw === 'pierce') pierce = true;
    if (c.kw === 'siphon') siphon = true;
    if (c.kw === 'ward') ward.push(Math.ceil(c.guard / 2));
  }
  return { atk, guard, ward, pierce, siphon };
}

const sum = (list) => list.reduce((n, v) => n + v, 0);

// Trinity attack lands where you committed the most cards (earliest lane on a tie).
function trinityTarget(lanes, fx) {
  if (!fx.trinity) return -1;
  let best = -1, top = 0;
  lanes.forEach((cs, i) => { if (cs.length > top) { top = cs.length; best = i; } });
  return best;
}

function withWard(base) {
  return base.map((b, i) => ({
    ...b,
    guard: b.guard + sum(base[i - 1]?.ward ?? []) + sum(base[i + 1]?.ward ?? []),
  }));
}

// One turn's committed cards per side: [lane0[], lane1[], lane2[]].
export function resolveClash(playerLanes, foeLanes) {
  const fxP = effectsOf(playerLanes.flat());
  const fxF = effectsOf(foeLanes.flat());
  const pBase = withWard(playerLanes.map((cs) => laneBase(cs, fxP)));
  const fBase = withWard(foeLanes.map((cs) => laneBase(cs, fxF)));
  const pTri = trinityTarget(playerLanes, fxP);
  const fTri = trinityTarget(foeLanes, fxF);
  const results = [];
  for (let i = 0; i < LANE_COUNT; i++) {
    const p = { ...pBase[i] };
    const f = { ...fBase[i] };
    if (i === pTri) p.atk += fxP.trinity;
    if (i === fTri) f.atk += fxF.trinity;
    const pDmg = Math.max(0, p.atk - (f.pierce ? 0 : f.guard));
    const fDmg = Math.max(0, f.atk - (p.pierce ? 0 : p.guard));
    results.push({
      pAtk: p.atk, fAtk: f.atk, pGuard: p.guard, fGuard: f.guard,
      pDmg, fDmg, winner: pDmg > fDmg ? 'p' : fDmg > pDmg ? 'f' : null,
      trinityP: i === pTri ? fxP.trinity : 0, trinityF: i === fTri ? fxF.trinity : 0,
      pierceP: p.pierce, pierceF: f.pierce,
      siphonP: p.siphon && pDmg > fDmg, siphonF: f.siphon && fDmg > pDmg,
    });
  }
  return {
    results, fxP, fxF,
    pHeal: fxP.tide + results.filter((r) => r.siphonP).length,
    fHeal: fxF.tide + results.filter((r) => r.siphonF).length,
    pDraw: fxP.gale,
    fDraw: fxF.gale,
  };
}
