# Éléments du frontend EVAM — par poste, écran et composant

Ce document décrit, pour chacun des 12 postes (profils) de l'application EVAM (eau, jus, yaourts — Congo, FCFA), ce qui apparaît réellement à l'écran : menu latéral, page d'accueil, tableaux, formulaires et actions de chaque écran. Il est construit par lecture directe du code source du frontend (`EVAM_Next_project`), pas par supposition.

**Plan du document**
1. Éléments communs à tous les postes (connexion, barre latérale, barre supérieure, composants génériques)
2. Les 12 postes : carte d'identité, menu, page d'accueil, liste des écrans accessibles
3. Catalogue détaillé de tous les écrans, classé par domaine métier (c'est ici que sont décrits en détail les tableaux et formulaires — les sections par poste y renvoient pour éviter les répétitions, un même écran étant souvent partagé par plusieurs postes)

---

## 1. Éléments communs à tous les postes

### 1.1 Connexion — `/login`
Écran en deux colonnes : à gauche (visible à partir des écrans larges) un bandeau de marque sur fond sombre avec le logo, la mention « Unité de production » et le rappel des domaines couverts (Production · Qualité · Stocks / Ventes · Caisse · Distribution). À droite, le formulaire :
- Champ **Identifiant** (texte, obligatoire, auto-focus)
- Champ **Mot de passe** (obligatoire)
- Message d'erreur en rouge si l'authentification échoue
- Bouton **Se connecter** (désactivé tant que les deux champs ne sont pas remplis ; affiche « Connexion… » pendant l'appel)
- Bouton de bascule clair/sombre en haut à droite

À la connexion, l'utilisateur est redirigé automatiquement vers `/accueil`.

### 1.2 Barre latérale (sidebar)
Commune à tous les postes, seul son **contenu** change (voir section 2 par poste). Comportement :
- Sur ordinateur : repliée par défaut (icônes seules, 64px), se déplie au survol ou au focus (252px) avec animation ; le contenu de la page se redécale en conséquence.
- Sur mobile/tablette : tiroir plein écran ouvert par le bouton menu (☰) de la barre supérieure, refermé par un bouton « X » ou un clic sur le fond assombri.
- En-tête de la sidebar : icône + libellé du poste connecté (ex. « Responsable Qualité ») et sa « station » (ex. « Laboratoire / lots »), dans la couleur d'accent du profil.
- Corps : groupes de navigation (icône + titre de groupe en majuscules, ex. « PRODUCTION »), puis la liste des écrans du groupe (icône + libellé), l'écran actif étant surligné.
- Pied de sidebar : mention « Eau · Jus · Yaourts ».
- Un groupe **« Référentiel »** est ajouté automatiquement (entre le menu principal et l'Administration s'il y en a une, sinon en fin de liste) pour tout poste ayant au moins un droit de lecture ou d'écriture sur une page de paramétrage — son contenu varie donc par poste (voir section 2).

### 1.3 Barre supérieure (topbar)
Présente en haut de chaque écran, hauteur fixe, contient de gauche à droite :
- Bouton menu ☰ (mobile uniquement), pour ouvrir la sidebar en tiroir.
- Fil d'Ariane (breadcrumbs) correspondant à la page courante (ex. Poste / Production / Ordres de fabrication), cliquable si l'utilisateur a accès aux pages intermédiaires.
- Bouton **« Aller à… »** (raccourci clavier Ctrl+K) : ouvre une fenêtre de recherche/saut rapide listant tous les écrans accessibles au poste, filtrable par texte.
- Sélecteur de **dépôt actif** (liste déroulante), visible uniquement pour les postes manipulant du stock physique (Magasinier, Responsable Production, Responsable Achats, Agent Production, Responsable Qualité, Responsable Distribution) et seulement s'il existe plusieurs dépôts.
- Bouton de bascule **clair/sombre**.
- **Cloche de notifications** : badge rouge si des notifications non lues existent ; au clic, un panneau liste jusqu'à 20 notifications (titre, message, non lues en gras avec un fond teinté), avec un bouton « Tout marquer lu » ; cliquer sur une notification la marque lue et navigue vers l'écran du document concerné (commande, OF, décaissement, demande de matière, lot qualité, bon de livraison, demande d'achat, commande fournisseur, préparation, fiche technique…) si le poste y a accès. Rafraîchie automatiquement toutes les 45 secondes.
- **Menu utilisateur** : avatar (initiales, couleur du profil) + nom (sur grands écrans) + chevron. Au clic : carte d'identité (nom, badge du profil), sur mobile le sélecteur de dépôt et la bascule de thème y sont dupliqués, puis bouton **Se déconnecter**.

Un **bandeau d'erreur** flottant (bas de l'écran) apparaît après toute action refusée par le serveur (« Action impossible » + message), avec un bouton pour le fermer.

### 1.4 Page d'accueil (`/accueil`) — structure générique
La page d'accueil est la même structure React pour tous les postes, mais son **contenu** (actions rapides, indicateurs, listes de travail, graphique) est entièrement défini par poste dans `lib/home.ts` — voir le détail dans chaque fiche de poste (section 2). Éléments de la structure commune :
- **En-tête de poste** : icône et couleur du profil, date du jour, station, salutation (« Bonjour »/« Bonsoir » + prénom), mission du poste en une phrase, badge du profil, pastille « X élément(s) à traiter » (orange) ou « Tout est à jour » (vert), et jusqu'à 2 **boutons d'action rapide** menant aux tâches les plus fréquentes du poste.
- **Bandeau caisse** (uniquement pour le poste Caissier) : solde consolidé de la caisse principale (masquable par un œil), solde et statut de session de la caisse personnelle, liste des autres caisses actives avec pastille session ouverte/fermée.
- **Feuille de route numérotée** (uniquement pour l'Administrateur SI) : étapes de mise en route (créer les comptes, affecter les caisses, valider les fiches techniques), avec barre de progression et bouton d'action par étape.
- **Cartes d'indicateurs (KPI)** : 3 ou 4 tuiles chiffrées, cliquables si elles renvoient vers un écran.
- **Files de travail** (cartes « boîte de réception ») : chacune liste jusqu'à quelques éléments à traiter (titre, détail, badge de statut), avec un lien « Voir les X »/« Ouvrir l'écran » ; une file vide affiche un message positif (« Rien à signaler »).
- **Colonne latérale** (absente pour l'Administrateur SI) : un graphique (camembert ou barres horizontales) propre au poste, un bloc **« Accès rapides »** (raccourcis vers tous les écrans du menu, sous forme de tuiles), et un bloc **« Repères du poste »** listant les règles métier (ce que le poste doit faire) et les interdits (ce qu'il ne fait jamais), repris de la fiche de poste.

### 1.5 Composants génériques réutilisés sur la quasi-totalité des écrans
- **PageHeader** : bandeau de titre en haut de chaque page (surtitre, titre, description, éventuel bouton d'action principal).
- **Panel** : encadré blanc (carte) utilisé pour regrouper un tableau ou un formulaire.
- **DataTable** : tableau générique (colonnes définies par écran, lignes cliquables ou non selon l'écran).
- **Field / inputClass** : champ de formulaire étiqueté (texte, nombre, date, select…).
- **Button** : bouton avec variantes visuelles primaire / secondaire / discret / danger / succès.
- **StatusBadge** : pastille de statut colorée (tons : neutre, info, succès, avertissement, danger, teal), utilisée pour les statuts de documents (commande, OF, lot, décaissement, demande…) — certains écrans utilisent des badges dédiés par type de document (`OrderBadge`, `OfBadge`, `LotBadge`, `BlBadge`, `DaBadge`…) avec un code couleur propre à leurs statuts.
- **Guard** : bandeau d'alerte encadré (vert « ok », rouge « bloqué », orange « avertissement ») utilisé pour signaler une règle métier importante sur une fiche (ex. « Lot bloqué — non vendable »).
- **StatusStepper** : frise horizontale des étapes d'un circuit (ex. commande : Brouillon → Validée → En préparation → Livrée → Facturée ; OF : Brouillon → … → Clôturé), avec l'étape courante mise en évidence.
- **Historique** (`components/Historique.tsx`) : encadré « Historique », présent en bas des fiches de détail des documents à statut (commandes, OF, lots, réclamations, préparations, bons de livraison, inventaires) — liste en lecture seule chaque création/changement de statut (action, ancien statut → nouveau statut, auteur, date), alimentée automatiquement par le serveur, sans aucune saisie possible.
- **KpiCard / WidgetCard / DonutChart / BarChart** : cartes chiffrées et graphiques (camembert, barres) utilisés sur les accueils et le tableau de bord.
- **EmptyState** : message centré (« Rien à afficher ») quand une liste est vide.

### 1.6 Accès refusé — `/403`
Affiché quand un poste accède à une URL hors de son périmètre : titre « Hors périmètre », message rappelant que le menu n'affiche que ce que le poste a le droit de faire, et un bouton « Retour à mon poste » vers `/accueil`.

---

## 2. Les 12 postes

Pour chaque poste : sa carte d'identité (telle que définie dans le code), son menu de navigation complet, le contenu spécifique de sa page d'accueil, puis la liste de tous les écrans auxquels il a accès (le détail de chaque écran est au chapitre 3, « Catalogue des écrans »).

### 2.1 Administrateur SI (`ADMIN_SI`)
**Carte d'identité**
- Station : Configuration · Couleur d'accent : bleu marine (navy) · Icône : bouclier
- Mission : « Créez les comptes et les caisses, validez les fiches techniques et tenez le référentiel à jour. »
- Posture : « Vous configurez EVAM. L'atelier, la caisse et les ventes restent aux métiers. »
- Fait : Comptes, Caisses, Fiches techniques, Référentiel
- Ne fait pas : modifier les dépôts système · Ne voit pas : commandes, factures, encaissements, tarifs
- Règles : un compte inactif ne peut plus se connecter ; un utilisateur a un profil unique ; ce poste crée/modifie/désactive les comptes et valide les fiches techniques

**Menu (sidebar)** — un seul groupe « Configuration », 7 entrées (au lieu de 20) :
Accueil · Utilisateurs & profils · Caisses · Fiches techniques · Référentiel · Paramètres · Journal d'audit

**Page d'accueil** (de haut en bas)
- **Feuille de route en 3 étapes** avec barre de progression : 1) Créer les comptes et leur rôle → `/admin/utilisateurs` ; 2) Créer et affecter chaque caisse → `/admin/caisses` ; 3) Valider la fiche technique de chaque produit fini → `/parametrage/fiches-techniques`.
- KPI : Comptes actifs, Sessions de caisse ouvertes, Actions aujourd'hui.
- Files (3 colonnes) : Fiches techniques en brouillon, Comptes sans rôle, Caissiers sans caisse.
- Activité récente (pleine largeur, dernières lignes du journal d'audit).
- Pas de boutons d'action rapide ni de colonne latérale.

**Écrans accessibles** : Accueil · Utilisateurs & profils (onglets Comptes, Profils & accès) · Caisses · Fiches techniques · Référentiel (onglets Articles, Matières, Conditionnements, Dépôts, Clients, Fournisseurs, Codes fiscaux) · Paramètres (onglets Listes fixes, Numérotation, Généraux) · Journal d'audit.

### 2.2 PDG / Direction (`DIRECTION`)
**Carte d'identité**
- Station : Pilotage · Couleur : bleu marine · Icône : graphique
- Mission : « Autorisez les décaissements, surveillez les alertes et lisez les marges et le rendement. »
- Posture : « Tout en lecture : les équipes métier saisissent, vous pilotez. »
- Fait : autoriser/refuser les décaissements, générer le rapport · Voit : tout en lecture
- Ne fait pas : valider un OF ou une clôture, créer quoi que ce soit · Ne voit pas : le référentiel (aucun paramétrage)
- Priorités : 1) autoriser/refuser les décaissements ; 2) surveiller les alertes (ruptures, écarts de caisse, anomalies) ; 3) lire marges et rendement

