# Guide des annonces et règles IA pendant le jeu — Whist de Gand

Ce document décrit les annonces configurées dans AllWhist, leur priorité, leur objectif, leur barème, les conseils tactiques et les règles opérationnelles utilisées par l’IA pendant le jeu.

## Déroulement des annonces au Whist de Gand

Le tour de table des annonces commence toujours par une vérification obligatoire des As avant d'entamer les enchères ordinaires :

1. **Le Premier Tour d'Annonces (Tour des As / Le Trou) :**
   - **Trou (3 As)** : Si un joueur possède exactement 3 As, il annonce obligatoirement « **Trou** ». L'atout devient la couleur du 4ème As. L'annonceur et le détenteur du 4ème As font équipe pour réaliser au moins 9 plis.
   - **Trou Royal (4 As)** : Si un joueur possède les 4 As, il annonce obligatoirement « **Trou Royal** ». L'atout est Cœur et son partenaire est le détenteur du Roi de Cœur (objectif : 9 plis à deux).
   - **Passe-trou (Moins de 3 As)** : Tout joueur ayant 0, 1 ou 2 As annonce « **Passe-trou** » lors de ce premier tour pour indiquer qu'il ne détient pas de Trou.
   - **Bouche-Trou** : Lorsqu'un joueur annonce « Trou », le joueur détenant le 4ème As répond obligatoirement « **Bouche-Trou** » (ou « Je bouche le trou ») pour confirmer le partenariat et sceller l'engagement à 9 plis.

2. **Le Tour d'Enchères Ordinaires :**
   - Si les 4 joueurs ont annoncé « **Passe-trou** », la table enchaîne alors avec le tour d'enchères régulier (Je propose, J'emballe, Demande à l'As, Solo 6, Solo 7, Petite Misère, Solo 8, Abondance 9, Grande Misère, etc.).

---

## Principes communs de l’IA

- L’IA choisit uniquement parmi les cartes légalement jouables et doit fournir à la couleur demandée lorsqu’elle le peut.
- Elle n’utilise pas les cartes cachées des autres joueurs. Ses décisions reposent sur sa main, le contrat, l’historique des plis, les cartes visibles et des déductions issues du jeu.
- **Attaque** désigne le déclarant et son partenaire éventuel. **Défense** désigne le camp opposé.
- L’objectif du contrat prime sur la recherche de surplis. L’IA sécurise d’abord le nombre de plis requis ou, en misère, l’absence de pli.
- À valeur stratégique comparable, l’IA conserve les cartes maîtresses, les reprises et les atouts utiles, puis choisit la carte la moins coûteuse.
- Les règles ci-dessous sont des règles de décision. Elles ne modifient ni la légalité des cartes, ni le calcul des points, ni les informations accessibles à chaque joueur.

## Repères de lecture

- La **priorité** est la valeur interne utilisée pour comparer les annonces. Une valeur plus élevée surenchérit sur une valeur plus basse.
- **Réussite** : le camp déclarant atteint l’objectif. Pour une misère, le déclarant doit faire exactement zéro pli.
- Pour un contrat à l’atout avec objectif positif, hors Chelem, chaque pli au-delà de l’objectif ajoute **1 point par adversaire**.
- Le montant indiqué est le montant de base **par adversaire**.
- En contrat à deux, le gain ou la perte totale est partagé entre les partenaires. Les défenseurs paient ou reçoivent chacun le montant par adversaire.
- Il n’y a pas de bonus de surplis pour les contrats sans atout ni pour le Chelem.

## Table des annonces

