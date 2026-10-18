// ===========================================================================
//  Recettes, ingrédients, allergènes, compositeur, texte Yazio, assiettes.
//  Repris du carnet Cuisine 180 (version web). Tourne dans la page seule.
// ===========================================================================

const ING = {
  poulet:{n:"Blanc de poulet",r:"Viande",tip:"Filets surgelés en sac : moins chers."},
  hache:{n:"Haché de bœuf 5 %",r:"Viande",tip:"5 % de gras maximum sur l'étiquette."},
  dinde:{n:"Dinde en tranches",r:"Frais",tip:"Choisis « maigre »."},
  jambon:{n:"Jambon",r:"Frais",tip:"Choisis « dégraissé »."},
  oeufs:{n:"Œufs",r:"Frais"},
  sere:{n:"Séré maigre",r:"Frais",tip:"Bien « maigre », pas demi-gras. Gros pot."},
  cottage:{n:"Cottage cheese",r:"Frais"},
  lait:{n:"Lait demi-écrémé",r:"Frais",tip:"≈ 3,3 g de protéines pour 100 ml, comme tous les laits de vache."},
  parmesan:{n:"Parmesan",r:"Frais"},
  "fromage-rape":{n:"Fromage râpé",r:"Frais"},
  "fromage-tranche":{n:"Fromage en tranches allégé",r:"Frais"},
  riz:{n:"Riz",r:"Épicerie"}, pates:{n:"Pâtes",r:"Épicerie"},
  lentilles:{n:"Lentilles vertes",r:"Épicerie"}, "lentilles-corail":{n:"Lentilles corail",r:"Épicerie"},
  "pois-chiches":{n:"Pois chiches en boîte",r:"Épicerie"}, flocons:{n:"Flocons d'avoine",r:"Épicerie"},
  "tomates-concassees":{n:"Tomates concassées",r:"Épicerie"}, "sauce-tomate":{n:"Sauce tomate nature",r:"Épicerie"},
  huile:{n:"Huile d'olive",r:"Épicerie"}, epices:{n:"Épices (paprika, cumin…)",r:"Épicerie"},
  curry:{n:"Curry en poudre",r:"Épicerie"}, cannelle:{n:"Cannelle",r:"Épicerie"}, moutarde:{n:"Moutarde",r:"Épicerie"},
  whey:{n:"Whey",r:"Épicerie",tip:"75 g de protéines ou plus pour 100 g."},
  "pain-complet":{n:"Pain complet",r:"Boulangerie"}, tortillas:{n:"Tortillas",r:"Boulangerie"}, "pain-burger":{n:"Pain à burger",r:"Boulangerie"},
  pdt:{n:"Pommes de terre",r:"Fruits et légumes"}, legumes:{n:"Légumes au choix",r:"Fruits et légumes",tip:"Surgelés : moins chers."},
  oignon:{n:"Oignon",r:"Fruits et légumes"}, ail:{n:"Ail",r:"Fruits et légumes"}, poivron:{n:"Poivron",r:"Fruits et légumes"},
  tomate:{n:"Tomate",r:"Fruits et légumes"}, salade:{n:"Salade verte",r:"Fruits et légumes"}, concombre:{n:"Concombre",r:"Fruits et légumes"},
  citron:{n:"Citron",r:"Fruits et légumes"}, champignons:{n:"Champignons",r:"Fruits et légumes"}, epinards:{n:"Épinards",r:"Fruits et légumes"},
  brocoli:{n:"Brocoli",r:"Fruits et légumes"}, carottes:{n:"Carottes",r:"Fruits et légumes"}, banane:{n:"Banane",r:"Fruits et légumes"},
  "petits-pois":{n:"Petits pois",r:"Surgelés"}, "fruits-rouges":{n:"Fruits rouges",r:"Surgelés"},
  thon:{n:"Thon au naturel (boîte)",r:"Épicerie",tip:"« Au naturel » ou « à l'eau », pas à l'huile."},
  crevettes:{n:"Crevettes décortiquées",r:"Surgelés",tip:"Le sac surgelé est bien moins cher."},
  tofu:{n:"Tofu nature",r:"Frais",tip:"« Ferme » : il se tient à la cuisson."},
  semoule:{n:"Semoule (couscous)",r:"Épicerie"}, "haricots-rouges":{n:"Haricots rouges en boîte",r:"Épicerie"},
  mais:{n:"Maïs en boîte",r:"Épicerie"}, "sauce-soja":{n:"Sauce soja",r:"Épicerie"}
};
const CATS = {poulet:"Poulet", boeuf:"Bœuf", poisson:"Thon et crevettes", oeufs:"Œufs et jambon", vege:"Végé", sucre:"Sucré"};