**Menu (sidebar)** — un seul groupe « Pilotage », 6 entrées (au lieu de 17) :
Accueil · Tableau de bord · Supervision · Coûts & marges · Anomalies & écritures · Décaissements
- **Supervision** (hub à onglets, mêmes écrans que les métiers, sans bouton de création) : Commandes · Production (OF, Lots) · Achats (Besoins, Commandes fournisseurs, Réceptions) · Distribution (Préparations, Bons de livraison) · Stocks (Situation, Mouvements, Inventaires).
- **Coûts & marges** (onglets) : Coûts réels · Coûts standards · Valorisation du stock.
- **Anomalies & écritures** (onglets) : Anomalies · Écritures.

**Page d'accueil**
- Bouton en tête **« Décaissements à autoriser (N) »**, affiché seulement s'il y a des demandes en attente.
- KPI : Encaissé aujourd'hui (+ ce mois), OF en cours (+ en production), Lots en attente, Anomalies ouvertes.
- Files de travail : Lots à libérer, OF en production, Articles sous le seuil, Anomalies ouvertes.
- Graphique : camembert « Ordres de fabrication » (répartition par étape du circuit).

**Écrans accessibles** : Accueil · Tableau de bord · Supervision (tous ses onglets) · Coûts & marges · Anomalies & écritures · Décaissements.

### 2.3 Responsable Production (`RESPONSABLE_PRODUCTION`)
**Carte d'identité**
- Station : Planifier et piloter · Couleur : teal · Icône : usine
- Mission : « Planifiez, lancez les OF, demandez les matières et menez chaque OF jusqu'à la clôture. »
- Posture : « Vous orchestrez l'atelier. Le stock vendable n'existe qu'après libération qualité. »
- Fait : plans, OF, avancer/annuler, demandes de matières, compléments
- Ne fait pas : libérer un lot, encaisser, accéder aux coûts, modifier une fiche technique · Ne voit pas : coûts, caisse
- Priorités : 1) créer le plan ; 2) le convertir en OF (avec agents) ; 3) demander les matières ; 4) avancer le statut quand les matières sont livrées ; 5) clôturer

**Menu (sidebar)** — un seul groupe « Production », 6 entrées (au lieu de 12) :
Accueil · Plans · Ordres de fabrication · Matières atelier · Stock · Référentiel
- **Référentiel** (hub à onglets) : Articles, Matières, Conditionnements (écriture) · Fiches techniques (lecture seule).
- Besoins matières et Suivi eau ne sont plus des entrées de menu : ce sont des onglets de la fiche OF.
- *Accès supplémentaire sans entrée de menu* : Lots qualité (`/production/qualite`, lecture).

**Page d'accueil**
- Actions rapides : Planifier, OF.
- KPI : OF en production (+ total ouverts), OF à lancer, Plans à convertir, Pertes du jour.
- Files de travail : Plans à convertir (badges Urgent/Prioritaire), OF par étape, Matières demandées au magasin, Fiches techniques en attente (Admin SI).
- Graphique : camembert « Ordres de fabrication » par étape.

**Écrans accessibles** : Accueil · Plans · Ordres de fabrication (liste + fiche) · Matières atelier · Situation de stock · Lots qualité (lecture) · Référentiel (Articles, Matières, Conditionnements, Fiches techniques en lecture).

### 2.4 Agent Production (`AGENT_PRODUCTION`)
**Carte d'identité**
- Station : Saisie atelier (mobile) · Couleur : ambre · Icône : clé
- Mission : « Choisissez l'OF en production, saisissez la quantité produite par étape et déclarez les pertes. »
- Posture : « Écran mobile : actions courtes. Le responsable avance le statut de l'OF. »
- Fait : étapes, pertes, suivi eau, sessions
- Ne fait pas : avancer un OF, modifier une fiche technique, créer une commande · Ne voit pas : OF non affectés, stock, ventes
- Priorités : 1) choisir l'OF en production ; 2) saisir la quantité produite par étape ; 3) déclarer les pertes

**Menu** — 3 entrées (au lieu de 5), en **barre basse sur mobile** (menu latéral sur ordinateur) :
Mes OF · Saisir · Accueil

