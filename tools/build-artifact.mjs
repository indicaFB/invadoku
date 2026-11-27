// Assemble le jeu en une seule page HTML autonome (aperçu claude.ai, partage en un fichier).
//   node tools/build-artifact.mjs  →  dist/invadoku.html
// Les modules sont mis bout à bout dans l'ordre des dépendances, sans import/export ;
// les polices sont intégrées en data: URI. Pas de service worker dans cette version.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = p => readFileSync(new URL(p, root), "utf8");
const MODULES = ["generator", "rater", "levels", "rules", "hints", "i18n", "sprites", "storage", "fx", "app"];

const js = MODULES.map(m => {
  const src = read(`js/${m}.js`)
    .replace(/^import [\s\S]*?from ".*?";\n/gm, "")
    .replace(/^export (?=(const|function|let|class) )/gm, "");
  if (/^\s*(import|export)\b/m.test(src)) throw new Error(`import/export non géré dans ${m}.js`);
  return `// ---- ${m}.js\n${src}`;
}).join("\n");

const css = read("css/style.css").replace(/url\("\.\.\/fonts\/([^"]+)"\)/g, (_, f) =>
  `url("data:font/woff2;base64,${readFileSync(new URL(`fonts/${f}`, root)).toString("base64")}")`);

const index = read("index.html");
const body = index.slice(index.indexOf("<body>") + 6, index.indexOf('<script type="module"'));
const version = index.match(/data-version="([^"]+)"/)[1];

const html = `<title>Invadoku</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}
</style>
${body.trim()}
<script>
document.documentElement.dataset.build = "artifact";
document.documentElement.dataset.version = ${JSON.stringify(version)};
${js}
</script>
`;

mkdirSync(new URL("dist/", root), { recursive: true });
writeFileSync(new URL("dist/invadoku.html", root), html);
new Function(js); // analyse seulement (doublons de noms, syntaxe) : rien n'est exécuté
console.log(`dist/invadoku.html (${(html.length / 1024).toFixed(0)} Ko, version ${version})`);
