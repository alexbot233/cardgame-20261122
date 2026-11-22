// Ember Duel — bootstrap: choose the live game or a deterministic staged scene,
// keep the fixed stage fitted to the window, and wire one render pass to every action.
import { SUITS, SUIT_KEYS, suitIcon } from './cards.js';
import { sceneFor } from './shots.js';
import { render, applyFx, paintEmbers } from './render.js';
import { bindInput } from './input.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Math.max(1, Number(params.get('seed')) || 1);
const scene = shot ? sceneFor(shot, seed) : { screen: 'title', state: null };

if (shot) document.documentElement.classList.add('no-anim');

const app = {
  state: scene.state,
  seed,
  shot: Boolean(shot),
  scale: 1,
  commit() {
    render(app);
    applyFx(app);
  },
};

function paintTitle() {
  document.getElementById('titleSuits').innerHTML = SUIT_KEYS.map((key) =>
    `<div class="title-suit suit-${key}">
      ${suitIcon(key, 38)}
      <b>${SUITS[key].label.toUpperCase()}</b>
      <small>${SUITS[key].bonus}</small>
    </div>`).join('');
}

function fitStage() {
  app.scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  document.getElementById('stage').style.transform =
    `translate(-50%, -50%) scale(${app.scale})`;
}

paintEmbers();
paintTitle();
fitStage();
window.addEventListener('resize', fitStage);
if (!app.shot) bindInput(app, app.commit);
app.commit();

// Small, harmless hook for local debugging and headless smoke tests.
window.__EMBER__ = app;