**Page d'accueil**
- KPI : Mes étapes du jour, Pertes du jour.
- Liste de **cartes OF** (uniquement ses OF ouverts, OF en production en tête et mis en avant) : n°, article, quantité, statut, et deux gros boutons **[Étape]** et **[Perte]** qui ouvrent « Saisir » avec l'OF pré-rempli.

**Écrans accessibles** : Accueil · Saisir · Mes OF (liste + fiche en lecture seule).

### 2.5 Responsable Qualité (`RESPONSABLE_QUALITE`)
**Carte d'identité**
- Station : Contrôle et libération · Couleur : vert · Icône : coche
- Mission : « Transformez chaque OF terminé en lot, contrôlez-le, puis libérez-le ou bloquez-le. Seuls les lots libérés se vendent. »
- Posture : « Contrôle conforme ou non conforme, puis libération ou blocage. »
- Fait : lots, contrôles, libération, blocage, contrôle des retours
- Ne fait pas : modifier le planning, vendre un lot en attente · Ne voit pas : commandes, prix, caisse
- Priorités : 1) transformer chaque OF terminé en lot ; 2) contrôler (Conforme / Non conforme) ; 3) libérer ou bloquer ; 4) traiter les retours clients

**Menu (sidebar)** — un seul groupe « Qualité », 5 entrées (au lieu de 6) :
Accueil · Lots qualité · Réclamations · Stock · Fiches
- **Fiches** (hub à onglets, lecture) : Articles · Fiches techniques.
- L'ancien écran « OF reçus » devient l'onglet « À créer » des lots (`/production/qualite/of` redirige).

**Page d'accueil**
- Actions rapides : Créer les lots, Contrôler.
- KPI : Lots en attente, OF à contrôler (lot à créer), Contrôles du jour (+ conformes), Lots bloqués.
- Files de travail : OF reçus, Lots à contrôler, Lots bloqués, Retours en quarantaine.
- Graphique : camembert « Lots par statut ».

**Écrans accessibles** : Accueil · Lots qualité (onglets + fiche lot) · Réclamations (liste + détail) · Situation de stock · Fiches (Articles, Fiches techniques en lecture).

### 2.6 Magasinier (`MAGASINIER`)
**Carte d'identité**
- Station : Magasin et quai · Couleur : ambre · Icône : boîtes
- Mission : « Livrez les matières à l'atelier, sortez les commandes préparées, réceptionnez les fournisseurs et tenez les inventaires. »
- Posture : « Chaque mouvement a une origine. Disponible = physique − bloquée − réservée. »
- Fait : livraisons matières, sorties, réceptions, inventaires, dépôts
- Ne fait pas : prix, encaissement · Ne voit pas : factures, caisse, coûts
- Priorités : 1) livrer les matières à l'atelier (partiel possible) ; 2) confirmer la préparation puis la sortie magasin ; 3) réceptionner ; 4) inventaires

**Menu (sidebar)** — un seul groupe « Magasin », 6 entrées (au lieu de 11) :
Accueil · Servir l'atelier · Préparations · Réceptions · Stock · Réclamations
- **Stock** (hub à onglets) : Situation · Mouvements · Inventaires · Dépôts.

**Page d'accueil**
- Actions rapides : Servir l'atelier, Réceptionner.
- KPI : Matières à servir, Préparations clients, Réceptions attendues, Articles sous seuil.
- Files dans l'ordre d'urgence : Matières à servir, Préparations, Livraisons fournisseurs attendues (ouvre directement le tiroir de réception), Articles sous le seuil, puis Inventaires en cours s'il y en a.
- Graphique : camembert « Mouvements de stock » (7 derniers jours).

**Écrans accessibles** : Accueil · Servir l'atelier · Préparations (liste + fiche) · Réceptions · Stock (Situation, Mouvements, Inventaires, Dépôts) · Réclamations.

### 2.7 Responsable Achat (`RESPONSABLE_ACHATS`)
**Carte d'identité**
- Station : Approvisionnement · Couleur : teal · Icône : chariot
- Mission : « Couvrez les besoins, traitez les demandes d'achat, envoyez les commandes et suivez les réceptions. »
- Posture : « Le stock matières suit le reçu, pas le commandé. »
- Fait : fournisseurs, DA (approuver / rejeter), commandes, réceptions
- Ne fait pas : lancer un OF, modifier un client · Ne voit pas : ventes, caisse, production
- Priorités : 1) couvrir les besoins sous seuil ; 2) approuver / rejeter les DA ; 3) créer et envoyer les commandes ; 4) suivre les réceptions

**Menu (sidebar)** — un seul groupe « Achats », 5 entrées (au lieu de 9) :
Accueil · Approvisionnement · Fournisseurs · Stock · Catalogue
- **Catalogue** (hub à onglets) : Articles · Matières.

**Page d'accueil**
- Action rapide : Approvisionnement.
- KPI : Demandes à approuver, Besoins à couvrir, Commandes à envoyer, Livraisons attendues (chacun ouvre l'étape correspondante du flux).
- Files dans l'ordre du flux : Besoins non couverts (badge « Sous seuil »), Demandes en attente d'approbation, Commandes prêtes à envoyer, Livraisons attendues, puis Articles sous le seuil.
- Graphique : camembert « Commandes fournisseurs » par statut.

**Écrans accessibles** : Accueil · Approvisionnement (et les anciens écrans Besoins, Demandes, Commandes, Réceptions) · Fournisseurs · Situation de stock · Catalogue (Articles, Matières).

### 2.8 Commercial (`COMMERCIAL`)
**Carte d'identité**
- Station : Vente · Couleur : bleu marine · Icône : poignée de main
- Mission : « Créez les commandes, validez-les, facturez, puis suivez les impayés et les clients bloqués. »
- Posture : « Vous ne forcez pas le stock. Les lots non libérés ne sont pas vendables. »
- Fait : clients, tarifs, commandes, factures, avoirs, réclamations · Voit : stock en lecture
- Ne fait pas : encaisser, modifier le stock, livrer
- Priorités : 1) créer la commande ; 2) ajouter les lignes ; 3) valider ; 4) facturer ; 5) suivre impayés et clients bloqués

**Menu (sidebar)** — un seul groupe « Vente », 6 entrées (au lieu de 11) :
Accueil · Commandes · Facturation · Clients · Tarifs · Réclamations

**Page d'accueil**
- Actions rapides : Nouvelle commande (ouvre le tiroir), Clients.
- KPI : Facturé ce mois, Commandes à valider, Factures non payées, Factures échues.
- Files : Commandes en brouillon, Factures échues, Clients bloqués, Réclamations ouvertes.
- Graphique : camembert « Commandes par statut ».

**Écrans accessibles** : Accueil · Commandes (liste + fiche) · Facturation (Factures, Impayés, Avoirs) · Clients · Tarifs · Réclamations · Situation de stock (lecture).

### 2.9 Caissier (`CAISSIER`)
**Carte d'identité**
- Station : Caisse · Couleur : vert · Icône : billet
- Mission : « Ouvrez votre session, encaissez les factures, demandez un décaissement si besoin, puis clôturez en justifiant l'écart. »
- Posture : « Le caissier ne modifie ni commande, ni prix, ni stock. »
- Fait : encaisser, demander un décaissement, clôturer
- Ne fait pas : supprimer un écart, valider un BL, exporter · Ne voit pas : prix, stock, autres sessions
- Priorités : 1) ouvrir la session ; 2) encaisser les factures ; 3) demander un décaissement si besoin ; 4) clôturer et justifier l'écart
- Sans caisse affectée : bandeau bloquant « contactez l'Admin SI » (accueil, Caisse, Ma session, Décaissements).

**Menu (sidebar)** — un seul groupe « Caisse », 4 entrées (les anciens écrans « Encaissement » et « Factures non soldées » sont intégrés à Caisse) :
Accueil · Caisse · Décaissements · Ma session