| Priorité | Annonce | Camp et objectif | Atout / conditions | Points de base réussite / échec | Stratégie de l’attaque | Stratégie de la défense | Règles IA pendant le jeu — attaque | Règles IA pendant le jeu — défense |
|---:|---|---|---|---:|---|---|---|---|
| 0 | Passe-trou / Passe | Aucun contrat joué. | — | 0 / 0 | « Passe-trou » au 1er tour avec < 3 As; « Passe » aux enchères ordinaires si la main ne permet pas d'enchérir. | Pas de défense particulière; évaluer les annonces suivantes. | Aucune règle de jeu: l’IA ne joue pas de contrat après quatre passes; elle relance ou termine la donne selon le mode configuré. | Identique: aucune logique attaque/défense n’est appliquée sans contrat. |
| 1 | Je propose | Chercher un partenaire; faire **8 plis à deux**. | Le proposant choisit une couleur; le partenaire est associé à l’annonce. | 10 / 10 | Proposer avec des plis sûrs et des possibilités de coupe; rechercher une complémentarité avec le partenaire. | Prendre les plis sûrs tôt et exploiter les couleurs courtes du camp déclarant. | Entamer une couleur forte ou l’atout si le partenariat est connu; protéger les reprises; favoriser les plis du partenaire; couper seulement si la coupe améliore le contrôle du pli. | Avant identification du partenaire, éviter d’aider le proposant; après identification, jouer la couleur faible du camp attaquant, encaisser les plis certains et conserver les atouts de coupe. |
| 1,5 | J’emballe | Rejoindre le proposant; faire **8 plis à deux**. | Disponible seulement après « Je propose », par un autre joueur. | 10 / 10 | Apporter des plis, une longueur utile ou une bonne complémentarité avec la couleur annoncée. | Identifier les partenaires et exploiter leurs couleurs faibles. | Soutenir la couleur annoncée; rendre la main au proposant; ne pas consommer inutilement les cartes maîtresses du partenaire; signaler une force par le choix de l’entame et des défausses. | Traiter proposant et emballeur comme un camp connu; attaquer leurs communications, forcer les atouts et éviter les entames sous un honneur isolé sans nécessité. |
| 1,8 | Demande à l’As | Appeler secrètement un partenaire; faire **8 plis à deux**. | Disponible au proposant après « Je propose »; le partenaire est révélé lorsqu’il joue l’As demandé. | 10 / 10 | Appeler un As absent et utile à la main; protéger le partenaire jusqu’à sa révélation. | Déduire l’As appelé puis coordonner la défense après révélation. | Le déclarant évite d’épuiser prématurément la couleur appelée; le partenaire joue l’As demandé lorsqu’il doit légalement le fournir; après révélation, les deux IA appliquent une logique de camp commune. | Avant révélation, mettre à jour les probabilités de partenariat sans utiliser d’information cachée; après révélation, attaquer les reprises et couleurs courtes du camp déclarant. |
| 2 | Solo 6 | Seul contre les trois autres; faire **au moins 6 plis**. | Atout choisi; objectif minimal. | 15 / 15 | Choisir l’atout le plus solide; compter les plis sûrs et les entrées. | Conserver des atouts pour couper les longues couleurs du déclarant. | Prioriser les plis sûrs jusqu’à l’objectif; tirer les atouts si la main possède la majorité et des gagnantes latérales; sinon conserver des atouts pour couper; éviter les risques inutiles après six plis assurés. | Jouer en camp commun sans partage de cartes cachées; encaisser les gagnantes certaines; rechercher la coupe; éviter d’ouvrir gratuitement une couleur secondaire forte du déclarant. |
| 3 | Solo 7 | Seul contre les trois autres; faire **au moins 7 plis**. | Atout choisi. | 20 / 20 | Préserver les reprises et contrôler davantage de couleurs que pour Solo 6. | Faire tomber les atouts au bon moment et communiquer par le jeu légal des cartes. | Construire un plan de sept plis; tirer les atouts adverses si cela sécurise les longues; conserver au moins une reprise vers une couleur affranchie. | Augmenter l’agressivité défensive: prendre les plis disponibles, raccourcir le déclarant à l’atout et rejouer la couleur montrée faible par le déclarant. |
| 4 | Petite Misère | Seul; faire **zéro pli**, après avoir écarté une carte. | Sans atout; 12 cartes en jeu. | 30 / 30 | Écarter une carte dangereuse et conserver des sorties basses. | Forcer le déclarant à gagner un pli. | Écarter d’abord un honneur isolé ou une carte sans sortie sûre; jouer la plus basse carte légale, sauf si une carte plus haute permet de se débarrasser d’un danger sans gagner le pli; favoriser les défausses d’honneurs. | Identifier les couleurs courtes et honneurs probables du déclarant; jouer une carte assez basse pour lui laisser le pli lorsqu’il est forcé de fournir; éviter de gagner entre défenseurs si cela libère une sortie sûre. |
| 5 | Solo 8 | Seul contre les trois autres; faire **au moins 8 plis**. | Atout choisi. | 25 / 25 | Exiger plusieurs plis sûrs, une bonne longueur d’atout et des entrées. | Retirer les atouts utiles et profiter des couleurs courtes. | Sécuriser huit plis avant de rechercher les surplis; tirer l’atout plus tôt qu’en Solo 6/7; conserver l’entrée nécessaire à la dernière couleur maîtresse. | Chercher immédiatement les deux à cinq plis de chute; encaisser les contrôles avant qu’ils ne disparaissent et forcer le déclarant à couper pour réduire ses atouts. |
| 6 | Abondance 9 | Seul contre les trois autres; faire **au moins 9 plis**. | Atout choisi. | 40 / 40 | Planifier l’ordre d’encaissement avec une forte couleur d’atout. | Couper les communications et garder les atouts pour les plis critiques. | Établir rapidement l’atout; calculer les perdantes; choisir entre purge des atouts et encaissement immédiat selon le risque de coupe; ne pas sacrifier une entrée. | Toute levée défensive est critique: encaisser un As exposé, chercher une promotion d’atout, forcer une coupe dans la main longue et éviter les retours qui affranchissent une couleur. |
| 7 | Trou (Bouche-Trou) | Avec le détenteur du quatrième As; faire **au moins 9 plis à deux**. | Forcé au 1er tour avec 3 As; le partenaire au 4ème As répond « Bouche-Trou ». Atout = couleur du 4ème As. | 30 / 30 | Sécuriser les premières levées et préserver les communications. | Neutraliser les couleurs maîtresses et empêcher neuf plis. | Identifier immédiatement le partenaire par le quatrième As; encaisser les As menacés; privilégier les retours vers la main forte; tirer l’atout si cela protège les longues du camp. | Éviter de nourrir les As; attaquer les couleurs où le camp du Trou risque d’être court; conserver un contrôle pour interrompre leur série de plis. |
| 7,5 | Trou Royal | Avec le détenteur du Roi de Cœur; faire **au moins 9 plis à deux**. | Forcé au 1er tour avec 4 As; partenaire détenteur du Roi de Cœur. Atout = Cœur. | 60 / 60 | Répartir les prises sans isoler le Roi de Cœur partenaire. | Limiter le camp adverse à huit plis. | Les quatre As sont des contrôles, pas une obligation d’encaissement immédiat; préserver une entrée vers le Roi de Cœur; éviter de bloquer une couleur longue entre partenaires. | Attaquer les communications avec le Roi de Cœur; rechercher les plis avant l’encaissement complet des As; ne pas jouer une couleur qui offre une reprise gratuite au camp attaquant. |
| 8 | Abondance 10 | Seul contre les trois autres; faire **au moins 10 plis**. | Atout choisi. | 50 / 50 | Contrôler presque toute la main et établir les longues sans perdre les entrées. | Encaisser les plis défensifs sûrs avant affranchissement des longues. | Compter au maximum trois perdantes; tirer les atouts sauf danger immédiat sur une gagnante latérale; choisir la ligne qui minimise le risque d’un quatrième pli perdu. | Prendre tout pli sûr; rechercher une coupe ou une promotion d’atout; éviter toute finesse gratuite offerte au déclarant. |
| 9 | Grande Misère | Seul; faire **zéro pli avec 13 cartes**. | Sans atout. | 60 / 60 | Défausser les honneurs et conserver des cartes de sortie basses. | Forcer le déclarant à gagner un pli. | Jouer la plus basse carte légale par défaut; sur défausse, éliminer d’abord les cartes hautes isolées; conserver plusieurs sorties dans les couleurs longues; éviter de prendre la main même si cela coûte une défausse utile. | Mémoriser les cartes jouées; remettre le déclarant en position haute; jouer dans ses couleurs courtes ou dominées; coordonner les défenseurs par le résultat observable des plis, sans accès aux mains cachées. |
| 10 | Abondance 11 | Seul contre les trois autres; faire **au moins 11 plis**. | Atout choisi. | 70 / 70 | Contrôler presque toutes les couleurs et vérifier les deux perdantes possibles. | Préserver chaque contrôle et éviter de donner une coupe. | Comparer les lignes de jeu selon le risque de perdre plus de deux plis; encaisser les gagnantes vulnérables; tirer les atouts dès que les contrôles latéraux sont protégés. | La défense vise trois plis: encaisser les honneurs menacés, créer une coupe, ou promouvoir un atout; choisir la ligne la plus directe plutôt qu’une défense passive. |
| 10,5 | Abondance 12 | Seul contre les trois autres; faire **au moins 12 plis**. | Atout choisi. | 100 / 100 | Protéger l’unique perdante potentielle. | Chercher l’unique couleur ou coupe produisant deux plis défensifs. | Identifier l’unique pli potentiellement perdu; sécuriser les douze autres par purge d’atout et ordre exact des reprises; éviter toute finesse non nécessaire. | Prendre immédiatement tout pli certain; si aucun n’est visible, maximiser la chance de créer une coupe ou de promouvoir un honneur; éviter les retours neutres qui laissent le déclarant dérouler. |
| 11 | Misère sur Table | Seul; faire **zéro pli**; cartes visibles après le premier pli. | Sans atout; cartes étalées face visible après le premier pli. | 120 / 120 | Exploiter l’information visible pour éviter toute prise. | Coordonner les entames pour imposer une carte gagnante. | Après exposition, recalculer une ligne complète de sorties sûres à partir des cartes visibles; choisir le jeu qui conserve au moins une réponse basse dans chaque couleur forcée. | Après exposition, simuler les réponses légales visibles; sélectionner l’entame qui réduit les sorties sûres du déclarant et force le plus tôt possible une carte maîtresse. |
| 12 | Chelem | Seul contre les trois autres; faire **les 13 plis**. | Atout choisi. | 250 / 250 | Contrôler les atouts, compter toutes les cartes et conserver les entrées. | Créer une coupe ou préserver une carte maîtresse pour prendre un pli. | Aucune prise de risque facultative: vérifier que chaque pli reste contrôlé; tirer les atouts adverses sauf nécessité d’encaisser une gagnante menacée; maintenir l’ordre exact des entrées. | Un seul pli suffit: encaisser immédiatement toute carte maîtresse, rechercher une coupe, jouer la couleur la plus susceptible de créer une promotion; ne jamais sacrifier un pli certain pour un signal. |

