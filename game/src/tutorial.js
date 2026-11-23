// Ember Duel — skippable first-run field guide: three short steps, remembered locally.
const SEEN_KEY = 'ember-duel:tutorial-seen';

const STEPS = [
  {
    glyph: 'I  ·  II  ·  III',
    title: 'THREE LANES',
    body: 'Commit up to 3 cards face-up into lanes I–III. Each lane clashes on its own; out-score the rival there to break it.',
  },
  {
    glyph: '●  ●  ●',
    title: 'THREE ENERGY',
    body: 'Cards cost 1–3 energy. Spend it all on one heavy hitter or spread it wide. UNDO takes your last card back.',
  },
  {
    glyph: '↯  ◇  ✦',
    title: 'CLASH & COMBOS',
    body: 'SPACE resolves the clash. Two or more of one suit fire its combo (attack, heal, guard, draw); three suits are TRINITY.',
  },
];

let open = false;
let index = 0;

function seen() {
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
}

function remember() {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* storage blocked */ }
}

export function tutorialNeeded() { return !seen(); }
export function tutorialOpen() { return open; }

function paint() {
  const step = STEPS[index];
  const total = String(STEPS.length).padStart(2, '0');
  document.getElementById('tutorialNum').textContent = `${String(index + 1).padStart(2, '0')} / ${total}`;
  document.getElementById('tutorialGlyph').textContent = step.glyph;
  document.getElementById('tutorialTitle').textContent = step.title;
  document.getElementById('tutorialBody').textContent = step.body;
  document.getElementById('tutorialDots').innerHTML = STEPS.map((_, i) =>
    `<i class="${i === index ? 'on' : ''}"></i>`).join('');
  document.getElementById('tutorialNext').innerHTML = index === STEPS.length - 1
    ? 'PLAY <kbd>ENTER</kbd>' : 'NEXT <kbd>ENTER</kbd>';
}

export function showTutorial() {
  if (open || !tutorialNeeded()) return false;
  open = true;
  index = 0;
  paint();
  document.getElementById('tutorialRoot').classList.remove('hidden');
  return true;
}

export function advanceTutorial(skip = false) {
  if (!open) return;
  if (skip || index >= STEPS.length - 1) {
    open = false;
    document.getElementById('tutorialRoot').classList.add('hidden');
    remember();
    return;
  }
  index += 1;
  paint();
}
