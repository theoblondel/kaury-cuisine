// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: utensils;

// ===========================================================================
//  KAURY CUISINE (Cuisine 180) — repas, calories, pas, poids et muscle pour
//  iPhone, dans l'app Scriptable
//
//  Un seul fichier, trois usages :
//    · widget (écran d'accueil ou verrouillé) : calories qui restent, série…
//    · appli (on touche le widget ou on lance le script) : journal du jour,
//      recettes, suivi du poids, courses, guide ;
//    · Raccourcis : lancé avec tes pas (et ton poids) lus dans Santé, il les
//      note dans la journée, prévient le soir si la série est en jeu, et rend
//      la main sans rien ouvrir. Lancé avec un code-barres scanné, il ouvre
//      la fiche du produit (Open Food Facts).
//
//  Les données sont un fichier JSON dans iCloud Drive/Scriptable/
//  (cuisine-180.json) : lisible et sauvegardable depuis le PC.
//
//  Fichier GÉNÉRÉ par build.mjs depuis src/ : ne pas le modifier à la main,
//  modifier les sources puis relancer `node build.mjs`.
//
//  https://github.com/theoblondel/kaury-cuisine · Licence MIT · Kaury Studio
//  Produits du commerce : Open Food Facts (ODbL), openfoodfacts.org
// ===========================================================================

const FICHIER = 'cuisine-180.json';

/*@calculs*/

// ---------------------------------------------------------------------------
//  Données
// ---------------------------------------------------------------------------
function gestionnaire() {
  try {
    const fm = FileManager.iCloud();
    fm.documentsDirectory();
    return fm;
  } catch (e) {
    return FileManager.local();
  }
}

function premieresDonnees() {
  return {
    version: 1,
    profil: { pret: false, taille: null, age: null, sexe: 'h', depart: null, dateDepart: null, cible: null,
      rythme: 0.5, pas: 8000, seances: 3, kcal: null, prot: null, allergenes: [], facteur: 1 },
    jours: {},
    placard: [],
    comp: { pro: 'poulet', fec: 'riz', leg: 'surg', sau: 'curry' },
    col: 'quotidien',
  };
}

async function lire() {
  const fm = gestionnaire();
  const chemin = fm.joinPath(fm.documentsDirectory(), FICHIER);
  if (!fm.fileExists(chemin)) {
    const d = premieresDonnees();
    fm.writeString(chemin, JSON.stringify(d, null, 2));
    return d;
  }
  if (fm.isFileStoredIniCloud && fm.isFileStoredIniCloud(chemin)) await fm.downloadFileFromiCloud(chemin);
  try {
    return JSON.parse(fm.readString(chemin));
  } catch (e) {
    // Fichier abîmé (édition à la main ratée) : on le met de côté plutôt que
    // de l'écraser, pour ne rien perdre.
    fm.move(chemin, chemin.replace(/\.json$/, '-abime-' + Date.now() + '.json'));
    const d = premieresDonnees();
    fm.writeString(chemin, JSON.stringify(d, null, 2));
    return d;
  }
}

function ecrire(donnees) {
  const fm = gestionnaire();
  fm.writeString(fm.joinPath(fm.documentsDirectory(), FICHIER), JSON.stringify(donnees, null, 2));
}

