// Valeurs nutritionnelles de base (pour 100 g, cru / tel qu'acheté) et contrôle
// des recettes : les protéines et kcal annoncées doivent coller au calcul.
//   node test/nutrition.mjs           -> compare chaque recette au calcul
// Sources : tables suisses / étiquettes courantes (Migros, Coop). Arrondies.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const N = {
  poulet: [23, 110], hache: [21, 125], dinde: [20, 105], jambon: [20, 110], oeufs: [13, 145],
  sere: [12, 70], cottage: [12, 95], lait: [3.3, 47], parmesan: [33, 400], 'fromage-rape': [28, 380],
  'fromage-tranche': [30, 280], riz: [7, 355], pates: [12.5, 355], lentilles: [25, 350], 'lentilles-corail': [24, 340],
  'pois-chiches': [7, 130], flocons: [13, 370], 'tomates-concassees': [1.2, 25], 'sauce-tomate': [1.5, 35],
  huile: [0, 900], whey: [78, 390], 'pain-complet': [9, 240], tortillas: [8, 300], 'pain-burger': [9, 270],
  pdt: [2, 77], legumes: [2, 30], oignon: [1.1, 40], ail: [0, 0], poivron: [1, 30], tomate: [0.9, 18],
  salade: [0, 0], concombre: [0.7, 15], citron: [0, 0], champignons: [3, 22], epinards: [2.9, 23],
  brocoli: [2.8, 34], carottes: [0.9, 41], banane: [1.1, 89], 'petits-pois': [5, 80], 'fruits-rouges': [1, 45],
  epices: [0, 0], curry: [0, 0], cannelle: [0, 0], moutarde: [0, 0],
  // ajoutés avec les recettes faciles
  thon: [25, 110], crevettes: [20, 90], tofu: [13, 125], semoule: [12, 360], 'haricots-rouges': [8, 110],
  mais: [3, 80], 'sauce-soja': [8, 60],
};
// Poids d'une unité (mêmes valeurs que GR dans recettes.js, + cuillères).
const UNITE = { oeufs: 60, oignon: 100, poivron: 150, tomate: 120, concombre: 300, banane: 120, tortillas: 60,
  'pain-burger': 60, 'pain-complet': 40, 'fromage-tranche': 20, ail: 5, citron: 60, carottes: 80 };
const CUILLERE = { 'c. à c.': 5, 'c. à s.': 15 };

export function calcul(r) {
  let p = 0, k = 0;
  for (const [cle, q, u] of r.ing) {
    if (q == null) continue;
    const v = N[cle];
    if (!v) throw new Error('Pas de valeur pour « ' + cle + ' » (' + r.id + ')');
    const g = u === 'g' || u === 'ml' ? q : CUILLERE[u] ? q * CUILLERE[u] : q * (UNITE[cle] ?? 0);
    p += (v[0] * g) / 100;
    k += (v[1] * g) / 100;
  }
  return { p: Math.round(p), k: Math.round(k / 5) * 5 };
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const ctx = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(racine, 'src', 'recettes.js'), 'utf8') + '\n;globalThis.R=R;', ctx);
  let ecarts = 0;
  for (const r of ctx.R) {
    const c = calcul(r);
    const ok = Math.abs(c.p - r.p) <= 6 && Math.abs(c.k - r.k) / r.k <= 0.08;
    if (!ok) ecarts++;
    console.log((ok ? '  ' : '≠ ') + r.id.padEnd(16) + ' annoncé ' + String(r.p).padStart(3) + ' g ' + String(r.k).padStart(4) + ' kcal · calcul ' + String(c.p).padStart(3) + ' g ' + String(c.k).padStart(4) + ' kcal');
  }
  console.log(ecarts ? '\n' + ecarts + ' recette(s) à vérifier (écart > 6 g ou > 8 %).' : '\nToutes les recettes collent au calcul.');
}
