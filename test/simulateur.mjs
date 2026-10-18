// Fait tourner Cuisine 180 hors de l'iPhone, avec de faux objets Scriptable.
//   node test/simulateur.mjs           -> tous les tests (calculs, Raccourci, widgets, page)
//   node test/simulateur.mjs apercu    -> écrit test/apercu.html (la page avec 6 semaines d'exemple)
//   node test/simulateur.mjs widget-large -> imprime le contenu du widget (exemple)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { construireScript, construirePage } from '../build.mjs';
import { calcul } from './nutrition.mjs';

const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const calculsSrc = fs.readFileSync(path.join(racine, 'src', 'calculs.js'), 'utf8');

// --- Les calculs, chargés seuls dans un bac à sable
const K = vm.createContext({});
vm.runInContext(calculsSrc + '\n;Object.assign(globalThis,{cleJour,decaler,ecart,metabolisme,depense,objectifs,infoJour,serie,meilleureSerie,poidsPrevu,tendance,dateCible,etalonnage,moyenne7,kcalJour,kcalPrevu,alerteSoir,courbeLissee,lisse,statutJour,bilanSemaine,causes,projection,composition,tourTaille,recomposition,mesPlats,texteBilan,lundiDe,jourSemaine});', K);

// --- Données d'exemple : 6 semaines inventées, jamais de vraies données.
function exemple(auj, jours = 42) {
  const d = {
    version: 1,
    profil: { pret: true, taille: 180, age: 30, sexe: 'h', depart: 94, dateDepart: K.decaler(auj, -jours), cible: 85,
      rythme: 0.5, pas: 8000, kcal: null, prot: null, allergenes: [], facteur: 1 },
    jours: {}, placard: ['riz', 'poulet'], comp: { pro: 'poulet', fec: 'riz', leg: 'surg', sau: 'curry' }, col: 'quotidien',
  };
  let graine = 7;
  const alea = () => ((graine = (graine * 16807) % 2147483647) / 2147483647);
  for (let i = jours; i >= 0; i--) {
    const c = K.decaler(auj, -i);
    const j = {};
    if (i % 3 !== 1) j.poids = Math.round((94 - (jours - i) * 0.085 + (alea() - 0.5) * 1.2) * 10) / 10;
    if (i % 7 === 0) j.tour = Math.round((104 - (jours - i) * 0.12) * 2) / 2;  // une mesure par semaine
    if (i % 4 === 0) j.gras = Math.round((28 - (jours - i) * 0.06 + (alea() - 0.5) * 2) * 10) / 10;
    if ([1, 3, 5].includes(K.jourSemaine(c))) j.muscu = true;
    if (i > 0) {
      j.pas = Math.round(5000 + alea() * 6500);
      j.repas = [
        { id: 'shaker', nom: 'Shaker au lait', k: 240, p: 30, x: 1, n: 's' + i },
        { id: 'q-poulet-riz-surg-curry', nom: 'Poulet au curry, riz et légumes', k: 735, p: 76, x: 1, n: 'a' + i },
        { id: 'bolo', nom: 'Bolognaise maigre', k: 790, p: 82, x: alea() > 0.8 ? 1.5 : 1, n: 'b' + i },
      ];
    } else {
      j.pas = 4210; j.pasMaj = new Date().toISOString();
      j.repas = [{ id: 'shaker', nom: 'Shaker au lait', k: 240, p: 30, x: 1, n: 'auj' }];
    }
    d.jours[c] = j;
  }
  return d;
}

