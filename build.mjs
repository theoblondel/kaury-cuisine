// Assemble src/ en un seul fichier « Cuisine 180.js » à coller dans Scriptable.
// Usage : node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ici = dirname(fileURLToPath(import.meta.url));
const lire = (f) => readFileSync(join(ici, 'src', f), 'utf8').replace(/\r\n/g, '\n');
const remplacer = (s, cle, val) => {
  if (!s.includes(cle)) throw new Error('Marqueur introuvable : ' + cle);
  return s.replace(cle, () => val);
};

export function construirePage() {
  const js = [lire('calculs.js'), lire('recettes.js'), lire('page.js')].join('\n');
  if (/<\/script/i.test(js)) throw new Error('« </script » dans le JS de la page : il couperait la balise.');
  let page = lire('page.html');
  page = remplacer(page, '<!--@guide-->', lire('guide.html'));
  page = remplacer(page, '/*@js*/', js);
  return page;
}

export function construireScript() {
  let s = lire('script.js');
  s = remplacer(s, '/*@calculs*/', lire('calculs.js'));
  s = remplacer(s, "/*@page*/''", JSON.stringify(construirePage()));
  return s;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const sortie = join(ici, 'Cuisine 180.js');
  const s = construireScript();
  writeFileSync(sortie, s);
  console.log('Écrit : ' + sortie + ' (' + Math.round(s.length / 1024) + ' Ko)');
}