// [clé, quantité, unité, précision]
const R = [
 {id:"poulet-riz",nom:"Poulet, riz et légumes",cat:"poulet",p:80,k:720,m:25,art:["riz","poulet","legumes","sere"],
  ing:[["poulet",180,"g"],["riz",80,"g","poids sec"],["legumes",250,"g"],["epices",null,"au goût"],["sere",250,"g","en dessert"],["cannelle",null,"au goût","sur le séré"]],
  st:["Cuis le riz dans l'eau salée.","Coupe le poulet en dés. Saisis-le 6 à 8 min à la poêle avec les épices.","Fais sauter les légumes 5 min dans la même poêle.","Sers. Le séré à la cannelle en dessert."]},
 {id:"bolo",nom:"Bolognaise maigre",cat:"boeuf",p:82,k:790,m:25,art:["pates","boeuf","tomate","fromage"],
  ing:[["pates",80,"g","poids sec"],["hache",180,"g"],["sauce-tomate",200,"g"],["oignon",0.5,""],["ail",1,"gousse"],["parmesan",20,"g"],["sere",200,"g","en dessert"]],
  st:["Fais revenir l'oignon et l'ail émincés.","Ajoute le haché. Fais-le dorer 5 min en l'émiettant.","Verse la sauce tomate. Laisse mijoter 10 min.","Cuis les pâtes. Mélange. Parmesan dessus."]},
 {id:"chili",nom:"Chili lentilles et bœuf",cat:"boeuf",p:81,k:900,m:35,art:["riz","boeuf","lentilles","tomate"],
  ing:[["hache",150,"g"],["lentilles",60,"g","poids sec"],["tomates-concassees",400,"g","1 boîte"],["oignon",1,""],["poivron",1,""],["epices",null,"au goût","cumin, paprika"],["riz",50,"g","poids sec"],["sere",200,"g","dessus ou en dessert"]],
  st:["Fais revenir l'oignon et le poivron.","Ajoute le haché et les épices. Dore 5 min.","Ajoute les lentilles, les tomates et 200 ml d'eau. Mijote 25 min.","Sers avec le riz et une cuillère de séré dessus."]},
 {id:"omelette",nom:"Omelette géante",cat:"oeufs",p:88,k:835,m:15,art:["oeuf","jambon","legumes","pain"],
  ing:[["oeufs",4,""],["jambon",100,"g"],["champignons",100,"g"],["epinards",100,"g"],["pain-complet",2,"tranche"],["sere",200,"g","en dessert"]],
  st:["Fais revenir les champignons, puis les épinards.","Bats les œufs. Ajoute le jambon coupé.","Verse sur les légumes. Cuis à feu moyen, couvercle fermé, 5 min.","Avec le pain. Séré en dessert."]},
 {id:"poelee",nom:"Poêlée paysanne",cat:"oeufs",p:81,k:895,m:25,art:["pdt","oeuf","dinde","legumes"],
  ing:[["pdt",300,"g"],["oeufs",3,""],["dinde",125,"g"],["oignon",1,""],["poivron",1,""],["huile",1,"c. à c."],["sere",200,"g","en dessert"]],
  st:["Coupe les pommes de terre en dés. Cuis-les 10 min à l'eau.","Fais-les dorer à la poêle avec l'huile, l'oignon et le poivron.","Ajoute la dinde en lanières.","Casse les œufs dessus. Couvre 4 min."]},
 {id:"wraps",nom:"Wraps au poulet",cat:"poulet",p:77,k:775,m:20,art:["pain","poulet","legumes","sere"],
  ing:[["tortillas",2,""],["poulet",200,"g"],["salade",null,"une poignée"],["tomate",1,""],["concombre",0.5,""],["sere",100,"g","pour la sauce"],["ail",1,"gousse","pour la sauce"],["fromage-rape",30,"g"]],
  st:["Cuis le poulet en lanières avec un peu d'épices.","Sauce : séré + ail râpé + sel + herbes.","Garnis les tortillas : sauce, salade, tomate, concombre, poulet, fromage.","Roule. Passe 1 min à la poêle si tu veux du croustillant."]},
 {id:"curry",nom:"Curry poulet et pois chiches",cat:"poulet",p:79,k:790,m:30,art:["riz","curry","poulet","legumes"],
  ing:[["poulet",180,"g"],["pois-chiches",150,"g","½ boîte égouttée"],["legumes",200,"g"],["sauce-tomate",150,"g"],["curry",1,"c. à s."],["riz",50,"g","poids sec"],["sere",150,"g","en dessert"]],
  st:["Saisis le poulet en dés avec le curry.","Ajoute les légumes, les pois chiches et la sauce tomate.","Mijote 15 min.","Sers avec le riz."]},
 {id:"porridge",nom:"Porridge protéiné",cat:"sucre",p:78,k:810,m:8,art:["avoine","sere","banane"],
  ing:[["flocons",70,"g"],["lait",250,"ml"],["whey",30,"g","1 dose"],["banane",1,""],["sere",300,"g"],["cannelle",null,"au goût"]],
  st:["Cuis les flocons dans le lait 4 min, ou 2 min au micro-ondes.","Hors du feu, mélange la whey.","Ajoute le séré et la banane en rondelles.","Cannelle dessus."]},
 {id:"gratin",nom:"Gratin de pâtes au poulet",cat:"poulet",p:77,k:765,m:35,art:["pates","poulet","brocoli","fromage"],
  ing:[["pates",80,"g","poids sec"],["poulet",150,"g"],["cottage",200,"g","à la place de la crème"],["brocoli",200,"g"],["fromage-rape",20,"g"]],
  st:["Cuis les pâtes et le brocoli ensemble, 8 min.","Saisis le poulet en dés.","Mélange tout avec le cottage cheese, sel, poivre.","Fromage dessus. Four à 200 °C, 15 min."]},
 {id:"hachis",nom:"Hachis Parmentier maigre",cat:"boeuf",p:75,k:770,m:40,art:["pdt","boeuf","carottes"],
  ing:[["pdt",300,"g"],["lait",100,"ml"],["hache",180,"g"],["carottes",1,""],["oignon",1,""],["fromage-rape",30,"g"],["sere",150,"g","en dessert"]],
  st:["Cuis les pommes de terre. Écrase-les avec le lait.","Fais revenir l'oignon, la carotte râpée et le haché.","Dans un plat : viande en bas, purée dessus, fromage.","Four à 200 °C, 15 min."]},
 {id:"burger",nom:"Burger maison maigre",cat:"boeuf",p:74,k:675,m:30,art:["pain","boeuf","carottes","legumes"],
  ing:[["pain-burger",1,""],["hache",200,"g"],["fromage-tranche",1,"tranche"],["salade",null,"quelques feuilles"],["tomate",1,""],["oignon",0.5,""],["sere",150,"g","pour la sauce"],["moutarde",1,"c. à c.","pour la sauce"],["carottes",150,"g","en frites"]],
  st:["Frites : carottes en bâtonnets, four à 220 °C, 25 min.","Forme un gros steak avec le haché. Cuis 3 à 4 min de chaque côté.","Sauce : séré + moutarde + paprika.","Monte le burger. Le reste de sauce pour tremper les frites."]},
 {id:"tandoori",nom:"Poulet tandoori et raïta",cat:"poulet",p:79,k:755,m:30,art:["riz","curry","poulet","sere"],
  ing:[["poulet",200,"g"],["sere",200,"g","moitié marinade, moitié raïta"],["curry",1,"c. à s.","ou épices tandoori"],["citron",0.5,""],["riz",100,"g","poids sec"],["concombre",0.5,""]],
  st:["Marinade : 100 g de séré, épices, jus de citron. Mélange avec le poulet. 15 min minimum.","Cuis le poulet à la poêle bien chaude, 8 min.","Raïta : 100 g de séré + concombre râpé + sel.","Sers avec le riz."]},
 {id:"shakshuka",nom:"Shakshuka à la dinde",cat:"oeufs",p:86,k:875,m:25,art:["tomate","oeuf","dinde","pain"],
  ing:[["oeufs",4,""],["tomates-concassees",400,"g","1 boîte"],["poivron",1,""],["oignon",1,""],["dinde",100,"g"],["epices",null,"au goût","cumin, paprika"],["pain-complet",1,"tranche"],["sere",200,"g","en dessert"]],
  st:["Fais revenir l'oignon et le poivron.","Ajoute les tomates, les épices et la dinde en lanières. Mijote 10 min.","Fais 4 creux. Casse un œuf dans chacun.","Couvre 6 min. Mange avec le pain."]},
 {id:"dahl",nom:"Dahl de lentilles aux œufs",cat:"vege",p:75,k:800,m:30,art:["lentilles","oeuf","sere"],
  ing:[["lentilles-corail",120,"g","poids sec"],["tomates-concassees",200,"g"],["oignon",1,""],["ail",1,"gousse"],["curry",1,"c. à s."],["oeufs",2,"","durs"],["sere",250,"g","100 g dessus, le reste en dessert"]],
  st:["Fais revenir l'oignon, l'ail et le curry.","Ajoute les lentilles, les tomates et 400 ml d'eau. Cuis 15 min.","Cuis les œufs 9 min. Écale-les.","Sers avec les œufs coupés et le séré dessus."]},
 {id:"cantonais",nom:"Riz cantonais protéiné",cat:"oeufs",p:80,k:900,m:20,art:["riz","oeuf","jambon","petitspois"],
  ing:[["riz",70,"g","poids sec, idéalement cuit la veille"],["oeufs",3,""],["jambon",100,"g","en dés"],["petits-pois",150,"g"],["oignon",0.5,""],["sere",200,"g","en dessert"]],
  st:["Cuis le riz. Laisse-le refroidir.","Brouille les œufs à la poêle. Réserve.","Fais sauter l'oignon, les petits pois et le jambon.","Ajoute le riz et les œufs. Un peu de sauce soja si tu en as."]},
 {id:"carbo",nom:"Pâtes carbo légères",cat:"oeufs",p:78,k:780,m:15,art:["pates","jambon","fromage","oeuf"],
  ing:[["pates",80,"g","poids sec"],["oeufs",2,""],["jambon",120,"g","en dés"],["parmesan",20,"g"],["sere",200,"g","en dessert"]],
  st:["Cuis les pâtes. Garde un fond d'eau de cuisson.","Bats les œufs avec le parmesan et du poivre.","Dore le jambon à la poêle.","Hors du feu : pâtes + jambon + œufs + un peu d'eau. Mélange vite."]},
 {id:"salade",nom:"Salade complète au poulet",cat:"poulet",p:78,k:715,m:25,art:["legumes","poulet","pdt","oeuf"],
  ing:[["poulet",200,"g"],["pdt",250,"g"],["oeufs",2,"","durs"],["salade",null,"un grand bol"],["tomate",1,""],["sere",100,"g","pour la sauce"],["moutarde",1,"c. à c."],["huile",1,"c. à c."]],
  st:["Cuis les pommes de terre et les œufs.","Grille le poulet en tranches.","Sauce : séré + moutarde + huile + sel.","Mélange tout dans un grand bol."]},
 {id:"pancakes",nom:"Pancakes protéinés",cat:"sucre",p:76,k:710,m:15,art:["avoine","fruits","sere"],
  ing:[["flocons",60,"g","mixés"],["oeufs",2,""],["whey",30,"g","1 dose"],["sere",250,"g","150 g dans la pâte, 100 g dessus"],["fruits-rouges",100,"g"]],
  st:["Mixe les flocons. Mélange avec les œufs, la whey et 150 g de séré.","Cuis des petites crêpes épaisses, 2 min par côté.","Chauffe les fruits rouges 2 min.","Sers avec le reste de séré et les fruits."]},
 {id:"bowl",nom:"Bol séré, banane, avoine",cat:"sucre",p:81,k:720,m:3,art:["sere","avoine","banane"],
  ing:[["sere",400,"g"],["whey",30,"g","1 dose"],["flocons",60,"g"],["banane",1,""],["cannelle",null,"au goût"]],
  st:["Mélange le séré et la whey.","Ajoute les flocons et la banane.","Cannelle. C'est prêt."]},
 {id:"boulettes",nom:"Boulettes sauce tomate et purée",cat:"boeuf",p:77,k:795,m:35,art:["boeuf","tomate","pdt","legumes"],
  ing:[["hache",180,"g"],["oeufs",1,""],["sauce-tomate",200,"g"],["pdt",300,"g"],["lait",100,"ml"],["legumes",200,"g"],["sere",150,"g","en dessert"]],
  st:["Mélange le haché, l'œuf, sel et épices. Forme des boulettes.","Dore-les, puis ajoute la sauce tomate. Mijote 10 min.","Purée : pommes de terre cuites écrasées avec le lait.","Avec les légumes."]},
 {id:"poulet-four",nom:"Poulet citron-ail au four",cat:"poulet",p:79,k:700,m:40,art:["poulet","pdt","legumes"],
  ing:[["poulet",200,"g"],["pdt",300,"g"],["legumes",250,"g"],["citron",0.5,""],["ail",2,"gousse"],["huile",1,"c. à c."],["sere",200,"g","en dessert"]],
  st:["Coupe les pommes de terre et les légumes. Mets-les sur une plaque.","Pose le poulet dessus. Citron, ail écrasé, huile, sel.","Four à 200 °C, 30 à 35 min.","Séré en dessert."]},
 {id:"assiette",nom:"Assiette froide express",cat:"oeufs",p:77,k:730,m:12,art:["dinde","sere","oeuf","pain","legumes"],
  ing:[["dinde",150,"g"],["cottage",200,"g"],["oeufs",2,"","durs"],["pain-complet",2,"tranche"],["concombre",0.5,""],["tomate",1,""]],
  st:["Cuis les œufs 9 min.","Coupe les légumes.","Dispose tout sur une assiette. Pas de cuisson pour le reste."]},
 {id:"poulet-champi",nom:"Poulet aux champignons et pâtes",cat:"poulet",p:76,k:685,m:25,art:["pates","poulet","champignons"],
  ing:[["poulet",180,"g"],["champignons",200,"g"],["pates",80,"g","poids sec"],["sere",100,"g","pour la sauce"],["lait",50,"ml","pour la sauce"],["parmesan",15,"g"]],
  st:["Cuis les pâtes.","Saisis le poulet. Ajoute les champignons. 6 min.","Hors du feu : séré + lait + parmesan. Mélange pour faire une sauce.","Mélange avec les pâtes."]},
 /* --- Faciles, ajoutées le 18.10.2026 : p et k calculés par test/nutrition.mjs --- */
 {id:"thon-pates",nom:"Pâtes au thon et à la tomate",cat:"poisson",p:75,k:680,m:15,art:["pates","thon","tomate"],
  ing:[["pates",80,"g","poids sec"],["thon",150,"g","1 grande boîte égouttée"],["sauce-tomate",200,"g"],["oignon",0.5,""],["sere",200,"g","en dessert"]],
  st:["Cuis les pâtes.","Pendant ce temps, fais revenir l'oignon émincé 3 min.","Ajoute la sauce tomate et le thon émietté. Chauffe 5 min.","Mélange avec les pâtes. Séré en dessert."]},
 {id:"salade-thon",nom:"Salade de riz au thon et maïs",cat:"poisson",p:78,k:810,m:15,art:["riz","thon","mais","legumes"],
  ing:[["riz",80,"g","poids sec"],["thon",150,"g","égoutté"],["mais",100,"g"],["tomate",1,""],["concombre",0.5,""],["cottage",250,"g"],["citron",0.5,"","le jus"]],
  st:["Cuis le riz. Rince-le à l'eau froide.","Coupe la tomate et le concombre en dés.","Mélange tout avec le thon, le maïs et le cottage cheese.","Citron, sel, poivre. Se garde 2 jours au frigo."]},
 {id:"crevettes-riz",nom:"Riz sauté aux crevettes",cat:"poisson",p:82,k:800,m:15,art:["riz","crevettes","petitspois","oeuf"],
  ing:[["riz",80,"g","poids sec, cuit la veille si possible"],["crevettes",250,"g","décortiquées"],["petits-pois",100,"g"],["oeufs",1,""],["sauce-soja",1,"c. à s."],["huile",1,"c. à c."],["sere",100,"g","en dessert"]],
  st:["Cuis le riz (ou prends celui de la veille).","Saisis les crevettes 3 min dans l'huile. Réserve.","Fais sauter le riz et les petits pois. Casse l'œuf, brouille.","Remets les crevettes, sauce soja. Mélange 1 min."]},
 {id:"crevettes-ail",nom:"Pâtes aux crevettes, ail et citron",cat:"poisson",p:78,k:705,m:12,art:["pates","crevettes"],
  ing:[["pates",80,"g","poids sec"],["crevettes",250,"g","décortiquées"],["ail",2,"gousse"],["huile",2,"c. à c."],["citron",0.5,""],["sere",150,"g","en dessert"]],
  st:["Cuis les pâtes.","Fais dorer l'ail émincé dans l'huile, 1 min.","Ajoute les crevettes. 3 min de chaque côté.","Pâtes dans la poêle, jus de citron, poivre."]},
 {id:"wrap-thon",nom:"Wraps thon-maïs",cat:"poisson",p:79,k:790,m:10,art:["pain","thon","mais","sere"],
  ing:[["tortillas",2,""],["thon",150,"g","égoutté"],["mais",60,"g"],["salade",null,"une poignée"],["sere",100,"g","pour la sauce"],["moutarde",1,"c. à c.","pour la sauce"],["fromage-rape",20,"g"],["sere",100,"g","en dessert"]],
  st:["Sauce : séré + moutarde + sel + poivre.","Mélange le thon, le maïs et la moitié de la sauce.","Garnis les tortillas : salade, mélange au thon, fromage.","Roule. Le reste du séré en dessert."]},
 {id:"bowl-mexicain",nom:"Bowl mexicain au bœuf",cat:"boeuf",p:77,k:785,m:20,art:["riz","boeuf","haricots","mais"],
  ing:[["hache",200,"g"],["haricots-rouges",120,"g","égouttés"],["mais",80,"g"],["riz",60,"g","poids sec"],["tomate",1,""],["epices",null,"au goût","cumin, paprika"],["sere",150,"g","comme crème"]],
  st:["Cuis le riz.","Dore le haché avec les épices, 5 min.","Ajoute les haricots et le maïs. Chauffe 3 min.","Dans un bol : riz, viande, tomate en dés, séré dessus."]},
 {id:"oeufs-toast",nom:"Œufs brouillés, toasts et dinde",cat:"oeufs",p:76,k:770,m:10,art:["oeuf","pain","dinde","tomate"],
  ing:[["oeufs",3,""],["pain-complet",2,"tranche"],["dinde",100,"g"],["tomate",1,""],["cottage",200,"g"]],
  st:["Bats les œufs avec sel et poivre.","Cuis-les à feu doux en remuant, 2-3 min. Retire-les encore crémeux.","Grille le pain.","Sers avec la dinde, la tomate et le cottage cheese."]},
 {id:"omelette-thon",nom:"Omelette au thon et fromage",cat:"oeufs",p:77,k:700,m:10,art:["oeuf","thon","fromage","pain"],
  ing:[["oeufs",4,""],["thon",100,"g","égoutté"],["fromage-rape",20,"g"],["salade",null,"une poignée"],["pain-complet",1,"tranche"],["sere",100,"g","en dessert"]],
  st:["Bats les œufs. Ajoute le thon émietté.","Verse dans une poêle chaude. Fromage dessus.","Couvre, feu doux, 4 min.","Avec la salade et le pain."]},
 {id:"croque",nom:"Croque-monsieur protéiné",cat:"oeufs",p:79,k:745,m:10,art:["pain","jambon","fromage"],
  ing:[["pain-complet",3,"tranche"],["jambon",100,"g"],["fromage-tranche",2,"tranche"],["moutarde",1,"c. à c."],["cottage",100,"g","à tartiner"],["sere",200,"g","en dessert"]],
  st:["Tartine le pain de cottage cheese et d'un peu de moutarde.","Garnis de jambon et de fromage.","Poêle sans huile, couvercle, 3 min de chaque côté.","Séré en dessert."]},
 {id:"poulet-paprika",nom:"Poulet paprika et semoule",cat:"poulet",p:76,k:680,m:15,art:["semoule","poulet","legumes"],
  ing:[["poulet",200,"g"],["semoule",70,"g"],["legumes",200,"g"],["huile",1,"c. à c."],["epices",null,"au goût","paprika, sel"],["sere",150,"g","en dessert"]],
  st:["Verse 100 ml d'eau bouillante sur la semoule. Couvre 5 min.","Saisis le poulet en dés avec le paprika, 6 min.","Ajoute les légumes. 5 min.","Égrène la semoule à la fourchette. Sers."]},
 {id:"couscous",nom:"Couscous express au poulet",cat:"poulet",p:78,k:730,m:15,art:["semoule","poulet","curry","legumes"],
  ing:[["semoule",70,"g"],["poulet",180,"g"],["pois-chiches",100,"g","égouttés"],["legumes",150,"g"],["epices",null,"au goût","cumin, ras-el-hanout"],["sere",150,"g","en dessert"]],
  st:["Semoule : 100 ml d'eau bouillante, couvre 5 min.","Dore le poulet en dés avec les épices.","Ajoute les légumes et les pois chiches. 5 min.","Sers sur la semoule."]},
 {id:"pates-brocoli",nom:"Pâtes poulet-brocoli au parmesan",cat:"poulet",p:82,k:735,m:15,art:["pates","poulet","brocoli","fromage"],
  ing:[["pates",80,"g","poids sec"],["poulet",180,"g"],["brocoli",200,"g"],["parmesan",20,"g"],["ail",1,"gousse"],["sere",150,"g","en dessert"]],
  st:["Cuis les pâtes. Ajoute le brocoli 4 min avant la fin.","Saisis le poulet en dés avec l'ail.","Égoutte. Mélange tout.","Parmesan dessus."]},
 {id:"salade-pates",nom:"Salade de pâtes au poulet",cat:"poulet",p:76,k:770,m:15,art:["pates","poulet","tomate","sere"],
  ing:[["pates",70,"g","poids sec"],["poulet",180,"g"],["tomate",1,""],["concombre",0.5,""],["cottage",200,"g","pour la sauce"],["huile",2,"c. à c."],["moutarde",1,"c. à c."]],
  st:["Cuis les pâtes. Rince-les à l'eau froide.","Cuis le poulet en lanières. Laisse tiédir.","Sauce : cottage + huile + moutarde + sel.","Mélange tout. Se garde 2 jours : idéal pour l'emporter."]},
 {id:"tofu-riz",nom:"Tofu sauté, riz et brocoli",cat:"vege",p:75,k:795,m:20,art:["riz","tofu","brocoli"],
  ing:[["tofu",250,"g","nature, ferme"],["riz",60,"g","poids sec"],["brocoli",250,"g"],["sauce-soja",1,"c. à s."],["ail",1,"gousse"],["sere",250,"g","en dessert"]],
  st:["Cuis le riz.","Coupe le tofu en dés. Dore-le à la poêle 8 min sans le remuer trop.","Ajoute le brocoli, l'ail, la sauce soja et 3 c. à s. d'eau. Couvre 5 min.","Sers sur le riz."]},
 {id:"bol-fruits",nom:"Bol séré, fruits rouges et flocons",cat:"sucre",p:78,k:645,m:3,art:["sere","fruits","avoine"],
  ing:[["sere",450,"g"],["whey",20,"g","⅔ de dose"],["flocons",50,"g"],["fruits-rouges",150,"g","décongelés"],["cannelle",null,"au goût"]],
  st:["Mélange le séré et la whey.","Ajoute les fruits rouges et leur jus.","Flocons dessus.","Cannelle. Prêt."]}
];

