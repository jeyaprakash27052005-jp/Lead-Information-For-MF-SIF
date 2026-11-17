// Makes a stand-alone Android app project for ONE game, ready for Capacitor and Google Play.
//   node android-games/build.mjs <game-id>        (run inside apps/game)
// Output: android-games/out/<game-id>/  with www/ (just that game), capacitor.config.json, package.json and assets/ (icons, splash).
// Then, in that folder: cap add android, capacitor-assets generate --android, cap sync android (see .github/workflows/game-apps.yml).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const gameRoot = path.resolve(here, '..');
const id = process.argv[2];
const games = JSON.parse(fs.readFileSync(path.join(here, 'games.json'), 'utf8'));
const g = games.find((x) => x.id === id);
if (!g) {
  console.error(`Unknown game "${id}". Choose one of: ${games.map((x) => x.id).join(', ')}`);
  process.exit(1);
}

const out = path.join(here, 'out', id);
fs.rmSync(out, { recursive: true, force: true });
const www = path.join(out, 'www');
const src = path.join(gameRoot, 'www');
fs.mkdirSync(path.join(www, 'games'), { recursive: true });

// Only what this game needs
fs.cpSync(path.join(src, 'shared'), path.join(www, 'shared'), { recursive: true });
fs.cpSync(path.join(src, 'icons'), path.join(www, 'icons'), { recursive: true });
fs.copyFileSync(path.join(src, 'privacy.html'), path.join(www, 'privacy.html'));
fs.copyFileSync(path.join(src, 'games', `${id}.html`), path.join(www, 'games', `${id}.html`));
// extra files of the game (for example games/finance-data.js)
for (const f of fs.readdirSync(path.join(src, 'games'))) if (f.startsWith(`${id}-`)) fs.copyFileSync(path.join(src, 'games', f), path.join(www, 'games', f));

// Single-game mode: no "All games" link, paused screen when the Head hides this game in Game Admin
const lib = path.join(www, 'shared', 'mcube.js');
fs.writeFileSync(lib, `window.MG_SINGLE = ${JSON.stringify(id)};\n` + fs.readFileSync(lib, 'utf8'));

// The app opens straight into the game
fs.writeFileSync(
  path.join(www, 'index.html'),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${g.label}</title>` +
    `<meta http-equiv="refresh" content="0;url=games/${id}.html"></head><body style="background:#fff"><script>location.replace("games/${id}.html")</script></body></html>\n`,
);

const pkg = JSON.parse(fs.readFileSync(path.join(gameRoot, 'package.json'), 'utf8'));
const dep = (n) => pkg.devDependencies[n];
fs.writeFileSync(
  path.join(out, 'package.json'),
  JSON.stringify(
    {
      name: `mcube-${id}`,
      version: pkg.version,
      private: true,
      dependencies: {
        '@capacitor/android': dep('@capacitor/android'),
        '@capacitor/core': dep('@capacitor/core'),
        '@capacitor/filesystem': dep('@capacitor/filesystem'),
        '@capacitor/share': dep('@capacitor/share'),
      },
    },
    null,
    2,
  ) + '\n',
);
fs.writeFileSync(
  path.join(out, 'capacitor.config.json'),
  JSON.stringify({ appId: g.appId, appName: g.label, webDir: 'www', backgroundColor: '#ffffff', android: { allowMixedContent: false }, server: { allowNavigation: ['investment-business-game.vercel.app'] } }, null, 2) + '\n',
);

// Icons and splash made for this game (apps/game/play-store/<id>/app-assets)
fs.cpSync(path.join(gameRoot, 'play-store', id, 'app-assets'), path.join(out, 'assets'), { recursive: true });

console.log(`Ready: ${path.relative(gameRoot, out)}  (${g.appId}, "${g.label}")`);