## Ordre commun d’évaluation d’une carte

1. Filtrer les cartes légalement jouables.
2. Déterminer si le camp doit gagner ou éviter le pli courant.
3. Évaluer le besoin contractuel restant: plis à obtenir, plis à concéder ou zéro pli en misère.
4. Protéger les cartes maîtresses, les reprises, les atouts et les communications avec le partenaire connu.
5. Comparer les cartes candidates selon le risque immédiat, le contrôle du prochain pli et l’effet sur les couleurs restantes.
6. À score égal, jouer la carte de plus faible valeur stratégique afin de conserver les ressources fortes.

## Calcul rapide des points

- **Solo 6 réussi juste** : 15 points par adversaire, soit **+45** au déclarant et **−15** à chacun des trois défenseurs.
- **Solo 6 réussi avec 2 surplis** : 17 points par adversaire, soit **+51** au déclarant et **−17** à chaque défenseur.
- **Solo 6 échoué** : **−45** au déclarant et **+15** à chaque défenseur.
- **Trou réussi juste** : 30 points par défenseur, soit **+45 à chacun des deux partenaires** et **−30 à chacun des deux adversaires**.

## À garder en tête

- Les priorités, objectifs et points reprennent la configuration documentée d’AllWhist.
- Les deux colonnes « Règles IA pendant le jeu » décrivent une logique déterministe et testable, distincte des conseils généraux de stratégie.
- Les annonces conditionnelles, notamment J’emballe, Demande à l’As, Trou et Trou Royal, restent limitées aux situations prévues.
- Les décisions de partenariat ne peuvent utiliser que les informations révélées par les annonces et les cartes effectivement jouées.
- Les règles d’une table réelle peuvent différer de cette implémentation.