/* ---------- Quotidien : un panier fixe, des assiettes composées ---------- */
const PRO={
 poulet:{n:"Poulet",cat:"poulet",ing:[["poulet",200,"g"]],p:46,k:220,art:"poulet",st:"Coupe le poulet en dés. Saisis-le 6 à 8 min dans une poêle bien chaude."},
 hache:{n:"Haché de bœuf",cat:"boeuf",ing:[["hache",180,"g"]],p:38,k:225,art:"boeuf",st:"Fais dorer le haché 5 min à la poêle, en l'émiettant."},
 oeufs:{n:"Œufs et jambon",cat:"oeufs",ing:[["oeufs",2,""],["jambon",150,"g","en dés"]],p:43,k:310,art:"oeuf",st:"Dore le jambon en dés. Ajoute les œufs battus et brouille 2 min."}};
const FEC={
 riz:{n:"riz",ing:[["riz",80,"g","poids sec"]],p:6,k:285,art:"riz",m:15,st:"Cuis le riz 12 à 15 min dans l'eau salée."},
 pates:{n:"pâtes",ing:[["pates",80,"g","poids sec"]],p:10,k:285,art:"pates",m:12,st:"Cuis les pâtes comme indiqué sur le paquet."},
 pdt:{n:"pommes de terre",ing:[["pdt",350,"g"]],p:7,k:270,art:"pdt",m:25,st:"Coupe les pommes de terre en dés. Cuis-les 15 min à l'eau, puis dore-les 5 min à la poêle."}};
