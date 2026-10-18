// ===========================================================================
//  La page de l'appli. `etat` est le contenu de cuisine-180.json, injecté par
//  le script ; chaque changement repart vers le script, qui l'écrit dans iCloud.
// ===========================================================================
const etat = __ETAT__;
etat.profil = etat.profil || {};
etat.profil.seances ??= 3; // ajouté avec le suivi gras / muscle
etat.jours = etat.jours || {};

// --- Pont avec Scriptable : le script attend, la page lui répond à chaque changement.
// Messages : {type:"etat", etat}, {type:"copier", texte}, {type:"url", url},
// {type:"web", url, id} (requête faite par le script, réponse via __web).
let attente = null, pont = false;
const file = [];
// Ce que le widget a demandé en ouvrant l'appli : {action:"plat"|"autre"|"shaker"|"poids"|"code", code}.
const OUVRIR = __OUVRIR__;
function envoyer(m) {
  if (m.type === 'etat') { const i = file.findIndex((x) => x.type === 'etat'); if (i >= 0) file.splice(i, 1); }
  file.push(m);
  if (attente) { const c = attente; attente = null; c(JSON.stringify(file.splice(0))); }
}
window.__attendre = (c) => { pont = true; if (file.length) c(JSON.stringify(file.splice(0))); else attente = c; };
const attenteWeb = {};
window.__web = (n, texte) => { const f = attenteWeb[n]; if (f) { delete attenteWeb[n]; f(texte); } };
// Requête JSON : directement si la page en a le droit, sinon par le script (Request n'a pas de CORS).
async function web(url) {
  // Une réponse reçue (même 404, qu'Open Food Facts renvoie en JSON) vaut réponse ;
  // seule une requête bloquée (réseau, CORS) passe par le script.
  try { const r = await fetch(url); return await r.json(); } catch (e) {}
  if (!pont) throw new Error('hors ligne');
  const n = id();
  const texte = await new Promise((ok, ko) => { attenteWeb[n] = ok; envoyer({ type: 'web', url, id: n }); setTimeout(() => ko(new Error('délai')), 15000); });
  if (texte == null) throw new Error('échec');
  return JSON.parse(texte);
}
const ouvrirUrl = (url) => envoyer({ type: 'url', url });
function sauver() {
  etat.placard = [...placard];
  etat.comp = comp;
  etat.col = coll;
  envoyer({ type: 'etat', etat });
}
// Le presse-papiers du navigateur n'existe pas dans la page de Scriptable : c'est le script qui copie.
function copier(texte, sortie) {
  envoyer({ type: 'copier', texte });
  try { navigator.clipboard && navigator.clipboard.writeText(texte).catch(() => {}); } catch (e) {}
  if (sortie) { sortie.textContent = 'Copié.'; setTimeout(() => (sortie.textContent = ''), 2500); }
}

// --- Outils
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const auj = () => cleJour(new Date());
const nf = (n, d = 0) => n == null || isNaN(n) ? '–' : Number(n).toLocaleString('fr-CH', { minimumFractionDigits: d, maximumFractionDigits: d });
const signe = (n, d = 1) => (n > 0 ? '+' : n < 0 ? '−' : '') + nf(Math.abs(n), d);
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const joli = (c) => { const [a, m, j] = c.split('-').map(Number); return JOURS[new Date(a, m - 1, j).getDay()] + ' ' + j + ' ' + MOIS[m - 1]; };
const court = (c) => { const [, m, j] = c.split('-'); return j + '.' + m; };
const moisAnnee = (c) => { const [a, m] = c.split('-').map(Number); return MOIS[m - 1] + ' ' + a; };
const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const jour = (c) => (etat.jours[c] ||= {});

// --- État de l'écran (pas sauvé, sauf placard / compositeur / collection)
let placard = new Set(etat.placard || []);
let comp = Object.assign({ pro: 'poulet', fec: 'riz', leg: 'surg', sau: 'curry' }, etat.comp || {});
let coll = etat.col || 'quotidien';
let onglet = 'jour', cat = 'tous', range = 30, openId = null, mult = 1;
regleAllergenes(etat.profil.allergenes);

// --- Toast avec « Annuler »
let annulation = null, minuteur = null;
function toast(texte, annuler) {
  annulation = annuler || null;
  $('#toast-txt').textContent = texte;
  $('#toast-annuler').hidden = !annuler;
  $('#toast').classList.add('ouvert');
  clearTimeout(minuteur);
  minuteur = setTimeout(() => { $('#toast').classList.remove('ouvert'); annulation = null; }, 3500);
}
$('#toast-annuler').onclick = () => {
  if (annulation) { annulation(); annulation = null; sauver(); tout(); }
  $('#toast').classList.remove('ouvert');
};

// ===========================================================================
//  AUJOURD'HUI (et les autres jours : flèches à côté de la date)
// ===========================================================================
let vu = auj();                 // jour affiché dans l'onglet
let peseeEdit = false, pasEdit = false, mesureEdit = false;
const futur = () => vu > auj();
const nomJour = (c) => { const a = auj(); return c === a ? 'Aujourd’hui' : c === decaler(a, -1) ? 'Hier' : c === decaler(a, 1) ? 'Demain' : joli(c); };

// Un plat entre dans le journal du jour affiché, mangé ou seulement prévu.
function ajouterRepas(r, x = 1, prevu = futur()) {
  const j = jour(vu);
  j.repas ||= [];
  const e = { id: r.id, nom: r.nom, k: r.k, p: r.p, x, n: id() };
  if (prevu) e.prevu = true;
  j.repas.push(e);
  sauver();
  toast((prevu ? 'Prévu · ' : 'Ajouté · ') + nf(r.k * x) + ' kcal', () => { j.repas.splice(j.repas.indexOf(e), 1); });
  tout();
}

// Le dernier jour avant `c` où quelque chose a été noté (14 jours en arrière au plus).
function jourModele(c) {
  for (let i = 1; i <= 14; i++) { const x = decaler(c, -i); if ((etat.jours[x]?.repas || []).length) return x; }
  return null;
}