**Page d'accueil**
- **Bandeau caisse en tête** : solde de la caisse principale (masquable), ma caisse, état de la session ; si la session est fermée, **bouton unique [Ouvrir ma session]**.
- Actions rapides (session ouverte) : Encaisser, Ma session.
- KPI : Factures à encaisser, Encaissé aujourd'hui, Décaissé aujourd'hui.
- Files : Factures à encaisser (ouvrent la facture dans Caisse), Encaissements du jour, Écarts à justifier.
- Graphique : camembert des encaissements du jour par mode de paiement.

**Écrans accessibles** : Accueil · Caisse · Décaissements · Ma session · Commandes (lecture, depuis une facture).

### 2.10 Responsable Distribution (`RESPONSABLE_DISTRIBUTION`)
**Carte d'identité**
- Station : Logistique · Couleur : teal · Icône : camion
- Mission : « Véhicules, chauffeurs, tournées, préparations et livraisons. »
- Posture : « Circuit : commande → préparation → sortie magasin → bon de livraison → signature client. »
- Possède : Tournées, Véhicules, Chauffeurs, Préparations, Bons de livraison
- Ne fait jamais : encaisser, modifier le stock hors transfert
- Règles : confirmer une livraison enregistre la signature du client

**Menu (sidebar)**
- Menu : Accueil
- Distribution : Préparations, Bons de livraison, Tournées, Réclamations
- Commandes : Commandes (lecture/consultation des commandes à préparer)
- Pas de Référentiel.

**Page d'accueil**
- Actions rapides : Préparations, Tournées.
- KPI : Commandes à lancer, Préparations en cours, Prêtes à sortir, En livraison.
- Files de travail : Commandes validées à préparer, Préparations, Livraisons en cours, Tournées du jour, Réclamations ouvertes (si existantes).
- Graphique : camembert « Bons de livraison » par statut.

**Écrans accessibles** : Accueil · Préparations (liste + détail) · Bons de livraison (liste + détail) · Tournées · Réclamations (liste + détail) · Commandes clients (lecture).

### 2.11 Chauffeur / Livreur (`CHAUFFEUR`)
**Carte d'identité**
- Station : Tournée · Couleur : ambre · Icône : colis
- Mission : « Consultez uniquement vos tournées et bons de livraison. »
- Posture : « Vous voyez uniquement votre tournée du jour. »
- Possède : Mes tournées, Mes BL
- Ne fait jamais : créer une tournée, confirmer une livraison (réservé au responsable)
- Règles : seules ses tournées apparaissent dans le menu

**Menu (sidebar)**
- Menu : Accueil
- Mes livraisons : Bons de livraison, Tournées
- Pas de Référentiel, pas d'accès supplémentaire.