// --- Faux Scriptable
function scriptable({ donnees, widget, param, journal, query, dansApp, heure, jour }) {
  const store = {};
  if (donnees) store['/docs/cuisine-180.json'] = JSON.stringify(donnees);
  const sortie = { widget: null, raccourci: null, page: null, copie: null, notifs: [], urls: [] };
  // Horloge du script figée à l'heure voulue (le reste du test garde la vraie).
  const Vrai = Date;
  const FausseDate = class extends Vrai {
    constructor(...a) {
      if (a.length) { super(...a); return; }
      super();
      if (jour) { const [y, m, dd] = jour.split('-').map(Number); this.setFullYear(y, m - 1, dd); }
      if (heure != null) this.setHours(heure, 5, 0, 0);
    }
    static now() { return new FausseDate().getTime(); }
  };
  // Un objet qui accepte tout : chaque méthode renvoie un nouvel objet du même genre.
  const libre = (prof) => new Proxy(function () {}, {
    get(_, k) {
      if (k === 'addText') return (t) => { journal && journal.push('  '.repeat(prof) + 'T ' + t); return libre(prof); };
      if (k === 'addStack') return () => libre(prof + 1);
      if (k === 'url') return undefined;
      if (k === 'addImage') return () => { journal && journal.push('  '.repeat(prof) + '[image]'); return libre(prof); };
      if (k === 'getImage') return () => ({ image: true });
      if (k === Symbol.toPrimitive) return () => '';
      return () => libre(prof);
    },
    set(_, k, v) { if (k === 'url') sortie.urls.push(v); return true; },
    apply() { return libre(prof); },
    construct() { return libre(prof); },
  });
  const g = {
    FileManager: { iCloud: () => { throw new Error('pas d’iCloud'); }, local: () => ({
      documentsDirectory: () => '/docs', joinPath: (a, b) => a + '/' + b,
      fileExists: (p) => p in store, writeString: (p, s) => { store[p] = s; }, readString: (p) => store[p], move() {},
    }) },
    Color: Object.assign(class { constructor(h) { this.h = h; } }, { dynamic: (a) => a }),
    Font: new Proxy({}, { get: () => () => ({}) }),
    Size: class { constructor(w, h) { this.w = w; this.h = h; } },
    Point: class { constructor(x, y) { this.x = x; this.y = y; } },
    Rect: class { constructor(...a) { this.a = a; } },
    Path: class { move() {} addLine() {} },
    DrawContext: class { constructor() { return libre(0); } },
    ListWidget: class { constructor() { return libre(0); } },
    Pasteboard: { copy: (t) => { sortie.copie = t; } },
    Safari: { open: (u) => sortie.urls.push(u) },
    Request: class { async loadString() { throw new Error('pas de réseau dans les tests'); } },
    URLScheme: { forRunningScript: () => 'scriptable:///run/Cuisine%20180' },
    Notification: class { async schedule() { sortie.notifs.push({ titre: this.title, corps: this.body }); } },
    Date: FausseDate,
    Script: { setWidget: (w) => { sortie.widget = w; }, setShortcutOutput: (t) => { sortie.raccourci = t; }, complete() {} },
    config: { runsInWidget: !!widget, widgetFamily: widget, runsInApp: dansApp ?? !widget },
    args: { shortcutParameter: param ?? null, queryParameters: query || {} },
    WebView: class { async loadHTML(h) { sortie.page = h; } async present() {} async evaluateJavaScript() { return null; } },
  };
  return { g, store, sortie };
}
async function lancer(opts) {
  const s = scriptable(opts);
  const src = construireScript();
  const fn = new Function(...Object.keys(s.g), `return (async () => {${src}\n})()`);
  await fn(...Object.values(s.g));
  const brut = s.store['/docs/cuisine-180.json'];
  return { ...s.sortie, donnees: brut ? JSON.parse(brut) : null };
}

const mode = process.argv[2];
const auj = K.cleJour(new Date());