// ---------------------------------------------------------------------------
//  Raccourcis : pas et poids venus de Santé
// ---------------------------------------------------------------------------
// Accepte un nombre (les pas), un texte (« 6 240 », « 6’240 pas ») ou un
// dictionnaire { pas, poids }. Renvoie ce qui a été compris.
function lireNombre(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  const t = String(v).replace(/[\s  '’]/g, '').replace(',', '.').match(/-?\d+(\.\d+)?/);
  return t ? Number(t[0]) : null;
}
function depuisRaccourci(donnees, param, maintenant) {
  let pas = null, poids = null, gras = null, tour = null, muscu = null;
  if (param && typeof param === 'object') {
    pas = lireNombre(param.pas ?? param.steps ?? param.Pas);
    poids = lireNombre(param.poids ?? param.weight ?? param.Poids);
    gras = lireNombre(param.gras ?? param.bodyfat ?? param.Gras);
    tour = lireNombre(param.tour ?? param.waist ?? param.Tour);
    muscu = lireNombre(param.muscu ?? param.Muscu);
  } else pas = lireNombre(param);
  const cle = cleJour(maintenant);
  const j = (donnees.jours[cle] ||= {});
  const fait = [];
  if (pas != null && pas >= 0 && pas < 200000) {
    j.pas = Math.round(pas);
    j.pasMaj = maintenant.toISOString();
    fait.push(j.pas + ' pas');
  }
  // Le poids de Santé ne remplace pas une pesée notée à la main dans l'appli.
  if (poids != null && poids >= 30 && poids <= 300 && !j.poidsMain) {
    j.poids = Math.round(poids * 10) / 10;
    fait.push(j.poids + ' kg');
  }
  // Santé donne parfois le % de gras en fraction (0,22) : on le remet en %.
  if (gras != null && gras > 0 && gras <= 1) gras *= 100;
  if (gras != null && gras >= 3 && gras <= 60 && j.gras == null) {
    j.gras = Math.round(gras * 10) / 10;
    fait.push(j.gras + ' % de gras');
  }
  if (tour != null && tour >= 40 && tour <= 200 && j.tour == null) {
    j.tour = Math.round(tour * 2) / 2;
    fait.push(j.tour + ' cm de tour de taille');
  }
  // `muscu` : minutes (ou nombre) d'entraînements de force du jour, lus dans Santé.
  if (muscu != null && muscu > 0 && !j.muscu) {
    j.muscu = true;
    fait.push('séance de muscu');
  }
  return fait;
}

// Un code-barres scanné : 8 à 14 chiffres (les pas, eux, n'en ont jamais plus de 6),
// ou un dictionnaire { code }.
function codeScanne(param) {
  if (param && typeof param === 'object') param = param.code ?? param.Code ?? null;
  if (param == null) return null;
  const t = String(param).trim().replace(/^code\s*[:=]?\s*/i, '');
  return /^\d{8,14}$/.test(t) ? t : null;
}

// Le soir (dès 17 h), une notification si la journée n'est pas encore gagnée.
// Au plus une toutes les 3 heures : les automatisations de 18 h et 22 h suffisent.
async function alerter(d, maintenant) {
  const p = d.profil || {};
  if (!p.pret || p.notifs === false || maintenant.getHours() < 17) return null;
  if (d.alerte && maintenant.getTime() - new Date(d.alerte).getTime() < 3 * 3600e3) return null;
  const a = alerteSoir(d, cleJour(maintenant));
  if (!a) return null;
  const n = new Notification();
  n.title = a.titre;
  n.body = a.corps;
  n.threadIdentifier = 'cuisine-180';
  n.openURL = URLScheme.forRunningScript();
  await n.schedule();
  d.alerte = maintenant.toISOString();
  return a;
}

// Le dimanche dès 20 h, le bilan de la semaine en une notification (une seule fois).
async function bilanDimanche(d, maintenant) {
  const p = d.profil || {}, cle = cleJour(maintenant);
  if (!p.pret || p.notifs === false || maintenant.getDay() !== 0 || maintenant.getHours() < 20 || d.bilanEnvoye === cle) return null;
  const b = texteBilan(d, cle);
  if (!b) return null;
  const n = new Notification();
  n.title = b.titre;
  n.body = b.corps;
  n.threadIdentifier = 'cuisine-180';
  n.openURL = URLScheme.forRunningScript();
  await n.schedule();
  d.bilanEnvoye = cle;
  return b;
}

// ---------------------------------------------------------------------------
//  Widget
// ---------------------------------------------------------------------------
const C = {
  fond: Color.dynamic(new Color('#F2F4EF'), new Color('#111612')),
  encre: Color.dynamic(new Color('#18201A'), new Color('#E6ECE5')),
  doux: Color.dynamic(new Color('#5C6A5F'), new Color('#9AA89D')),
  piste: Color.dynamic(new Color('#DCE3D6'), new Color('#28322A')),
  vert: Color.dynamic(new Color('#2C6A4C'), new Color('#6DBE93')),
  prot: Color.dynamic(new Color('#A87708'), new Color('#F0BB3E')),
  bleu: Color.dynamic(new Color('#3D7CC0'), new Color('#7FB3E8')),
  feu: Color.dynamic(new Color('#D9481C'), new Color('#FF8A5B')),
};
const nb1 = (n) => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');

function texte(s, t, taille, poids, couleur) {
  const x = s.addText(t);
  x.font = poids === 'gros' ? Font.heavyRoundedSystemFont(taille) : poids === 'gras' ? Font.boldSystemFont(taille) : Font.mediumSystemFont(taille);
  x.textColor = couleur || C.encre;
  x.lineLimit = 1;
  x.minimumScaleFactor = 0.6;
  return x;
}
// Barre de progression en piles (les couleurs suivent clair / sombre, une image non).
function barre(s, ratio, largeur, couleur) {
  const piste = s.addStack();
  piste.size = new Size(largeur, 6);
  piste.cornerRadius = 3;
  piste.backgroundColor = C.piste;
  const r = Math.max(0, Math.min(1, ratio || 0));
  if (r > 0) {
    const plein = piste.addStack();
    plein.size = new Size(Math.max(6, largeur * r), 6);
    plein.cornerRadius = 3;
    plein.backgroundColor = couleur;
  }
  piste.addSpacer();
}
function ligneJauge(w, nom, val, ratio, couleur, largeur) {
  const l = w.addStack();
  l.centerAlignContent();
  texte(l, nom, 11, 'gras', C.doux);
  l.addSpacer();
  texte(l, val, 11, 'gras', C.encre);
  w.addSpacer(3);
  barre(w, ratio, largeur, couleur);
}

// Boutons du widget moyen et grand (iOS ne rend pas les piles touchables sur le petit).
const SCANNER = 'shortcuts://run-shortcut?name=' + encodeURIComponent('Cuisine 180 scanner');
function boutons(w, grand) {
  const ici = URLScheme.forRunningScript();
  const rang = w.addStack();
  rang.centerAlignContent();
  const b = (txt, url) => {
    const s = rang.addStack();
    s.url = url;
    s.backgroundColor = C.piste;
    s.cornerRadius = 9;
    s.setPadding(5, 10, 5, 10);
    texte(s, txt, 12, 'gras', C.encre);
  };
  b('+ Shaker', ici + '?ouvrir=shaker');
  rang.addSpacer(6);
  b('+ Plat', ici + '?ouvrir=plat');
  rang.addSpacer(6);
  b('Scanner', SCANNER);
  if (grand) { rang.addSpacer(6); b('Poids', ici + '?ouvrir=poids'); }
  rang.addSpacer();
}

// Courbe du poids sur 30 jours (moyenne 7 j) + point du poids prévu.
function courbePoids(d, auj, largeur, hauteur) {
  const pts = [];
  const lisses = courbeLissee(d, auj);
  for (let i = 29; i >= 0; i--) pts.push(lisses[decaler(auj, -i)] ?? null);
  const vals = pts.filter((v) => v != null);
  if (vals.length < 2) return null;
  const prev = poidsPrevu(d, auj);
  const tous = prev ? vals.concat([prev.poids]) : vals;
  let lo = Math.min(...tous), hi = Math.max(...tous);
  if (hi - lo < 1) { const m = (hi + lo) / 2; lo = m - 0.5; hi = m + 0.5; }
  const ctx = new DrawContext();
  ctx.size = new Size(largeur, hauteur);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const x = (i) => 4 + (i / 29) * (largeur - 8), y = (v) => 4 + (1 - (v - lo) / (hi - lo)) * (hauteur - 8);
  // Couleurs fixes, lisibles sur fond clair comme sombre.
  const chemin = new Path();
  let premier = true;
  pts.forEach((v, i) => { if (v == null) return; const p = new Point(x(i), y(v)); premier ? chemin.move(p) : chemin.addLine(p); premier = false; });
  ctx.addPath(chemin);
  ctx.setStrokeColor(new Color('#4E9A72'));
  ctx.setLineWidth(3);
  ctx.strokePath();
  if (prev) {
    ctx.setFillColor(new Color('#D9A21B'));
    ctx.fillEllipse(new Rect(x(29) - 4, y(prev.poids) - 4, 8, 8));
  }
  return ctx.getImage();
}

function construireWidget(d, famille) {
  const auj = cleJour(new Date());
  const w = new ListWidget();
  const minuit = new Date();
  minuit.setHours(24, 0, 30, 0);
  w.refreshAfterDate = new Date(Math.min(minuit.getTime(), Date.now() + 15 * 60 * 1000));

  if (!d.profil || !d.profil.pret) {
    if (famille && famille.startsWith('accessory')) { w.addText('Ouvre Cuisine 180'); return w; }
    w.backgroundColor = C.fond;
    texte(w, 'Cuisine 180', 15, 'gros', C.vert);
    w.addSpacer(6);
    const t = w.addText('Touche ici pour régler ton profil.');
    t.font = Font.mediumSystemFont(13);
    t.textColor = C.doux;
    return w;
  }

  const i = infoJour(d, auj), o = i.obj;
  const mange = i.kcal || 0, reste = o.kcal - mange, trop = reste < 0;
  const s = serie(d, auj);
  const flamme = '🔥 ' + s;

  if (famille === 'accessoryInline') { w.addText((trop ? '+' : '') + nb(Math.abs(reste)) + ' kcal · ' + flamme); return w; }
  if (famille === 'accessoryCircular') {
    w.addAccessoryWidgetBackground = true;
    const n = w.addText(nb(Math.abs(reste)));
    n.font = Font.heavyRoundedSystemFont(15);
    n.minimumScaleFactor = 0.6;
    n.centerAlignText();
    const l = w.addText(trop ? 'de trop' : 'kcal');
    l.font = Font.mediumSystemFont(9);
    l.centerAlignText();
    const f = w.addText(flamme);
    f.font = Font.mediumSystemFont(9);
    f.centerAlignText();
    return w;
  }
  if (famille === 'accessoryRectangular') {
    const t = w.addText(nb(Math.abs(reste)) + (trop ? ' kcal de trop' : ' kcal restantes'));
    t.font = Font.heavySystemFont(14);
    const l = w.addText(flamme + ' · ' + nb(i.pas || 0) + ' pas');
    l.font = Font.systemFont(12);
    const p = w.addText(nb(i.prot) + ' / ' + nb(o.prot) + ' g protéines');
    p.font = Font.systemFont(12);
    return w;
  }

  w.backgroundColor = C.fond;
  w.setPadding(14, 15, 12, 15);
  const petit = famille === 'small';

  const tete = w.addStack();
  tete.centerAlignContent();
  texte(tete, petit ? 'Cuisine' : 'Cuisine 180', petit ? 13 : 14, 'gros', C.vert);
  tete.addSpacer();
  texte(tete, flamme, petit ? 13 : 14, 'gros', s ? C.feu : C.doux);
  w.addSpacer(petit ? 6 : 8);

  const bloc = (cible, largeur) => {
    texte(cible, trop ? 'DÉPASSÉ DE' : 'IL TE RESTE', 10, 'gras', C.doux);
    const g = cible.addStack();
    g.bottomAlignContent();
    texte(g, nb(Math.abs(reste)), famille === 'large' || famille === 'extraLarge' ? 36 : 30, 'gros', trop ? C.feu : C.encre);
    g.addSpacer(3);
    texte(g, 'kcal', 13, 'gras', C.doux);
    cible.addSpacer(4);
    barre(cible, mange / o.kcal, largeur, trop ? C.feu : C.vert);
  };

  if (petit) {
    bloc(w, 125);
    w.addSpacer();
    texte(w, nb(i.pas || 0) + ' pas · ' + nb(i.prot) + ' g', 11, 'gras', C.doux);
    return w;
  }

  // Moyen et grand : les calories à gauche, protéines et pas à droite.
  const cols = w.addStack();
  cols.layoutHorizontally();
  const g = cols.addStack();
  g.layoutVertically();
  bloc(g, 135);
  cols.addSpacer(16);
  const dr = cols.addStack();
  dr.layoutVertically();
  dr.addSpacer(4);
  ligneJauge(dr, 'Protéines', nb(i.prot) + ' / ' + nb(o.prot) + ' g', i.prot / o.prot, C.prot, 130);
  dr.addSpacer(9);
  ligneJauge(dr, 'Pas', nb(i.pas || 0) + ' / ' + nb(o.pas), (i.pas || 0) / o.pas, C.bleu, 130);
  const grand = famille === 'large' || famille === 'extraLarge';
  w.addSpacer(grand ? 12 : 8);
  boutons(w, grand);

  if (grand) {
    w.addSpacer(12);
    const m7 = lisse(d, auj) ?? dernierPoids(d, auj), prev = poidsPrevu(d, auj), dc = dateCible(d, auj);
    const t = w.addStack();
    t.centerAlignContent();
    texte(t, 'POIDS · 30 JOURS', 10, 'gras', C.doux);
    t.addSpacer();
    if (d.profil.depart && m7) texte(t, (m7 - d.profil.depart > 0 ? '+' : '−') + nb1(Math.abs(m7 - d.profil.depart)) + ' kg depuis le départ', 10, 'gras', m7 < d.profil.depart ? C.vert : C.doux);
    w.addSpacer(6);
    const img = courbePoids(d, auj, 300, 90);
    if (img) {
      const im = w.addImage(img);
      im.imageSize = new Size(300, 90);
      im.centerAlignImage();
    } else {
      const v = w.addText('La courbe apparaît après 2 pesées.');
      v.font = Font.mediumSystemFont(12);
      v.textColor = C.doux;
    }
    w.addSpacer(8);
    const bas = w.addStack();
    const col = (titre, val, coul) => {
      const c = bas.addStack();
      c.layoutVertically();
      texte(c, titre, 10, 'gras', C.doux);
      texte(c, val, 15, 'gros', coul || C.encre);
    };
    col('RÉEL', m7 ? nb1(m7) + ' kg' : '–');
    bas.addSpacer();
    col('PRÉVU', prev ? nb1(prev.poids) + ' kg' : '–', C.prot);
    bas.addSpacer();
    const mois = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    col('VISÉ', d.profil.cible ? nb1(d.profil.cible) + (dc ? ' · ' + mois[Number(dc.slice(5, 7)) - 1] + ' ' + dc.slice(2, 4) : ' kg') : '–', C.vert);
    // Le tour de taille dit mieux que la balance si le gras part et que le muscle reste.
    const tt = tourTaille(d, auj);
    if (tt) { bas.addSpacer(); col('TOUR', nb1(tt.v) + (tt.mesures > 1 ? ' (' + (tt.total > 0 ? '+' : '−') + nb1(Math.abs(tt.total)) + ')' : ''), tt.total < 0 ? C.vert : C.encre); }
  }
  w.addSpacer();
  return w;
}

// ---------------------------------------------------------------------------
//  Appli (page HTML dans une WebView)
// ---------------------------------------------------------------------------
const PAGE = /*@page*/'';

function pageHtml(donnees, ouvrir) {
  // « < » échappé pour qu'un nom de plat ne puisse pas fermer la balise <script>.
  const json = JSON.stringify(donnees).replace(/</g, '\\u003c');
  // __OUVRIR__ d'abord : les données injectées ensuite ne peuvent plus être prises pour un marqueur.
  return PAGE.replace('__OUVRIR__', () => JSON.stringify(ouvrir || null).replace(/</g, '\\u003c')).replace('__ETAT__', () => json);
}

// La page demande une URL (Open Food Facts) : le script la charge, sans CORS.
async function repondreWeb(wv, m) {
  let texte = null;
  try {
    const r = new Request(m.url);
    r.headers = { 'User-Agent': 'Cuisine180/1.0 (Scriptable, usage perso)' };
    r.timeoutInterval = 12;
    texte = await r.loadString();
  } catch (e) {}
  try { await wv.evaluateJavaScript('window.__web(' + JSON.stringify(m.id) + ',' + JSON.stringify(texte) + ')'); } catch (e) {}
}

async function ouvrirApp(donnees, ouvrir) {
  const wv = new WebView();
  await wv.loadHTML(pageHtml(donnees, ouvrir));
  let ouvert = true;
  const traiter = (json) => {
    for (const m of JSON.parse(json)) {
      if (m.type === 'etat') ecrire(m.etat);
      else if (m.type === 'copier') Pasteboard.copy(m.texte);
      else if (m.type === 'url') Safari.open(m.url);
      else if (m.type === 'web') repondreWeb(wv, m);
    }
  };
  // Boucle d'écoute : la page rend la main à chaque modification.
  (async () => {
    while (ouvert) {
      try {
        const json = await wv.evaluateJavaScript('window.__attendre(completion)', true);
        if (json) traiter(json);
      } catch (e) {
        break;
      }
    }
  })();
  await wv.present(true);
  ouvert = false;
  // Filet de sécurité : dernier état relu à la fermeture.
  try {
    const json = await wv.evaluateJavaScript('JSON.stringify(etat)');
    if (json) ecrire(JSON.parse(json));
  } catch (e) {}
}

// ---------------------------------------------------------------------------
const donnees = await lire();
const param = args.shortcutParameter;
const demande = (args.queryParameters || {}).ouvrir || null;
const code = codeScanne(param);
if (code) {
  // Raccourci « Cuisine 180 scanner » : la fiche du produit s'ouvre dans l'appli.
  if (config.runsInApp) await ouvrirApp(donnees, { action: 'code', code });
  else Script.setShortcutOutput('Cuisine 180 : active « Run In App » sur l\u2019action Run Script pour voir le produit ' + code + '.');
} else if (param != null && param !== '') {
  // Raccourci des pas : on note, on prévient si besoin, on ne montre rien.
  const maintenant = new Date();
  const fait = depuisRaccourci(donnees, param, maintenant);
  const alerte = fait.length ? await alerter(donnees, maintenant) : null;
  const bilan = fait.length ? await bilanDimanche(donnees, maintenant) : null;
  if (fait.length) ecrire(donnees);
  Script.setShortcutOutput(fait.length
    ? 'Cuisine 180 : ' + fait.join(', ') + (alerte ? ' · alerte envoyée' : '') + (bilan ? ' · bilan envoyé' : '')
    : 'Cuisine 180 : rien compris dans « ' + String(JSON.stringify(param)).slice(0, 60) + ' »');
} else if (config.runsInWidget) {
  Script.setWidget(construireWidget(donnees, config.widgetFamily));
} else {
  await ouvrirApp(donnees, demande ? { action: demande } : null);
  // Aperçu du widget à jour quand on lance depuis l'app Scriptable.
  Script.setWidget(construireWidget(await lire(), 'large'));
}
Script.complete();