**Page d'accueil**
- Actions rapides : Mes bons de livraison, Mes tournées.
- KPI : Tournées du jour, BL à livrer, Livrés aujourd'hui.
- Files de travail : Bons à livrer, Tournées à venir (badge « Aujourd'hui »).
- Pas de graphique (seul poste avec l'Admin SI à ne pas en avoir).

**Écrans accessibles** : Accueil · Bons de livraison (liste + détail — actions « Marquer remis au client » / « Signaler un problème » réservées à ce poste) · Tournées (lecture, uniquement les siennes).

### 2.12 Comptabilité / DAF (`COMPTABILITE_DAF`)
**Carte d'identité**
- Station : Finance · Couleur : ardoise (slate) · Icône : registre
- Mission : « Coûts, anomalies, exports comptables et clôtures. »
- Posture : « Pas de saisie d'écriture libre : vous contrôlez et exportez. »
- Possède : Coûts, Anomalies, Exports, Clôtures, Journal
- Ne fait jamais : saisir un mouvement de stock, lancer un OF
- Règles : recalculer un coût réel avant d'exporter ; exports disponibles : ventes, encaissements, achats, journal

**Menu (sidebar)**
- Menu : Accueil
- Comptabilité : Anomalies, Écritures, Exports comptables, Clôtures, Paramètres comptables, Journal d'audit, Impayés
- Coûts : Coûts réels, Coûts standards, Valorisation du stock
- Caisse : Sessions de caisse, Décaissements
- Référentiel : Codes fiscaux (écriture)

**Page d'accueil**
- Actions rapides : Exports comptables, Clôtures.
- KPI : Anomalies à traiter, Encaissé ce mois, Factures impayées, Dernière clôture.
- Files de travail : Anomalies à traiter, Factures échues, Écarts de caisse à valider, Derniers exports.
- Graphique : barres horizontales « Anomalies par type » (ouvertes).

**Écrans accessibles** : Accueil · Anomalies · Écritures comptables · Exports comptables · Clôtures comptables · Paramètres comptables · Journal d'audit · Impayés · Coûts réels · Coûts standards et marges · Valorisation du stock · Sessions de caisse / Clôture · Décaissements · Référentiel : Codes fiscaux.

---

## 3. Catalogue détaillé des écrans (par domaine)

### 3.1 Tableau de bord — `/dashboard`
**Objectif :** vue d'ensemble chiffrée de l'usine (ventes, caisse, production, stock, livraisons, rentabilité).
**Rôles :** Direction et Comptabilité/DAF voient la version complète « pilotage » ; les autres postes y accédant voient une version restreinte (KPI simples + liste des OF).

*Version Direction / Comptabilité/DAF (« ReportingDashboard »)* :
- En haut : bouton **Actualiser** et horodatage de dernière mise à jour.
- 4 KPI : CA du jour (+ CA du mois), Encaissé aujourd'hui (+ écart de caisse), Rendement du jour (+ pertes), Valeur du stock (+ ruptures).
- Widget **Production** : quantité conforme, jauges de rendement et de pertes, pour aujourd'hui et pour le mois.
- Widget **Livraisons du jour** : graphique en barres (prévues / en cours / terminées / en retard) + taux de complétion.
- Widget **Stock** : camembert produits finis vs matières, compteurs « en rupture » et « sous minimum ».
- Widget **Caisse** : encaissements, solde théorique, écart de caisse (+ nombre de non justifiés).
- Widget **Commercial** : CA du mois, produit le plus vendu, client principal.
- Widget **Rentabilité** : top 5 produits les plus rentables (marge, taux de marge) avec lien vers Coûts standards.
- Mise en page : les 6 widgets (Production, Livraisons, Stock, Caisse, Commercial, Rentabilité) en grille de 2 colonnes ; **Alertes** dans une colonne droite fixe.
- Widget **Alertes** : 4 blocs empilés — matières manquantes, ruptures de stock, écarts de caisse non justifiés, anomalies comptables (lien vers Anomalies).
- En bas, tableau **Rapports générés** : colonnes Période, Date, Généré le ; bouton « Générer le rapport du jour » si droit `GENERER_RAPPORT`.

*Version restreinte (autres postes)* :
- 4 KPI : Stock disponible, Encaissements, OF ouverts, Lots en attente.
- Tableau des 8 premiers OF (N°, Article, Statut).
- Message : « Les indicateurs détaillés sont réservés à la direction. »

### 3.2 Production
#### Plans de production — `/production/planning`
**Objectif :** prévisions de volumes ; convertir un plan en OF déclenche le calcul des besoins matières.
**Tableau :** Article (+ commentaire), Date prévue, Quantité, Priorité (badge), Statut (badge), action. Filtres : recherche, À convertir / Convertis / Tous. Tri : plans ouverts d'abord, par priorité puis date.
**Tiroir « Nouveau plan »** (bouton d'en-tête, droit `CREATE_PLAN`) : Article, Date prévue, Quantité, Priorité (4 boutons), Commentaire ; alerte si l'article n'a pas de fiche technique validée.
**En fin de ligne : [Convertir en OF]** (droit `CONVERTIR_PLAN`) → mini-tiroir avec sélecteur d'agents à cases à cocher. Bouton grisé avec lien « Fiche technique non validée » si l'article n'a pas de fiche validée.

#### Ordres de fabrication (liste) — `/production/of`
*Agent Production : écran « Mes OF » — liste de ses OF (En cours / Terminés), fiche en lecture seule (stepper, besoins, étapes & pertes, suivi eau) avec un bouton « Saisir sur cet OF ».*
**Haut :** 3 KPI (OF en production, Attente qualité, Volume à produire) + graphique « Pipeline » (OF par statut).
**Pastilles de statut** (Ouverts, chaque statut présent, Tous) avec compteurs, recherche.
**Tableau :** Numéro, Article, Quantité, Statut (badge), Agents, Créé le. Ligne cliquable → fiche.
**[+ Créer OF]** (en-tête, droit `CREATE_OF`) → tiroir : Article, Quantité, Plan d'origine (facultatif), Agents ; création bloquée si fiche technique non validée.

#### Détail d'un ordre de fabrication — `/production/of/[id]` (gabarit B)
- En haut : retour à la liste, numéro + badge, **stepper** de progression.
- Bandeau si production terminée (contrôle qualité en attente) ou OF annulé (motif).
- **Onglets :** Synthèse (infos + agents réaffectables, droit `AFFECTER_AGENTS_OF`) · Besoins matières (théorique / disponible / manquant / situation ; bouton **[Demander les matières au magasin]**, remplacé ensuite par **[Demande complémentaire]** en tiroir ; suivi des demandes) · Sorties (sorties, retours, compléments) · Étapes & pertes · Suivi eau (OF de la famille eau uniquement ; saisie en tiroir) · Lots · Historique.
- **Barre fixe en bas :** **[Avancer → statut suivant]** (droit `AVANCER_OF`) et lien discret **Annuler l'OF** (droit `ANNULER_OF`, tiroir avec motif obligatoire) ; rappel des demandes de matières non livrées.

#### Saisir — `/production/suivi` (gabarit C, mobile)
- Sélecteur d'OF en haut (pré-rempli par `?of=` depuis une carte de l'accueil), avec quantité et statut.
- **Onglets :** Étape · Perte · Eau (OF de la famille eau uniquement) · Session (`?tab=`).
  - Étape (`CREATE_ETAPE`) : étape en gros boutons, quantité produite, observations.
  - Perte (`CREATE_PERTE`) : motif en gros boutons (liste fixe), quantité, observations.
  - Eau (`CREATE_SUIVI_EAU`) : volumes capté / traitement / embouteillage, bouteilles produites / conformes / rejetées, packs.
  - Session (`CREATE_SUIVI_PROD`) : heure de début, équipe, quantités entrée / produite / conforme / rejetée, arrêts, incidents.
- Bouton **[Enregistrer]** pleine largeur, collé en bas au-dessus de la barre de navigation ; confirmation « Enregistré ».
- **Dernières saisies du jour** en tableau compact sous le formulaire (derniers relevés de l'OF pour l'onglet Eau).

#### Suivi eau — `/production/suivi-eau`
**Objectif :** volumes captage → traitement → embouteillage et bouteilles produites sur un OF de la ligne eau.
**Tableau :** OF, Capté (L), Obtenu traitement (L), Envoyé embouteillage (L), Perte captage→traitement, Perte traitement→embouteillage, Bouteilles produites, Taux de rejet (pertes et taux calculés côté écran).
**Formulaire** (droit `CREATE_SUIVI_EAU`) : OF (filtré sur la famille « eau »), Volume capté, Volume envoyé traitement, Volume obtenu après traitement, Volume envoyé embouteillage, Bouteilles produites/conformes/rejetées, Nombre de packs. Bouton « Enregistrer ».

#### Pertes de production — `/production/pertes`
**Tableau :** OF, Motif, Qté, Taux, Observations.
**Formulaire** (droit `CREATE_PERTE`) : OF, Motif (liste fixe : Casse, Mauvais réglage, Fuite, Défaut matière, Défaut bouteille, Contrôle qualité, Arrêt machine, Nettoyage, Erreur opérateur, Autre), Quantité, Taux de perte % (optionnel). Bouton « Enregistrer ».

#### Besoins matières — `/production/besoins`
**Objectif :** quantités théoriques de matières calculées à la création de l'OF, avec stock disponible et manquant. Écran de consultation uniquement.
**Tableau :** OF, Matière, Théorique, Dispo, Manquant, Situation.

#### Matières atelier — `/production/demandes-matieres`
**Objectif :** suivi des demandes de matières, compléments, sorties et retours pour les OF.
**4 onglets** (avec compteurs) et recherche commune ; numéro d'OF cliquable vers sa fiche :
1. Demandes (N°, OF, Matière, Demandée, Livrée, Statut) — quantité à livrer + « Livrer » par ligne (droit `LIVRER_DEMANDE_MATIERE`).
2. Compléments (N°, OF, Matière, Quantité, Motif, Statut) — Approuver / Rejeter (droit `APPROUVER_COMPLEMENT`).
3. Sorties (OF, Matière, Quantité, Type, Motif, Date).
4. Retours (OF, Matière, Quantité retournée, Date).
**Formulaires en tiroir** (bouton d'en-tête selon l'onglet) : Demande complémentaire (`CREATE_COMPLEMENT`), Sortie manuelle (`CREATE_SORTIE`, motif obligatoire si complémentaire), Retour matière (`CREATE_RETOUR_MAT`).

### 3.3 Qualité
#### Lots qualité — `/production/qualite`
**Onglets avec compteurs** (`?tab=`) : **À créer** (OF terminés ou en contrôle sans lot ; bouton **« Créer le lot »** en fin de ligne → tiroir : quantité pré-remplie, date de production, péremption) · **À contrôler** (En attente) · **À libérer** (Conforme) · **Libérés** · **Bloqués** (Bloqué ou Non conforme). Recherche commune ; ligne de lot cliquable → fiche.
*La Direction (Supervision) voit les mêmes onglets sans « À créer ».*

#### Fiche lot — `/production/qualite/[id]` (gabarit B)
- **Gauche :** bandeau d'état (« Lot libéré — vendable » vert, « Lot bloqué — non vendable » rouge, sinon « non vendable pour l'instant ») + synthèse (article, OF, quantité, production, péremption).
- **Droite :** panneau **Résultat du contrôle** (contrôleur, date, observations) avec champ Observations, qui sert aussi de motif de blocage.
- **Barre fixe en bas :** **[Non conforme] [Conforme]** (droit `CREATE_CONTROLE`, lot en attente), puis **[Libérer le lot]** (droit `LIBERER_LOT`, lot conforme) ou **[Bloquer]** (droit `BLOQUER_LOT`, motif obligatoire).
- Historique.

### 3.4 Stocks
#### Situation de stock — `/stocks`
**Objectif :** stock disponible par article et dépôt. Filtres : recherche, dépôt, « Sous seuil ». Tableau : Article, Dépôt, Physique, Bloquée, Réservée, Disponible (rouge si nul, orange sous le minimum). Ligne cliquable → fiche article.

#### Fiche stock d'un article — `/stocks/article/[id]`
En-tête = code/désignation/type/unité de l'article. Tableau par dépôt : Dépôt, Physique, Disponible. Lecture seule.

#### Inventaires — `/stocks/inventaires`
**Tableau :** Dépôt, Date, Statut (badge), Ouvert par ; inventaires en cours en tête. Ligne cliquable → détail.
**[+ Ouvrir un inventaire]** (droit `CREATE_INVENTAIRE`) → tiroir : Dépôt, Date du comptage.

#### Détail d'un inventaire — `/stocks/inventaires/[id]`
**En-tête :** dépôt, statut, date, créateur ; bouton **« Clôturer »** (droit `CLOTURER_INVENTAIRE`, si en cours).
**Tableau :** Article, Théorique, Comptée.
**Formulaire d'ajout de ligne** (droit `CREATE_INVENTAIRE`, si en cours) : Article, Théorique, Comptée. Bouton « Ajouter ligne ».
Composant Historique en bas de page.

#### Mouvements de stock — `/stocks/mouvements`
**Tableau :** N°, Type (badge), Article, Dépôt, Quantité, Origine / motif, Saisi par, Date. Filtres : recherche, type, dépôt.
**[+ Mouvement manuel]** (droit `CREATE_MVT`) → tiroir limité à **Ajustement** ou **Transfert**, avec Article, Dépôt, Quantité et **motif obligatoire** (les autres mouvements naissent des documents).

#### Valorisation du stock (CMUP) — `/stocks/valorisation`
**Objectif :** valeur du stock au coût moyen unitaire pondéré, recalculé automatiquement à chaque entrée en stock.
**Filtres :** Dépôt (tous ou un en particulier), Type d'article.
**Contenu :** encadré « Valeur totale du stock filtré » (FCFA) ; tableau détaillé — Article, Désignation, Type, Dépôt, Quantité, CMUP, Valeur. Écran de consultation uniquement.

*(Note : `/stocks/alertes` n'est qu'une redirection technique vers `/stocks`, sans contenu propre.)*

### 3.5 Achats / Approvisionnement
#### Approvisionnement — `/approvisionnement` (Responsable Achat)
**Frise de flux en haut** avec compteurs : Besoins (à couvrir) → Demandes (à traiter) → Commandes (à envoyer) → Réceptions (attendues) ; chaque pastille est un onglet (`?etape=`). Tableau dessous, recherche et vue « À traiter / Tout ».
**Actions de ligne :** Besoin → **[Créer la DA]** · DA en attente → **[Approuver] [Rejeter]** · DA approuvée → **[Créer la commande]** (tiroir pré-rempli) · Commande brouillon → **[Envoyer]** · Commande attendue → **[Réceptionner]** (tiroir de réception).
**Boutons d'en-tête** selon l'étape : Nouvelle demande (tiroir), Nouvelle commande.

#### Commande fournisseur (tiroir)
Fournisseur + lignes (article, quantité, prix — prix du catalogue fournisseur proposé) dans un seul formulaire, total en direct ; **[Envoyer]** fixe en bas (ou « Enregistrer le brouillon »). Pour une commande existante : onglets **Commande · Réceptions · Historique**.

#### Besoins d'approvisionnement — `/approvisionnement/besoins`
**Tableau :** Article, Qté, Origine (Production / Stock sous seuil / Saisie manuelle), Satisfait (Oui/Non), action.
**Actions :** bouton **« Créer la DA »** par ligne non satisfaite (droit `CREER_DA_DEPUIS_BESOIN`). Pas de formulaire de création (besoins générés automatiquement).

#### Demandes d'achat — `/approvisionnement/demandes`
**Tableau :** #, Article, Qté, Statut (badge : En attente/Approuvée/Rejetée/Transformée), action.
**Formulaire** (droit `CREATE_DA`) : Article (matières premières), Quantité, Motif. Bouton « Créer ».
**Actions par ligne (si En attente) :** « Approuver » (droit `APPROUVER_DA`), « Rejeter » (droit `REJETER_DA`).

#### Commandes fournisseurs — `/approvisionnement/commandes`
**Tableau :** N°, Fournisseur, Statut, Lignes (résumé article × quantité), action.
**Formulaires** (droit `CREATE_CF`) : 1) Création de commande — Fournisseur, Demande d'achat d'origine (optionnelle, limitée aux DA approuvées) ; 2) Ajout de ligne — Commande, Article, Quantité, Prix.
**Actions :** « Créer commande », « Ajouter ligne », « Envoyer » (droit `ENVOYER_CF`, si Brouillon).

