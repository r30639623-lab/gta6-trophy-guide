// Leonida Trophy Guide — hand-in program (Node 22, standard library only).
// The guide itself is plain static files in app/ (index.html, style.css, app.js
// and data/trophies.json); the screenshots of it live in screenshots/. This
// program copies both folders into the output directory and writes
// dossier.json there, using the vendored make.fun library to build it. The
// library file is the kit's own copy and is left untouched.
//
// Run it twice and the two outputs are byte for byte the same:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function countEntries(dir) {
  let n = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    n += 1;
    if (statSync(p).isDirectory()) n += countEntries(p);
  }
  return n;
}

function handIn() {
  mkdirSync(outDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
  const shots = join(repoRoot, 'screenshots');
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  if (existsSync(shots)) cpSync(shots, join(outDir, 'screenshots'), { recursive: true });
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  return {
    appEntries: countEntries(join(outDir, 'app')),
    shotFiles: readdirSync(join(outDir, 'screenshots')).length,
    dossierBytes: Buffer.byteLength(dossier, 'utf8'),
  };
}

const summary = handIn();
console.log(
  `trophy guide: handed in ${summary.appEntries} app entries, ${summary.shotFiles} screenshots, dossier ${summary.dossierBytes} bytes -> ${outDir}`,
);
