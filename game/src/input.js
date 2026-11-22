// Ember Duel — mouse, drag-and-drop and keyboard control of the same turn actions.
import { createGame, toggleSelect, placeCard, undoPlacement, endTurn } from './state.js';
import { stagePoint } from './render.js';
import { SFX } from './audio.js';
import { LANE_COUNT } from './rules.js';

export function bindInput(app, commit) {
  const start = () => {
    app.state = createGame(app.seed);
    SFX.play('deal');
    commit();
  };

  function place(index, lane) {
    const s = app.state;
    if (index === null || index === undefined || index < 0 || index >= s.p.hand.length) {
      s.message = 'SELECT A CARD FIRST · 1–5 OR CLICK';
      commit();
      return;
    }
    s.selected = index;
    const el = document.querySelector(`#playerHand .card[data-index="${index}"]`);
    const from = el ? stagePoint(el.getBoundingClientRect(), app) : null;
    if (placeCard(s, index, lane)) {
      if (s.fx) s.fx.from = from;
      SFX.play('place');
    } else {
      s.message = 'LANE FULL OR NOT ENOUGH ENERGY';
    }
    commit();
  }

  document.addEventListener('click', (event) => {
    const s = app.state;
    if (!s || s.phase === 'title') { start(); return; }
    if (s.phase === 'win' || s.phase === 'loss') {
      if (event.target.closest('#endScreen')) start();
      return;
    }
    const card = event.target.closest('#playerHand .card');
    if (card) {
      toggleSelect(s, Number(card.dataset.index));
      SFX.play('select');
      commit();
      return;
    }
    const lane = event.target.closest('.lane');
    if (lane) { place(s.selected, Number(lane.dataset.lane)); return; }
    if (event.target.closest('#undoBtn')) { if (undoPlacement(s)) { SFX.play('select'); commit(); } return; }
    if (event.target.closest('#endBtn')) {
      if (endTurn(s)) { SFX.play('clash'); commit(); }
    }
  });

  document.addEventListener('dragstart', (event) => {
    const card = event.target.closest('#playerHand .card');
    if (!card || app.state?.phase !== 'table') return;
    event.dataTransfer.setData('text/plain', card.dataset.index);
    event.dataTransfer.effectAllowed = 'move';
    card.classList.add('dragging');
  });
  document.addEventListener('dragend', () => {
    document.querySelectorAll('.dragging, .dragover').forEach((n) => n.classList.remove('dragging', 'dragover'));
  });
  document.addEventListener('dragover', (event) => {
    const lane = event.target.closest('.lane');
    if (!lane || app.state?.phase !== 'table') return;
    event.preventDefault();
    document.querySelectorAll('.dragover').forEach((n) => n.classList.remove('dragover'));
    lane.classList.add('dragover');
  });
  document.addEventListener('drop', (event) => {
    const lane = event.target.closest('.lane');
    if (!lane || app.state?.phase !== 'table') return;
    event.preventDefault();
    lane.classList.remove('dragover');
    place(Number(event.dataTransfer.getData('text/plain')), Number(lane.dataset.lane));
  });

  document.addEventListener('keydown', (event) => {
    if (app.shot) return;
    const s = app.state;
    const key = event.key;
    if (!s || s.phase === 'title') {
      if (key === 'Enter' || key === ' ') { event.preventDefault(); start(); }
      return;
    }
    if (s.phase === 'win' || s.phase === 'loss') {
      if (key === 'Enter' || key === ' ' || key.toLowerCase() === 'r') { event.preventDefault(); start(); }
      return;
    }
    if (/^[1-9]$/.test(key)) {
      toggleSelect(s, Number(key) - 1);
      SFX.play('select');
      commit();
    } else if (key === 'ArrowLeft') {
      s.cursor = (s.cursor + LANE_COUNT - 1) % LANE_COUNT; commit();
    } else if (key === 'ArrowRight') {
      s.cursor = (s.cursor + 1) % LANE_COUNT; commit();
    } else if (key === 'ArrowUp' || key === 'ArrowDown') {
      const delta = key === 'ArrowDown' ? 1 : -1;
      for (let step = 1; step <= s.p.hand.length; step++) {
        const i = (s.selected === null ? 0 : s.selected + delta * step + s.p.hand.length * 2) % s.p.hand.length;
        if (s.p.hand[i].cost <= s.energy) { toggleSelect(s, i); break; }
      }
      commit();
    } else if (key === 'Enter') {
      event.preventDefault();
      place(s.selected, s.cursor);
    } else if (key === ' ' || key === 'Spacebar') {
      event.preventDefault();
      if (endTurn(s)) { SFX.play('clash'); commit(); }
    } else if (key === 'Backspace' || key.toLowerCase() === 'u') {
      event.preventDefault();
      if (undoPlacement(s)) { SFX.play('select'); commit(); }
    } else if (key === 'Escape') {
      s.selected = null; commit();
    } else if (key.toLowerCase() === 'r') {
      start();
    }
  });
}