#### Réceptions — `/approvisionnement/receptions`
**Onglets :** À réceptionner (commandes fournisseurs envoyées ou partiellement reçues, lignes restantes, bouton **« Réceptionner »**) · Réceptions effectuées (commande, réceptionnée par, conformité, date ; ligne cliquable → détail).
**Tiroir unique de réception** (droit `CREATE_RECEPTION`, ouvrable par `?cf=`) : lignes de la commande (article, commandé, déjà reçu, reste dû), colonne **« Qté reçue »** pré-remplie avec le reste dû, **écart calculé en direct** (✓, manque en orange, excédent en rouge), observations ; conformité déduite des écarts ; **[Valider la réception]** en bas (crée la réception et ses lignes en une fois).

#### Détail d'une réception — `/approvisionnement/receptions/[id]`
**Tableau :** Article, Qté reçue.
**Formulaire** (droit `CREATE_RECEPTION`) : Ligne de commande concernée, Quantité reçue. Bouton « Ajouter ».

### 3.6 Commercial
#### Commandes clients (liste) — `/commercial/commandes`
**Pastilles de statut** (En cours, chaque statut, Toutes) + recherche. **Tableau :** N°, Client, Type, Montant, Statut, Date. Ligne cliquable → fiche.
**[+ Nouvelle commande]** (droit `CREATE_COMMANDE`, aussi via `?nouvelle=1`) → tiroir : client (bloqués grisés, non sélectionnables), type (Comptant / Contrat) → **« Créer et ouvrir »** ouvre directement la fiche de la commande.

