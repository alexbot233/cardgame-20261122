// A working best-game-01 entry (Node 22, standard library only): the game is this directory's
// game/ folder, plain static files a desktop browser loads offline (game/index.html and its ES
// modules, no library and no network request), and the program hands it in. It copies game/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library. A starting point, not a winner: Block Dodger, a
// plain 2D canvas game where a paddle dodges falling blocks and catches coins, with a title screen,
// score, lives and levels, game over and restart, flat colours and no sound. Build your own game
// (any genre, any library you vendor under game/, or none), put your 3 or 4 PNG or JPEG screenshots
// in screenshots/ (the first by name is the cover) and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

/** Where this entry lives: game/ and screenshots/ sit beside this script. */
const entryDirectory = fileURLToPath(new URL('.', import.meta.url));
/** Where the finished entry is handed in. */
const outputDirectory = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDirectory = join(entryDirectory, 'game');
const screenshotsDirectory = join(entryDirectory, 'screenshots');
const entryPagePath = join(gameDirectory, 'index.html');

/** Counts the plain files under a directory, descending into its subdirectories. */
function countFilesRecursively(directoryPath: string): number {
  let fileCount = 0;
  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    if (entry.isDirectory()) fileCount += countFilesRecursively(join(directoryPath, entry.name));
    else if (entry.isFile()) fileCount++;
  }
  return fileCount;
}

// A game without its page cannot be played, so fail early with a useful message rather than deep in buildDossier.
if (!existsSync(entryPagePath)) {
  process.stderr.write(`main.ts: ${entryPagePath} does not exist. A game needs index.html at the root of game/.\n`);
  process.exit(1);
}

mkdirSync(outputDirectory, { recursive: true });
cpSync(gameDirectory, join(outputDirectory, 'game'), { recursive: true });
const gameFilesCopied = countFilesRecursively(gameDirectory);
mkdirSync(join(outputDirectory, 'screenshots'), { recursive: true });
const hasScreenshots = existsSync(screenshotsDirectory);
const screenshotsCopied = hasScreenshots ? countFilesRecursively(screenshotsDirectory) : 0;
if (hasScreenshots) cpSync(screenshotsDirectory, join(outputDirectory, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
const dossierPath = join(outputDirectory, 'dossier.json');
const dossierBytes = buildDossier(outputDirectory, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(dossierPath, dossierBytes);

process.stdout.write(
  `Dossier written: ${dossierPath} (${dossierBytes.byteLength} bytes)\n` +
    `Copied ${gameFilesCopied} game file(s) and ${screenshotsCopied} screenshot(s) into ${outputDirectory}.\n`,
);
