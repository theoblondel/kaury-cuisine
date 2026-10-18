# Cuisine 180 — installation sur iPhone

Il faut l'app gratuite **Scriptable** (App Store) et l'app **Raccourcis** (déjà
sur l'iPhone).

## 1. Le script

1. Télécharge le script depuis la [dernière version](https://github.com/theoblondel/kaury-cuisine/releases/latest)
   (`Cuisine.180.js` : GitHub remplace l'espace par un point) et mets-le dans
   **iCloud Drive › Scriptable**, depuis l'iPhone (Partager › Enregistrer dans
   Fichiers) ou depuis le PC
   (par iCloud pour Windows ou icloud.com › Drive).
2. Ouvre Scriptable sur l'iPhone : « Cuisine.180 » apparaît dans la liste
   (appui long › Renommer pour l'appeler « Cuisine 180 », si tu veux).
3. Touche-le une fois : l'appli s'ouvre et pose ses questions (taille, âge,
   poids, poids visé, rythme, pas, allergènes). Elle calcule tes objectifs.

Tes données vont dans `iCloud Drive/Scriptable/cuisine-180.json`. C'est ce
fichier qu'il faut garder pour ne rien perdre ; le script, lui, se remplace
sans risque.

> Le nom du script n'a pas d'importance (ce guide l'appelle « Cuisine 180 ») :
> les Raccourcis le choisissent dans une liste.
>
> Nouvelle version du script : remplace simplement le fichier dans le
> dossier Scriptable. Tes données ne bougent pas.

## 2. Le widget

1. Appui long sur l'écran d'accueil › **+** › Scriptable.
2. Choisis la taille (petit, moyen ou grand) › Ajouter.
3. Appui long sur le widget › **Modifier le widget** :
   - Script : **Cuisine 180**
   - When Interacting : **Run Script**

Pour l'écran verrouillé : appui long sur l'écran verrouillé › Personnaliser ›
ajoute un widget Scriptable (rectangle ou rond) et choisis Cuisine 180.

iOS rafraîchit le widget quand il veut, en général toutes les 15 à 60 min.
Ouvrir l'appli le met à jour tout de suite.

Sur le widget moyen et grand, des boutons ouvrent directement le bon écran :
**+ Shaker** (ajoute ton shaker), **+ Plat**, **Scanner** (voir § 5) et, sur le
grand, **Poids**. Sur le petit, iOS ne permet qu'un seul toucher : il ouvre
l'appli.

## 3. Le Raccourci des pas

Scriptable ne peut pas lire Santé ; Raccourcis, si. Le Raccourci lit tes pas
et les donne au script, sans rien ouvrir.

Dans **Raccourcis** › **+** (nouveau raccourci), nomme-le
**Cuisine 180 – pas**, puis ajoute ces actions :

1. **Rechercher des échantillons de santé**
   - Type : **Nombre de pas**
   - Date de début : **est aujourd'hui**
   - Regrouper par : **Jour** ← important si tu as une Apple Watch : sans ça,
     les pas de la montre et de l'iPhone se comptent deux fois.
2. **Calculer des statistiques** : **Somme** des échantillons de santé.
3. **Run Script** (action Scriptable) :
   - Script : **Cuisine 180**
   - Parameter : le résultat de l'étape 2 (**Statistiques**)
   - « Run In App » : **désactivé**

Lance-le une fois à la main. Il doit répondre
« Cuisine 180 : 6240 pas » (avec tes pas). **Compare avec le chiffre de
l'app Santé** : s'il est presque double, c'est que « Regrouper par Jour »
manque à l'étape 1.

Les noms des actions peuvent varier un peu selon la version d'iOS ; cherche
« santé », « statistiques » et « Run Script » dans la liste des actions.

### Le poids aussi (facultatif)

Si tu te pèses avec une balance connectée qui écrit dans Santé, le même
Raccourci peut envoyer ton poids. Remplace l'étape 3 par :

1. **Rechercher des échantillons de santé** : Type **Poids**, Date de début
   **est aujourd'hui**, Trier par **Date de début**, du plus récent, Limite **1**.
2. **Dictionnaire** avec deux clés : `pas` = Statistiques, `poids` = le
   poids trouvé.
3. **Run Script** › Cuisine 180, Parameter = le dictionnaire.

Une pesée notée à la main dans l'appli n'est jamais écrasée par Santé.

Le même dictionnaire accepte aussi, si Santé les a :

- `gras` : **Pourcentage de graisse corporelle** (le plus récent du jour) ;
- `tour` : **Tour de taille** ;
- `muscu` : les **minutes d'entraînement de force** du jour (action
  « Rechercher des entraînements », type Musculation, aujourd'hui) : dès
  qu'il y en a, la séance est cochée.

Une mesure déjà notée ce jour-là n'est jamais écrasée.

## 4. Les automatisations

Dans Raccourcis › **Automatisation** › **+** › **Heure de la journée** :

- **12:00**, Quotidiennement › **Exécuter immédiatement** › action
  « Exécuter le raccourci » › Cuisine 180 – pas.
- Refais-en deux : **18:00** et **22:00**.

La série se joue sur les pas de la journée entière : celle de 22 h compte le
plus. Tu peux aussi toucher « Corriger » sous tes pas dans l'appli.

### L'alerte du soir

Quand le Raccourci tourne après 17 h (donc à 18 h et 22 h) et que ta journée
n'est pas encore gagnée, tu reçois une notification, par exemple :
« Ta série de 12 jours est en jeu 🔥 — Il te manque 2 300 pas. » Une seule
toutes les 3 heures. La première fois, iOS demande d'autoriser les
notifications de Scriptable : accepte. Pour la couper : Suivi › Mon profil ›
« Me prévenir si ma série est en jeu ».

### Le bilan du dimanche

Le dimanche, la tournée de 22 h envoie aussi le bilan de ta semaine :
« 5/7 jours gagnés · −0,6 kg · −1 cm de tour de taille · 8 200 pas/j ·
protéines 6/7 jours · 3/3 séances ». Une seule fois.

## 5. Le Raccourci scanner (code-barres)

Dans **Raccourcis** › **+**, nomme-le exactement **Cuisine 180 scanner**
(le bouton du widget et celui de l'appli l'appellent par ce nom) :

1. **Scanner un code QR ou un code-barres**.
2. **Run Script** (Scriptable) : Script **Cuisine 180**, Parameter = le code
   scanné, **« Run In App » activé** (sinon la fiche ne peut pas s'afficher).

Le script cherche le produit sur **Open Food Facts** (base gratuite et
collaborative) et ouvre « Autre chose » avec ses calories et protéines pour
100 g : tu n'as plus qu'à entrer les grammes mangés. Dans l'appli, « Autre »
cherche aussi par nom (les produits vendus en Suisse d'abord).

Si un produit manque ou a des valeurs fausses, entre l'étiquette à la main.
Open Food Facts limite les recherches à une dizaine par minute.

## Ce qu'il faut savoir

- **Ton but : perdre du gras, garder le muscle.** La balance seule ne le
  dit pas : mesure ton tour de taille chaque semaine (le matin, à jeun, au
  nombril) et coche tes séances de muscu dans « Aujourd'hui ». Le Suivi
  croise tout : bilan de la semaine, gras et muscle, calendrier de la
  série, ce qui te fait rater, projection.
- **Prévu ou mangé** : un plat « prévu » (pour faire tes courses, ou le
  matin pour ce soir) ne compte pas tant que tu ne l'as pas coché. Les
  flèches à côté de la date changent de jour : hier pour corriger, demain
  pour prévoir. « Comme la veille » recopie le menu du dernier jour noté.
- **La série** : un jour compte s'il est sous ton objectif de calories ET
  au-dessus de ton objectif de pas. La journée en cours ne la casse jamais
  avant minuit.
- **Le poids prévu** ne compte que les jours où tu as noté ce que tu as mangé.
- **Les calories brûlées sont estimées** (±10 %). Après 3 semaines de
  pesées, l'onglet Suivi compare le prévu et le réel et te propose de corriger.
- Testé sur PC avec un simulateur, **pas encore sur un vrai iPhone**. Si
  quelque chose s'affiche mal, une capture d'écran suffit pour corriger.