function renderJour() {
  const a = auj(), i = infoJour(etat, vu), o = i.obj, j = etat.jours[vu] || {};
  // Date courte : le titre doit tenir sur une ligne, même sur un petit iPhone.
  const [, mm, jj] = vu.split('-').map(Number);
  const courte = (vu === a || vu < decaler(a, -1) || vu > decaler(a, 1)) ? JOURS[jourSemaine(vu)].slice(0, 3) + '. ' + jj + ' ' + MOIS_COURTS[mm - 1] : nomJour(vu);
  $('#date').innerHTML = '<button class="fl" data-vu="-1" aria-label="Jour précédent">‹</button><span>' + courte + '</span>' +
    '<button class="fl" data-vu="1" aria-label="Jour suivant"' + (vu >= decaler(a, 2) ? ' disabled' : '') + '>›</button>';
  const mange = i.kcal || 0, prevu = kcalPrevu(j), reste = o.kcal - mange, trop = reste < 0;
  const pct = (v, t) => Math.max(0, Math.min(100, t ? (v / t) * 100 : 0)) + '%';
  const etiquette = futur() ? 'Prévu pour ' + nomJour(vu).toLowerCase() : vu < a ? (trop ? 'Dépassé de' : 'Il restait') : (trop ? 'Dépassé de' : 'Il te reste');
  const gros = futur() ? prevu : Math.abs(reste);
  let sous = futur() ? 'sur ' + nf(o.kcal) + ' · ' + (o.kcal - prevu >= 0 ? 'marge ' + nf(o.kcal - prevu) : 'trop de ' + nf(prevu - o.kcal)) : nf(mange) + ' mangées sur ' + nf(o.kcal);
  if (!futur() && prevu) sous += ' · ' + (reste - prevu >= 0 ? nf(reste - prevu) + ' après le prévu' : 'le prévu dépasse de ' + nf(prevu - reste));
  if (i.actif) sous += ' · journée réussie ✓';
  const s = serie(etat, a), rec = meilleureSerie(etat, a);
  $('#hero').innerHTML =
    '<small>' + etiquette + '</small>' +
    '<div class="gros num' + (trop && !futur() ? ' trop' : '') + '">' + nf(gros) + '<span style="font-size:20px;font-weight:700"> kcal</span></div>' +
    '<div class="sous">' + sous + '</div>' +
    '<div class="jauges">' +
    '<div class="jauge kcal' + (trop ? ' trop' : '') + '"><span>Calories</span><div class="piste"><i style="width:' + pct(futur() ? prevu : mange, o.kcal) + '"></i></div><span class="v">' + nf(futur() ? prevu : mange) + ' / ' + nf(o.kcal) + '</span></div>' +
    '<div class="jauge j-prot"><span>Protéines</span><div class="piste"><i style="width:' + pct(i.prot, o.prot) + '"></i></div><span class="v">' + nf(i.prot) + ' / ' + nf(o.prot) + ' g</span></div>' +
    (futur() ? '' : '<div class="jauge j-pas"><span>Pas</span><div class="piste"><i style="width:' + pct(i.pas || 0, o.pas) + '"></i></div><span class="v">' + nf(i.pas || 0) + ' / ' + nf(o.pas) + '</span></div>') +
    '</div>' + (vu === a ? '<div class="chips-hero"><span class="serie' + (s ? '' : ' zero') + '">🔥 ' + s + ' jour' + (s > 1 ? 's' : '') + ' d’affilée</span>' +
    (rec > s ? '<span class="serie zero">Record : ' + rec + '</span>' : '') + (j.muscu ? '<span class="serie zero">💪 séance faite</span>' : '') + '</div>' : '');

  // Pesée (pas pour un jour à venir)
  const m7 = lisse(etat, vu);
  $('#pesee').hidden = futur();
  $('#pesee').innerHTML = j.poids && !peseeEdit
    ? '<div class="head-row"><div><h3>' + nf(j.poids, 1) + ' kg</h3><span class="meta">' + (vu === a ? 'Pesée du jour' : 'Pesée') + (m7 ? ' · poids lissé ' + nf(m7, 1) + ' kg' : '') + '</span></div><button class="lien" data-pesee-edit>Modifier</button></div>'
    : '<h3>' + (vu === a ? 'Pesée du matin' : 'Pesée') + '</h3><p class="hint">À jeun, après les toilettes : c’est le poids le plus stable.</p>' +
      '<form class="pesee" id="f-pesee" onsubmit="return false"><input class="champ num" id="pesee-v" type="number" step="0.1" min="30" max="300" inputmode="decimal" placeholder="' + (m7 ? nf(m7, 1) : 'kg') + '" value="' + (j.poids ?? '') + '"><span>kg</span><button class="btn" data-pesee>Noter</button></form>';

  // Séance de muscu et mesures (tour de taille, % de gras)
  const cj = $('#corps-jour');
  cj.hidden = futur();
  if (!futur()) {
    const b = bilanSemaine(etat, lundiDe(vu), vu), obj = etat.profil.seances || 0;
    const dt = derniere(etat, 'tour', vu), recent = dt && ecart(dt.cle, vu) < 7;
    const montrerChamps = mesureEdit || !recent || j.tour != null || j.gras != null;
    cj.innerHTML = '<div class="muscu"><button class="chip" data-muscu aria-pressed="' + !!j.muscu + '">💪 ' + (j.muscu ? 'Séance de muscu faite' : 'J\u2019ai fait ma séance') + '</button>' +
      '<span class="meta">' + (b ? b.seances : 0) + (obj ? '/' + obj : '') + ' cette semaine</span></div>' +
      (montrerChamps
        ? '<form class="mesures" onsubmit="return false"><label>Tour de taille (cm)<input class="champ num" id="tour-v" type="number" step="0.5" min="40" max="200" inputmode="decimal" placeholder="' + (dt ? nf(dt.v, 1) : 'cm') + '" value="' + (j.tour ?? '') + '"></label>' +
          '<label>% de gras<input class="champ num" id="gras-v" type="number" step="0.1" min="3" max="60" inputmode="decimal" placeholder="facultatif" value="' + (j.gras ?? '') + '"></label><button class="btn" data-mesures>Noter</button></form>' +
          (dt ? '' : '<p class="hint" style="margin:8px 0 0">' + RAPPEL_TOUR + '</p>')
        : '<p class="meta" style="margin-top:10px">Tour de taille : ' + nf(dt.v, 1) + ' cm, mesuré ' + (dt.cle === decaler(vu, -1) ? 'hier' : 'il y a ' + ecart(dt.cle, vu) + ' jours') + '. Prochaine mesure dans ' + (7 - ecart(dt.cle, vu)) + ' j. <button class="lien" data-mesure-edit>Mesurer</button></p>');
  }

  // Journal
  const repas = j.repas || [];
  $('#journal-titre').textContent = futur() ? 'Ce que je prévois' : vu === a ? 'Ce que j’ai mangé' : 'Ce que j’avais mangé';
  $('#journal-total').textContent = repas.length ? nf(futur() ? prevu : mange) + ' kcal · ' + nf(i.prot) + ' g prot.' : '';
  $('#journal').innerHTML = repas.length ? repas.map((e) =>
    '<li data-n="' + e.n + '" class="' + (e.prevu ? 'prevu' : '') + '">' +
    (e.prevu && !futur() ? '<button class="cocher" data-manger aria-label="Marquer comme mangé"></button>' : '<span class="cocher' + (e.prevu ? '' : ' fait') + '"></span>') +
    '<div class="nom"><b>' + esc(e.nom) + '</b><span class="num">' + nf(e.k * e.x) + ' kcal · ' + nf(e.p * e.x) + ' g' + (e.prevu ? ' · prévu' : '') + '</span></div>' +
    '<div class="pas-a-pas"><button data-x="-0.5" aria-label="Moins">−</button><span>×' + nf(e.x, e.x % 1 ? 1 : 0) + '</span><button data-x="0.5" aria-label="Plus">+</button></div>' +
    '<button class="suppr" data-suppr aria-label="Retirer">✕</button></li>').join('')
    : '<li style="display:block;color:var(--muted);font-size:14px">' + (futur() ? 'Rien de prévu. Prévois tes plats pour faire tes courses.' : 'Rien de noté pour l’instant. Ajoute ton shaker ou un plat.') + '</li>';
  const nbPrevus = repas.filter((e) => e.prevu).length;
  const modele = jourModele(vu);
  $('#journal-extra').innerHTML =
    (nbPrevus && !futur() ? '<button class="btn petit" data-tout-manger>✓ Tout est mangé (' + nbPrevus + ')</button>' : '') +
    (modele ? '<button class="btn sec petit" data-comme="' + modele + '">↺ Comme ' + (modele === decaler(vu, -1) ? 'la veille' : 'le ' + court(modele)) + ' (' + etat.jours[modele].repas.length + ')</button>' : '') +
    (futur() ? '' : '<button class="btn sec petit" data-yazio-jour>Copier pour Yazio</button>') + '<span class="meta" id="copie-jour"></span>';
  $('#bouton-plat').innerHTML = '<span>🍽️</span>' + (futur() ? 'Prévoir' : 'Un plat');

  // Pas (pas pour un jour à venir)
  $('#pas-box').hidden = futur();
  const maj = j.pasMaj ? new Date(j.pasMaj) : null;
  $('#pas-box').innerHTML = '<div class="head-row"><div><h3>' + nf(i.pas || 0) + ' pas</h3><span class="meta">' +
    (maj ? 'Repris de Santé à ' + maj.toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' }) : vu === a ? 'Pas encore reçus de Santé.' : 'Pas reçus de Santé ce jour-là.') +
    '</span></div><button class="lien" data-pas-edit>Corriger</button></div>' +
    (pasEdit ? '<form class="pesee" style="margin-top:10px" onsubmit="return false"><input class="champ num" id="pas-v" type="number" step="100" min="0" inputmode="numeric" value="' + (i.pas ?? '') + '"><button class="btn" data-pas-ok>OK</button></form>' : '');
}

function texteYazioJour(c) {
  const repas = ((etat.jours[c] || {}).repas || []).filter((e) => !e.prevu);
  if (!repas.length) return '';
  const blocs = repas.map((e) => {
    const r = byId(e.id);
    if (!r) return e.nom + ' ≈ ' + Math.round(e.k * e.x) + ' kcal, ' + Math.round(e.p * e.x) + ' g de protéines';
    const y = yazio(r, e.x);
    return y.head + '\n' + y.lines.join('\n');
  });
  const i = infoJour(etat, c);
  return 'Journée du ' + joli(c) + ' ≈ ' + nf(i.kcal) + ' kcal, ' + nf(i.prot) + ' g de protéines\n\n' + blocs.join('\n\n');
}

// --- Panneau « Ajouter un plat »
let recherche = '', ajoutPrevu = false, autresRecents = [];
function ouvrirAjoutPlat() {
  openId = null;
  recherche = '';
  ajoutPrevu = futur();
  $('#sheet').innerHTML = '';
  renderAjoutPlat();
  ouvrirSheet();
}
function ligneChoix(r) {
  const attr = r.id === 'autre' ? 'data-reprendre="' + autresRecents.indexOf(r) + '"' : 'data-ajoute="' + r.id + '"';
  return '<li><button ' + attr + '><b>' + esc(r.nom) + '</b><span class="meta"><span class="prot num">' + nf(r.p) + ' g</span><span class="num">' + nf(r.k) + ' kcal</span></span></button></li>';
}
function renderAjoutPlat() {
  const q = recherche.trim().toLowerCase();
  const ok = (r) => permis(r) && (!q || r.nom.toLowerCase().includes(q) || r.ing.some((i) => ING[i[0]].n.toLowerCase().includes(q)));
  // Récents : les derniers plats notés, sans doublon ; tes « autres » (kebab, barre…) compris.
  const vus = new Set(), recents = [];
  autresRecents = [];
  for (const c of joursTries(etat).reverse()) {
    for (const e of [...(etat.jours[c].repas || [])].reverse()) {
      if (e.id === 'autre') {
        const cle = 'autre:' + e.nom.toLowerCase();
        if (!vus.has(cle)) { vus.add(cle); const o = { id: 'autre', nom: e.nom, k: e.k, p: e.p, ing: [] }; autresRecents.push(o); recents.push(o); }
        continue;
      }
      const r = byId(e.id);
      if (r && !vus.has(r.id) && !r.id.startsWith('shaker')) { vus.add(r.id); recents.push(r); }
    }
    if (recents.length >= 8) break;
  }
  const mien = make(comp.pro, comp.fec, comp.leg, comp.sau);
  const groupes = [
    ['Récents', recents.slice(0, 8).filter(ok)],
    ['Mon assiette composée', permis(mien) && ok(mien) ? [mien] : []],
    ['Assiettes de base', base().filter(ok)],
    ['Shakers', SHAKERS.filter(ok)],
    ['Recettes variées', R.filter(ok)],
  ];
  const corps = groupes.filter((g) => g[1].length).map(([t, l]) => '<h4 style="margin:14px 0 2px">' + t + '</h4><ul class="choix">' + l.map(ligneChoix).join('') + '</ul>').join('') || '<p class="empty-note">Aucun plat ne correspond.</p>';
  if ($('#a-q')) { $('#a-liste').innerHTML = corps; return; }
  $('#sheet').innerHTML = '<div class="sheet-head"><h2>' + (futur() ? 'Prévoir · ' + nomJour(vu).toLowerCase() : 'Ajouter un plat') + '</h2><button class="close" data-close>Fermer</button></div>' +
    (futur() ? '' : '<div class="seg" style="margin-bottom:10px"><button data-mode="mange" aria-pressed="' + !ajoutPrevu + '">Mangé</button><button data-mode="prevu" aria-pressed="' + ajoutPrevu + '">Prévu, à cocher</button></div>') +
    '<input id="a-q" class="champ" type="search" style="width:100%" placeholder="Chercher un plat ou un ingrédient">' +
    '<div id="a-liste">' + corps + '</div>';
}

// --- Panneau « Autre chose » : saisie libre ou produit trouvé sur Open Food Facts
let produit = null; // { nom, k100, p100 } une fois un produit choisi
function ouvrirAjoutAutre(code) {
  openId = null;
  produit = null;
  $('#sheet').innerHTML = '<div class="sheet-head"><h2>Autre chose</h2><button class="close" data-close>Fermer</button></div>' +
    '<p class="hint">Un en-cas, un resto, un produit du magasin. Cherche-le, ou entre l’étiquette à la main.</p>' +
    '<form class="pesee" onsubmit="return false"><input class="champ" id="off-q" style="flex:1" type="search" placeholder="Produit ou code-barres" value="' + esc(code || '') + '"><button class="btn sec" data-off>Chercher</button></form>' +
    '<div class="ligne-btns" style="margin-top:8px"><button class="lien" data-scanner>📷 Scanner un code-barres</button></div>' +
    '<div id="off-res"></div>' +
    '<form class="form" id="f-autre" onsubmit="return false"><label class="full">Nom<input class="champ" id="o-nom" placeholder="ex. Kebab, barre protéinée…"></label>' +
    '<label class="full" id="o-g-l" hidden>Quantité mangée (g)<input class="champ" id="o-g" type="number" inputmode="numeric" min="0" step="5"></label>' +
    '<label>Calories<input class="champ" id="o-k" type="number" inputmode="numeric" min="0" step="10"></label>' +
    '<label>Protéines (g)<input class="champ" id="o-p" type="number" inputmode="numeric" min="0" step="1"></label></form>' +
    '<div class="ligne-btns"><button class="btn" data-autre-ok>' + (futur() ? 'Prévoir' : 'Ajouter') + '</button><span class="meta" id="o-msg"></span></div>';
  ouvrirSheet();
  if (code) chercherProduit(code);
}
function recalculerProduit() {
  if (!produit) return;
  const g = numv('#o-g') ?? 0;
  $('#o-k').value = Math.round((produit.k100 * g) / 100);
  $('#o-p').value = Math.round((produit.p100 * g) / 100);
}
const OFF = 'https://world.openfoodfacts.org';
const CHAMPS = 'code,product_name,product_name_fr,brands,nutriments,serving_quantity';
const marque = (p) => String((Array.isArray(p.brands) ? p.brands[0] : (p.brands || '').split(',')[0]) || '').trim();
const nomProduit = (p) => (p.product_name_fr || p.product_name || 'Sans nom') + (marque(p) ? ' · ' + marque(p) : '');
let trouves = [];
async function chercherProduit(q) {
  q = (q || '').trim();
  if (!q) return;
  const res = $('#off-res');
  res.innerHTML = '<p class="empty-note">Recherche…</p>';
  try {
    if (/^\d{8,14}$/.test(q)) {
      const j = await web(OFF + '/api/v2/product/' + q + '?fields=' + CHAMPS);
      trouves = j && j.product ? [{ ...j.product, code: q }] : [];
    } else {
      // Moteur de recherche d'Open Food Facts : d'abord ce qui se vend en Suisse,
      // puis le reste du monde si c'est maigre. (Pas de CORS : passe par le script.)
      const url = 'https://search.openfoodfacts.org/search?page_size=12&langs=fr&fields=' + CHAMPS + '&q=';
      const ch = await web(url + encodeURIComponent(q + ' countries_tags:"en:switzerland"'));
      trouves = (ch && ch.hits) || [];
      if (trouves.filter((p) => p.nutriments && p.nutriments['energy-kcal_100g'] != null).length < 4) {
        const monde = await web(url + encodeURIComponent(q));
        const vus = new Set(trouves.map((p) => p.code));
        trouves = trouves.concat(((monde && monde.hits) || []).filter((p) => !vus.has(p.code)));
      }
    }
    trouves = trouves.filter((p) => p.nutriments && p.nutriments['energy-kcal_100g'] != null).slice(0, 8);
    res.innerHTML = trouves.length
      ? '<ul class="choix">' + trouves.map((p, ix) => '<li><button data-produit="' + ix + '"><b>' + esc(nomProduit(p)) + '</b><span class="meta"><span class="prot num">' + nf(p.nutriments.proteins_100g ?? 0, 1) + ' g</span><span class="num">' + nf(p.nutriments['energy-kcal_100g']) + ' kcal</span><span>/100 g</span></span></button></li>').join('') + '</ul>'
      : '<p class="empty-note">Rien trouvé sur Open Food Facts. Entre les valeurs à la main.</p>';
  } catch (e) {
    res.innerHTML = '<p class="empty-note">Open Food Facts ne répond pas (réseau ?). Entre les valeurs à la main.</p>';
  }
}

// ===========================================================================
//  RECETTES (repris de la version web)
// ===========================================================================
function renderCats() {
  const all = [['tous', 'Tous'], ['express', '⚡ 15 min et moins'], ...Object.entries(CATS)];
  $('#cats').innerHTML = all.map(([k, v]) => '<button class="chip" data-cat="' + k + '" aria-pressed="' + (cat === k) + '">' + v + '</button>').join('');
}
function card(r) {
  const nb = toBuy(r, placard).length;
  return '<button class="card" data-open="' + r.id + '"><div class="pic"><span class="tag">' + CATS[r.cat] + '</span>' + plate(r) + '</div>' +
    '<div class="body"><h3>' + esc(r.nom) + '</h3><div class="meta"><span class="prot num">' + r.p + ' g</span><span class="num">' + r.k + ' kcal</span><span>' + r.m + ' min</span></div>' +
    '<div class="meta">' + (nb ? nb + ' à acheter' : '<span style="color:var(--ok);font-weight:700">Tout est chez toi</span>') + '</div></div></button>';
}
function renderGrid() {
  const q = $('#q').value.trim().toLowerCase(), so = $('#sort').value;
  const list = R.filter((r) => permis(r) && (cat === 'tous' || (cat === 'express' ? r.m <= 15 : r.cat === cat)) && (!q || r.nom.toLowerCase().includes(q) || r.ing.some((i) => ING[i[0]].n.toLowerCase().includes(q))));
  list.sort({ p: (a, b) => b.p - a.p, k: (a, b) => a.k - b.k, m: (a, b) => a.m - b.m, buy: (a, b) => toBuy(a, placard).length - toBuy(b, placard).length }[so]);
  const caches = R.filter((r) => !permis(r)).length;
  $('#count').textContent = list.length + ' plat' + (list.length > 1 ? 's' : '') + (caches ? ' · ' + caches + ' masqué' + (caches > 1 ? 's' : '') + ' (allergènes)' : '');
  $('#grid').innerHTML = list.map(card).join('') || '<p>Aucun plat ne correspond.</p>';
}
function renderQ() {
  // Un choix interdit par les allergènes est grisé ; si le choix courant l'est, on prend le premier permis.
  for (const [k, obj] of [['pro', PRO], ['fec', FEC], ['leg', LEG], ['sau', SAU]]) {
    if (!choixPermis(obj[comp[k]])) { const libre = Object.keys(obj).find((x) => choixPermis(obj[x])); if (libre) comp[k] = libre; }
  }
  const grp = (key, obj, lab) => '<div class="row"><small>' + lab + '</small><div class="chips">' + Object.entries(obj).map(([k, v]) =>
    '<button class="chip" data-cp="' + key + ':' + k + '" aria-pressed="' + (comp[key] === k) + '"' + (choixPermis(v) ? '' : ' disabled') + '>' + v.n.charAt(0).toUpperCase() + v.n.slice(1) + '</button>').join('') + '</div></div>';
  const r = make(comp.pro, comp.fec, comp.leg, comp.sau);
  $('#comp').innerHTML = '<div><h3>Compose ton assiette</h3><p class="hint" style="margin-bottom:0">Un élément par ligne. Le séré en dessert s’ajuste pour arriver à ≈ 75 g de protéines.</p></div>' +
    grp('pro', PRO, 'Protéine') + grp('fec', FEC, 'Féculent') + grp('leg', LEG, 'Légumes') + grp('sau', SAU, 'Goût') +
    '<div class="res">' + plate(r) + '<h3>' + esc(r.nom) + '</h3><div class="meta" style="justify-content:center"><span class="prot num">' + r.p + ' g prot.</span><span class="num">' + r.k + ' kcal</span><span>' + r.m + ' min</span></div>' +
    '<div class="ligne-btns" style="justify-content:center;margin-top:4px"><button class="btn sec petit" data-open="' + r.id + '">Voir la recette</button><button class="btn petit" data-ajoute="' + r.id + '">+ Aujourd’hui</button></div></div>';
  const B = [['Protéines', ['poulet', 'hache', 'oeufs', 'jambon', 'sere']], ['Féculents', ['riz', 'pates', 'pdt']], ['Légumes', ['legumes', 'carottes', 'brocoli', 'poivron', 'oignon']], ['Goût', ['sauce-tomate', 'curry', 'epices', 'ail']]];
  $('#basket').innerHTML = '<h3>Le panier de base</h3><p class="hint" style="margin-bottom:0">17 produits. Avec eux, 144 assiettes différentes. Coche ce que tu as.</p>' +
    '<div class="cols4">' + B.map(([t, ks]) => '<div><h4>' + t + '</h4><div class="pantry-group">' + ks.filter((k) => !EXCLU.has(k)).map((k) => '<button class="pt" data-pt="' + k + '" aria-pressed="' + placard.has(k) + '">' + ING[k].n + '</button>').join('') + '</div></div>').join('') + '</div>';
  const b = base();
  $('#titre-base').textContent = b.length + ' assiette' + (b.length > 1 ? 's' : '') + ' de base';
  $('#grid-q').innerHTML = b.map(card).join('');
  document.querySelectorAll('.seg button').forEach((x) => x.setAttribute('aria-pressed', x.dataset.col === coll));
  $('#view-q').hidden = coll !== 'quotidien';
  $('#view-v').hidden = coll !== 'varie';
}
function renderFiche() {
  const r = byId(openId);
  if (!r) return;
  const buy = toBuy(r, placard), yz = yazio(r);
  const buyTxt = buy.map((i) => ING[i[0]].n + (i[1] != null ? ' (' + fmt(i[1], i[2], mult) + ')' : ''));
  $('#sheet').innerHTML =
    '<div class="sheet-head"><span class="meta">' + (CATS[r.cat] || '') + (r.m ? ' · ' + r.m + ' min' : '') + '</span><button class="close" data-close>Fermer</button></div>' +
    (r.art ? '<div class="fiche-pic">' + plate(r) + '</div>' : '') +
    '<h2 style="font-size:26px;margin-top:12px">' + esc(r.nom) + '</h2>' +
    '<div class="macros"><div class="macro p"><b>' + Math.round(r.p * mult) + ' g</b><small>Protéines</small></div><div class="macro"><b>' + Math.round(r.k * mult) + '</b><small>kcal</small></div><div class="macro"><b>' + (r.m || '–') + '</b><small>minutes</small></div></div>' +
    '<div class="ligne-btns" style="margin-top:0"><button class="btn" data-ajoute="' + r.id + '">+ Mangé aujourd\u2019hui</button><button class="btn sec" data-prevoir="' + r.id + '">Prévoir</button></div>' +
    '<div class="portions" style="margin-top:12px"><span>Cuisiner pour :</span>' + [1, 2, 3, 4].map((n) => '<button data-mult="' + n + '" aria-pressed="' + (mult === n) + '">' + n + '</button>').join('') + '</div>' +
    '<div class="stack">' +
    '<div class="box"><h3>Ingrédients</h3><p class="hint">Coche ce que tu as déjà. Les poids de viande sont crus.</p><ul class="ing">' +
    r.ing.map((i, ix) => { const m = ING[i[0]], h = placard.has(i[0]); return '<li class="' + (h ? 'have' : '') + '"><input type="checkbox" id="i-' + ix + '" data-have="' + i[0] + '"' + (h ? ' checked' : '') + '><label for="i-' + ix + '">' + m.n + (i[3] ? ' <span style="color:var(--muted)">· ' + esc(i[3]) + '</span>' : '') + (m.tip ? '<span class="tip">À regarder : ' + esc(m.tip) + '</span>' : '') + '</label><span class="q">' + fmt(i[1], i[2], mult) + '</span></li>'; }).join('') +
    '</ul><div class="buy"><h4>À acheter</h4>' + (buy.length ? '<ul>' + buyTxt.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul><div class="ligne-btns"><button class="btn sec petit" data-copie-achat>Copier la liste</button><span class="meta" id="copie-achat"></span></div>' : '<p class="none">Tu as tout. Tu peux cuisiner.</p>') + '</div></div>' +
    (r.st ? '<div class="box"><h3>Préparation</h3><ol class="steps">' + r.st.map((s) => '<li><span>' + esc(s) + '</span></li>').join('') + '</ol></div>' : '') +
    '<div class="box"><h3>Pour Yazio</h3><p class="hint">Pour 1 portion, chaque ingrédient en grammes.</p><pre class="yz num">' + esc(yz.head) + '\n\n' + yz.lines.map(esc).join('\n') + '</pre>' +
    '<div class="ligne-btns"><button class="btn sec petit" data-copie-yazio>Copier pour Yazio</button><span class="meta" id="copie-yazio"></span></div></div>' +
    '</div>';
  $('#sheet').dataset.achat = buyTxt.map((t) => '- ' + t).join('\n');
  $('#sheet').dataset.yazio = yz.head + '\n\n' + yz.lines.join('\n');
}
function ouvrirFiche(i) { openId = i; mult = 1; renderFiche(); ouvrirSheet(); }
function ouvrirSheet() { $('#sheet').scrollTop = 0; $('#sheet').classList.add('ouvert'); $('#voile').classList.add('ouvert'); }
function fermerSheet() { $('#sheet').classList.remove('ouvert'); $('#voile').classList.remove('ouvert'); openId = null; }

// ===========================================================================
//  COURSES
// ===========================================================================
function renderCourses() {
  const groups = {};
  Object.entries(ING).forEach(([k, v]) => { if (!EXCLU.has(k)) (groups[v.r] ||= []).push([k, v.n]); });
  const order = ['Frais', 'Viande', 'Épicerie', 'Boulangerie', 'Fruits et légumes', 'Surgelés'];
  $('#pantry').innerHTML = order.filter((g) => groups[g]).map((g) => '<div class="box"><h3>' + g + '</h3><div class="pantry-group" style="margin-top:10px">' + groups[g].map(([k, n]) => '<button class="pt" data-pt="' + k + '" aria-pressed="' + placard.has(k) + '">' + n + '</button>').join('') + '</div></div>').join('');
  const rs = ((etat.jours[vu] || {}).repas || []).map((e) => [byId(e.id), e.x]).filter((x) => x[0]);
  const titre = '<h3>Courses pour ' + nomJour(vu).toLowerCase() + '</h3>';
  if (!rs.length) { $('#day-buy').innerHTML = titre + '<p class="hint" style="margin-bottom:0">Ajoute ou prévois tes plats dans « Aujourd\u2019hui » (les flèches changent de jour). La liste apparaîtra ici.</p>'; return; }
  const agg = {};
  rs.forEach(([r, x]) => toBuy(r, placard).forEach((i) => { const key = i[0] + '|' + i[2]; if (!agg[key]) agg[key] = { k: i[0], q: i[1] != null ? i[1] * x : null, u: i[2] }; else if (i[1] != null && agg[key].q != null) agg[key].q += i[1] * x; }));
  const items = Object.values(agg).map((a) => ING[a.k].n + (a.q != null ? ' (' + fmt(a.q, a.u, 1) + ')' : ''));
  $('#day-buy').innerHTML = titre + '<p class="hint">' + rs.map(([r]) => esc(r.nom)).join(' + ') + '</p>' +
    (items.length ? '<ul>' + items.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul><div class="ligne-btns"><button class="btn sec petit" id="copy-day">Copier la liste</button><span class="meta" id="copied-day"></span></div>' : '<p style="color:var(--ok);font-weight:700;margin:0">Tu as tout ce qu’il faut.</p>');
  $('#day-buy').dataset.copy = items.map((t) => '- ' + t).join('\n');
}

// ===========================================================================
//  SUIVI
// ===========================================================================
let extraPas = 0, calSel = null;
const RAPPEL_TOUR = 'Le matin, à jeun, au niveau du nombril, mètre ruban à plat sans serrer. Une fois par semaine suffit.';

function renderSuivi() {
  const a = auj(), p = etat.profil, i = infoJour(etat, a), o = i.obj, b = metabolisme(p, i.poidsRef);
  const needDef = Math.round(((p.rythme || 0.5) * KCAL_KG) / 7);
  renderBilan(a);
  const tiles = [
    ['hl', 'Calories qui restent', nf(o.kcal - (i.kcal || 0)), 'sur ' + nf(o.kcal)],
    ['', 'Dépense estimée', i.dep != null ? nf(i.dep) : '–', i.dep != null ? 'avec ' + nf(i.pas || 0) + ' pas' : 'entre ta taille'],
    [i.def == null ? '' : i.def >= needDef ? 'good' : i.def > 0 ? '' : 'bad', 'Déficit du jour', i.def != null ? nf(i.def) : '–', 'visé : ' + nf(needDef)],
    [(i.pas || 0) >= o.pas ? 'good' : '', 'Pas', nf(i.pas || 0), Math.round(((i.pas || 0) / o.pas) * 100) + ' % de ' + nf(o.pas)],
  ];
  $('#today-stats').innerHTML = tiles.map(([c, l, v, s]) => '<div class="stat ' + c + '"><small>' + l + '</small><b>' + v + '</b><span>' + s + '</span></div>').join('');
  renderCorps(a);
  renderCalendrier(a);
  renderCauses(a);

  // Poids : lissé, prévu, tendance, projection
  const tr = tendance(etat, a), cur = lisse(etat, a) ?? dernierPoids(etat, a), h = p.taille / 100;
  const prev = poidsPrevu(etat, a), pr0 = projection(etat, a, 0), pr = projection(etat, a, extraPas);
  let warn = '';
  if (b && p.kcal == null) {
    const brut = Math.round((depense(p, i.poidsRef, o.pas) - needDef) / 50) * 50;
    if (brut < o.kcal) warn += '<div class="note-warn">Pour ' + nf(p.rythme, p.rythme % 1 ? 2 : 0) + ' kg par semaine avec ' + nf(o.pas) + ' pas, il faudrait manger ≈ ' + nf(brut) + ' kcal. C’est trop bas : ton objectif reste à ' + nf(o.kcal) + '. Pour aller plus vite, ajoute des pas : chaque tranche de 2000 pas ≈ ' + nf(Math.round(2000 * 0.0005 * i.poidsRef)) + ' kcal.</div>';
  }
  // Garde-fou muscle : au-delà de ~1 % du poids par semaine, on perd aussi du muscle.
  if (cur && tr != null && -tr / cur > 0.01) warn += '<div class="note-warn">Tu perds ' + nf(-tr, 2) + ' kg par semaine, plus de 1 % de ton poids : c’est rapide, une partie peut venir du muscle. Remonte un peu tes calories (+150 à 200 kcal), garde tes protéines et tes séances.</div>';
  else if (cur && (p.rythme || 0.5) / cur > 0.01) warn += '<div class="note-warn">Ton rythme visé (' + nf(p.rythme, 2) + ' kg par semaine) dépasse 1 % de ton poids. Pour perdre du gras sans perdre de muscle, 0,5 à 0,75 kg par semaine est plus sûr.</div>';
  const projTxt = !pr ? (p.cible ? '' : '<p class="empty-note">Règle un poids visé dans ton profil pour voir quand tu l’atteindras.</p>')
    : '<p style="margin:12px 0 6px">' + (pr.base === 'reel' ? 'À ton rythme réel (' + nf(pr0.kgSem, 2) + ' kg par semaine)' : 'Au rythme visé (pas encore assez de pesées pour le rythme réel)') +
      (extraPas ? ', avec <b>+' + nf(extraPas) + ' pas</b> par jour' : '') + ' : <b>' + nf(p.cible, 1) + ' kg vers ' + moisAnnee(pr.date) + '</b>' +
      (extraPas && pr0 ? ', ' + nf(Math.max(0, Math.round(pr0.semaines - pr.semaines))) + ' semaine' + (Math.round(pr0.semaines - pr.semaines) > 1 ? 's' : '') + ' plus tôt.' : ' (dans ' + nf(Math.round(pr.semaines)) + ' semaines).') + '</p>' +
      '<div class="chips">' + [0, 1000, 2000, 3000].map((x) => '<button class="chip" data-extra="' + x + '" aria-pressed="' + (extraPas === x) + '">' + (x ? '+' + nf(x) + ' pas' : 'Comme maintenant') + '</button>').join('') + '</div>';
  $('#poids-box').innerHTML = '<h3>Mon poids</h3>' +
    '<div class="stats" style="margin-top:10px">' +
    '<div class="stat"><small>Poids lissé</small><b>' + nf(cur, 1) + '</b><span>kg, sans les à-coups</span></div>' +
    '<div class="stat ' + (p.depart && cur < p.depart ? 'good' : '') + '"><small>Depuis le départ</small><b>' + (p.depart && cur ? signe(cur - p.depart) : '–') + '</b><span>départ ' + nf(p.depart, 1) + ' kg</span></div>' +
    '<div class="stat ' + (tr != null && tr < 0 ? 'good' : '') + '"><small>Tendance</small><b>' + (tr == null ? '–' : signe(tr, 2)) + '</b><span>' + (tr == null ? 'il faut 1 semaine de pesées' : 'kg par semaine') + '</span></div>' +
    '<div class="stat"><small>Poids visé</small><b>' + (p.cible ? nf(p.cible, 1) : '–') + '</b><span>' + (pr && pr.base === 'reel' ? 'vers ' + moisAnnee(pr0.date) : p.cible ? 'date dès que ça descend' : 'à régler dans le profil') + '</span></div></div>' +
    (prev ? '<div class="duo"><div><small>Prévu par tes déficits</small><b>' + nf(prev.poids, 1) + '</b> kg<br><span class="meta">' + signe(-prev.perte) + ' kg sur ' + prev.jours + ' jour' + (prev.jours > 1 ? 's' : '') + ' notés</span></div><div><small>Réel (lissé)</small><b>' + nf(cur, 1) + '</b> kg<br><span class="meta">' + (prev.jours >= 14 && cur ? (Math.abs(cur - prev.poids) < 0.8 ? 'Ça colle : les calculs sont justes.' : cur > prev.poids ? 'Tu perds moins que prévu.' : 'Tu perds plus que prévu.') : 'On compare après 2 semaines.') + '</span></div></div>' : '') +
    projTxt +
    (h ? '<p style="margin:12px 0 0">Zone santé pour ' + p.taille + ' cm (IMC 20 à 25) : <b class="num">' + nf(20 * h * h) + ' – ' + nf(25 * h * h) + ' kg</b>. Avec du muscle, l’IMC te classe plus lourd que tu ne l’es : le tour de taille dit mieux.</p>' : '<p class="empty-note">Entre ta taille dans ton profil pour voir ta dépense et ta zone de poids santé.</p>') + warn;

  // Étalonnage
  const et = etalonnage(etat, a);
  const eb = $('#etalon-box');
  eb.hidden = !et || Math.abs(et.facteur - (p.facteur || 1)) < 0.03;
  if (!eb.hidden) {
    eb.innerHTML = '<h3>Ta vraie dépense</h3><p style="margin:8px 0 0">D’après ce que tu as mangé et ce que tu as perdu ces 4 dernières semaines, tu dépenses ≈ <b class="num">' + nf(et.reelle) + ' kcal</b> par jour. Le calcul disait ' + nf(et.estimee) + '.</p>' +
      '<p class="hint">Corriger : tous les calculs (objectif, déficit, poids prévu) utiliseront ' + (et.facteur > 1 ? '+' : '−') + nf(Math.abs(et.facteur - 1) * 100) + ' %.</p><div class="ligne-btns"><button class="btn petit" data-etalon="' + et.facteur + '">Corriger ma dépense</button></div>';
  }

  // Graphiques
  const all = joursTries(etat);
  const days = [];
  if (all.length) { for (let c = range ? decaler(a, -(range - 1)) : all[0]; c <= a; c = decaler(c, 1)) days.push(c); }
  // Courbe du poids prévu : jour après jour depuis le départ.
  const prevu = {};
  if (p.depart && p.dateDepart) { let cum = 0; for (let c = p.dateDepart; c <= a; c = decaler(c, 1)) { prevu[c] = p.depart - cum / KCAL_KG; const d = infoJour(etat, c).def; if (d != null) cum += d; } }
  const courbe = courbeLissee(etat, a);
  chart('#c-poids', days, { kind: 'line', get: (d) => etat.jours[d]?.poids ?? null, avg: (d) => courbe[d] ?? null, ref2: (d) => prevu[d] ?? null, unit: 'kg', dec: 1, ref: p.cible || null, refLab: 'visé' });
  chart('#c-pas', days, { kind: 'bar', get: (d) => etat.jours[d]?.pas ?? null, unit: 'pas', ref: o.pas, refLab: 'objectif' });
  chart('#c-prot', days, { kind: 'bar', get: (d) => { const k = kcalJour(etat.jours[d]); return k != null ? protJour(etat.jours[d]) : null; }, unit: 'g', ref: o.prot, refLab: 'objectif' });
  // Aujourd'hui n'est pas fini : son déficit gonflé fausserait le graphique.
  chart('#c-def', days, { kind: 'bar', get: (d) => (d === a ? null : infoJour(etat, d).def), unit: 'kcal', ref: needDef, refLab: 'visé', signed: true });
  const aTour = days.some((d) => etat.jours[d]?.tour != null);
  $('#g-tour').hidden = !aTour;
  if (aTour) chart('#c-tour', days, { kind: 'line', get: (d) => etat.jours[d]?.tour ?? null, avg: (d) => etat.jours[d]?.tour ?? null, unit: 'cm', dec: 1 });

  renderPlats(a);

  // Semaines
  const wk = {};
  all.forEach((d) => { (wk[lundiDe(d)] ||= []).push(d); });
  const keys = Object.keys(wk).sort().reverse().slice(0, 12);
  const rows = keys.map((k, ix) => {
    const ds = wk[k], P = moyenne(ds.map((d) => courbe[d])), pk = keys[ix + 1], Pp = pk ? moyenne(wk[pk].map((d) => courbe[d])) : null;
    const actifs = ds.filter((d) => infoJour(etat, d).actif).length, seances = ds.filter((d) => etat.jours[d].muscu).length;
    return '<tr><td>' + court(k) + '</td><td class="n">' + nf(moyenne(ds.map((d) => etat.jours[d].pas))) + '</td><td class="n">' + nf(moyenne(ds.map((d) => kcalJour(etat.jours[d])))) + '</td><td class="n">' + actifs + '</td><td class="n">' + seances + '</td><td class="n">' + nf(P, 1) + '</td><td class="n">' + (P != null && Pp != null ? signe(P - Pp) : '–') + '</td></tr>';
  }).join('');
  $('#weeks').innerHTML = '<h3>Par semaine</h3>' + (keys.length ? '<table class="t" style="margin-top:8px"><thead><tr><th>Lundi</th><th class="n">Pas/j</th><th class="n">kcal/j</th><th class="n">🔥</th><th class="n">💪</th><th class="n">Poids</th><th class="n">Écart</th></tr></thead><tbody>' + rows + '</tbody></table><p class="hint" style="margin:8px 0 0">🔥 jours gagnés · 💪 séances de muscu · poids lissé moyen.</p>' : '<p class="empty-note">Tes semaines apparaîtront ici dès ta première journée notée.</p>');
  document.querySelectorAll('#range .chip').forEach((c) => c.setAttribute('aria-pressed', +c.dataset.range === range));
  if (!document.activeElement || !document.activeElement.closest || !document.activeElement.closest('#f-day')) remplirJourEdit();
  renderProfil();
}

// --- Ma semaine : celle-ci face à la précédente
function renderBilan(a) {
  const p = etat.profil, lundi = lundiDe(a);
  const cette = bilanSemaine(etat, lundi, a), passee = bilanSemaine(etat, decaler(lundi, -7), a);
  const carte = (b, titre) => {
    if (!b || (!b.notes && b.pas == null)) return '<div class="bil"><h4>' + titre + '</h4><p class="empty-note">Rien de noté.</p></div>';
    const l = (k, v, bon) => '<li><span>' + k + '</span><b class="num' + (bon === true ? ' ok' : bon === false ? ' ko' : '') + '">' + v + '</b></li>';
    return '<div class="bil"><h4>' + titre + '</h4><ul>' +
      l('Jours gagnés', b.gagnes + '/' + b.jours, b.gagnes >= Math.ceil(b.jours * 0.7)) +
      l('Poids', b.poids == null ? '–' : signe(b.poids) + ' kg', b.poids == null ? null : b.poids <= 0) +
      (b.tour != null ? l('Tour de taille', signe(b.tour) + ' cm', b.tour <= 0) : '') +
      l('Pas / jour', nf(b.pas), b.pas == null ? null : b.pas >= (p.pas || 8000)) +
      l('kcal / jour', nf(b.kcal)) +
      l('Protéines OK', b.protOk + '/' + b.notes, b.notes ? b.protOk >= b.notes * 0.7 : null) +
      l('Séances muscu', b.seances + (p.seances ? '/' + p.seances : ''), p.seances ? (b.seances >= p.seances ? true : null) : null) +
      '</ul></div>';
  };
  let phrase = '';
  if (cette && passee && passee.notes && cette.notes >= 2) {
    const t1 = cette.gagnes / cette.jours, t0 = passee.gagnes / passee.jours, reste = 7 - cette.jours;
    phrase = t1 > t0 + 0.1 ? 'Tu fais mieux que la semaine passée. Continue.'
      : t1 < t0 - 0.1 ? 'Un peu moins bien que la semaine passée' + (reste ? ' : il reste ' + reste + ' jour' + (reste > 1 ? 's' : '') + ' pour remonter.' : '.')
      : 'Dans la lignée de la semaine passée.';
  }
  $('#bilan-box').innerHTML = '<h3>Ma semaine</h3><div class="bilans">' + carte(cette, 'Cette semaine') + carte(passee, 'La semaine passée') + '</div>' + (phrase ? '<p style="margin:10px 0 0">' + phrase + '</p>' : '');
}

// --- Gras et muscle : tour de taille, composition, recomposition
function renderCorps(a) {
  const p = etat.profil, t = tourTaille(etat, a), c = composition(etat, a), rc = recomposition(etat, a);
  const b = bilanSemaine(etat, lundiDe(a), a), cs = causes(etat, a, 28);
  let html = '<h3>Gras et muscle</h3><p class="hint">Ton but : perdre du gras sans perdre de muscle. La balance seule ne le dit pas : le tour de taille, si.</p><div class="stats">';
  html += '<div class="stat ' + (t && t.total < 0 ? 'good' : '') + '"><small>Tour de taille</small><b>' + (t ? nf(t.v, 1) : '–') + '</b><span>' + (t ? (t.mesures > 1 ? signe(t.total) + ' cm depuis le ' + court(t.depuis) : 'cm · première mesure') : 'à mesurer chaque semaine') + '</span></div>';
  html += '<div class="stat ' + (t && t.sur4 != null && t.sur4 < 0 ? 'good' : '') + '"><small>Sur 4 semaines</small><b>' + (t && t.sur4 != null ? signe(t.sur4) : '–') + '</b><span>cm</span></div>';
  if (c) {
    html += '<div class="stat"><small>Masse grasse</small><b>' + nf(c.grasse, 1) + '</b><span>kg · ' + nf(c.gras, 1) + ' %' + (c.dGrasse != null ? ' · ' + signe(c.dGrasse) + ' kg' : '') + '</span></div>';
    html += '<div class="stat ' + (c.dMaigre != null && c.dMaigre >= -0.3 ? 'good' : c.dMaigre != null ? 'bad' : '') + '"><small>Masse maigre</small><b>' + nf(c.maigre, 1) + '</b><span>kg' + (c.dMaigre != null ? ' · ' + signe(c.dMaigre) + ' kg' : '') + '</span></div>';
  }
  html += '</div>';
  const notes = [];
  if (rc) notes.push('<div class="note-ok">En 4 semaines, ton poids a bougé de ' + signe(rc.dPoids) + ' kg, mais ton tour de taille a perdu ' + nf(-rc.dTour, 1) + ' cm : tu perds du gras et tu gardes ton muscle. C’est exactement le but, même si la balance traîne.</div>');
  if (c && c.dMaigre != null) notes.push(c.dMaigre >= -0.3
    ? '<p style="margin:10px 0 0">Ta masse maigre tient (' + signe(c.dMaigre) + ' kg) : ton muscle est protégé.</p>'
    : '<div class="note-warn">Ta masse maigre baisse de ' + nf(-c.dMaigre, 1) + ' kg. Soigne tes protéines, garde tes séances, et ralentis le rythme si ça continue. (Une balance à impédance se trompe souvent : regarde aussi ton tour de taille.)</div>');
  // Les deux leviers du muscle : protéines et séances.
  const leviers = [];
  if (cs.notes >= 5) leviers.push('protéines atteintes <b>' + cs.protOk + ' jours sur ' + cs.notes + '</b> ces 4 semaines');
  if (b && p.seances) leviers.push('<b>' + b.seances + ' séance' + (b.seances > 1 ? 's' : '') + ' sur ' + p.seances + '</b> cette semaine');
  if (leviers.length) notes.push('<p style="margin:10px 0 0">Pour le muscle : ' + leviers.join(', ') + '.</p>');
  if (!t) notes.push('<p class="empty-note">Mesure ton tour de taille dans « Aujourd’hui ». ' + RAPPEL_TOUR + '</p>');
  if (!c) notes.push('<p class="empty-note">Ta balance donne un % de gras ? Note-le avec le tour de taille, ou envoie-le par le Raccourci : l’appli en tirera ta masse grasse et ta masse maigre. Seule la tendance compte, pas le chiffre exact.</p>');
  $('#corps-box').innerHTML = html + notes.join('');
}

// --- Calendrier de la série : 12 semaines, une case par jour
const STATUTS = { gagne: 'Gagné', pas: 'Pas ratés', kcal: 'Calories dépassées', les2: 'Pas et calories ratés', vide: 'Repas pas notés', encours: 'En cours', futur: '' };
function renderCalendrier(a) {
  const fin = decaler(lundiDe(a), 6), debut = decaler(lundiDe(a), -7 * 11);
  let cases = '';
  for (let c = debut; c <= fin; c = decaler(c, 1)) {
    const st = statutJour(etat, c, a);
    cases += '<button class="cal ' + st + (c === calSel ? ' sel' : '') + '" data-cal="' + c + '"' + (st === 'futur' ? ' disabled' : '') + ' aria-label="' + joli(c) + ' : ' + (STATUTS[st] || '') + '">' + (etat.jours[c]?.muscu ? '<i></i>' : '') + '</button>';
  }
  const s = serie(etat, a), rec = meilleureSerie(etat, a);
  let detail = '<p class="hint" style="margin:8px 0 0">Touche une case pour voir le jour.</p>';
  if (calSel) {
    const i = infoJour(etat, calSel), st = statutJour(etat, calSel, a);
    detail = '<p style="margin:8px 0 0"><b>' + nomJour(calSel) + '</b> · ' + (STATUTS[st] || '') + ' · ' + (i.kcal != null ? nf(i.kcal) + ' / ' + nf(i.obj.kcal) + ' kcal' : 'repas pas notés') + ' · ' + nf(i.pas || 0) + ' pas' + (etat.jours[calSel]?.muscu ? ' · 💪' : '') + '</p>';
  }
  $('#cal-box').innerHTML = '<div class="head-row"><h3>Ma série</h3><span class="meta">🔥 ' + s + ' en cours · record ' + rec + '</span></div>' +
    '<div class="calwrap"><div class="caljours"><span>L</span><span></span><span>M</span><span></span><span>V</span><span></span><span>D</span></div><div class="calgrid">' + cases + '</div></div>' +
    '<div class="legende" style="flex-wrap:wrap"><span><i class="lg gagne"></i>gagné</span><span><i class="lg pas"></i>pas</span><span><i class="lg kcal"></i>calories</span><span><i class="lg les2"></i>les deux</span><span><i class="lg vide"></i>pas noté</span><span>• muscu</span></div>' + detail;
}

// --- Ce qui te fait rater
function renderCauses(a) {
  const r = causes(etat, a);
  if (r.juges < 5) { $('#causes-box').innerHTML = '<h3>Ce qui te fait rater</h3><p class="empty-note">Il faut une semaine de journées notées pour en tirer quelque chose.</p>'; return; }
  const li = [];
  li.push('Ces 8 dernières semaines : <b>' + r.gagnes + ' jours gagnés sur ' + r.juges + '</b> (' + Math.round(r.taux * 100) + ' %).');
  const pasT = r.pas + r.les2, kcalT = r.kcal + r.les2;
  if (pasT || kcalT) {
    li.push('Ce qui te coûte le plus : <b>' + (pasT >= kcalT ? 'les pas' : 'les calories') + '</b> (' + Math.max(pasT, kcalT) + ' jours ratés, contre ' + Math.min(pasT, kcalT) + ' pour ' + (pasT >= kcalT ? 'les calories' : 'les pas') + ').');
    if (r.manquePas) li.push('Les jours où les pas manquent, il en manque <b>' + nf(Math.round(r.manquePas / 100) * 100) + '</b> en moyenne : ≈ ' + nf(Math.round(r.manquePas / 100)) + ' min de marche.');
    if (r.depasse) li.push('Quand tu dépasses, c’est de <b>' + nf(Math.round(r.depasse / 10) * 10) + ' kcal</b> en moyenne' + (r.depasse < 300 ? ' : un shaker à l’eau au lieu du lait, ou une demi-portion de féculent, et ça passe.' : '.'));
  }
  if (r.pire) li.push('Le <b>' + r.pire.jour + '</b> est ton jour le plus dur : raté ' + r.pire.rates + ' fois sur ' + r.pire.juges + '. Prévois tes plats la veille (flèche › dans « Aujourd’hui »).');
  if (r.vide) li.push(r.vide + ' jour' + (r.vide > 1 ? 's' : '') + ' sans repas notés : ils ne comptent ni pour la série, ni pour le poids prévu.');
  if (r.notes >= 5) li.push('Protéines atteintes <b>' + r.protOk + ' jours sur ' + r.notes + '</b>.' + (r.protOk < r.notes * 0.7 ? ' Pour garder ton muscle, c’est le chiffre à soigner : un shaker de plus fait +30 g.' : ''));
  $('#causes-box').innerHTML = '<h3>Ce qui te fait rater</h3><ul class="analyse">' + li.map((x) => '<li>' + x + '</li>').join('') + '</ul>';
}

// --- Mes plats
function renderPlats(a) {
  const m = mesPlats(etat, a);
  if (!m.top.length) { $('#plats-box').innerHTML = '<h3>Mes plats</h3><p class="empty-note">Tes plats préférés apparaîtront ici après quelques jours notés.</p>'; return; }
  $('#plats-box').innerHTML = '<h3>Mes plats</h3><p class="hint">Ces 60 derniers jours. Le % : la part de journées gagnées quand ce plat y était.</p><ul class="choix">' +
    m.top.map((s) => {
      const t = s.jours >= 3 && m.taux != null ? s.gagnes / s.jours : null;
      return '<li><div style="display:grid;grid-template-columns:1fr auto;gap:10px;padding:9px 2px;border-top:1px solid var(--line)"><b>' + esc(s.nom) + '</b><span class="meta"><span class="num">' + s.fois + ' fois</span>' + (t != null ? '<span class="prot num" style="' + (t >= m.taux + 0.15 ? 'background:color-mix(in srgb,var(--ok) 18%,transparent);color:var(--ok)' : '') + '">' + Math.round(t * 100) + ' %</span>' : '') + '</span></div></li>';
    }).join('') + '</ul><p class="meta" style="margin-top:8px">Repas moyen : ' + nf(m.moyRepas) + ' kcal · journées gagnées : ' + (m.taux != null ? Math.round(m.taux * 100) + ' %' : '–') + '</p>';
}

function chart(sel, days, o) {
  const el = $(sel), vals = days.map(o.get), ref2 = o.ref2 ? days.map(o.ref2) : [];
  if (!vals.some((v) => v != null)) { el.innerHTML = '<p class="empty-note">Pas encore de données.</p>'; return; }
  const W = Math.max(300, el.clientWidth || 600), H = 170, L = 44, Rr = 8, T = 12, B = 22, iw = W - L - Rr, ih = H - T - B;
  const pool = vals.filter((v) => v != null).concat(o.ref ? [o.ref] : []).concat(o.signed ? [0] : []).concat(ref2.filter((v) => v != null));
  let lo = Math.min(...pool), hi = Math.max(...pool);
  if (o.kind === 'bar' && !o.signed) lo = 0;
  if (o.kind === 'line') { const pad = Math.max(0.5, (hi - lo) * 0.15); lo -= pad; hi += pad; }
  if (hi === lo) hi = lo + 1;
  const r = (hi - lo) / 4, m = Math.pow(10, Math.floor(Math.log10(r))), step = [1, 2, 2.5, 5, 10].find((x) => x * m >= r) * m;
  lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
  const y = (v) => T + ih - ((v - lo) / (hi - lo)) * ih, n = days.length, bw = iw / n, x = (i) => L + bw * (i + 0.5);
  let g = '';
  for (let v = lo; v <= hi + 1e-9; v += step) g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="var(--line)"/><text x="' + (L - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--f-num)">' + nf(v, step < 1 ? 1 : 0) + '</text>';
  const every = Math.ceil(n / 5);
  days.forEach((d, i) => { if (i % every === 0) g += '<text x="' + x(i) + '" y="' + (H - 5) + '" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--f-num)">' + court(d) + '</text>'; });
  if (o.signed && lo < 0) g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="var(--muted)"/>';
  if (o.kind === 'bar') {
    const w = Math.max(2, Math.min(20, bw - 2)), z = y(o.signed ? 0 : lo);
    vals.forEach((v, i) => { if (v == null) return; const yy = y(v); g += '<rect x="' + (x(i) - w / 2) + '" y="' + Math.min(yy, z) + '" width="' + w + '" height="' + Math.max(1, Math.abs(z - yy)) + '" rx="' + Math.min(4, w / 2) + '" fill="' + (v < 0 ? 'var(--warn)' : 'var(--accent)') + '"/>'; });
  } else {
    const path = (arr) => { let s = ''; arr.forEach((v, i) => { if (v != null) s += (s ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }); return s; };
    const p2 = path(ref2);
    if (p2) g += '<path d="' + p2 + '" fill="none" stroke="var(--prot)" stroke-width="2" stroke-dasharray="5 4"/>';
    vals.forEach((v, i) => { if (v != null) g += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3" fill="var(--muted)" opacity=".55"/>'; });
    const p1 = path(days.map(o.avg));
    if (p1) g += '<path d="' + p1 + '" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  if (o.ref && o.ref >= lo && o.ref <= hi) g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + y(o.ref) + '" y2="' + y(o.ref) + '" stroke="var(--muted)" stroke-width="1.2" stroke-dasharray="2 4"/><text x="' + (W - Rr) + '" y="' + (y(o.ref) - 5) + '" text-anchor="end" font-size="11" fill="var(--muted)" font-weight="700">' + o.refLab + ' ' + nf(o.ref, o.dec || 0) + '</text>';
  el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Graphique ' + o.unit + '">' + g + '<rect class="hit" x="' + L + '" y="' + T + '" width="' + iw + '" height="' + ih + '" fill="transparent"/></svg><div class="tt" hidden></div>';
  const svg = el.querySelector('svg'), tt = el.querySelector('.tt');
  const move = (ev) => {
    const rc = svg.getBoundingClientRect(), sx = ((ev.clientX - rc.left) * W) / rc.width, i = Math.max(0, Math.min(n - 1, Math.floor((sx - L) / bw))), v = vals[i];
    if (v == null) { tt.hidden = true; return; }
    tt.hidden = false;
    tt.style.left = Math.max(60, Math.min(rc.width - 60, (x(i) * rc.width) / W)) + 'px';
    tt.style.top = (y(v) * rc.height) / H + 'px';
    tt.textContent = court(days[i]) + ' · ' + nf(v, o.dec || 0) + ' ' + o.unit + (ref2[i] != null ? ' · prévu ' + nf(ref2[i], 1) : '');
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerdown', move);
  svg.addEventListener('pointerleave', () => (tt.hidden = true));
}

function remplirJourEdit() {
  const d = $('#d-date').value || auj();
  $('#d-date').value = d;
  const j = etat.jours[d] || {};
  $('#d-poids').value = j.poids ?? '';
  $('#d-pas').value = j.pas ?? '';
  const viaRepas = j.repas && j.repas.length;
  $('#d-kcal').value = viaRepas ? kcalJour(j) : j.kcal ?? '';
  $('#d-kcal').disabled = !!viaRepas;
  $('#d-tour').value = j.tour ?? '';
  $('#d-gras').value = j.gras ?? '';
  $('#d-muscu').checked = !!j.muscu;
  $('#d-msg').textContent = viaRepas ? 'Calories tirées des repas notés.' : '';
}
const numv = (s) => { const v = $(s).value; return v === '' ? null : Number(v); };

// --- Profil
const RYTHMES = [[0.25, '0,25 kg / sem. (doux)'], [0.5, '0,5 kg / sem. (garde le muscle)'], [0.75, '0,75 kg / semaine'], [1, '1 kg / sem. (risque pour le muscle)']];
function champsProfil(p, avecObjectifs) {
  const o = objectifs({ ...p, kcal: null, prot: null }, p.depart);
  const sel = (v, opts) => opts.map(([k, l]) => '<option value="' + k + '"' + (String(v) === String(k) ? ' selected' : '') + '>' + l + '</option>').join('');
  return '<form class="form" onsubmit="return false">' +
    '<label>Taille (cm)<input class="champ" type="number" id="p-taille" min="120" max="230" inputmode="numeric" value="' + (p.taille ?? '') + '"></label>' +
    '<label>Âge<input class="champ" type="number" id="p-age" min="14" max="100" inputmode="numeric" value="' + (p.age ?? '') + '"></label>' +
    '<label>Sexe<select class="champ" id="p-sexe">' + sel(p.sexe || 'h', [['h', 'Homme'], ['f', 'Femme']]) + '</select></label>' +
    '<label>' + (avecObjectifs ? 'Poids de départ' : 'Poids aujourd’hui') + ' (kg)<input class="champ" type="number" id="p-depart" step="0.1" inputmode="decimal" value="' + (p.depart ?? '') + '"></label>' +
    '<label>Poids visé (kg)<input class="champ" type="number" id="p-cible" step="0.5" inputmode="decimal" placeholder="optionnel" value="' + (p.cible ?? '') + '"></label>' +
    '<label>Rythme<select class="champ" id="p-rythme">' + sel(p.rythme ?? 0.5, RYTHMES) + '</select></label>' +
    '<label>Objectif pas / jour<input class="champ" type="number" id="p-pas" step="500" inputmode="numeric" value="' + (p.pas ?? 8000) + '"></label>' +
    '<label>Séances de muscu / semaine<input class="champ" type="number" id="p-seances" step="1" min="0" max="7" inputmode="numeric" value="' + (p.seances ?? 3) + '"></label>' +
    (avecObjectifs ? '<label>Objectif kcal / jour<input class="champ" type="number" id="p-kcal" step="50" inputmode="numeric" placeholder="auto : ' + nf(o.kcal) + '" value="' + (p.kcal ?? '') + '"></label>' +
      '<label>Protéines / jour (g)<input class="champ" type="number" id="p-prot" step="5" inputmode="numeric" placeholder="auto : ' + nf(o.prot) + '" value="' + (p.prot ?? '') + '"></label>' : '') +
    (avecObjectifs ? '<div class="full"><label style="margin-bottom:6px">Alerte du soir</label><button class="chip" data-notifs aria-pressed="' + (p.notifs !== false) + '">Me prévenir si ma série est en jeu</button></div>' : '') +
    '<div class="full"><label style="margin-bottom:6px">Allergènes à éviter</label><p class="hint" style="margin:0 0 8px">Lactose et gluten : les ingrédients passent à leur version « sans ». Œufs : les plats qui en ont sont masqués.</p><div class="allerg">' + Object.entries(ALLERGENES).map(([k, v]) => '<button class="chip" data-allerg="' + k + '" aria-pressed="' + (p.allergenes || []).includes(k) + '">' + v.n + '</button>').join('') + '</div></div>' +
    '</form>';
}
function lireProfil(p) {
  const v = (s) => ($(s) ? numv(s) : undefined);
  const r = { ...p, taille: v('#p-taille'), age: v('#p-age'), sexe: $('#p-sexe').value, depart: v('#p-depart'), cible: v('#p-cible'), rythme: Number($('#p-rythme').value), pas: v('#p-pas') || 8000, seances: v('#p-seances') ?? 3 };
  if ($('#p-kcal')) { r.kcal = v('#p-kcal'); r.prot = v('#p-prot'); }
  r.allergenes = [...document.querySelectorAll('[data-allerg][aria-pressed="true"]')].map((b) => b.dataset.allerg);
  if ($('[data-notifs]')) r.notifs = $('[data-notifs]').getAttribute('aria-pressed') === 'true';
  return r;
}
function renderProfil() {
  if (document.activeElement && document.activeElement.closest && document.activeElement.closest('#profil-box')) return;
  $('#profil-box').innerHTML = '<h3>Mon profil</h3><p class="hint">Laisse « auto » pour que l’appli calcule tes objectifs. Le poids de départ et sa date servent au poids prévu.</p>' +
    champsProfil(etat.profil, true) + '<div class="ligne-btns"><button class="btn" data-profil-ok>Enregistrer le profil</button><span class="meta" id="p-msg"></span></div>';
}

// ===========================================================================
//  PREMIER LANCEMENT
// ===========================================================================
let brouillon = null;
function renderAccueil() {
  const ac = $('#accueil');
  ac.hidden = !!etat.profil.pret;
  // Vidé une fois fini : ses champs portent les mêmes id que ceux du profil.
  if (ac.hidden) { ac.innerHTML = ''; return; }
  brouillon ||= { sexe: 'h', rythme: 0.5, pas: 8000, allergenes: [], ...etat.profil };
  const o = brouillon.taille && brouillon.age && brouillon.depart ? objectifs({ ...brouillon, kcal: null, prot: null }, brouillon.depart) : null;
  ac.innerHTML = '<div class="wrap"><h1>Cuisine <b>180</b></h1><p class="lead">Quelques questions, une seule fois. Elles servent à calculer tes calories, tes protéines et ton poids prévu. Tout reste sur ton iPhone.</p>' +
    '<div class="box">' + champsProfil(brouillon, false) + '<div class="ligne-btns"><button class="btn sec" data-accueil-calc>Calculer mes objectifs</button></div></div>' +
    (o ? '<div class="resume"><small style="opacity:.75;text-transform:uppercase;letter-spacing:.07em;font-weight:700;font-size:12px">Tes objectifs par jour</small><div class="trio"><div><b>' + nf(o.kcal) + '</b><small>kcal</small></div><div><b>' + nf(o.prot) + '</b><small>g de protéines</small></div><div><b>' + nf(o.pas) + '</b><small>pas</small></div></div>' +
      '<p style="margin:12px 0 0;font-size:14px;opacity:.85">Tu peux tout changer plus tard dans Suivi › Mon profil.</p></div>' +
      '<button class="btn" style="padding:14px" data-accueil-ok>C’est parti</button>' : '') +
    '</div>';
}

// ===========================================================================
//  Rendu et événements
// ===========================================================================
function tout() {
  renderJour();
  if (onglet === 'recettes') { renderQ(); renderGrid(); }
  if (onglet === 'suivi') renderSuivi();
  if (onglet === 'courses') renderCourses();
  if (onglet === 'guide') renderGuide();
  if (openId) renderFiche();
}
function renderGuide() {
  const o = infoJour(etat, auj()).obj, sh = SHAKERS[0], reste = o.prot - sh.p, parRepas = Math.round(reste / 2 / 5) * 5;
  $('#calcul-jour').innerHTML = '<h3>Le calcul du jour</h3><p><span class="num">' + o.prot + ' g</span> de protéines à atteindre.</p><p>Shaker : <span class="num">' + sh.p + ' g</span>. Il reste <span class="num">' + reste + ' g</span>.</p>' +
    '<p>Donc ≈ <b class="num">' + parRepas + ' g</b> par repas, au dîner et au souper.</p><p>Calories : <span class="num">' + nf(o.kcal) + ' − ' + sh.k + '</span> = ≈ <span class="num">' + nf(o.kcal - sh.k) + ' kcal</span>, soit ≈ <span class="num">' + nf(Math.round((o.kcal - sh.k) / 2 / 10) * 10) + '</span> par repas au maximum.</p>';
}
function changerOnglet(t) {
  onglet = t;
  document.querySelectorAll('nav.tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === t));
  ['jour', 'recettes', 'suivi', 'courses', 'guide'].forEach((x) => ($('#tab-' + x).hidden = x !== t));
  window.scrollTo(0, 0);
  if (t === 'recettes') renderCats();
  requestAnimationFrame(tout);
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'voile') return fermerSheet();
  const t = e.target.closest('button');
  if (!t || t.disabled) return;
  const a = auj();
  const d = t.dataset;

  if (d.tab) return changerOnglet(d.tab);
  if (d.close !== undefined) return fermerSheet();
  if (d.open) return ouvrirFiche(d.open);
  // Depuis l'onglet Recettes, on ajoute toujours à aujourd'hui.
  const depuisRecettes = () => { if (onglet !== 'jour') vu = a; };
  const dansJournal = () => { const li = t.closest('li'), liste = (etat.jours[vu] || {}).repas || []; return [liste, liste.findIndex((r) => r.n === li.dataset.n)]; };
  if (d.ajoute) {
    const r = byId(d.ajoute), panneau = !!$('#a-q');
    if (!r) return;
    depuisRecettes(); fermerSheet();
    return ajouterRepas(r, 1, panneau ? ajoutPrevu : futur());
  }
  if (d.prevoir) { const r = byId(d.prevoir); if (r) { depuisRecettes(); fermerSheet(); ajouterRepas(r, 1, true); } return; }
  if (d.reprendre) { const o = autresRecents[+d.reprendre]; if (o) { fermerSheet(); ajouterRepas(o, 1, ajoutPrevu); } return; }
  if (d.mode) { ajoutPrevu = d.mode === 'prevu'; document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', b === t)); return; }
  if (d.shaker) return ajouterRepas(SHAKERS.find((s) => s.id === d.shaker));
  if (d.ajoutPlat !== undefined) return ouvrirAjoutPlat();
  if (d.ajoutAutre !== undefined) return ouvrirAjoutAutre();
  if (d.off !== undefined) return chercherProduit($('#off-q').value);
  if (d.produit) {
    const p = trouves[+d.produit];
    if (!p) return;
    const nom = nomProduit(p);
    produit = { nom, k100: Number(p.nutriments['energy-kcal_100g']) || 0, p100: Number(p.nutriments.proteins_100g) || 0 };
    $('#o-nom').value = nom;
    $('#o-g-l').hidden = false;
    $('#o-g').value = Math.round(Number(p.serving_quantity) || 100);
    recalculerProduit();
    $('#off-res').innerHTML = '<p class="empty-note">' + esc(nom) + ' : ' + nf(produit.k100) + ' kcal et ' + nf(produit.p100, 1) + ' g de protéines pour 100 g.</p>';
    return $('#o-g').focus();
  }
  if (d.scanner !== undefined) { ouvrirUrl('shortcuts://run-shortcut?name=' + encodeURIComponent('Cuisine 180 scanner')); return toast('Ouverture du Raccourci « Cuisine 180 scanner »…'); }
  if (d.autreOk !== undefined) {
    let nom = $('#o-nom').value.trim();
    const k = numv('#o-k'), p = numv('#o-p') || 0, g = produit ? numv('#o-g') : null;
    if (!nom || k == null) { $('#o-msg').textContent = 'Il faut au moins un nom et des calories.'; return; }
    if (g) nom += ' (' + g + ' g)';
    fermerSheet();
    return ajouterRepas({ id: 'autre', nom, k, p }, 1);
  }
  if (d.x) {
    const [liste, ix] = dansJournal();
    if (ix >= 0) { liste[ix].x = Math.max(0.5, Math.min(6, liste[ix].x + Number(d.x))); sauver(); tout(); }
    return;
  }
  if (d.suppr !== undefined) {
    const [liste, ix] = dansJournal();
    if (ix < 0) return;
    const [e2] = liste.splice(ix, 1);
    sauver(); tout();
    return toast('« ' + e2.nom.slice(0, 22) + ' » retiré', () => liste.splice(ix, 0, e2));
  }
  if (d.manger !== undefined) {
    const [liste, ix] = dansJournal();
    if (ix < 0) return;
    const e2 = liste[ix];
    delete e2.prevu; sauver(); tout();
    return toast('Mangé · ' + nf(e2.k * e2.x) + ' kcal', () => { e2.prevu = true; });
  }
  if (d.toutManger !== undefined) {
    const prevus = (etat.jours[vu].repas || []).filter((e2) => e2.prevu);
    prevus.forEach((e2) => delete e2.prevu); sauver(); tout();
    return toast(prevus.length + ' plat' + (prevus.length > 1 ? 's' : '') + ' cochés', () => prevus.forEach((e2) => (e2.prevu = true)));
  }
  if (d.comme) {
    const j = jour(vu), avant = (j.repas || []).slice(), prevu = vu >= a;
    j.repas = avant.concat((etat.jours[d.comme].repas || []).map((e2) => { const c = { ...e2, n: id() }; if (prevu) c.prevu = true; else delete c.prevu; return c; }));
    sauver(); tout();
    return toast(prevu ? 'Menu repris, à cocher quand c\u2019est mangé' : 'Menu repris', () => { j.repas = avant; });
  }
  if (d.muscu !== undefined) { const j = jour(vu); if (j.muscu) delete j.muscu; else j.muscu = true; sauver(); tout(); return toast(j.muscu ? 'Séance notée 💪' : 'Séance retirée'); }
  if (d.mesureEdit !== undefined) { mesureEdit = true; renderJour(); return $('#tour-v')?.focus(); }
  if (d.mesures !== undefined) {
    const t = numv('#tour-v'), g = numv('#gras-v'), j = jour(vu);
    if (t == null && g == null) return toast('Entre au moins ton tour de taille.');
    if (t != null && (t < 40 || t > 200)) return toast('Le tour de taille se donne en centimètres, par exemple 98.');
    if (g != null && (g < 3 || g > 60)) return toast('Le % de gras va de 3 à 60.');
    if (t != null) j.tour = t;
    if (g != null) j.gras = g;
    mesureEdit = false; sauver(); tout(); return toast('Mesures notées');
  }
  if (d.extra !== undefined) { extraPas = +d.extra; return renderSuivi(); }
  if (d.cal) { calSel = calSel === d.cal ? null : d.cal; return renderCalendrier(a); }
  if (d.vu) { vu = decaler(vu, +d.vu); if (vu > decaler(a, 2)) vu = decaler(a, 2); peseeEdit = pasEdit = false; return tout(); }
  if (d.yazioJour !== undefined) { const txt = texteYazioJour(vu); if (!txt) return toast('Rien à copier pour l\u2019instant.'); return copier(txt, $('#copie-jour')); }
  if (d.pesee !== undefined) {
    const v = numv('#pesee-v');
    if (!v || v < 30 || v > 300) return toast('Entre ton poids en kilos, par exemple 95,4.');
    jour(vu).poids = Math.round(v * 10) / 10; jour(vu).poidsMain = true; peseeEdit = false; sauver(); return tout();
  }
  if (d.peseeEdit !== undefined) { peseeEdit = true; renderJour(); return $('#pesee-v')?.focus(); }
  if (d.pasEdit !== undefined) { pasEdit = !pasEdit; renderJour(); return $('#pas-v')?.focus(); }
  if (d.pasOk !== undefined) { const v = numv('#pas-v'); if (v != null) { jour(vu).pas = Math.round(v); delete jour(vu).pasMaj; } pasEdit = false; sauver(); return tout(); }

  if (d.col) { coll = d.col; sauver(); return renderQ(); }
  if (d.cp) { const [k, v] = d.cp.split(':'); comp[k] = v; sauver(); return renderQ(); }
  if (d.cat) { cat = d.cat; renderCats(); return renderGrid(); }
  if (d.mult) { mult = +d.mult; return renderFiche(); }
  if (d.copieAchat !== undefined) return copier($('#sheet').dataset.achat, $('#copie-achat'));
  if (d.copieYazio !== undefined) return copier($('#sheet').dataset.yazio, $('#copie-yazio'));
  if (t.id === 'copy-day') return copier($('#day-buy').dataset.copy, $('#copied-day'));
  if (d.pt) { placard.has(d.pt) ? placard.delete(d.pt) : placard.add(d.pt); sauver(); t.setAttribute('aria-pressed', placard.has(d.pt)); return; }
  if (t.id === 'clear-pantry') { placard.clear(); sauver(); return tout(); }

  if (d.range !== undefined) { range = +d.range; return renderSuivi(); }
  if (t.id === 'd-save') {
    const c = $('#d-date').value || a, j = jour(c);
    for (const [k, s] of [['poids', '#d-poids'], ['pas', '#d-pas']]) { const v = numv(s); if (v == null) delete j[k]; else j[k] = v; }
    if (j.poids != null) j.poidsMain = true; else delete j.poidsMain;
    for (const [k, s] of [['tour', '#d-tour'], ['gras', '#d-gras']]) { const v = numv(s); if (v == null) delete j[k]; else j[k] = v; }
    if ($('#d-muscu').checked) j.muscu = true; else delete j.muscu;
    if (!(j.repas && j.repas.length)) { const v = numv('#d-kcal'); if (v == null) delete j.kcal; else j.kcal = v; }
    sauver(); tout(); $('#d-msg').textContent = 'Enregistré.'; return;
  }
  if (d.allerg || d.notifs !== undefined) { t.setAttribute('aria-pressed', t.getAttribute('aria-pressed') !== 'true'); return; }
  if (d.profilOk !== undefined) {
    const p = lireProfil(etat.profil);
    if (!p.depart) { $('#p-msg').textContent = 'Il faut au moins ton poids de départ.'; return; }
    etat.profil = p; regleAllergenes(p.allergenes); sauver(); tout(); $('#p-msg').textContent = 'Profil enregistré.'; return;
  }
  if (d.etalon) { etat.profil.facteur = Math.round((etat.profil.facteur || 1) * Number(d.etalon) * 100) / 100; sauver(); toast('Dépense corrigée.'); return tout(); }

  if (d.accueilCalc !== undefined) {
    brouillon = lireProfil(brouillon);
    if (!brouillon.taille || !brouillon.age || !brouillon.depart) return toast('Il manque la taille, l’âge ou le poids.');
    if (brouillon.age < 18) return toast('Cette appli est faite pour les adultes.');
    renderAccueil();
    return $('#accueil').scrollTo({ top: 1e5, behavior: 'smooth' });
  }
  if (d.accueilOk !== undefined) {
    etat.profil = { ...brouillon, pret: true, dateDepart: a, kcal: null, prot: null, facteur: 1 };
    if (jour(a).poids == null) { jour(a).poids = brouillon.depart; jour(a).poidsMain = true; }
    regleAllergenes(etat.profil.allergenes);
    sauver(); renderAccueil(); return tout();
  }
});
document.addEventListener('change', (e) => {
  if (e.target.dataset.have) { const k = e.target.dataset.have; e.target.checked ? placard.add(k) : placard.delete(k); sauver(); tout(); }
  if (e.target.id === 'd-date') remplirJourEdit();
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'a-q') { recherche = e.target.value; renderAjoutPlat(); }
  if (e.target.id === 'q') renderGrid();
  if (e.target.id === 'o-g') recalculerProduit();
});
$('#sort').addEventListener('change', renderGrid);

// Si l'appli reste ouverte après minuit, la journée change sous nos yeux.
let jourAffiche = auj();
setInterval(() => { if (auj() !== jourAffiche && !openId) { if (vu === jourAffiche) vu = auj(); jourAffiche = auj(); tout(); } }, 30000);
let rz;
window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => onglet === 'suivi' && renderSuivi(), 150); });

renderAccueil();
remplirJourEdit();
tout();
// Ouvert depuis un bouton du widget ou le Raccourci scanner.
if (OUVRIR && etat.profil.pret) {
  if (OUVRIR.action === 'plat') ouvrirAjoutPlat();
  else if (OUVRIR.action === 'autre') ouvrirAjoutAutre();
  else if (OUVRIR.action === 'code') ouvrirAjoutAutre(String(OUVRIR.code || ''));
  else if (OUVRIR.action === 'shaker') ajouterRepas(SHAKERS[0], 1, false);
  else if (OUVRIR.action === 'poids') { peseeEdit = true; renderJour(); setTimeout(() => $('#pesee-v')?.focus(), 300); }
}