const LEG={
 surg:{n:"légumes",ing:[["legumes",250,"g","mélange surgelé"]],p:5,k:75,art:"legumes"},
 carottes:{n:"carottes",ing:[["carottes",250,"g"]],p:2,k:90,art:"carottes"},
 brocoli:{n:"brocoli",ing:[["brocoli",250,"g"]],p:7,k:85,art:"brocoli"},
 poivron:{n:"poivrons",ing:[["poivron",1,""],["oignon",1,""]],p:3,k:75,art:"legumes"}};
const SAU={
 tomate:{n:"Tomate",adj:"à la tomate",ing:[["sauce-tomate",150,"g"]],p:2,k:45,art:"tomate",st:"Ajoute la sauce tomate. Laisse chauffer 5 min."},
 curry:{n:"Curry",adj:"au curry",ing:[["sauce-tomate",100,"g"],["curry",1,"c. à s."]],p:1.5,k:35,art:"curry",st:"Ajoute le curry et la sauce tomate. Mijote 5 min."},
 ail:{n:"Ail et herbes",adj:"sauce ail et herbes",ing:[["sere",80,"g","pour la sauce"],["ail",1,"gousse"]],p:10,k:55,art:"sere",st:"Sauce : séré + ail râpé + sel + herbes. Mélange hors du feu."},
 paprika:{n:"Paprika",adj:"au paprika",ing:[["epices",null,"au goût","paprika, sel, poivre"]],p:0,k:0,art:null,st:"Assaisonne avec paprika, sel et poivre pendant la cuisson."}};