if (mode === 'apercu') {
  const ex = exemple(auj);
  // Un plat prévu pour ce soir et un menu prévu demain, pour voir les deux états.
  ex.jours[auj].repas.push({ id: 'q-hache-pates-surg-tomate', nom: 'Haché de bœuf à la tomate, pâtes et légumes', k: 755, p: 76, x: 1, n: 'pr', prevu: true });
  ex.jours[K.decaler(auj, 1)] = { repas: [{ id: 'bolo', nom: 'Bolognaise maigre', k: 790, p: 82, x: 1, n: 'd1', prevu: true }] };
  const page = construirePage().replace('__OUVRIR__', 'null').replace('__ETAT__', () => JSON.stringify(ex));
  fs.writeFileSync(path.join(racine, 'test', 'apercu.html'), page);
  const vide = construirePage().replace('__OUVRIR__', 'null').replace('__ETAT__', () => JSON.stringify({ version: 1, profil: { pret: false, sexe: 'h', rythme: 0.5, pas: 8000, allergenes: [] }, jours: {} }));
  fs.writeFileSync(path.join(racine, 'test', 'apercu-accueil.html'), vide);
  console.log('Écrit : test/apercu.html et test/apercu-accueil.html');
} else if (mode && mode.startsWith('widget-')) {
  const journal = [];
  await lancer({ donnees: exemple(auj), widget: mode.slice(7), journal });
  console.log(journal.join('\n'));
} else {
  let n = 0;
  const test = async (nom, f) => { await f(); n++; console.log('✓ ' + nom); };

  // ---------- Calculs
  await test('objectifs : jamais sous le métabolisme de base', () => {
    const p = { taille: 180, age: 30, sexe: 'h', depart: 94, rythme: 1, pas: 3000 };
    const o = K.objectifs(p, 94), b = K.metabolisme(p, 94);
    assert.ok(o.kcal >= b, o.kcal + ' < ' + b);
  });
  await test('objectifs : chiffres attendus', () => {
    const p = { taille: 180, age: 30, sexe: 'h', depart: 94, rythme: 0.5, pas: 8000 };
    const o = K.objectifs(p, 94);
    // Métabolisme 1920 ; dépense 1920 × 1,2 + 6000 × 0,0005 × 94 = 2586 ; − 550 = 2036 → 2050.
    assert.equal(Math.round(K.metabolisme(p, 94)), 1920);
    assert.equal(o.kcal, 2050);
    assert.equal(o.prot, 160); // IMC 25 à 180 cm = 81 kg → 2 × 81 = 162 → 160
    assert.equal(K.objectifs({ ...p, cible: 85 }, 94).prot, 170);
    assert.equal(K.objectifs({ ...p, kcal: 1900, prot: 180 }, 94).kcal, 1900);
    assert.ok(K.objectifs({ ...p, sexe: 'f', taille: 150, age: 60, rythme: 1, pas: 2000 }, 50).kcal >= 1200);
  });
  await test('série : hier et avant comptent, aujourd’hui ne casse rien', () => {
    const d = { profil: { taille: 180, age: 30, sexe: 'h', depart: 90, pas: 8000, kcal: 2000 }, jours: {} };
    const bon = { pas: 9000, kcal: 1800 }, mauvais = { pas: 9000, kcal: 2400 };
    d.jours[K.decaler(auj, -4)] = mauvais;
    d.jours[K.decaler(auj, -3)] = bon;
    d.jours[K.decaler(auj, -2)] = bon;
    d.jours[K.decaler(auj, -1)] = bon;
    d.jours[auj] = { pas: 1000, kcal: 300 };
    assert.equal(K.serie(d, auj), 3);
    d.jours[auj] = { pas: 8000, kcal: 2000 };
    assert.equal(K.serie(d, auj), 4);
    d.jours[K.decaler(auj, -1)] = { kcal: 1800 }; // pas manquants : jour non actif
    assert.equal(K.serie(d, auj), 1);
    assert.equal(K.meilleureSerie(d, auj), 2);
  });
  await test('poids prévu : départ − Σ déficits / 7700', () => {
    const d = { profil: { taille: 180, age: 30, sexe: 'h', depart: 100, dateDepart: K.decaler(auj, -10), pas: 8000 }, jours: {} };
    for (let i = 10; i >= 1; i--) d.jours[K.decaler(auj, -i)] = { pas: 2000, kcal: 1000 };
    const dep = K.depense(d.profil, 100, 2000);
    const pr = K.poidsPrevu(d, auj);
    assert.equal(pr.jours, 10);
    assert.ok(Math.abs(pr.poids - (100 - (10 * (dep - 1000)) / 7700)) < 1e-9);
  });
  await test('tendance et étalonnage sur 6 semaines d’exemple', () => {
    const d = exemple(auj);
    const tr = K.tendance(d, auj);
    assert.ok(tr < -0.3 && tr > -0.9, 'tendance ' + tr);
    const et = K.etalonnage(d, auj);
    assert.ok(et, 'étalonnage disponible');
    assert.ok(et.facteur >= 0.75 && et.facteur <= 1.25);
    assert.ok(K.dateCible(d, auj) > auj);
  });

  // ---------- Raccourci
  await test('Raccourci : nombre, texte suisse, dictionnaire', async () => {
    let r = await lancer({ donnees: exemple(auj), param: 6240 });
    assert.equal(r.donnees.jours[auj].pas, 6240);
    assert.match(r.raccourci, /6240 pas/);
    assert.equal(r.page, null, 'aucune page ouverte');
    r = await lancer({ donnees: exemple(auj), param: '7’815 pas' });
    assert.equal(r.donnees.jours[auj].pas, 7815);
    r = await lancer({ donnees: exemple(auj), param: { pas: '9 120', poids: '94,6' } });
    assert.equal(r.donnees.jours[auj].pas, 9120);
    assert.equal(r.donnees.jours[auj].poids, 94.6);
  });
  await test('Raccourci : une pesée faite à la main n’est pas écrasée', async () => {
    const d = exemple(auj);
    d.jours[auj].poids = 93.1; d.jours[auj].poidsMain = true;
    const r = await lancer({ donnees: d, param: { pas: 5000, poids: 95 } });
    assert.equal(r.donnees.jours[auj].poids, 93.1);
    assert.equal(r.donnees.jours[auj].pas, 5000);
  });
  await test('Raccourci : un texte sans chiffre ne touche à rien', async () => {
    const r = await lancer({ donnees: exemple(auj), param: 'bonjour' });
    assert.match(r.raccourci, /rien compris/);
    assert.equal(r.donnees.jours[auj].pas, 4210);
  });

  // ---------- Widgets
  for (const f of ['small', 'medium', 'large', 'accessoryRectangular', 'accessoryInline', 'accessoryCircular']) {
    await test('widget ' + f + ' (profil rempli)', async () => {
      const journal = [];
      const r = await lancer({ donnees: exemple(auj), widget: f, journal });
      assert.ok(r.widget, 'widget posé');
      assert.ok(journal.some((l) => /kcal/.test(l)), journal.join('\n'));
      if (f === 'large') assert.ok(journal.some((l) => l.includes('[image]')), 'courbe présente');
    });
  }
  await test('widget au tout premier lancement (fichier créé, invite)', async () => {
    const journal = [];
    const r = await lancer({ widget: 'medium', journal });
    assert.equal(r.donnees.profil.pret, false);
    assert.ok(journal.some((l) => /régler ton profil/.test(l)));
  });

  // ---------- Repas prévus, alerte du soir
  await test('un repas prévu ne compte pas tant qu\u2019il n\u2019est pas coché', () => {
    const j = { repas: [{ k: 500, p: 40, x: 1 }, { k: 700, p: 60, x: 1, prevu: true }] };
    assert.equal(K.kcalJour(j), 500);
    assert.equal(K.kcalPrevu(j), 700);
    assert.equal(K.kcalJour({ repas: [{ k: 700, p: 60, x: 1, prevu: true }], kcal: 1800 }), 1800);
  });
  await test('alerte du soir : ce qui manque, et rien si la journée est gagnée', () => {
    const d = { profil: { taille: 180, age: 30, sexe: 'h', depart: 90, pas: 8000, kcal: 2000 }, jours: {} };
    d.jours[K.decaler(auj, -1)] = { pas: 9000, kcal: 1800 };
    d.jours[auj] = { pas: 5000, repas: [{ k: 1500, p: 150, x: 1 }] };
    const a = K.alerteSoir(d, auj);
    assert.match(a.titre, /série de 1 jour est en jeu/);
    assert.match(a.corps, /^Il te manque 3\u202F000 pas\.$/);
    d.jours[auj].pas = 8500;
    assert.equal(K.alerteSoir(d, auj), null);
  });
  await test('Raccourci du soir : notification envoyée, une seule fois en 3 h', async () => {
    const d = exemple(auj);
    d.jours[auj].pas = 1000;
    let r = await lancer({ donnees: d, param: 2000, heure: 19 });
    assert.equal(r.notifs.length, 1, 'une alerte');
    assert.match(r.notifs[0].corps, /pas/);
    assert.match(r.raccourci, /alerte envoyée/);
    r = await lancer({ donnees: r.donnees, param: 2500, heure: 19 });
    assert.equal(r.notifs.length, 0, 'pas deux de suite');
    r = await lancer({ donnees: exemple(auj), param: 2000, heure: 12 });
    assert.equal(r.notifs.length, 0, 'rien à midi');
    const off = exemple(auj); off.profil.notifs = false;
    r = await lancer({ donnees: off, param: 2000, heure: 20 });
    assert.equal(r.notifs.length, 0, 'alerte désactivée');
  });

  // ---------- Analyses du suivi
  await test('poids lissé : une pesée isolée ne compte que pour 20 %', () => {
    const d = { profil: {}, jours: {} };
    d.jours[K.decaler(auj, -2)] = { poids: 90 };
    d.jours[K.decaler(auj, -1)] = { poids: 95 };
    const c = K.courbeLissee(d, auj);
    assert.equal(c[K.decaler(auj, -2)], 90);
    assert.equal(c[K.decaler(auj, -1)], 91);
    assert.equal(c[auj], 91, 'un jour sans pesée garde la veille');
  });
  await test('calendrier : gagné, pas, calories, les deux, pas noté, en cours', () => {
    const d = { profil: { taille: 180, age: 30, sexe: 'h', depart: 90, pas: 8000, kcal: 2000 }, jours: {} };
    const j = (n, v) => (d.jours[K.decaler(auj, -n)] = v);
    j(5, { pas: 9000, kcal: 1800 }); j(4, { pas: 5000, kcal: 1800 }); j(3, { pas: 9000, kcal: 2300 });
    j(2, { pas: 5000, kcal: 2300 }); j(1, { pas: 9000 });
    const st = (n) => K.statutJour(d, K.decaler(auj, -n), auj);
    assert.deepEqual([5, 4, 3, 2, 1].map(st), ['gagne', 'pas', 'kcal', 'les2', 'vide']);
    assert.equal(K.statutJour(d, auj, auj), 'encours');
    assert.equal(K.statutJour(d, K.decaler(auj, 1), auj), 'futur');
  });
  await test('causes : la cause principale et le jour le plus dur', () => {
    const d = { profil: { taille: 180, age: 30, sexe: 'h', depart: 90, pas: 8000, kcal: 2000 }, jours: {} };
    for (let n = 1; n <= 42; n++) {
      const c = K.decaler(auj, -n), samedi = K.jourSemaine(c) === 6;
      d.jours[c] = samedi ? { pas: 4000, kcal: 1800, repas: [{ k: 1800, p: 170, x: 1 }] } : { pas: 9000, repas: [{ k: 1800, p: 170, x: 1 }] };
    }
    const r = K.causes(d, auj);
    assert.equal(r.pire.jour, 'samedi');
    assert.equal(r.pas, r.juges - r.gagnes, 'tous les ratés viennent des pas');
    assert.equal(r.manquePas, 4000);
  });
  await test('bilan de la semaine et texte du dimanche', () => {
    const d = exemple(auj);
    const b = K.bilanSemaine(d, K.lundiDe(K.decaler(auj, -7)), auj);
    assert.equal(b.jours, 7);
    assert.ok(b.poids < 0, 'le poids lissé baisse : ' + b.poids);
    assert.ok(b.seances >= 2);
    const t = K.texteBilan(d, auj);
    assert.match(t.corps, /jours gagnés/);
    assert.match(t.corps, /séances/);
  });
  await test('projection : des pas en plus avancent la date', () => {
    const d = exemple(auj);
    const p0 = K.projection(d, auj, 0), p2 = K.projection(d, auj, 2000);
    assert.equal(p0.base, 'reel');
    assert.ok(p2.date < p0.date && p2.semaines < p0.semaines);
  });
  await test('composition, tour de taille et recomposition', () => {
    const d = exemple(auj);
    const c = K.composition(d, auj), t = K.tourTaille(d, auj);
    assert.ok(c.dGrasse < 0, 'la masse grasse baisse');
    assert.ok(t.total < 0 && t.sur4 < 0);
    // Poids stable, tour qui baisse : c'est de la recomposition.
    const r = { profil: {}, jours: {} };
    for (let n = 35; n >= 0; n--) r.jours[K.decaler(auj, -n)] = { poids: 85 + (n % 2) * 0.2, ...(n % 7 === 0 ? { tour: 95 - (35 - n) * 0.1 } : {}) };
    assert.ok(K.recomposition(r, auj), 'recomposition détectée');
  });
  await test('mes plats : les plus mangés d\u2019abord', () => {
    const m = K.mesPlats(exemple(auj), auj);
    assert.equal(m.top.length, 2);
    assert.ok(m.top[0].fois >= m.top[1].fois);
    assert.ok(m.moyRepas > 200);
  });
  await test('Raccourci : % de gras en fraction, tour de taille, séance', async () => {
    const d = exemple(auj);
    delete d.jours[auj].gras; delete d.jours[auj].tour; delete d.jours[auj].muscu; // une mesure déjà là n'est jamais écrasée
    const r = await lancer({ donnees: d, param: { pas: 6000, gras: 0.243, tour: '98,5', muscu: 45 } });
    const j = r.donnees.jours[auj];
    assert.equal(j.gras, 24.3);
    assert.equal(j.tour, 98.5);
    assert.equal(j.muscu, true);
  });
  await test('bilan du dimanche soir : envoyé une seule fois', async () => {
    // Le dimanche de la semaine en cours (ou aujourd'hui si on est dimanche).
    const dim = K.decaler(K.lundiDe(auj), 6);
    const d = exemple(dim);
    const heure = 21;
    const lancerDim = (donnees) => lancer({ donnees, param: 7000, heure, jour: dim });
    let r = await lancerDim(d);
    assert.ok(r.notifs.some((n) => /Ta semaine/.test(n.titre)), JSON.stringify(r.notifs));
    r = await lancerDim(r.donnees);
    assert.ok(!r.notifs.some((n) => /Ta semaine/.test(n.titre)), 'pas deux fois');
  });

  // ---------- Scanner, boutons du widget
  await test('code-barres : la fiche produit s\u2019ouvre (Run In App), sinon on explique', async () => {
    let r = await lancer({ donnees: exemple(auj), param: '7610200337389', dansApp: true });
    assert.ok(r.page.includes('const OUVRIR = {"action":"code","code":"7610200337389"}'));
    assert.equal(r.donnees.jours[auj].pas, 4210, 'le code n\u2019est pas pris pour des pas');
    r = await lancer({ donnees: exemple(auj), param: { code: '76102003' }, dansApp: false });
    assert.match(r.raccourci, /Run In App/);
  });
  await test('widget : boutons Shaker / Plat / Scanner (et Poids en grand)', async () => {
    let r = await lancer({ donnees: exemple(auj), widget: 'medium', journal: [] });
    assert.deepEqual(r.urls.filter((u) => u.includes('ouvrir=') || u.startsWith('shortcuts')), [
      'scriptable:///run/Cuisine%20180?ouvrir=shaker', 'scriptable:///run/Cuisine%20180?ouvrir=plat',
      'shortcuts://run-shortcut?name=Cuisine%20180%20scanner']);
    r = await lancer({ donnees: exemple(auj), widget: 'large', journal: [] });
    assert.ok(r.urls.includes('scriptable:///run/Cuisine%20180?ouvrir=poids'));
  });
  await test('ouvert par un bouton du widget : la page sait quoi ouvrir', async () => {
    const r = await lancer({ donnees: exemple(auj), query: { ouvrir: 'plat' } });
    assert.ok(r.page.includes('const OUVRIR = {"action":"plat"}'));
  });

  // ---------- Recettes
  await test('chaque recette : protéines et kcal annoncées = calcul des ingrédients', () => {
    const ctx = vm.createContext({});
    vm.runInContext(fs.readFileSync(path.join(racine, 'src', 'recettes.js'), 'utf8') + ';globalThis.R=R;globalThis.ING=ING;globalThis.CATS=CATS;globalThis.COL=COL;', ctx);
    assert.ok(ctx.R.length >= 38, ctx.R.length + ' recettes');
    const ids = new Set();
    for (const r of ctx.R) {
      assert.ok(!ids.has(r.id), 'id en double : ' + r.id); ids.add(r.id);
      assert.ok(ctx.CATS[r.cat], 'catégorie inconnue : ' + r.cat);
      for (const i of r.ing) assert.ok(ctx.ING[i[0]], r.id + ' : ingrédient inconnu ' + i[0]);
      for (const a of r.art) assert.ok(ctx.COL[a], r.id + ' : dessin inconnu ' + a);
      const c = calcul(r);
      assert.ok(Math.abs(c.p - r.p) <= 6 && Math.abs(c.k - r.k) / r.k <= 0.08, r.id + ' annonce ' + r.p + ' g / ' + r.k + ' kcal, calcul ' + c.p + ' g / ' + c.k + ' kcal');
    }
  });

  // ---------- Page
  await test('appli : la page reçoit les données et reste du HTML valide', async () => {
    const r = await lancer({ donnees: exemple(auj) });
    assert.ok(r.page.startsWith('<!doctype html>'));
    assert.ok(!r.page.includes('__ETAT__') && !r.page.includes('__OUVRIR__'));
    const js = r.page.split('<script>\n')[1].split('</script>')[0];
    new Function(js); // compile
    assert.ok(r.page.includes('"dateDepart"'));
  });
  await test('appli : un nom de plat avec </script> ne casse pas la page', async () => {
    const d = exemple(auj);
    d.jours[auj].repas.push({ id: 'autre', nom: '</script><b>x', k: 10, p: 0, x: 1, n: 'z' });
    const r = await lancer({ donnees: d });
    assert.equal(r.page.split('</script>').length, 2);
  });

  console.log('\n' + n + ' tests passés.');
}