#### Fiche commande — `/commercial/commandes/[id]` (gabarit B)
- **Stepper** Brouillon → Validée → En préparation → Livrée → Facturée.
- **Haut :** client avec **encours en direct** (« factures non soldées / encours autorisé », barre colorée, alerte si la commande ferait dépasser).
- **Centre :** tableau des lignes (article, quantité, prix, montant) avec le **stock disponible en information** sur chaque ligne ; **[+ Ligne]** en brouillon : article, quantité, **prix automatique** (tarif client sinon public ; ajout impossible sans tarif).
- **Droite :** total HT + **bloc facture** (numéro, statut, HT, taxes, TTC, échéance ; alerte et « Générer les lignes » si code fiscal manquant).
- **Barre fixe :** **[Valider]** (brouillon avec lignes, client non bloqué) → **[Facturer]** (tiroir d'aperçu HT / accise / centimes / TVA / TTC estimé, puis « Émettre la facture ») → **[PDF]**.
- Historique.

#### Facturation — `/commercial/facturation`
**Onglets** (`?onglet=`) :
- **Factures** : non soldées / toutes ; N°, client, émission, échéance (rouge si échue), montant TTC, statut, PDF ; ligne → fiche commande.
- **Impayés** : factures échues non soldées triées par retard ; bandeau et montants en rouge au-delà de 30 jours.
- **Avoirs** : liste (montant, facture d'origine, motif, statut) ; **[Émettre un avoir]** (tiroir : client, facture d'origine, montant, motif) et **[Appliquer]** par avoir émis (tiroir : facture non soldée du client).

### 3.7 Distribution
#### Préparations (liste) — `/distribution/preparations`
**Tableau :** Commande, Client, Statut (badge), Lancée le, Préparée par. Filtres : recherche, À traiter / Sorties / Toutes. Ligne cliquable → fiche.
**[+ Lancer une préparation]** (droit `CREATE_PREP`) → tiroir : commandes validées sans préparation.

#### Détail préparation — `/distribution/preparations/[id]`
Stepper (À préparer → En préparation → Sortie magasin), synthèse, articles à sortir avec disponible (si les lignes sont transmises au poste), Historique.
**Barre fixe en bas :** **[Confirmer préparation]** (droit `PREP_CONFIRMER`) puis **[Confirmer sortie]** (droit `PREP_SORTIE`).
**Erreur « stock insuffisant »** : affichée en Guard rouge avec l'article, le dépôt, la quantité demandée et le **disponible réel** ; aucune sortie n'est enregistrée (tout ou rien).

#### Bons de livraison (liste) — `/distribution/bl`
**Tableau :** N°, Commande, Statut (badge), Signature (Oui/Non). Ligne cliquable → détail.
**Formulaire** (droit `CREATE_BL`) : Commande, Tournée (optionnelle). Bouton « Créer BL ».

#### Détail bon de livraison — `/distribution/bl/[id]`
**En-tête :** numéro, badge de statut, commande liée. Boutons :
- **« Marquer remis au client »** (droit `LIVRER_BL`, si En livraison, sans signature déjà enregistrée).
- **« Signaler un problème »** (droit `SIGNALER_PROBLEME_BL`, saisie du motif via une invite de saisie, obligatoire) — réservé notamment au Chauffeur.
- **« Confirmer la livraison »** (droit `CONFIRMER_BL`, si pas encore Livrée) — réservé au Responsable Distribution.
Bandeau d'alerte si un incident a été signalé par le chauffeur. Composant Historique.

#### Tournées — `/distribution/tournees`
**Tableau :** N°, Chauffeur, Véhicule, Date.
**Formulaires :** « Véhicule » (droit `CREATE_VEHICULE` : Immatriculation, Type) ; « Chauffeur » (droit `CREATE_CHAUFFEUR` : Utilisateur profil Chauffeur, N° de permis) ; « Créer une tournée » (droit `CREATE_TOURNEE` : Chauffeur, Véhicule, Date).

### 3.8 Réclamations
#### Réclamations (liste) — `/reclamations`
**Objectif :** circuit après BL validé : réclamation → retour physique → contrôle → solution.
**Tableau :** N°, Client, Article, Qté, Problème, Statut, Date, lien « Ouvrir ».
**Formulaire** (droit `CREATE_RECLAMATION`) : Client, Article, Quantité, Type de problème (Produit défectueux / manquant / Erreur de référence / Emballage endommagé / Produit périmé / Autre), Description, case « Produit retourné ».

#### Détail réclamation — `/reclamations/[id]`
**Parcours vertical** : seules les étapes franchies (pastille verte, date) et l'étape courante (surlignée, « Étape en cours », avec son formulaire) sont visibles :
1. Réclamation enregistrée (récapitulatif).
2. **Retour physique en quarantaine** (si produit retourné ; droit `CREATE_RETOUR_PHYSIQUE`) : quantité → « Réceptionner en quarantaine ».
3. **Contrôle du retour** (droit `CREATE_CONTROLE_RETOUR`) : résultat en boutons (Récupérable directement / avec intervention / Non récupérable), observations → « Enregistrer le contrôle » ; la décision s'applique automatiquement.
4. **Reconditionnement** (si créé ; droit `TERMINER_RECONDITIONNEMENT`) : quantité → « Terminer & réintégrer ».
5. **Solution client et clôture** (droit `CREATE_SOLUTION`) : type, montant (avoir / remboursement) → « Appliquer la solution ».
Historique en bas.

### 3.9 Caisse
#### Caisse — `/caisse` (Caissier)
- **Barre de session fixe en haut** : caisse, état (ouverte avec solde théorique / fermée avec solde repris) et **[Ouvrir ma session]** ou **[Clôturer]** (→ Ma session) ; bandeau rouge bloquant si aucune caisse n'est affectée.
- **Gauche (60 %)** : factures en onglets **À encaisser** (émises) / **Non soldées** (partiellement payées), recherche par n° ou client ; chaque ligne affiche le restant dû et un lien « Voir la commande » (lecture).
- **Droite (40 %, fixe)** : facture sélectionnée (`?facture=`), **restant dû** (total, déjà payé), **mode de paiement** en gros boutons (Espèces, Mobile money, Virement, Chèque), montant (pré-rempli, paiement partiel possible), grand bouton **[Encaisser]** en bas.
- `/caisse/encaissement/[id]` redirige vers `/caisse?facture=id`.

#### Ma session — `/caisse/cloture`
**Caissier :** session ouverte avec le **solde théorique calculé** (ouverture + encaissements par mode − décaissements effectués) ; **solde compté** à saisir, **écart en direct**, **justification obligatoire si écart**, **[Clôturer]**. Session fermée : [Ouvrir ma session]. En dessous : mes sessions (théorique, compté, écart) et **mes écarts en lecture seule**.
**Autres postes (Comptabilité, Admin) :** tableau de toutes les sessions et des écarts ; la clôture reste réservée au caissier de la session.

#### Factures non soldées — `/caisse/suspendues`
Lecture : factures émises ou partiellement payées (N°, Client, Montant, Statut). Remplacé pour le caissier par l'onglet « Non soldées » de Caisse.

#### Décaissements — `/caisse/decaissements`
**Caissier :** à gauche **Nouvelle demande** (montant, bénéficiaire, motif obligatoire ; sur sa session ouverte) ; à droite **ses demandes** avec leur statut, et **[Effectuer la sortie]** uniquement sur ses demandes autorisées.
**Direction :** à autoriser à gauche, historique à droite (voir 2.2).
**Comptabilité / Admin :** panneau « À autoriser » et tableau général.

### 3.10 Comptabilité
#### Anomalies — `/comptabilite/brouillards`
**Objectif :** écarts de stock/caisse, dépassements matières, lots vendus trop tôt, impayés, péremptions — détectés automatiquement, jamais saisis.
**Bouton d'en-tête :** **« Lancer la détection »** (droit `DETECTER_ANOMALIES`), affiche ensuite le nombre détecté/résolu automatiquement.
**Tableau :** Type, Module, Description (+ commentaire de traitement si traitée), Statut (badge), Date, action.
**Actions par ligne (si non traitée) :** **« Prendre en charge »** (droit `RESOUDRE_ANOMALIE`, si Détectée), champ Commentaire, boutons **« Résoudre »** / **« Ignorer »** (commentaire obligatoire pour les deux).

#### Clôtures comptables — `/comptabilite/clotures`
**Tableau :** Période, Type (Mensuelle/Annuelle), Validée par, Date.
**Formulaire** (droit `CREATE_CLOTURE`) : Période (AAAA-MM ou AAAA), Type → bouton « Clôturer la période ».

#### Écritures comptables — `/comptabilite/ecritures`
**Objectif :** journal comptable en lecture seule, généré automatiquement à partir des documents.
**Tableau :** Numéro, Journal, Date, Pièce, Libellé, Débit, Crédit, Exportée (Oui/Non). Aucune saisie possible.

#### Exports comptables (Sage) — `/comptabilite/export-sage`
**Tableau :** Type (Ventes/Encaissements/Achats/Journal), Période, Généré le, action.
**Formulaire** (droit `CREATE_EXPORT`) : Type, Date de début, Date de fin → bouton « Générer ».
**Action :** **« Télécharger CSV »** par export existant (toujours visible, pas de garde de droit).

#### Paramètres comptables — `/comptabilite/parametres`
**Objectif :** plan de comptes et seuils de contrôle automatiques, modifiables sans intervention technique.
**Panneau « Plan de comptes »** : liste rôle → numéro de compte, éditable (droit `PATCH_COMPTE_PARAMETRE`) avec bouton « Enregistrer » par ligne.
**Panneau « Seuils des contrôles automatiques »** : liste libellé → valeur (avec min/max affichés), éditable avec bouton « Enregistrer » par ligne.

### 3.11 Coûts
#### Coûts réels — `/couts`
**Tableau :** OF, Matières, MO, Énergie, Amortissement, Total (calculé), action **« Recalculer »** (droit `RECALCULER_COUT`).

#### Coûts standards et marges — `/couts/marges`
**3 tableaux :** 1) Coûts standards vs tarifs (Article, Coût standard, Tarif public) ; 2) Coûts matières (Article, Coût unitaire) ; 3) Coûts des retours/pertes clients (Réclamation, Qté détruite, Coût produit détruit, Coût reconditionnement, action) — n'apparaît que s'il existe au moins un enregistrement ; champ de valorisation inline + bouton « Enregistrer » (droit `VALORISER_COUT_RETOUR`).

### 3.12 Référentiel (Paramétrage)
#### Hub — `/parametrage`
Redirige vers le premier onglet accessible. Pour l'Admin SI (entrée « Référentiel » du menu, hub à onglets), chaque page du référentiel s'ouvre sous un en-tête commun avec des **onglets** : Articles · Matières · Conditionnements · Dépôts · Clients · Fournisseurs · Codes fiscaux (filtrés selon les droits). Les codes générés automatiquement sont en lecture seule ; les champs de codification d'un article déjà utilisé sont verrouillés.