function make(pro,fec,leg,sau){
  const P=PRO[pro],F=FEC[fec],L=LEG[leg],S=SAU[sau]; if(!P||!F||!L||!S) return null;
  let p=P.p+F.p+L.p+S.p, k=P.k+F.k+L.k+S.k;
  const sere=Math.max(0,Math.ceil((75-p)/0.12/25)*25);
  const ing=[...P.ing,...F.ing,...L.ing,...S.ing];
  const st=[F.st,P.st,`Ajoute les ${L.n} dans la même poêle. 5 à 8 min.`,S.st];
  if(sere){ing.push(["sere",sere,"g","en dessert"]);st.push("Séré en dessert, avec cannelle ou un peu de cacao.");p+=sere*.12;k+=sere*.7}
  return {id:`q-${pro}-${fec}-${leg}-${sau}`,col:"quotidien",nom:`${P.n} ${S.adj}, ${F.n} et ${L.n}`,cat:P.cat,
    p:Math.round(p),k:Math.round(k/5)*5,m:F.m+8,art:[F.art,P.art,L.art,S.art].filter(Boolean),ing,st};
}
const BASE_IDS=[["poulet","riz","surg","curry"],["poulet","pates","brocoli","ail"],["poulet","pdt","carottes","paprika"],
 ["hache","riz","poivron","paprika"],["hache","pates","surg","tomate"],["hache","pdt","carottes","tomate"],
 ["oeufs","riz","surg","curry"],["oeufs","pates","brocoli","ail"],["oeufs","pdt","poivron","paprika"]];
