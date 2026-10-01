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
- Station : Administration · Couleur d'accent : bleu marine (navy) · Icône : bouclier
- Mission : « Gérez les comptes, les accès et le journal d'activité. »
- Posture : « Vous configurez EVAM. L'atelier, la caisse et les ventes restent aux métiers. »
- Possède : Utilisateurs, Droits d'accès, Journal d'audit, Référentiel
- Ne fait jamais : voir les commandes/factures/encaissements/tarifs ; modifier le nom ou le statut d'un dépôt système
- Règles : un compte inactif ne peut plus se connecter ; un utilisateur a un profil unique ; ce poste crée/modifie/désactive les comptes et valide les fiches techniques

**Menu (sidebar)**
- Menu : Accueil
- Référentiel : Articles, Matières, Conditionnements, Fiches techniques (lecture/écriture), Dépôts, Clients, Fournisseurs, Codes fiscaux, Motifs de pertes, Motifs de suspension, Motifs de réclamation, Numérotation, Paramètres généraux, Modes de paiement (tout le référentiel **sauf** les Tarifs, volontairement exclus du périmètre Admin SI)
- Administration : Utilisateurs, Caisses, Profils, Profils & accès, Journal d'audit

**Page d'accueil**
- Pas de boutons d'action rapide ni de colonne latérale (ni graphique, ni accès rapides, ni repères du poste) — remplacés par une **feuille de route numérotée en 3 étapes** : 1) Créer les comptes et leur rôle (combien de postes sans compte actif / comptes sans rôle) → `/admin/utilisateurs` ; 2) Créer et affecter chaque caisse (combien de caissiers sans caisse) → `/admin/caisses` ; 3) Valider la fiche technique de chaque produit fini (combien de produits finis sans fiche validée) → `/parametrage/fiches-techniques`.
- KPI : Comptes actifs (+ comptes désactivés), Sessions de caisse ouvertes, Actions aujourd'hui (journal d'audit du jour).
- Files de travail : Fiches techniques en brouillon, Comptes sans rôle, Caissiers sans caisse affectée, Dépôts système (toujours affichée), Activité récente (pleine largeur, dernières lignes du journal d'audit).

**Écrans accessibles** : Accueil · Administration (Utilisateurs, Caisses, Profils, Profils & accès, Journal d'audit) · Référentiel (Articles, Matières, Conditionnements, Fiches techniques, Dépôts, Clients, Fournisseurs, Codes fiscaux, Motifs de pertes, Motifs de suspension, Motifs de réclamation, Numérotation, Paramètres généraux, Modes de paiement).

### 2.2 PDG / Direction (`DIRECTION`)
**Carte d'identité**
- Station : Pilotage · Couleur : bleu marine · Icône : graphique
- Mission : « Suivez la santé de l'usine : stocks, commandes, production et coûts. »
- Posture : « Consultation. Les équipes métier saisissent, vous pilotez. »
- Possède : Tableau de bord, Suivi des files, Coûts
- Ne fait jamais : valider une clôture caisse ou un OF
- Règles : seuls les lots libérés peuvent être vendus ; les coûts se consultent dans le module dédié

**Menu (sidebar)**
- Menu : Accueil
- Pilotage : Tableau de bord, Coûts réels, Coûts standards, Anomalies, Écritures, Valorisation du stock
- Supervision (lecture, réutilise les écrans des métiers) : Commandes, Ordres de fabrication, Besoins d'achat, Commandes fournisseurs, Réceptions, Préparations, Bons de livraison, Mouvements, Inventaires
- Caisse : Décaissements
- *Accès supplémentaire sans entrée de menu dédiée* : Situation de stock (`/stocks`) et Lots qualité (`/production/qualite`), atteignables via les raccourcis de l'accueil ou le fil d'Ariane.
- Pas de groupe Référentiel (aucun droit de paramétrage).

**Page d'accueil**
- Actions rapides : Tableau de bord, Coûts réels.
- KPI : Encaissé aujourd'hui (+ ce mois), OF en cours (+ en production), Lots en attente, Anomalies ouvertes.
- Files de travail : Lots en attente de libération, OF en production, Articles sous le seuil, Anomalies ouvertes.
- Graphique : camembert « Ordres de fabrication » (répartition par étape du circuit).

**Écrans accessibles** : Accueil · Tableau de bord · Coûts réels · Coûts standards et marges · Anomalies · Écritures comptables · Valorisation du stock · Décaissements · Commandes clients · Ordres de fabrication · Besoins d'achat · Commandes fournisseurs · Réceptions achat · Préparations · Bons de livraison · Mouvements de stock · Inventaires · Situation de stock · Lots qualité.

### 2.3 Responsable Production (`RESPONSABLE_PRODUCTION`)
**Carte d'identité**
- Station : Atelier — planification · Couleur : teal · Icône : usine
- Mission : « Planifiez la journée et lancez les OF. Les fiches techniques sont paramétrées par l'Admin SI. »
- Posture : « Vous orchestrez l'atelier. Le stock vendable n'existe qu'après libération qualité. »
- Possède : Plans, Ordres de fabrication, Besoins matières
- Ne fait jamais : libérer un lot, encaisser, accéder aux coûts, modifier une fiche technique
- Règles : un OF ne se lance qu'avec une fiche technique validée ; les besoins matières sont calculés au lancement

**Menu (sidebar)**
- Menu : Accueil
- Production : Plans, Ordres de fabrication, Besoins matières, Matières atelier, Suivi eau, Demandes d'achat
- Stocks : Situation
- Référentiel : Articles, Matières, Conditionnements (écriture) + Fiches techniques (lecture seule)
- *Accès supplémentaire sans entrée de menu* : Lots qualité (`/production/qualite`, lecture).

**Page d'accueil**
- Actions rapides : Planifier, Ordres de fabrication.
- KPI : OF en production (+ total ouverts), OF à lancer (phases amont), Plans à convertir, Pertes du jour.
- Files de travail : OF ouverts (triés par étape), Plans à convertir en OF (badges Urgent/Prioritaire), Matières demandées au magasin, Fiches techniques à valider.
- Graphique : camembert « Ordres de fabrication » par étape.

**Écrans accessibles** : Accueil · Plans de production · Ordres de fabrication (liste + détail) · Besoins matières · Matières atelier · Suivi eau · Demandes d'achat · Situation de stock · Lots qualité (lecture) · Référentiel (Articles, Matières, Conditionnements, Fiches techniques en lecture).

### 2.4 Agent Production (`AGENT_PRODUCTION`)
**Carte d'identité**
- Station : Ligne / atelier · Couleur : ambre · Icône : clé
- Mission : « Saisissez les étapes, les quantités et les pertes sur vos OF. »
- Posture : « Écran d'atelier : actions courtes. Le responsable avance le statut de l'OF. »
- Possède : Étapes de production, Pertes, Consultation des OF affectés
- Ne fait jamais : avancer le statut d'un OF, modifier une fiche technique, créer une commande
- Règles : ne voit que les OF auxquels il est affecté ; les motifs de pertes sont une liste fixe

**Menu (sidebar)**
- Menu : Accueil
- Atelier : Étapes atelier, Suivi eau, Pertes, Ordres de fabrication
- Pas de Référentiel, pas d'accès supplémentaire.

**Page d'accueil**
- Actions rapides : Saisir une étape, Déclarer une perte.
- KPI : OF en production (filtrés sur ses affectations), OF prêts à démarrer, Mes étapes du jour, Pertes du jour.
- Files de travail : En production, Prêts à démarrer.
- Graphique : barres horizontales « Pertes par motif ».

**Écrans accessibles** : Accueil · Étapes de production / Suivi de production · Suivi eau · Pertes de production · Ordres de fabrication (liste + détail, lecture de ses OF affectés).

### 2.5 Responsable Qualité (`RESPONSABLE_QUALITE`)
**Carte d'identité**
- Station : Laboratoire / lots · Couleur : vert · Icône : coche
- Mission : « Contrôlez les lots. Seuls les lots libérés peuvent être vendus. »
- Posture : « Contrôle conforme ou non conforme, puis libération ou blocage. »
- Possède : Lots, Contrôles qualité, Libération / blocage
- Ne fait jamais : modifier le planning, vendre un lot en attente
- Règles : un contrôle met à jour le statut du lot ; on ne libère un lot que s'il est conforme

**Menu (sidebar)**
- Menu : Accueil
- Qualité : OF reçus, Lots qualité, Fiches techniques (lecture), Réclamations
- Référentiel : Articles (lecture seule — Fiches techniques déjà dans le menu Qualité)
- *Accès supplémentaire* : Situation de stock (`/stocks`, lecture).

**Page d'accueil**
- Actions rapides : OF reçus, Lots qualité.
- KPI : Lots en attente, OF à contrôler, Contrôles du jour (+ conformes), Lots bloqués.
- Files de travail : Lots à contrôler, OF reçus de la production, Lots bloqués ou non conformes, Retours clients en quarantaine.
- Graphique : camembert « Lots par statut ».

**Écrans accessibles** : Accueil · Lots qualité (liste + détail) · OF reçus · Fiches techniques (lecture) · Réclamations (liste + détail) · Situation de stock (lecture) · Référentiel : Articles (lecture).

### 2.6 Magasinier (`MAGASINIER`)
**Carte d'identité**
- Station : Magasin · Couleur : ambre · Icône : boîtes
- Mission : « Sorties matières, mouvements, inventaires, réceptions et préparations. »
- Posture : « Chaque mouvement a une origine. Disponible = physique − bloquée − réservée. »
- Possède : Stock, Mouvements, Inventaires, Sorties matières, Réceptions, Préparations
- Ne fait jamais : modifier un prix de vente, encaisser
- Règles : un mouvement met à jour le stock immédiatement ; on confirme la préparation puis la sortie magasin

**Menu (sidebar)**
- Menu : Accueil
- Magasin : Matières atelier, Situation, Mouvements, Inventaires, Demandes d'achat
- Réceptions & quai : Réceptions, Préparations, Réclamations
- Référentiel : Dépôts (écriture) + Fiches techniques (lecture)

**Page d'accueil**
- Actions rapides : Servir l'atelier, Mouvements.
- KPI : Matières à servir, Préparations clients, Réceptions attendues, Articles sous seuil.
- Files de travail : Matières à servir à l'atelier, Préparations de commandes, Livraisons fournisseurs attendues, Articles sous le seuil, Inventaires en cours (si au moins un en cours).
- Graphique : camembert « Mouvements de stock » (7 derniers jours).

**Écrans accessibles** : Accueil · Matières atelier · Situation de stock · Mouvements de stock · Inventaires (liste + détail) · Demandes d'achat (lecture) · Réceptions achat (liste + détail) · Préparations (liste + détail) · Réclamations · Référentiel : Dépôts, Fiches techniques (lecture).

### 2.7 Responsable Achat (`RESPONSABLE_ACHATS`)
**Carte d'identité**
- Station : Approvisionnement · Couleur : teal · Icône : chariot
- Mission : « Fournisseurs, demandes, commandes et réceptions. »
- Posture : « Le stock matières suit le reçu, pas le commandé. »
- Possède : Fournisseurs, Demandes d'achat, Commandes fournisseurs, Réceptions
- Ne fait jamais : lancer un OF, modifier une fiche client
- Règles : approuver/rejeter une demande est réservé à ce poste ; envoyer une commande la transmet au fournisseur

**Menu (sidebar)**
- Menu : Accueil
- Achats : Besoins d'achat, Demandes d'achat, Commandes fournisseurs, Réceptions
- Stocks : Situation
- Référentiel : Articles, Matières, Fournisseurs (écriture)

**Page d'accueil**
- Actions rapides : Demandes d'achat, Commandes fournisseurs.
- KPI : Demandes à approuver, Besoins à couvrir, Commandes à envoyer, Livraisons attendues.
- Files de travail : Demandes en attente d'approbation, Besoins non couverts, Commandes prêtes à envoyer, Livraisons attendues, Articles sous le seuil.
- Graphique : camembert « Commandes fournisseurs » par statut.

**Écrans accessibles** : Accueil · Besoins d'approvisionnement · Demandes d'achat · Commandes fournisseurs · Réceptions achat (liste + détail) · Situation de stock · Référentiel : Articles, Matières, Fournisseurs (liste + fiche).

### 2.8 Commercial (`COMMERCIAL`)
**Carte d'identité**
- Station : Vente · Couleur : bleu marine · Icône : poignée de main
- Mission : « Clients, tarifs, commandes et factures. Consultez le stock, ne le modifiez pas. »
- Posture : « Vous ne forcez pas le stock. Les lots non libérés ne sont pas vendables. »
- Possède : Clients, Commandes, Lignes, Factures, Tarifs
- Ne fait jamais : encaisser, modifier le stock, livrer
- Règles : un client bloqué ne peut plus commander ; la commande suit le circuit brouillon → facturée

**Menu (sidebar)**
- Menu : Accueil
- Commercial : Commandes, Nouvelle commande, Clients, Factures, Avoirs, Impayés, Réclamations
- Référentiel : Clients, Tarifs (écriture) + Articles (lecture)
- *Accès supplémentaire* : Situation de stock (`/stocks`, lecture).

**Page d'accueil**
- Actions rapides : Nouvelle commande, Clients.
- KPI : Facturé ce mois, Commandes à valider, Factures non payées, Factures échues.
- Files de travail : Commandes en brouillon, Factures échues, Réclamations ouvertes, Clients bloqués.
- Graphique : camembert « Commandes par statut ».

**Écrans accessibles** : Accueil · Commandes clients (liste + détail + nouvelle commande) · Clients · Avoirs · Impayés · Réclamations (liste + détail) · Situation de stock (lecture) · Référentiel : Clients, Tarifs (liste + fiche), Articles (lecture).

### 2.9 Caissier (`CAISSIER`)
**Carte d'identité**
- Station : Caisse · Couleur : vert · Icône : billet
- Mission : « Ouvrez une session, encaissez les factures, clôturez. Justifiez un écart, ne le supprimez jamais. »
- Posture : « Le caissier ne modifie ni commande, ni prix, ni stock. »
- Possède : Sessions de caisse, Encaissements, Écarts (justification)
- Ne fait jamais : supprimer un écart, valider un BL, exporter la comptabilité
- Règles : la clôture compare solde théorique et solde compté ; un écart doit être justifié

**Menu (sidebar)**
- Menu : Accueil
- Caisse : Encaissements (`/caisse`), Sessions de caisse (`/caisse/cloture`), Décaissements
- *Accès supplémentaire* : Commandes clients (`/commercial/commandes`, lecture).
- Pas de Référentiel.

**Page d'accueil**
- Actions rapides : si session ouverte → Encaisser + Clôturer la session ; sinon → Ouvrir une session.
- **Bandeau caisse** (bloc « cash », exclusif à ce poste) : solde de la caisse principale, solde de sa caisse personnelle et statut de session, autres caisses actives.
- KPI : Session de caisse (ouverte/fermée), Factures à encaisser, Encaissé aujourd'hui, Décaissé aujourd'hui.
- Files de travail : Factures à encaisser, Encaissements du jour, Écarts à justifier (si applicable).
- Graphique : camembert « Encaissements du jour » par mode de paiement.

**Écrans accessibles** : Accueil · Factures et encaissements (`/caisse`) · Sessions de caisse / Clôture · Décaissements · Factures non soldées (`/caisse/suspendues`) · Commandes clients (lecture).

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
- Bouton **Actualiser** (avec horodatage de dernière mise à jour).
- 4 KPI : CA du jour (+ CA du mois), Encaissé aujourd'hui (+ écart de caisse), Rendement du jour (+ pertes), Valeur du stock (+ ruptures).
- Widget **Production** : quantité conforme, jauges de rendement et de pertes, pour aujourd'hui et pour le mois.
- Widget **Livraisons du jour** : graphique en barres (prévues / en cours / terminées / en retard) + taux de complétion.
- Widget **Stock** : camembert produits finis vs matières, compteurs « en rupture » et « sous minimum ».
- Widget **Caisse** : encaissements, solde théorique, écart de caisse (+ nombre de non justifiés).
- Widget **Commercial** : CA du mois, produit le plus vendu, client principal.
- Widget **Rentabilité** : top 5 produits les plus rentables (marge, taux de marge) avec lien vers Coûts standards.
- Widget **Alertes** : 4 blocs — matières manquantes, ruptures de stock, écarts de caisse non justifiés, anomalies comptables (lien vers Anomalies).
- Tableau **Rapports générés** : colonnes Période, Date, Généré le ; bouton « Générer le rapport du jour » si droit `GENERER_RAPPORT`.

*Version restreinte (autres postes)* :
- 4 KPI : Stock disponible, Encaissements, OF ouverts, Lots en attente.
- Tableau des 8 premiers OF (N°, Article, Statut).
- Message : « Les indicateurs détaillés sont réservés à la direction. »

### 3.2 Production
#### Plans de production — `/production/planning`
**Objectif :** prévisions de volumes ; convertir une prévision en OF déclenche le calcul des besoins matières.
**Tableau :** Article, Date, Qté, Priorité, Statut, Créé par, Commentaire, action.
**Formulaire de création** (droit `CREATE_PLAN`) : Article (select produits finis), Date prévue, Quantité (défaut 1000), Priorité (Basse/Normale/Haute/Urgente), Commentaire.
**Actions :** « Créer la prévision » ; par ligne, « Convertir en OF » (droit `CONVERTIR_PLAN`, si statut convertible) avec un sélecteur multiple d'agents de production disponibles à affecter à l'OF résultant.

#### Ordres de fabrication (liste) — `/production/of`
**Objectif :** suivre chaque OF du brouillon à la clôture.
**KPI :** OF non clôturés, Attente qualité, Volume à produire ; graphique « Pipeline OF » (répartition par statut).
**Tableau :** Numéro, Article, Quantité, Statut (badge), Responsable, Créé le. Ligne cliquable → détail.
**Formulaire de création** (droit `CREATE_OF`) : Article, Quantité (défaut 100), Plan d'origine (optionnel), Agents affectés (sélecteur multiple ou saisie d'identifiants si aucun agent déclaré).
**Actions :** « Créer OF ».

#### Détail d'un ordre de fabrication — `/production/of/[id]`
**Objectif :** fiche complète d'un OF (synthèse, besoins, sorties, étapes, pertes, lots) et pilotage de son avancement.
**En-tête :** numéro, badge de statut, bouton **« Avancer → {statut suivant} »** (droit `AVANCER_OF`), bouton **« Annuler l'OF »** (droit `ANNULER_OF`, motif obligatoire).
**Contenu :**
- `StatusStepper` de progression (Brouillon → … → Clôturé).
- Bandeau d'alerte si production terminée (contrôle qualité en attente) ou si OF annulé (motif affiché).
- Panneau **Synthèse** : article, responsable, équipe, dates, agents affectés, avec un sélecteur pour réaffecter les agents (droit `AFFECTER_AGENTS_OF`).
- Panneau **Besoins matières** (lecture) ; bouton **« Demander les matières au magasin »** (droit `DEMANDER_MATIERES_OF`) si des besoins existent et qu'aucune demande n'est en cours.
- Panneaux **Sorties matières**, **Étapes**, **Pertes · Lots** (lecture).
- Composant **Historique** en bas de page.

#### Étapes de production / Suivi de production — `/production/suivi`
Deux sections sur la même page :
- **Étapes de production** : tableau (OF, Étape, Qté, Observations) ; formulaire (droit `CREATE_ETAPE`) : OF, Étape (Captage/Traitement/Soufflage/Embouteillage/Étiquetage/Conditionnement), Quantité produite ; bouton « Enregistrer ».
- **Suivi de production (sessions)** : tableau (OF, Date, Début, Équipe, Entrée, Produite, Conforme, Rejetée) ; formulaire (droit `CREATE_SUIVI_PROD`) : OF, Date, Heure de début, Équipe, Qté entrée/produite/conforme/rejetée, Arrêts, Incidents ; bouton « Enregistrer la session ».

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
**Objectif :** livraison, sorties, compléments et retours de matières pour les OF.
**4 tableaux :**
1. Demandes de matières (N°, OF, Matière, Qté demandée, Qté livrée, Statut) — champ de quantité à livrer par ligne (droit `LIVRER_DEMANDE_MATIERE`, livraison partielle possible).
2. Demandes complémentaires (N°, OF, Matière, Qté, Statut) — boutons Approuver/Rejeter par ligne (droit `APPROUVER_COMPLEMENT`).
3. Sorties matières (OF, Matière, Qté, Type).
4. Retours matières (OF, Matière, Qté retournée).
**Formulaires** : « Demande complémentaire » (droit `CREATE_COMPLEMENT` : OF, Matière, Quantité, Motif obligatoire) ; « Sortie manuelle » (droit `CREATE_SORTIE` : OF, Matière, Quantité, Type Normale/Complémentaire, Motif obligatoire si complémentaire) ; « Retour matière » (droit `CREATE_RETOUR_MAT` : OF, Matière, Quantité).

### 3.3 Qualité
#### Lots — `/production/qualite`
**Objectif :** enregistrer un lot, le contrôler, puis le libérer.
**Tableau :** Lot, Article, OF, Qté, Statut (badge), Date de production. Ligne cliquable → détail.
**Formulaire** (droit `CREATE_LOT`) : Article, Quantité, Date de production, OF d'origine (optionnel), Péremption (optionnelle). Bouton « Créer le lot ».

#### OF reçus — `/production/qualite/of`
**Objectif :** file d'attente des OF dont la production est terminée, à transformer en lot. Écran de consultation : Numéro, Article, Quantité produite, Responsable, Statut OF, Lot (« Créé » ou lien « À créer → »), Fin de production.

#### Détail d'un lot — `/production/qualite/[id]`
**En-tête :** numéro, badge de statut, description (article, OF, quantité, date).
**Contenu :**
- Panneau **Résultat du contrôle** (droit `CREATE_CONTROLE`) : champ Observations, boutons **« Conforme »** / **« Non conforme »**.
- Une fois contrôlé : résultat affiché en lecture seule.
- Bouton **« Libérer le lot »** (droit `LIBERER_LOT`, si statut Conforme).
- Bouton **« Bloquer »** (droit `BLOQUER_LOT`, avec motif = champ Observations).
- Bandeaux d'alerte : « Lot libéré — vendable » (vert) ou « Lot bloqué — non vendable » (rouge).
- Composant Historique.

### 3.4 Stocks
#### Situation de stock — `/stocks`
**Objectif :** stock disponible par article et dépôt. Tableau : Article, Dépôt, Physique, Bloquée, Réservée, Disponible. Ligne cliquable → fiche article.

#### Fiche stock d'un article — `/stocks/article/[id]`
En-tête = code/désignation/type/unité de l'article. Tableau par dépôt : Dépôt, Physique, Disponible. Lecture seule.

#### Inventaires — `/stocks/inventaires`
**Tableau :** Dépôt, Date, Statut (En cours/Clôturé), Créé par. Ligne cliquable → détail.
**Formulaire** (droit `CREATE_INVENTAIRE`) : Dépôt, Date. Bouton « Ouvrir ».

#### Détail d'un inventaire — `/stocks/inventaires/[id]`
**En-tête :** dépôt, statut, date, créateur ; bouton **« Clôturer »** (droit `CLOTURER_INVENTAIRE`, si en cours).
**Tableau :** Article, Théorique, Comptée.
**Formulaire d'ajout de ligne** (droit `CREATE_INVENTAIRE`, si en cours) : Article, Théorique, Comptée. Bouton « Ajouter ligne ».
Composant Historique en bas de page.

#### Mouvements de stock — `/stocks/mouvements`
**Tableau :** N°, Type, Article, Dépôt, Qté, Saisi par, Date.
**Formulaire** (droit `CREATE_MVT`) : Article, Dépôt, Type (Entrée/Sortie/Transfert/Ajustement/Retour), Quantité. Bouton « Créer ».

#### Valorisation du stock (CMUP) — `/stocks/valorisation`
**Objectif :** valeur du stock au coût moyen unitaire pondéré, recalculé automatiquement à chaque entrée en stock.
**Filtres :** Dépôt (tous ou un en particulier), Type d'article.
**Contenu :** encadré « Valeur totale du stock filtré » (FCFA) ; tableau détaillé — Article, Désignation, Type, Dépôt, Quantité, CMUP, Valeur. Écran de consultation uniquement.

*(Note : `/stocks/alertes` n'est qu'une redirection technique vers `/stocks`, sans contenu propre.)*

### 3.5 Achats / Approvisionnement
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

#### Réceptions achat — `/approvisionnement/receptions`
**Tableau :** Commande, Réceptionnée par, Conforme (Oui/Non), Date. Ligne cliquable → détail.
**Formulaire** (droit `CREATE_RECEPTION`) : Commande fournisseur. Bouton « Créer réception ».

#### Détail d'une réception — `/approvisionnement/receptions/[id]`
**Tableau :** Article, Qté reçue.
**Formulaire** (droit `CREATE_RECEPTION`) : Ligne de commande concernée, Quantité reçue. Bouton « Ajouter ».

### 3.6 Commercial
#### Commandes clients (liste) — `/commercial/commandes`
**Tableau :** N°, Client, Type, Statut (badge), Date. Ligne cliquable → détail.
**Action :** bouton « Nouvelle commande » (droit `CREATE_COMMANDE`) dans le header.

#### Nouvelle commande — `/commercial/commandes/nouvelle`
**Formulaire :** Client (les clients bloqués apparaissent grisés, non sélectionnables), Type (Vente au comptant / Client sous contrat). Bouton « Créer » → redirige vers la liste.

#### Détail commande — `/commercial/commandes/[id]`
**En-tête :** numéro, badge de statut, boutons **« Valider »** (droit `CREATE_COMMANDE`, si Brouillon) et **« Émettre facture »** (droit `CREATE_FACTURE`, si au moins une ligne).
**Contenu :**
- `StatusStepper` : Brouillon → Validée → En préparation → Livrée → Facturée.
- Panneau d'ajout de ligne (droit `CREATE_COMMANDE`) : Article, Quantité, Prix unitaire (calculé automatiquement selon le tarif client).
- Bloc Facture (si émise) : numéro, statut, montant HT, taxes (TVA/accise/centimes), total TTC, échéance ; bouton **« Générer les lignes »** (droit `GENERER_LIGNES_FACTURE`, avec avertissement sur les articles sans code fiscal) ; bouton **« Télécharger en PDF »**.
- Composant Historique.

#### Clients — `/commercial/clients`
**Tableau (lecture seule) :** Code, Nom, Type, Encours, Bloqué (Oui/Non).

#### Avoirs — `/commercial/avoirs`
**Tableau :** N°, Client, Montant, Statut (Émis/Utilisé/Annulé), Date, Motif.
**Formulaires :** « Émettre un avoir » (droit `CREATE_AVOIR` : Client, Montant, Facture d'origine optionnelle, Motif) ; « Utiliser un avoir sur une facture » (droit `UTILISER_AVOIR` : Avoir émis, Facture, bouton « Appliquer »).

#### Impayés — `/commercial/impayes`
**Objectif :** factures à crédit non soldées, échéance dépassée, triées par retard décroissant.
**Tableau (chargé via API dédiée) :** Facture, Client, Échéance, Montant, Payé, Restant, Retard (badge rouge si > 30 jours, orange sinon). Écran de consultation uniquement.

### 3.7 Distribution
#### Préparations (liste) — `/distribution/preparations`
**Tableau :** #, Commande, Statut, action. Ligne cliquable → détail.
**Formulaire** (droit `CREATE_PREP`) : Commande à préparer. Bouton « Lancer ».
**Actions par ligne :** « Confirmer préparation » (droit `PREP_CONFIRMER`, si « À préparer »), « Confirmer sortie » (droit `PREP_SORTIE`, si « En préparation »).

#### Détail préparation — `/distribution/preparations/[id]`
**En-tête :** numéro de commande liée, statut, client. Boutons **« Confirmer préparation »** et **« Confirmer sortie magasin »** selon statut et droits. Panneau « Lancée par / Préparée par ». Composant Historique.

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
Parcours séquentiel, chaque étape n'apparaissant que lorsque la précédente est franchie :
1. Récapitulatif (lecture seule).
2. **Retour physique** (droit `CREATE_RETOUR_PHYSIQUE`) : Quantité retournée → « Réceptionner en quarantaine ».
3. **Contrôle retour** (droit `CREATE_CONTROLE_RETOUR`) : Résultat (Récupérable direct / avec intervention / Non récupérable), Observations → « Enregistrer le contrôle » (la décision — réintégration, reconditionnement ou rebut — s'applique automatiquement).
4. **Reconditionnement** (si applicable, droit `TERMINER_RECONDITIONNEMENT`) : Quantité reconditionnée → « Terminer & réintégrer ».
5. **Solution client** (droit `CREATE_SOLUTION`) : Type (Remplacement / Avoir / Remboursement), Montant → « Appliquer la solution » (clôture automatiquement la réclamation).
Composant Historique.

### 3.9 Caisse
#### Factures et encaissements — `/caisse`
**Objectif :** ouvrir une session de caisse puis encaisser.
**Tableau :** Facture, Client, Montant, Statut (badge), lien PDF, action d'encaissement.
**Actions :** **« Ouvrir ma session »** (si aucune session ouverte, caisse affectée, droit `ENCAISSER`) ; par ligne de facture émise, sélecteur de mode de paiement (Espèces/Mobile money/Virement/Chèque) + bouton **« Encaisser »** (droit `ENCAISSER`, sur sa propre session ouverte uniquement).

#### Sessions de caisse (Clôture) — `/caisse/cloture`
**Objectif :** clôturer une session en saisissant le solde compté ; le solde théorique est calculé automatiquement.
**Tableau :** Caisse, Caissier, Statut, Ouverture, Décaissements, Théorique, action.
**Formulaire inline** (sur sa propre session ouverte, droit `CLOTURER_CAISSE`) : Solde compté, Justification (obligatoire en cas d'écart) → bouton **« Clôturer »**.
**Panneau Écarts de caisse** : liste des écarts enregistrés avec leur justification (lecture seule).

#### Factures non soldées — `/caisse/suspendues`
Tableau en lecture seule : N°, Client, Montant, Statut (Émise/Partiellement payée).

#### Décaissements — `/caisse/decaissements`
**Objectif :** sortie de caisse en 3 temps — demande, autorisation/refus, exécution.
**Panneau « Nouvelle demande »** (droit `CREATE_DECAISSEMENT`, sur sa session ouverte) : Montant, Bénéficiaire, Motif → bouton « Demander ».
**Panneau « À autoriser »** (droit `AUTORISER_DECAISSEMENT`, pour Direction/Comptabilité) : par demande en attente — montant, motif, champ « Motif si refus », boutons **« Autoriser »** / **« Refuser »**.
**Tableau général :** N°, Session, Montant, Bénéficiaire, Statut (badge : En attente d'autorisation/Autorisé/Refusé/Effectué), Autorisé/refusé par, Date, Motif, action **« Effectuer la sortie »** (droit `EFFECTUER_DECAISSEMENT`, réservée au caissier désigné, une fois Autorisé).

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
Page d'accueil du module : 3 panneaux de liens groupés — « Référentiel articles » (Articles, Matières, Conditionnements, Fiches techniques), « Stocks & tiers » (Dépôts, Clients, Tarifs, Fournisseurs), « Fiscalité » (Codes fiscaux). Chaque lien n'apparaît que si le poste y a droit.

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
**Éditeur de composition** (si Brouillon) : ajout d'un composant (Matière, Quantité/unité), édition inline de la quantité, suppression de ligne.
**Action :** « Valider la fiche » (droit `VALIDER_FT`, si au moins un composant) — fige définitivement la composition.

#### Dépôts — `/parametrage/depots`
**Liste :** Dépôt, Rôle (Système/Standard), Articles (nb), Statut. Clic → panneau latéral de détail (stock présent par article, statistiques) plutôt qu'une page séparée.
**Création** (droit `CREATE_DEPOT`, sauf pour l'Admin SI dont les dépôts système sont pilotés par le code) : Nom, Adresse.

#### Clients — `/parametrage/clients` et fiche `/parametrage/clients/[id]`
**Liste :** Code, Nom, Type, Téléphone, Encours autorisé, Délai de paiement, Statut (Bloqué/Actif).
**Formulaire de création :** Nom, Type (Particulier/Société/Contrat), Téléphone, Adresse, Encours autorisé, Délai de paiement.
**Fiche :** Identité, Conditions commerciales (encours, délai, case « Compte bloqué ») ; tableau des tarifs spécifiques au client (si le poste a lecture sur les Tarifs).

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

### 3.13 Administration (réservé à l'Administrateur SI)
#### Utilisateurs — `/admin/utilisateurs`
**Tableau :** Nom (avatar + identifiant), Rôle (badge coloré), Statut (Actif/Inactif). Filtres : recherche, Statut, Rôle (avec compteurs).
**Panneau « Nouvel utilisateur »** (droit `ADMIN_USERS`) : Prénom, Nom, Identifiant de connexion, E-mail, Rôle (les 12 profils, avec aperçu de la station/mission du profil choisi), Mot de passe provisoire (généré automatiquement, regénérable). Bouton **« Créer le compte »**.
**Panneau de détail/édition :** Identité, Rôle (non modifiable sur son propre compte), section Accès (activer/désactiver le compte, bloqué sur son propre compte), section **Réinitialiser le mot de passe** (génération automatique + bouton « Réinitialiser »).

#### Profils métier — `/admin/profils`
Tableau en lecture seule des 12 profils : Profil, Station, Mission. Page purement informative (dérivée du code), sans action.

#### Profils & accès — `/admin/droits`
Tableau en lecture seule : Profil, Poste, Possède (`owns`), Ne fait pas (`never`), Référentiel (accès paramétrage : Tout / liste des chemins / « — »). Documentation visuelle de la matrice de droits fixée dans le code (il n'existe plus de table de droits modifiable côté serveur).

#### Journal des actions — `/admin/audit`
**Tableau :** Date, Utilisateur, Module (badge), Action, Document. Filtres : recherche libre, période (Aujourd'hui/7 jours/30 jours/Tout), Utilisateur, Module — avec compteur « affichés/total ». Lecture seule.

#### Caisses — `/admin/caisses`
**Objectif :** gérer les caisses physiques, affecter un caissier, superviser la caisse principale qui consolide automatiquement tous les soldes.
**Tableau :** Caisse, Caissier affecté, Statut.
**Bandeau d'alerte** si des caissiers actifs n'ont pas de caisse, avec bouton d'affectation rapide par caissier concerné.
**Panneau de création/édition** (droit `ADMIN_USERS`) : Nom, Emplacement, Caissier affecté (verrouillé si une session est ouverte), case « Caisse active » (verrouillée si session ouverte).
**Fiche caisse principale** (lecture seule) : solde consolidé, détail par caisse (session ouverte/fermée, caissier, solde).

---

*Document généré par lecture directe du code source de `EVAM_Next_project` (frontend). Toute évolution du code (nouvel écran, nouveau droit, nouveau champ) doit être répercutée ici pour qu'il reste fiable.*
