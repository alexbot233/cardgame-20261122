# CONTEXT.md — brief for the building agent

You are building an entry for the make.fun competition `best-card-game-20261122-1826` ("Make the best card game"). Deliverable: an original, complete card game that runs offline in a desktop browser from static files under `game/`, plus a Node 22 entrypoint `main.ts` (already present) that copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.

## What the judge rewards (most important first)
1. **Complete card game shown in screenshots**: a title screen; a table with the player's hand AND the opponent's hand; cards with readable values and suits or costs; a visible score or life total; a win screen AND a loss screen. An entry that is not a playable game loses.
2. **Fun and depth**: rules that make each hand a real decision, cards that combine in more than one way, an opponent whose choices you can read and counter.
3. **Feel and polish**: cards that slide, flip and snap into place; a dealt hand with weight; a win that lands with a flourish.
4. **Look and originality**: cards legible at thumbnail size; a table that sets the mood; suits or costs told apart by colour and shape, never text alone. Never copy a commercial game's names, characters, art or music.
5. **Structure**: source split into files with one clear job each, named for what they do (the judge sees file paths and first declarations).

The judge mostly sees the 3–4 screenshots, so every screenshot must be readable at thumbnail size and show the game at its best.

## Hard technical constraints (violating any fails the entry)
- Static files only under `game/`. No build step. No network request. Every script, module, image, sound, font must be a file under `game/` or a `data:` URI. No CDN, no http/https URLs anywhere in reachable code.
- Do NOT use any external library (keep it dependency-free vanilla JS modules) — vendored libraries are counted against authorship checks.
- Keep total game source small enough that everything fits the dossier text cap (~160 KiB) — aim for a compact, well-organised game of roughly 8–15 source files.
- Every `.js` file must parse as an ES module (use `type="module"` scripts).
- Game must be playable with keyboard AND mouse.
- Support a screenshot hook: `game/index.html?shot=<name>` renders a deterministic staged scene (title, midgame table with full hands visible, win screen, loss screen) with no animation delay, so real screenshots can be captured headlessly. Keep the normal play flow intact when the param is absent.
- Current `game/src/*` is a leftover starter game ("Block Dodger"). Delete those files and write the card game fresh; do not read or reuse their code.
- `main.ts`, `vendor/makefun-game.ts`, `LICENSE`, `serve.ts`, `shots.json` must be left as-is (do not modify them).

## The game to build (original)
"Ember Duel" — a two-duel lane card battler:
- Player vs a scripted-but-readable AI opponent. Each has 20 life.
- 3 lanes; each turn a player may play up to 3 cards from a hand of 5, then the lanes clash.
- Card deck of ~24 distinct designs across 4 suits/elements (Ember, Tide, Stone, Gale) with colour+shape-coded suit icons, attack/defense values and an energy cost (player has 3 energy/turn, so every turn is a real decision).
- Combo rule: playing 2+ cards of the same suit in one turn grants that suit's bonus (e.g. Ember +1 attack, Tide heals 1, Stone +1 defense, Gale draws a card) — cards combine in more than one way.
- Cards show a small hint of the opponent's likely play (opponent telegraphs its intent icon), so you can read and counter it.
- Visual polish: cards slide from hand to lane with CSS transitions, flip to reveal, clash animations, glowing win flourish.
- Screens: title (game name, "Press Start"), table (both hands, lanes, life totals, energy), win screen, loss screen, plus restart.

## Deliverables in this repo
- `game/index.html` + ES modules under `game/` (vanilla, no external deps).
- `screenshots/` will be captured separately by the orchestrator — you do NOT create screenshots.
- Work only inside this directory. Use your file write/edit tools for every file (no shell heredocs/cat redirection).