const base = () => BASE_IDS.map(a=>make(...a)).filter(permis);

const byId = id => !id?null:id.startsWith("q-")?make(...id.slice(2).split("-")):R.find(r=>r.id===id)||SHAKERS.find(r=>r.id===id)||null;

/* ---------- quantités ---------- */
const plural = {tranche:"tranches",gousse:"gousses"};
function fmt(q,u,x){
  if(q==null) return u;
  let v=q*x;
  if(u==="g"){v=v<50?Math.round(v):Math.round(v/5)*5;return v+" g"}
  if(u==="ml"){return Math.round(v/10)*10+" ml"}
  const whole=Math.floor(v), half=Math.abs(v-whole-0.5)<0.01;
  const n = half?(whole?whole+"½":"½"):String(Math.round(v));
  if(!u) return n;
  if(u==="c. à s."||u==="c. à c.") return n+" "+u;
  return n+" "+(v>1&&plural[u]?plural[u]:u);
}
function toBuy(r,placard){return r.ing.filter(i=>!placard.has(i[0]))}

/* ---------- texte pour Yazio : tout en grammes, 1 portion ---------- */
const YNAME={poulet:"Blanc de poulet, cru",hache:"Viande hachée de bœuf 5 %, crue",riz:"Riz, cru",pates:"Pâtes, crues",lentilles:"Lentilles vertes, sèches",
  "lentilles-corail":"Lentilles corail, sèches",flocons:"Flocons d'avoine",pdt:"Pommes de terre, crues",lait:"Lait demi-écrémé",sere:"Séré maigre",oeufs:"Œuf entier",
  thon:"Thon au naturel, égoutté",crevettes:"Crevettes, crues",tofu:"Tofu nature",semoule:"Semoule de blé, crue",
  "haricots-rouges":"Haricots rouges, égouttés",mais:"Maïs doux, égoutté"};
