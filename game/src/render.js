// Ember Duel — DOM rendering. One pass paints every screen; CSS owns the polish.
import { SUITS, KEYWORDS, SWORD, SHIELD, cardTip } from './cards.js';
import { resolveClash, ROMAN, LANE_COUNT } from './rules.js';

const $ = (id) => document.getElementById(id);
// Suit icons carry both a colour class and (on card crests) a shape class, so
// the stylesheet can give each element its own badge silhouette. The numerals
// are wrapped in <b> so their size can be tuned independently of their glyphs.
const icon = (suit, size, cls = '') => {
  const badge = cls.split(/\s+/).includes('crest') ? ` crest-shape shape-${suit}` : '';
  return `<span class="suit-icon suit-${suit}${badge} ${cls}" style="width:${size}px;height:${size}px">${SUITS[suit].icon}</span>`;
};

function cardHtml(card, opts = {}) {
  const suit = SUITS[card.suit];
  const kw = card.kw
    ? `<span class="kw" title="${KEYWORDS[card.kw].hint}">${KEYWORDS[card.kw].glyph}${opts.mini ? '' : ` ${KEYWORDS[card.kw].label}`}</span>` : '';
  const tag = opts.tag ? `<span class="hand-tag">${opts.tag}</span>` : '';
  const tip = opts.tip ? `<span class="tip">${cardTip(card)}</span>` : '';
  const index = opts.index === undefined ? '' : ` data-index="${opts.index}"`;
  return `<div class="card suit-${card.suit}${opts.mini ? ' mini' : ''}${opts.intent ? ' intent' : ''}${opts.selected ? ' selected' : ''}${opts.cls ? ` ${opts.cls}` : ''}"
      data-uid="${card.uid}"${index} tabindex="0" role="button"${opts.index !== undefined ? ' draggable="true"' : ''}
      aria-label="${card.name}, ${suit.label}, cost ${card.cost}, ${card.atk} attack, ${card.guard} guard">
    ${tag}${kw}${tip}
    <div class="cost"><b>${card.cost}</b></div>
    ${icon(card.suit, 22, 'crest')}
    <div class="art">${icon(card.suit, 66, 'watermark')}</div>
    <div class="cname">${card.name}</div>
    <div class="cstats">
      <span class="atk" title="Attack">${SWORD}<b>${card.atk}</b></span>
      <span class="guard" title="Guard">${SHIELD}<b>${card.guard}</b></span>
    </div>
  </div>`;
}

function lifePanel(who, value) {
  const label = who === 'f' ? 'RIVAL' : 'YOU';
  return `<div class="life ${who}${value <= 6 ? ' critical' : ''}">
    ${icon('ember', 26, 'life-mark')}
    <div class="life-main">
      <div class="life-label">${label} · HEARTH</div>
      <div class="life-bar"><i style="width:${value * 5}%"></i></div>
    </div>
    <div class="life-num">${String(value).padStart(2, '0')}<small>/20</small></div>
  </div>`;
}

function comboChips(fx, side) {
  const chips = fx.combos.map((c) =>
    `<span class="combo-chip suit-${c.suit}">${icon(c.suit, 15)}${SUITS[c.suit].label.toUpperCase()} ×${c.count}
      <b>${SUITS[c.suit].bonus}</b></span>`);
  if (fx.trinity) {
    chips.unshift(`<span class="combo-chip trinity"><span class="trinity-mark">✦</span>TRINITY <b>+2 ATTACK</b></span>`);
  }
  if (!chips.length) {
    return `<span class="no-combo">${side === 'p' ? 'PLAY 2+ OF A SUIT FOR A COMBO' : 'RIVAL: NO COMBO'}</span>`;
  }
  return chips.join('');
}

function laneHtml(s, i, preview) {
  const intents = s.intents.filter((x) => x.lane === i)
    .map((x) => s.f.hand.find((c) => c.uid === x.uid)).filter(Boolean);
  const mine = s.placements.filter((p) => p.lane === i);
  const r = preview.results[i];
  const focus = s.cursor === i && s.selected !== null;
  const verdict = (s.phase === 'win' || s.phase === 'loss') ? s.lastClash?.[i]?.winner : null;
  return `<div class="lane${focus ? ' focus' : ''}${verdict === 'p' ? ' lane-won' : verdict === 'f' ? ' lane-lost' : ''}" data-lane="${i}">
    <div class="lane-head">
      <span class="lname">LANE ${ROMAN[i]}</span>
      <span class="incoming">${SWORD} ${r.fAtk}${r.pierceF ? '<em class="pierce">PIERCE</em>' : ''}</span>
    </div>
    <div class="lane-foe slot${intents.length ? '' : ' empty'}" data-drop="${i}">
      ${intents.length ? intents.map((c) => cardHtml(c, { mini: true, intent: true, cls: `foe-card${verdict === 'f' ? ' rival-glow' : ''}` })).join('')
        : '<span class="slot-hint">NO THREAT</span>'}
    </div>
    <div class="clash-line">
      <span class="block-note">${SHIELD} ${r.pGuard}</span>
      <span class="vs">VS</span>
      <span class="break-note">${r.pDmg ? `BREAK ${r.pDmg}` : 'HOLD'}</span>
    </div>
    <div class="lane-you slot${mine.length ? '' : ' empty'}" data-drop="${i}">
      ${mine.length ? mine.map((p) => cardHtml(p.card, { mini: true, cls: verdict === 'p' ? 'winning-card' : '' })).join('')
        : '<span class="slot-hint">DROP A CARD HERE</span>'}
    </div>
  </div>`;
}