#### Articles — `/parametrage/produits` et fiche `/parametrage/produits/[id]`
**Liste :** Code, Désignation, Type, Unité, Famille, Code fiscal, Fiche technique (badge Validée/Brouillon). Filtres : recherche, Fiche technique, Type, Famille, Statut.
**Formulaire de création** (si droit d'écriture) : Désignation, Type (Produit fini/intermédiaire), Unité de base, Famille*, Format*, Parfum/variante* (sauf famille Eau), Unité de vente*, Code fiscal (*obligatoires pour un produit fini).
**Panneau « Listes de valeurs »** : ajout rapide d'une valeur (Famille/Format/Parfum/Unité de vente) avec activation/désactivation inline (jamais de suppression).
**Fiche article :** panneaux Identité (champs de codification **verrouillés** une fois l'article utilisé dans un document — `est_verrouille`), Fiscalité (code fiscal), Stock & traçabilité (suivi par lot, péremption, seuils), Comptabilité analytique (compte de vente, activité, centre de coût), Contrôles qualité requis (tableau + formulaire d'ajout réservé à Production/Qualité/Admin SI).

#### Matières premières — `/parametrage/matieres` et fiche `/parametrage/matieres/[id]`
**Liste :** Code, Désignation, Unité, Stock minimum, Stock d'alerte, Statut. Formulaire de création : Désignation, Unité.
**Fiche :** Identité (code lecture seule), Stock & traçabilité (seuils, péremption, emplacement, case « Matière active »).

#### Conditionnements — `/parametrage/conditionnements`
**Liste :** Article, U/carton, Emballage, Poids carton, Cartons/palette. Formulaire de création : Article, Unités/carton, Emballage, Poids carton (optionnel), Cartons/palette (optionnel). Pas de fiche détail.

#### Fiches techniques — `/parametrage/fiches-techniques` et `/parametrage/fiches-techniques/[id]`
**Objectif :** composition (recette) d'un produit fini, qui alimente le calcul des besoins matières des OF une fois validée.
**Disposition :** liste des fiches à gauche (filtrable par statut), éditeur à droite.
**Création** (droit `CREATE_FT`, réservé Admin SI) : choix d'un produit fini sans brouillon en cours → « Créer le brouillon » (version calculée automatiquement).
**Éditeur de composition** (si Brouillon) : ajout d'un composant (Matière, Quantité/unité), quantité modifiable directement dans le tableau (enregistrée à la sortie du champ ou sur Entrée), suppression de ligne.
**Action :** « Valider la fiche » (droit `VALIDER_FT`, si au moins un composant) — fige définitivement la composition.

#### Dépôts — `/parametrage/depots`
**Liste :** Dépôt, Rôle (Système/Standard), Articles (nb), Statut. Clic → panneau latéral de détail (stock présent par article, statistiques) plutôt qu'une page séparée.
**Création** (droit `CREATE_DEPOT`, sauf pour l'Admin SI dont les dépôts système sont pilotés par le code) : Nom, Adresse.

#### Clients — `/parametrage/clients`
**Tableau :** Code, Nom, Type, Téléphone, Encours (utilisé / autorisé), Paiement, Statut ; clients bloqués en tête. Filtres : recherche, statut, type.
**Tiroir** (clic sur une ligne, `?client=`, ou **[+ Nouveau client]**) : Identité ; Conditions commerciales (encours autorisé, délai de paiement, case **« Compte bloqué »**) ; **tarifs spécifiques du client** en bas (article, prix, validité, statut) si le poste lit les Tarifs.

#### Tarifs — `/parametrage/tarifs` et fiche `/parametrage/tarifs/[id]`
**Liste :** Article, Client (ou « Public »), Prix, Début, Fin, Statut (En vigueur/À venir/Expiré).
**Formulaire de création :** Article, Client (optionnel, « Public » par défaut), Prix, Début, Fin.
**Fiche :** Cible (lecture seule), Prix et validité (modifiables).

#### Fournisseurs — `/parametrage/fournisseurs` et fiche `/parametrage/fournisseurs/[id]`
**Liste :** Code, Nom, Contact, Téléphone, Email, Statut. Formulaire de création : Nom, Contact, Téléphone, Email, Adresse.
**Fiche :** Identité et coordonnées, panneau Gestion (géré par / créé le, lecture seule + case « Fournisseur actif »).

#### Codes fiscaux — `/parametrage/fiscalite`
**Objectif :** matrice fiscale (familles fiscales + codes TVA/accise/centimes) ; les taux ne se choisissent jamais à la vente, ils sont dérivés du code rattaché à l'article.
**Tableau :** Code, Famille, TVA %, Accise %, Centimes %, Exonéré, Actif.
**Panneaux :** « Familles fiscales » (ajout + activation/désactivation) ; « Nouveau code fiscal » (code généré automatiquement — Famille, TVA %, Centimes %, Accise %, case Exonéré).

#### Autres écrans de référence (listes fixes ou informatifs, sans saisie)
- **Motifs de pertes** (`/parametrage/causes-pertes`) : liste fixe des motifs de perte (non éditable).
- **Modes de paiement** (`/parametrage/encaissement`) : liste fixe des modes de paiement (non éditable).
- **Motifs de suspension** (`/parametrage/motifs-suspension`) : écran informatif — renvoie vers le blocage client (fiche client).
- **Motifs de réclamation** (`/parametrage/motifs-reclamation`) : écran informatif — renvoie vers le module Réclamations.
- **Numérotation** (`/parametrage/numerotation`) : informatif — toute la numérotation (OF, commandes, factures, lots, BL) est automatique.
- **Paramètres généraux** (`/parametrage/general`) : informatif — fuseau horaire Brazzaville, réglages gérés par l'administrateur.
- **Exports vers la comptabilité** (`/parametrage/sage`) : renvoie vers `/comptabilite/export-sage`.
- **Seuils d'alerte** (`/parametrage/seuils`) : renvoie vers `/stocks`.

### 3.13 Configuration (réservé à l'Administrateur SI)
#### Utilisateurs & profils — `/admin/utilisateurs`
**Onglet Comptes :** tableau Nom (avatar + identifiant), Rôle (badge coloré), Statut. Filtres : recherche, Statut, Rôle (avec compteurs).
**Panneau droit « Nouvel utilisateur »** (droit `ADMIN_USERS`) : Prénom, Nom, Identifiant de connexion, E-mail, Rôle (aperçu de la station/mission), Mot de passe provisoire (généré, regénérable). Bouton **« Créer le compte »** fixe en bas du panneau.
**Panneau de détail/édition :** Identité, Rôle (non modifiable sur son propre compte), Accès (activer/désactiver), Réinitialiser le mot de passe.
**Onglet Profils & accès** (lecture seule) : une carte par profil — station, mission, nombre de comptes actifs, ce qu'il fait, ce qu'il ne fait pas.

#### Paramètres — `/admin/parametres`
Onglets en lecture seule : **Listes fixes** (motifs de pertes, modes de paiement, motifs de retour, problèmes de livraison) · **Numérotation** (préfixes des documents générés par le backend : OF-, LOT-, CMD-, FACT-, ENC-, BL-…) · **Généraux** (société, fuseau, devise, langue).

#### Journal des actions — `/admin/audit`
**Tableau :** Date, Utilisateur, Module (badge), Action, Document. Filtres : recherche libre, période (Aujourd'hui/7 jours/30 jours/Tout), Utilisateur, Module — avec compteur « affichés/total ». Lecture seule.

#### Caisses — `/admin/caisses`
**Objectif :** gérer les caisses physiques, affecter un caissier, superviser la caisse principale qui consolide automatiquement tous les soldes.
**Tableau :** Caisse, Caissier affecté, Statut.
**Bandeau rouge en haut de page** si des caissiers actifs n'ont pas de caisse (« N caissiers sans caisse », noms listés), avec bouton **« Affecter une caisse »** qui ouvre le panneau pré-rempli.
**Panneau de création/édition** (droit `ADMIN_USERS`) : Nom, Emplacement, Caissier affecté (verrouillé si une session est ouverte), case « Caisse active » (verrouillée si session ouverte).
**Fiche caisse principale** (lecture seule) : solde consolidé, détail par caisse (session ouverte/fermée, caissier, solde).

---

*Document généré par lecture directe du code source de `EVAM_Next_project` (frontend). Toute évolution du code (nouvel écran, nouveau droit, nouveau champ) doit être répercutée ici pour qu'il reste fiable.*