const GR={"sauce-soja":15,oeufs:60,oignon:100,poivron:150,tomate:120,concombre:300,banane:120,tortillas:60,"pain-burger":60,"pain-complet":40,"fromage-tranche":20,
  ail:5,citron:60,carottes:80,huile:5,curry:6,moutarde:5};
const UNITG={"c. à c.":1,"c. à s.":1,tranche:1,gousse:1,"":1};
function yazio(r,x=1){
  const lines=r.ing.filter(i=>i[1]!=null).map(i=>{
    const nom=YNAME[i[0]]||ING[i[0]].n, q=i[1]*x;
    let g;
    if(i[2]==="g"||i[2]==="ml") g=Math.round(q)+" "+i[2];
    else g=Math.round(q*(GR[i[0]]||0))+" g"+(i[0]==="oeufs"?` (${fmt(q,"",1)} œuf${q>1?"s":""})`:"");
    return `${nom} : ${g}`;
  });
  const por=x===1?"1 portion":fmt(x,"",1)+" portions";
  return {lines, head:`${r.nom} (${por}) ≈ ${Math.round(r.p*x)} g de protéines, ${Math.round(r.k*x)} kcal`};
}

/* ---------- allergènes ---------- */
// Lactose et gluten : chaque ingrédient concerné passe à sa version « sans »
// (mêmes protéines à peu près, en rayon chez Migros et Coop). Les œufs ne se
// remplacent pas : les plats qui en contiennent sont masqués.
const ALLERGENES = {
  lactose:{n:"Lactose",rempl:{sere:"Séré maigre sans lactose",lait:"Lait sans lactose",whey:"Whey isolat (sans lactose)",
    cottage:"Cottage cheese sans lactose","fromage-rape":"Fromage râpé sans lactose","fromage-tranche":"Fromage en tranches sans lactose"}},
  gluten:{n:"Gluten",rempl:{pates:"Pâtes sans gluten","pain-complet":"Pain sans gluten",tortillas:"Tortillas de maïs",
    "pain-burger":"Pain à burger sans gluten",flocons:"Flocons d'avoine sans gluten",
    "sauce-soja":"Sauce tamari (sans gluten)",semoule:"Quinoa (au lieu de la semoule)"}},
  oeufs:{n:"Œufs",ing:["oeufs"]}
};
const NOMS_ORIG = Object.fromEntries(Object.entries(ING).map(([k,v])=>[k,v.n]));
const YNAME_ORIG = {...YNAME};
// Ingrédients interdits par le profil (plats masqués).
let EXCLU = new Set();
function regleAllergenes(liste){
  liste=liste||[];
  for(const k in ING) ING[k].n=NOMS_ORIG[k];
  for(const k of Object.keys(YNAME)) if(!(k in YNAME_ORIG)) delete YNAME[k];
  Object.assign(YNAME,YNAME_ORIG);
  EXCLU=new Set();
  for(const a of liste){const A=ALLERGENES[a]; if(!A) continue;
    (A.ing||[]).forEach(k=>EXCLU.add(k));
    for(const [k,n] of Object.entries(A.rempl||{})){ING[k].n=n;YNAME[k]=n}}
}
const permis = r => !!r && !r.ing.some(i=>EXCLU.has(i[0]));
// Un choix du compositeur est grisé s'il contient un ingrédient interdit.
const choixPermis = o => !o.ing.some(i=>EXCLU.has(i[0]));

/* ---------- assiette dessinée ---------- */
function rng(seed){let h=1779033703;for(const c of seed)h=Math.imul(h^c.charCodeAt(0),3432918353),h=h<<13|h>>>19;
  return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296}}
const COL={thon:["#D9B8A0","#C9A38A","#E5C8B2"],crevettes:["#F2A07B","#EE8E66","#F7B497"],tofu:["#F3EBD3","#E8DEC0"],
  semoule:["#E9D59A","#DCC57F"],haricots:["#7B2D26","#8E3A30","#6A2620"],mais:["#F2C94C","#E8B730"],riz:["#F7F2E4","#ECE3CB"],poulet:["#E8BB7C","#D9A262","#F1CF98"],boeuf:["#7A3E2A","#93503A","#62301F"],legumes:["#4F8F3A","#6BAA48","#3C7A30"],
  brocoli:["#3F7F33","#5A9C3F"],tomate:["#C2412D","#D65A3F"],curry:["#D99A2B","#E5AC44"],sere:["#FCFBF6","#F1EEE4"],pates:["#EAC867","#E0B853"],
  fromage:["#F4D97E","#EDCB62"],lentilles:["#9A6A3A","#B27E48","#86592F"],jambon:["#E59A9A","#EEAAA6"],dinde:["#EDC9B0","#E2B597"],pain:["#C98A49","#B77837"],
  pdt:["#E8C46C","#DCB556"],avoine:["#DCC69A","#CDB380"],banane:["#F5E29A"],carottes:["#E5762A","#EF8B3D"],petitspois:["#6DB04A","#5EA03F"],
  fruits:["#A3243F","#C2364F","#5A2A6E"],champignons:["#B39C82","#C9B39A"],oeuf:["#FFFDF6"]};
const TYPE={thon:"shred",crevettes:"chunk",tofu:"chunk",semoule:"grain",haricots:"pea",mais:"pea",riz:"grain",avoine:"grain",lentilles:"grain",petitspois:"pea",fruits:"pea",poulet:"chunk",boeuf:"chunk",dinde:"chunk",jambon:"chunk",pdt:"chunk",
  carottes:"stick",fromage:"shred",champignons:"chunk",pain:"bread",tomate:"sauce",curry:"sauce",sere:"sauce",legumes:"leaf",brocoli:"leaf",oeuf:"egg",pates:"noodle",banane:"slice"};