function renderTable(s) {
  const playerLanes = [[], [], []];
  const foeLanes = [[], [], []];
  for (const p of s.placements) playerLanes[p.lane].push(p.card);
  for (const it of s.intents) {
    const c = s.f.hand.find((card) => card.uid === it.uid);
    if (c) foeLanes[it.lane].push(c);
  }
  const preview = resolveClash(playerLanes, foeLanes);

  $('topbar').innerHTML = `${lifePanel('f', s.life.f)}
    <div class="center-hud">
      <div class="turnbox"><span>TURN</span><b>${String(s.turn).padStart(2, '0')}</b></div>
      <div class="energy"><span>ENERGY</span><div class="orbs">
        ${Array.from({ length: 3 }, (_, i) => `<i class="${i < s.energy ? 'lit' : ''}"></i>`).join('')}
      </div></div>
      <div class="mood">${s.foeMood}</div>
    </div>
    ${lifePanel('p', s.life.p)}`;

  $('foeHand').innerHTML = s.f.hand.map((c) => {
    const intent = s.intents.find((x) => x.uid === c.uid);
    return cardHtml(c, { tag: intent ? ROMAN[intent.lane] : '' });
  }).join('');

  $('comboBar').innerHTML = `<div class="combo-side player"><span class="combo-owner">YOUR COMBO</span>${comboChips(preview.fxP, 'p')}</div>
    <div class="combo-side rival"><span class="combo-owner">RIVAL COMBO</span>${comboChips(preview.fxF, 'f')}</div>`;

  $('lanes').innerHTML = Array.from({ length: LANE_COUNT }, (_, i) => laneHtml(s, i, preview)).join('');
  $('message').textContent = s.message;
  $('playerHand').innerHTML = s.p.hand.map((c, i) =>
    cardHtml(c, { index: i, tip: true, selected: s.selected === i, cls: c.cost > s.energy ? 'unaffordable' : '' })).join('');

  $('undoBtn').disabled = !s.placements.length;
  $('endBtn').disabled = !s.placements.length;
}

function renderEnd(s) {
  const win = s.phase === 'win';
  const end = $('endScreen');
  end.className = `screen end ${win ? 'win' : 'loss'}`;
  $('endKicker').textContent = win ? 'THE LAST EMBER FALLS' : 'THE HEARTH IS SILENT';
  $('endTitle').textContent = win ? 'VICTORY' : 'DEFEAT';
  $('endStats').innerHTML = `<span>TURNS <b>${String(s.turn - 1).padStart(2, '0')}</b></span>
    <span>YOU <b>${s.life.p}</b></span><span>RIVAL <b>${s.life.f}</b></span>`;
  $('endGlyph').innerHTML = icon(win ? 'ember' : 'tide', 118, 'end-sigil');
  // Spotlight the cards that decided the duel: your breaking lane, or the rival's.
  const final = s.finalCards ?? { p: [[], [], []], f: [[], [], []] };
  const results = resolveClash(final.p, final.f).results;
  const side = win ? 'p' : 'f';
  // One-line recap: the first lane this side broke and the damage it dealt.
  // Staged ?shot= scenes have no running totals, so fall back to the final clash.
  const clash = s.lastClash ?? results;
  const dmgOf = (r) => (side === 'p' ? r.pDmg : r.fDmg);
  let broke = s.broke?.[side];
  if (!broke && clash.length) {
    let best = 0;
    clash.forEach((r, i) => { if (dmgOf(r) > dmgOf(clash[best])) best = i; });
    broke = ROMAN[best];
  }
  const total = s.totalDmg?.[side] ?? clash.reduce((n, r) => n + dmgOf(r), 0);
  $('endLine').textContent = win
    ? `Lane ${broke ?? 'I'} broke first · ${total} damage dealt across ${Math.max(1, s.turn - 1)} turns.`
    : `The rival broke lane ${broke ?? 'I'} first · ${total} damage to your hearth.`;
  const order = results.map((r, i) => ({ i, r }));
  const decisive = order.filter(({ r }) => r.winner === side)
    .concat(order.filter(({ r, i }) => final[side][i].length && r.winner !== side))
    .slice(0, 3);
  const shown = decisive.flatMap(({ i }) => final[side][i]);
  $('endLanes').innerHTML = `<span class="end-lane-label">${win ? 'YOUR BREAKTHROUGH' : 'THE RIVAL’S EDGE'}</span>` +
    (shown.length
      ? shown.map((c, i) => cardHtml(c, {
        mini: true,
        cls: `${win ? 'winning-card' : 'rival-highlight'}${!win && i === 0 ? ' rival-spotlight' : ''}`,
      })).join('')
      : '<span class="no-combo">NO CARD STOOD</span>');
}

