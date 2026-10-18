// ---------------------------------------------------------------------------
//  Calculs partagés. Ce fichier est recopié tel quel dans le script (widget),
//  dans la page et dans les tests : les trois comptent donc pareil.
//  Fonctions pures, sans Scriptable ni DOM.
// ---------------------------------------------------------------------------
const KCAL_KG = 7700; // kcal de déficit ≈ 1 kg de gras

function cleJour(d) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function decaler(cle, n) {
  const [a, m, j] = cle.split('-').map(Number);
  return cleJour(new Date(a, m - 1, j + n));
}
// Nombre de jours de `a` à `b` (b − a).
function ecart(a, b) {
  const t = (c) => { const [y, m, d] = c.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((t(b) - t(a)) / 864e5);
}

// Mifflin-St Jeor.
function metabolisme(prof, poids) {
  if (!prof.taille || !poids || !prof.age) return null;
  return 10 * poids + 6.25 * prof.taille - 5 * prof.age + (prof.sexe === 'f' ? -161 : 5);
}
// Vie de tous les jours (× 1,2) + ≈ 0,0005 kcal par pas et par kilo au-delà de 2000 pas,
// le tout corrigé par le facteur d'étalonnage une fois accepté dans l'appli.
function depense(prof, poids, pas) {
  const b = metabolisme(prof, poids);
  if (b == null) return null;
  return Math.round((b * 1.2 + Math.max(0, (pas || 0) - 2000) * 0.0005 * poids) * (prof.facteur || 1));
}

const joursTries = (d) => Object.keys(d.jours || {}).sort();

function dernierPoids(d, jusqua) {
  let p = null;
  for (const c of joursTries(d)) {
    if (c > jusqua) break;
    if (d.jours[c].poids) p = d.jours[c].poids;
  }
  return p ?? d.profil.depart ?? null;
}

// Moyenne des pesées des 7 derniers jours (le poids d'un matin ment, la moyenne moins).
function moyenne7(d, cle) {
  const debut = decaler(cle, -6), v = [];
  for (const c of joursTries(d)) if (c >= debut && c <= cle && d.jours[c].poids) v.push(d.jours[c].poids);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

// Un repas « prévu » (pas encore coché comme mangé) ne compte pas.
const manges = (j) => (j && j.repas ? j.repas.filter((r) => !r.prevu) : []);
function kcalJour(j) {
  if (!j) return null;
  const m = manges(j);
  if (m.length) return Math.round(m.reduce((a, r) => a + r.k * (r.x || 1), 0));
  return j.kcal ?? null;
}
function protJour(j) {
  return Math.round(manges(j).reduce((a, r) => a + r.p * (r.x || 1), 0));
}
function kcalPrevu(j) {
  if (!j || !j.repas) return 0;
  return Math.round(j.repas.filter((r) => r.prevu).reduce((a, r) => a + r.k * (r.x || 1), 0));
}
// Espace fine insécable entre les milliers, comme en Suisse romande.
const nb = (n) => (n < 0 ? '−' : '') + String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// Objectifs du jour. `prof.kcal` / `prof.prot` à null = calculés.
function objectifs(prof, poids) {
  poids = poids || prof.depart;
  const pas = prof.pas || 8000;
  let kcal = prof.kcal ?? null;
  if (kcal == null) {
    const b = metabolisme(prof, poids);
    if (b == null) kcal = 2000;
    else {
      const plancher = Math.ceil(Math.max(b, prof.sexe === 'f' ? 1200 : 1500) / 50) * 50;
      kcal = Math.max(plancher, Math.round((depense(prof, poids, pas) - (prof.rythme || 0.5) * KCAL_KG / 7) / 50) * 50);
    }
  }
  let prot = prof.prot ?? null;
  if (prot == null) {
    const imc25 = prof.taille ? 25 * (prof.taille / 100) ** 2 : null;
    const ref = prof.cible || (imc25 && poids ? Math.min(poids, imc25) : poids) || 75;
    prot = Math.round((2 * ref) / 5) * 5;
  }
  return { kcal, prot, pas };
}

// Tout ce qu'on sait d'un jour.
function infoJour(d, cle) {
  const j = d.jours?.[cle] || {};
  const poidsRef = dernierPoids(d, cle);
  const obj = objectifs(d.profil, poidsRef);
  const kcal = kcalJour(j);
  const dep = depense(d.profil, poidsRef, j.pas);
  const actif = kcal != null && kcal <= obj.kcal && j.pas != null && j.pas >= obj.pas;
  return { cle, poids: j.poids ?? null, poidsRef, pas: j.pas ?? null, kcal, prot: protJour(j), dep,
    def: dep != null && kcal != null ? dep - kcal : null, obj, actif };
}

// Série : jours actifs d'affilée jusqu'à hier, plus aujourd'hui s'il l'est déjà.
// La journée en cours ne casse jamais la série : elle a jusqu'à minuit.
function serie(d, auj) {
  let n = 0, c = decaler(auj, -1);
  while (n < 3650 && infoJour(d, c).actif) { n++; c = decaler(c, -1); }
  return n + (infoJour(d, auj).actif ? 1 : 0);
}
function meilleureSerie(d, auj) {
  const ds = joursTries(d).filter((c) => c <= auj);
  if (!ds.length) return 0;
  let best = 0, cur = 0;
  for (let c = ds[0]; c <= auj; c = decaler(c, 1)) {
    cur = infoJour(d, c).actif ? cur + 1 : 0;
    if (cur > best) best = cur;
  }
  return best;
}

// Poids prévu par la somme des déficits notés depuis le départ (hier compris).
function poidsPrevu(d, auj) {
  const p = d.profil;
  if (!p.depart || !p.dateDepart) return null;
  let cumul = 0, n = 0;
  for (const c of joursTries(d)) {
    if (c < p.dateDepart || c >= auj) continue;
    const i = infoJour(d, c);
    if (i.def != null) { cumul += i.def; n++; }
  }
  return { poids: p.depart - cumul / KCAL_KG, perte: cumul / KCAL_KG, jours: n };
}

// Poids lissé : moyenne mobile exponentielle (α = 0,2) des pesées, comme les
// applis de suivi sérieuses. Une soirée salée ne la fait presque pas bouger ;
// un jour sans pesée garde la valeur de la veille. Renvoie { jour: valeur }.
const ALPHA = 0.2;
function courbeLissee(d, jusqua) {
  const ds = joursTries(d).filter((c) => c <= jusqua && d.jours[c].poids);
  const out = {};
  if (!ds.length) return out;
  let v = null;
  for (let c = ds[0]; c <= jusqua; c = decaler(c, 1)) {
    const x = d.jours[c]?.poids;
    if (x) v = v == null ? x : v + ALPHA * (x - v);
    out[c] = v;
  }
  return out;
}
const lisse = (d, c) => courbeLissee(d, c)[c] ?? null;

// Tendance en kg / semaine : pente du poids lissé sur les 28 derniers jours.
function tendance(d, auj) {
  const ds = joursTries(d).filter((c) => c <= auj && d.jours[c].poids);
  if (ds.length < 4) return null;
  const fin = ds[ds.length - 1], courbe = courbeLissee(d, fin);
  const pts = ds.filter((c) => ecart(c, fin) < 28).map((c) => [ecart(fin, c), courbe[c]]);
  if (pts.length < 4 || pts[pts.length - 1][0] - pts[0][0] < 6) return null;
  const n = pts.length, mx = pts.reduce((a, q) => a + q[0], 0) / n, my = pts.reduce((a, q) => a + q[1], 0) / n;
  const den = pts.reduce((a, q) => a + (q[0] - mx) ** 2, 0);
  return den ? (pts.reduce((a, q) => a + (q[0] - mx) * (q[1] - my), 0) / den) * 7 : null;
}

// Date estimée pour le poids visé, au rythme réel.
function dateCible(d, auj) {
  const pr = projection(d, auj, 0);
  return pr && pr.base === 'reel' ? pr.date : null;
}

// Étalonnage : la vraie dépense, déduite de ce que tu manges et de ce que tu perds.
function etalonnage(d, auj) {
  const p = d.profil;
  if (!p.dateDepart || ecart(p.dateDepart, auj) < 21) return null;
  const debut = decaler(auj, -28);
  const ds = joursTries(d).filter((c) => c >= debut && c < auj);
  const pesees = ds.filter((c) => d.jours[c].poids).length;
  const notes = ds.filter((c) => kcalJour(d.jours[c]) != null);
  const tr = tendance(d, auj);
  if (pesees < 8 || notes.length < 14 || tr == null) return null;
  const brut = { ...p, facteur: 1 };
  const moyK = notes.reduce((a, c) => a + kcalJour(d.jours[c]), 0) / notes.length;
  const moyD = notes.reduce((a, c) => a + depense(brut, dernierPoids(d, c), d.jours[c].pas), 0) / notes.length;
  if (!moyD) return null;
  const reelle = moyK + (-tr / 7) * KCAL_KG;
  const facteur = Math.min(1.25, Math.max(0.75, reelle / moyD));
  return { reelle: Math.round(reelle), estimee: Math.round(moyD), facteur: Math.round(facteur * 100) / 100 };
}

// Alerte du soir : ce qu'il manque pour gagner la journée. null = rien à dire.
function alerteSoir(d, cle) {
  const i = infoJour(d, cle), o = i.obj;
  if (i.actif) return null;
  const enJeu = serie(d, cle); // aujourd'hui pas encore actif : la série d'hier
  const manque = [];
  if ((i.pas ?? 0) < o.pas) manque.push('il te manque ' + nb(o.pas - (i.pas ?? 0)) + ' pas');
  if (i.kcal == null) manque.push('note ce que tu as mangé');
  else if (i.kcal > o.kcal) manque.push('tu dépasses de ' + nb(i.kcal - o.kcal) + ' kcal');
  else if (i.prot < o.prot - 20) manque.push('il te reste ' + nb(o.prot - i.prot) + ' g de protéines à prendre');
  if (!manque.length) return null;
  const corps = manque.join(', ');
  return {
    titre: enJeu ? 'Ta série de ' + enJeu + ' jour' + (enJeu > 1 ? 's' : '') + ' est en jeu 🔥' : 'Cuisine 180',
    corps: corps.charAt(0).toUpperCase() + corps.slice(1) + '.',
  };
}

// ===========================================================================
//  Analyses du suivi
// ===========================================================================
const JOURS_LONGS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const jourSemaine = (c) => { const [a, m, j] = c.split('-').map(Number); return new Date(a, m - 1, j).getDay(); };
const lundiDe = (c) => decaler(c, -((jourSemaine(c) + 6) % 7));
const moyenne = (v) => { v = v.filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

// Ce qu'il s'est passé un jour, pour le calendrier de la série.
//   gagne · pas (pas ratés) · kcal (calories dépassées) · les2 · vide (repas pas notés)
//   encours (aujourd'hui, pas encore gagné) · futur
function statutJour(d, c, auj) {
  if (c > auj) return 'futur';
  const i = infoJour(d, c);
  if (i.actif) return 'gagne';
  if (c === auj) return 'encours';
  if (i.kcal == null) return 'vide';
  const kcalKo = i.kcal > i.obj.kcal, pasKo = i.pas == null || i.pas < i.obj.pas;
  return kcalKo && pasKo ? 'les2' : kcalKo ? 'kcal' : 'pas';
}

// Dernière mesure (tour de taille, % de gras…) jusqu'à `c`, et sa date.
function derniere(d, cle, c) {
  const ds = joursTries(d).filter((x) => x <= c && d.jours[x][cle] != null);
  return ds.length ? { cle: ds[ds.length - 1], v: d.jours[ds[ds.length - 1]][cle] } : null;
}

// Bilan d'une semaine (lundi → dimanche, jusqu'à aujourd'hui au plus).
function bilanSemaine(d, lundi, auj) {
  const jours = [];
  for (let i = 0; i < 7; i++) { const c = decaler(lundi, i); if (c <= auj) jours.push(c); }
  if (!jours.length) return null;
  const fin = jours[jours.length - 1];
  const infos = jours.map((c) => infoJour(d, c));
  const notes = infos.filter((i) => i.kcal != null);
  const courbe = courbeLissee(d, fin);
  const avant = courbe[decaler(lundi, -1)], apres = courbe[fin];
  const tourAvant = derniere(d, 'tour', decaler(lundi, -1)), tourFin = derniere(d, 'tour', fin);
  return {
    lundi, jours: jours.length,
    gagnes: infos.filter((i) => i.actif).length,
    notes: notes.length,
    kcal: moyenne(notes.map((i) => i.kcal)),
    prot: moyenne(notes.map((i) => i.prot)),
    protOk: notes.filter((i) => i.prot >= i.obj.prot - 5).length,
    pas: moyenne(infos.map((i) => i.pas)),
    seances: jours.filter((c) => d.jours[c]?.muscu).length,
    poids: avant != null && apres != null ? apres - avant : null,
    tour: tourAvant && tourFin && tourFin.cle >= lundi ? tourFin.v - tourAvant.v : null,
  };
}

// Pourquoi les jours ratés le sont, sur les `n` derniers jours (aujourd'hui exclu).
function causes(d, auj, n = 56) {
  const r = { juges: 0, gagnes: 0, pas: 0, kcal: 0, les2: 0, vide: 0, manquePas: [], depasse: [], protOk: 0, notes: 0,
    parJour: Array.from({ length: 7 }, () => ({ juges: 0, gagnes: 0 })) };
  const premier = joursTries(d)[0];
  if (!premier) return r;
  for (let c = decaler(auj, -n); c < auj; c = decaler(c, 1)) {
    if (c < premier) continue;
    const st = statutJour(d, c, auj), i = infoJour(d, c);
    if (i.kcal != null) { r.notes++; if (i.prot >= i.obj.prot - 5) r.protOk++; }
    if (st === 'vide') { if (d.jours[c]) r.vide++; continue; }
    r.juges++;
    const pj = r.parJour[jourSemaine(c)];
    pj.juges++;
    if (st === 'gagne') { r.gagnes++; pj.gagnes++; continue; }
    r[st]++;
    if (st === 'pas' || st === 'les2') r.manquePas.push(i.obj.pas - (i.pas ?? 0));
    if (st === 'kcal' || st === 'les2') r.depasse.push(i.kcal - i.obj.kcal);
  }
  r.manquePas = moyenne(r.manquePas);
  r.depasse = moyenne(r.depasse);
  // Le jour le plus dur : au moins 3 fois jugé, et nettement sous la moyenne.
  const taux = r.juges ? r.gagnes / r.juges : 0;
  let pire = null;
  r.parJour.forEach((pj, k) => {
    if (pj.juges < 3) return;
    const t = pj.gagnes / pj.juges;
    if (t < taux - 0.2 && (!pire || t < pire.taux)) pire = { jour: JOURS_LONGS[k], taux: t, juges: pj.juges, rates: pj.juges - pj.gagnes };
  });
  r.pire = pire;
  r.taux = taux;
  return r;
}

// Quand le poids visé sera atteint : au rythme réel (sinon au rythme visé),
// avec `extraPas` pas de plus chaque jour.
function projection(d, auj, extraPas = 0) {
  const p = d.profil, cur = lisse(d, auj) ?? dernierPoids(d, auj);
  if (!p.cible || !cur || cur <= p.cible) return null;
  let tr = tendance(d, auj), base = 'reel';
  if (tr == null || tr > -0.05) { tr = -(p.rythme || 0.5); base = 'vise'; }
  const kgSem = -tr + (extraPas * 0.0005 * cur * 7) / KCAL_KG;
  const semaines = (cur - p.cible) / kgSem;
  return { semaines, date: decaler(auj, Math.round(semaines * 7)), base, kgSem };
}

// Composition : masse grasse et masse maigre, d'après le % de gras de la balance.
// Une balance à impédance se trompe de plusieurs points : seule la tendance compte,
// d'où la moyenne des 3 premières et des 3 dernières mesures.
function composition(d, auj) {
  const ds = joursTries(d).filter((c) => c <= auj && d.jours[c].gras != null);
  if (!ds.length) return null;
  const courbe = courbeLissee(d, auj);
  const masse = (lot) => {
    const v = lot.map((c) => { const pds = courbe[c] ?? dernierPoids(d, c); return pds ? [(pds * d.jours[c].gras) / 100, pds] : null; }).filter(Boolean);
    if (!v.length) return null;
    const grasse = moyenne(v.map((x) => x[0])), poids = moyenne(v.map((x) => x[1]));
    return { grasse, maigre: poids - grasse, gras: (grasse / poids) * 100 };
  };
  const fin = masse(ds.slice(-3)), debut = masse(ds.slice(0, 3));
  if (!fin) return null;
  const assez = ds.length >= 6 && ecart(ds[0], ds[ds.length - 1]) >= 21;
  return { ...fin, mesures: ds.length, depuis: ds[0],
    dGrasse: assez ? fin.grasse - debut.grasse : null, dMaigre: assez ? fin.maigre - debut.maigre : null };
}

// Tour de taille : dernière mesure, écart depuis la première et sur 4 semaines.
function tourTaille(d, auj) {
  const ds = joursTries(d).filter((c) => c <= auj && d.jours[c].tour != null);
  if (!ds.length) return null;
  const v = (c) => d.jours[c].tour, der = ds[ds.length - 1];
  const il4 = ds.filter((c) => c <= decaler(der, -28)).pop();
  return { v: v(der), cle: der, depuis: ds[0], total: v(der) - v(ds[0]), sur4: il4 ? v(der) - v(il4) : null, mesures: ds.length };
}

// Recomposition : le poids bouge peu, mais le tour de taille baisse.
function recomposition(d, auj) {
  const t = tourTaille(d, auj), c = courbeLissee(d, auj);
  if (!t || t.sur4 == null || c[auj] == null || c[decaler(auj, -28)] == null) return null;
  const dPoids = c[auj] - c[decaler(auj, -28)];
  return t.sur4 <= -1 && dPoids > -1 ? { dPoids, dTour: t.sur4 } : null;
}

// Tes plats : les plus mangés, et la réussite des jours où ils y sont.
function mesPlats(d, auj, n = 60) {
  const stats = {}, repasK = [];
  let jours = 0, gagnes = 0;
  for (let c = decaler(auj, -n); c < auj; c = decaler(c, 1)) {
    const j = d.jours[c];
    if (!j || !j.repas) continue;
    const m = j.repas.filter((r) => !r.prevu);
    if (!m.length) continue;
    const actif = infoJour(d, c).actif;
    jours++;
    if (actif) gagnes++;
    const vus = new Set();
    for (const r of m) {
      repasK.push(r.k * (r.x || 1));
      if (r.id.startsWith('shaker')) continue;
      const cle = r.id === 'autre' ? 'autre:' + r.nom : r.id;
      const s = (stats[cle] ||= { nom: r.nom, fois: 0, jours: 0, gagnes: 0, k: r.k });
      s.fois++;
      if (!vus.has(cle)) { vus.add(cle); s.jours++; if (actif) s.gagnes++; }
    }
  }
  const top = Object.values(stats).sort((a, b) => b.fois - a.fois).slice(0, 5);
  return { top, moyRepas: moyenne(repasK), jours, taux: jours ? gagnes / jours : null };
}

// Bilan du dimanche soir, en une notification.
function texteBilan(d, auj) {
  const b = bilanSemaine(d, lundiDe(auj), auj);
  if (!b || !b.notes) return null;
  const morceaux = [b.gagnes + '/' + b.jours + ' jours gagnés'];
  if (b.poids != null) morceaux.push((b.poids <= 0 ? '' : '+') + (Math.round(b.poids * 10) / 10).toString().replace('.', ',') + ' kg');
  if (b.tour != null) morceaux.push((b.tour <= 0 ? '' : '+') + (Math.round(b.tour * 10) / 10).toString().replace('.', ',') + ' cm de tour de taille');
  if (b.pas != null) morceaux.push(nb(b.pas) + ' pas/j');
  morceaux.push('protéines ' + b.protOk + '/' + b.notes + ' jours');
  const obj = d.profil.seances ?? 3;
  if (obj) morceaux.push(b.seances + '/' + obj + ' séances');
  return { titre: 'Ta semaine' + (b.gagnes >= 5 ? ' 🔥' : ''), corps: morceaux.join(' · ') };
}