function plate(r){
  const R_=rng(r.id), pick=a=>a[Math.floor(R_()*a.length)], uid="c"+r.id.replace(/\W/g,"");
  const comps=[...r.art].sort((a,b)=>(TYPE[a]==="sauce"?0:1)-(TYPE[b]==="sauce"?0:1));
  const n=r.art.length, off=R_()*Math.PI*2;
  const sector=c=>{const i=r.art.indexOf(c);return[off+i*2*Math.PI/n,off+(i+1)*2*Math.PI/n]};
  const pt=(a0,a1,rmin=5,rmax=34)=>{const a=a0+(a1-a0)*(0.12+R_()*0.76),d=rmin+Math.sqrt(R_())*(rmax-rmin);return[50+Math.cos(a)*d,50+Math.sin(a)*d,a]};
  let s="";
  for(const c of comps){
    const [a0,a1]=sector(c), col=COL[c]||["#999"], t=TYPE[c];
    if(t==="sauce"){for(let i=0;i<9;i++){const[x,y]=pt(a0,a1,4,30);s+=`<circle cx="${x}" cy="${y}" r="${9+R_()*5}" fill="${col[i%col.length]}"/>`}}
    else if(t==="grain"){for(let i=0;i<110;i++){const[x,y]=pt(a0,a1,3,37);s+=`<ellipse cx="${x}" cy="${y}" rx="${1.8+R_()*.6}" ry="1.1" transform="rotate(${R_()*180} ${x} ${y})" fill="${pick(col)}"/>`}}
    else if(t==="pea"){for(let i=0;i<34;i++){const[x,y]=pt(a0,a1,4,36);s+=`<circle cx="${x}" cy="${y}" r="${2+R_()*1.4}" fill="${pick(col)}"/>`}}
    else if(t==="chunk"){for(let i=0;i<8;i++){const[x,y]=pt(a0,a1,6,32),w=8+R_()*5,h=6+R_()*4;s+=`<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="2.6" transform="rotate(${R_()*90} ${x} ${y})" fill="${pick(col)}" stroke="rgba(0,0,0,.14)" stroke-width=".5"/>`}}
    else if(t==="stick"){for(let i=0;i<11;i++){const[x,y]=pt(a0,a1,6,33),w=11+R_()*4;s+=`<rect x="${x-w/2}" y="${y-1.6}" width="${w}" height="3.2" rx="1.4" transform="rotate(${R_()*180} ${x} ${y})" fill="${pick(col)}"/>`}}
    else if(t==="shred"){for(let i=0;i<40;i++){const[x,y]=pt(a0,a1,4,34);s+=`<rect x="${x}" y="${y}" width="4" height="1.1" rx=".5" transform="rotate(${R_()*180} ${x} ${y})" fill="${pick(col)}"/>`}}
    else if(t==="leaf"){for(let i=0;i<16;i++){const[x,y]=pt(a0,a1,5,34);s+=`<circle cx="${x}" cy="${y}" r="${2.8+R_()*2.6}" fill="${pick(col)}" stroke="rgba(0,0,0,.12)" stroke-width=".4"/>`}}
    else if(t==="bread"){const[x,y,a]=pt(a0,a1,16,22);s+=`<rect x="${x-12}" y="${y-9}" width="24" height="18" rx="5" transform="rotate(${a*57.3} ${x} ${y})" fill="${col[0]}"/><rect x="${x-9.5}" y="${y-6.5}" width="19" height="13" rx="3.5" transform="rotate(${a*57.3} ${x} ${y})" fill="#E9C893"/>`}
    else if(t==="egg"){const k=r.art.length>3?1:2;for(let i=0;i<k;i++){const[x,y]=pt(a0,a1,12,24);s+=`<circle cx="${x}" cy="${y}" r="10" fill="#FFFDF6"/><circle cx="${x+3}" cy="${y-2}" r="7" fill="#FFFDF6"/><circle cx="${x+1}" cy="${y-1}" r="4.4" fill="#F2B31D"/>`}}
    else if(t==="noodle"){for(let i=0;i<18;i++){const[x,y]=pt(a0,a1,4,32),[x2,y2]=pt(a0,a1,4,32);s+=`<path d="M${x} ${y} Q${(x+x2)/2+R_()*12-6} ${(y+y2)/2+R_()*12-6} ${x2} ${y2}" fill="none" stroke="${pick(col)}" stroke-width="2.3" stroke-linecap="round"/>`}}
    else if(t==="slice"){for(let i=0;i<7;i++){const[x,y]=pt(a0,a1,8,32);s+=`<circle cx="${x}" cy="${y}" r="4.6" fill="${col[0]}" stroke="#E7CE7A" stroke-width=".8"/><circle cx="${x}" cy="${y}" r="1.1" fill="#D9BE6A"/>`}}
  }
  return `<svg viewBox="0 0 100 100" role="img" aria-label="Assiette : ${r.nom}"><defs><clipPath id="${uid}"><circle cx="50" cy="50" r="38"/></clipPath>
  <radialGradient id="g${uid}" cx="50%" cy="45%"><stop offset="80%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#E6E9E3"/></radialGradient></defs>
  <ellipse cx="51" cy="53" rx="47" ry="47" fill="rgba(0,0,0,.12)"/><circle cx="50" cy="50" r="47" fill="url(#g${uid})"/><circle cx="50" cy="50" r="39" fill="#FAFBF8" stroke="#E3E7E0" stroke-width=".8"/>
  <g clip-path="url(#${uid})">${s}</g></svg>`;
}

/* ---------- shakers : ajoutés au journal d'un toucher ---------- */
const SHAKERS=[
 {id:"shaker",nom:"Shaker au lait",p:30,k:240,ing:[["whey",30,"g"],["lait",300,"ml","demi-écrémé"]]},
 {id:"shaker-eau",nom:"Shaker à l'eau",p:23,k:115,ing:[["whey",30,"g"]]}
];