export function render(app) {
  const s = app.state;
  const title = s === null || s.phase === 'title';
  $('titleScreen').classList.toggle('hidden', !title);
  $('tableScreen').classList.toggle('hidden', title);
  $('endScreen').classList.toggle('hidden', title || (s.phase !== 'win' && s.phase !== 'loss'));
  if (title) return;
  renderTable(s);
  if (s.phase === 'win' || s.phase === 'loss') renderEnd(s);
  else $('endScreen').className = 'screen hidden';
}

// Convert a viewport rect to unscaled stage coordinates (the stage is CSS-transform scaled).
export function stagePoint(rect, app) {
  const origin = $('stage').getBoundingClientRect();
  return { x: (rect.left - origin.left) / app.scale, y: (rect.top - origin.top) / app.scale };
}

function floatText(host, text, cls = '', delay = 0) {
  const el = document.createElement('div');
  el.className = `float ${cls}`;
  el.textContent = text;
  el.style.animationDelay = `${delay}ms`;
  host.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

export function applyFx(app) {
  const fx = app.state?.fx;
  if (!fx || app.shot) { if (app.state) app.state.fx = null; return; }
  const table = $('tableScreen');
  if (fx.kind === 'deal') {
    document.querySelectorAll('#playerHand .card, #foeHand .card').forEach((el, i) => {
      el.style.animationDelay = `${i * 55}ms`;
      el.classList.add('dealt');
      setTimeout(() => el.classList.remove('dealt'), 700);
    });
  }
  if (fx.kind === 'deploy') {
    const el = document.querySelector(`.lane-you .card[data-uid="${fx.uid}"]`);
    if (el && fx.from) {
      const to = stagePoint(el.getBoundingClientRect(), app);
      el.style.setProperty('--fx', `${fx.from.x - to.x}px`);
      el.style.setProperty('--fy', `${fx.from.y - to.y}px`);
      el.classList.add('deploying');
      setTimeout(() => el.classList.remove('deploying'), 560);
    }
  }
  if (fx.kind === 'clash') {
    table.classList.add('shake');
    document.querySelectorAll('.lane').forEach((lane, i) => {
      const r = fx.results[i];
      if (!r) return;
      const mine = lane.querySelectorAll('.lane-you .card');
      const theirs = lane.querySelectorAll('.lane-foe .card');
      // Both sides lunge at the clash line; whoever took damage reels back.
      mine.forEach((el) => el.classList.add('lunge-you'));
      theirs.forEach((el) => el.classList.add('lunge-foe'));
      if (r.fDmg) mine.forEach((el) => el.classList.add('hit-shake'));
      if (r.pDmg) theirs.forEach((el) => el.classList.add('hit-shake'));
      if (r.pDmg || r.fDmg) lane.classList.add('clashing');
      if (r.pDmg) floatText(lane, `−${r.pDmg}`, 'damage to-foe');
      if (r.fDmg) floatText(lane, `−${r.fDmg}`, 'damage to-you', 90);
      if (r.pDmg && r.pierceP) floatText(lane, 'PIERCE', 'tag to-foe', 160);
      if (r.fDmg && r.pierceF) floatText(lane, 'PIERCE', 'tag to-you', 240);
    });
    if (fx.pHeal) floatText($('stage'), `+${fx.pHeal} HEAL`, 'heal heal-p', 260);
    if (fx.fHeal) floatText($('stage'), `+${fx.fHeal} HEAL`, 'heal heal-f', 320);
    setTimeout(() => {
      table.classList.remove('shake');
      document.querySelectorAll('.clashing, .lunge-you, .lunge-foe, .hit-shake')
        .forEach((n) => n.classList.remove('clashing', 'lunge-you', 'lunge-foe', 'hit-shake'));
    }, 850);
  }
  const end = $('endScreen');
  const flourish = fx.kind === 'win' || fx.kind === 'loss';
  end.classList.toggle('burst', flourish);
  const plaque = end.querySelector('.end-card');
  if (plaque) {
    // Restart the CSS animation even when two duels end back to back.
    plaque.classList.remove('burst');
    if (flourish) void plaque.offsetWidth;
    plaque.classList.toggle('burst', flourish);
  }
  app.state.fx = null;
}

export function paintEmbers() {
  const host = $('embers');
  let html = '';
  for (let i = 0; i < 26; i++) {
    html += `<i style="left:${(i * 137.5) % 100}%;top:${100 - (i * 47) % 100}%;--d:${(i % 9) * 0.7}s;--s:${2 + (i % 4)}px"></i>`;
  }
  host.innerHTML = html;
}
