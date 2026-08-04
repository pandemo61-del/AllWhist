// ─────────────────────────────────────────────
//  TYPES FONDAMENTAUX — AllWhist
// ─────────────────────────────────────────────

export enum Couleur {
  PIQUE    = 'PIQUE',
  COEUR    = 'COEUR',
  CARREAU  = 'CARREAU',
  TREFLE   = 'TREFLE',
}

export enum Valeur {
  DEUX   = 2,
  TROIS  = 3,
  QUATRE = 4,
  CINQ   = 5,
  SIX    = 6,
  SEPT   = 7,
  HUIT   = 8,
  NEUF   = 9,
  DIX    = 10,
  VALET  = 11,
  DAME   = 12,
  ROI    = 13,
  AS     = 14,
}

export interface Carte {
  id: string;          // ex: "14_PIQUE"
  valeur: Valeur;
  couleur: Couleur;
  estJoker?: boolean;
}

// ─── Joueurs ───────────────────────────────────

export type TypeJoueur = 'humain' | 'ia_facile' | 'ia_moyen' | 'ia_expert';

export interface Joueur {
  id: number;          // 0..3, le humain est toujours 0
  nom: string;
  type: TypeJoueur;
  main: Carte[];
  plisGagnesTotal: number;
}

// ─── Pli ───────────────────────────────────────

export interface CartePosee {
  joueurId: number;
  carte: Carte;
}

export interface Pli {
  numero: number;
  cartesJouees: CartePosee[];
  couleurDemandee?: Couleur;  // fixée par la 1ère carte jouée
  gagnantId?: number;
}

// ─── Contrat en cours ──────────────────────────

export interface ContratJoue {
  id: string;           // ref vers ContratConfig.id
  nom: string;
  joueurId: number;     // enchérisseur
  partenaireId?: number;// partenaire (Demande)
  asPartenaire?: Carte; // l'As qui révèle le partenaire
  atout?: Couleur;      // couleur d'atout choisie
  plisObjectif: number;
  seul: boolean;
  sanAtout: boolean;
  cartesVisibles: boolean;
  pointsReussite: number;
  pointsEchec: number;
  priorite: number;     // Ajouté pour faciliter les comparaisons
}

// ─── Enchères ──────────────────────────────────

export interface EtatEnchere {
  joueurCourantId: number;
  meilleureEnchere: ContratJoue | null;
  passesConsecutifs: number;
  historique: { joueurId: number; action: 'passe' | 'enchere'; contrat?: ContratJoue }[];
}

// ─── Phase de jeu ──────────────────────────────

export type PhaseJeu =
  | 'idle'
  | 'distribution'
  | 'encheres'
  | 'annonce_contrat'
  | 'jeu'
  | 'fin_pli'
  | 'fin_manche'
  | 'fin_partie';

// ─── Score ─────────────────────────────────────

export interface ScoreManche {
  manche: number;
  contrat: ContratJoue;
  plisParJoueur: Record<number, number>;
  deltaScores: Record<number, number>;  // +/- de cette manche
  reussite: boolean;
  details: string;
  erreurs?: any[]; // On utilisera le type de analysis.ts
}

// ─── État global de la partie ──────────────────

export interface EtatPartie {
  varianteId: string;
  phase: PhaseJeu;
  joueurs: Joueur[];
  manche: number;
  scores: number[];             // scores cumulés [j0, j1, j2, j3]
  pliEnCours: Pli;
  plisTermines: Pli[];
  atout: Couleur | null;
  tourDeJoueur: number;         // id du joueur qui doit jouer
  donneur: number;              // id du donneur (tourne à chaque manche)
  contratEnCours: ContratJoue | null;
  etatEnchere: EtatEnchere;
  historiqueManches: ScoreManche[];
  partenaireRévélé: boolean;    // pour Demande Gand
  estScenario: boolean;         // true si c'est une partie d'entraînement
  sessionGameId?: string;       // ID unique pour grouper les manches d'une partie
  notification?: { title: string; message: string } | null; // Pour les messages temporaires
}
