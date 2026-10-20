import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'dist');
fs.mkdirSync(outDir, { recursive: true });

const result = await build({
  entryPoints: [path.join(root, 'src/main.js')],
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  write: false,
  minify: true,
  legalComments: 'none',
  outfile: path.join(outDir, 'game.js'),
});

const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace('<link rel="stylesheet" href="./styles/main.css" />', `<style>\n${css}\n</style>`);
html = html.replace('<script type="module" src="./src/main.js"></script>', `<script>\n${js}\n</script>`);
html = html.replace('</head>', '  <meta name="game-version" content="1.0.0" />\n</head>');

fs.writeFileSync(path.join(outDir, 'index.html'), html);
fs.writeFileSync(path.join(root, '假装上班.html'), html);
const kb = Math.round(Buffer.byteLength(html) / 1024);
console.log(`built dist/index.html + 假装上班.html (${kb} KB)`);
