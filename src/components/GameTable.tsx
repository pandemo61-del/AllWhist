// ─────────────────────────────────────────────
//  COMPOSANT — Table de jeu
// ─────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Carte, Couleur, Pli, ContratJoue, Joueur } from '../engine/types';
import { CardFace, CardBack, HandBack } from './Card';
import { SYMBOLE, LABEL_VALEUR } from '../engine/deck';
import {
  Colors, Spacing, FontSize, FontWeight,
  Radius, Shadows, CardSize,
} from '../constants/theme';

// ─── Props ─────────────────────────────────────

interface GameTableProps {
  joueurs: Joueur[];
  pliEnCours: Pli;
  atout: Couleur | null;
  contrat: ContratJoue | null;
  tourDeJoueur: number;
  plisTermines: Pli[];        // Tableau des plis finis
  partenaireRévélé: boolean;
  scores: number[];
}

// ─── Composant ─────────────────────────────────

export const GameTable: React.FC<GameTableProps> = ({
  joueurs,
  pliEnCours,
  atout,
  contrat,
  tourDeJoueur,
  plisTermines,
  partenaireRévélé,
  scores,
}) => {
  const getPlisGagnes = (joueurId: number) => {
    return plisTermines.filter(p => p.gagnantId === joueurId).length;
  };

  const carteJoueeParJoueur = (joueurId: number): Carte | undefined =>
    pliEnCours.cartesJouees.find(c => c.joueurId === joueurId)?.carte;

  // Calcul du score équipe/solo pour le badge
  const nbPlisEquipe = contrat ? (
    contrat.seul
      ? getPlisGagnes(contrat.joueurId)
      : (getPlisGagnes(contrat.joueurId) + (contrat.partenaireId !== undefined ? getPlisGagnes(contrat.partenaireId) : 0))
  ) : 0;

  // Déterminer l'équipe de chaque joueur
  const getEquipe = (id: number): 'A' | 'B' | undefined => {
    if (!contrat) return undefined;
    const estAnnonceur = id === contrat.joueurId;
    const estPartenaire = partenaireRévélé && id === contrat.partenaireId;

    if (estAnnonceur || estPartenaire) return 'A';

    // Si partenaire pas encore révélé, on ne marque que l'annonceur
    if (!partenaireRévélé && contrat.partenaireId !== undefined) {
      return estAnnonceur ? 'A' : undefined;
    }

    return 'B'; // Défenseurs
  };

  return (
    <View style={styles.table}>

      {/* ── Badges info ─────────────────────────── */}
      <View style={styles.badgesRow}>
        {atout && (
          <View style={styles.badge}>
            <Text style={styles.badgeTexte}>{SYMBOLE[atout]} Atout</Text>
          </View>
        )}
        {contrat && (
          <View style={[styles.badge, styles.badgeContrat]}>
            <Text style={styles.badgeTexte}>
              {contrat.nom}
              {contrat.atout ? ` (${SYMBOLE[contrat.atout]})` : ''}
              {contrat.asPartenaire ? ` (As ${SYMBOLE[contrat.asPartenaire.couleur]})` : ''}
              : {nbPlisEquipe} / {contrat.plisObjectif}
            </Text>
          </View>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeTexte}>Pli {plisTermines.length + 1}/13</Text>
        </View>
      </View>

      {/* ── Joueur Nord (Partenaire / IA 1) ──────── */}
      <PlayerSlot
        joueur={joueurs[2]}
        position="nord"
        carteJouee={carteJoueeParJoueur(2)}
        estSonTour={tourDeJoueur === 2}
        plisManche={getPlisGagnes(2)}
        estPartenaire={partenaireRévélé && contrat?.partenaireId === 2}
        estAnnonceur={contrat?.joueurId === 2}
        gagnantIdPli={pliEnCours.gagnantId}
        equipe={getEquipe(2)}
      />

      {/* ── Rangée du milieu ─────────────────────── */}
      <View style={styles.milieu}>

        {/* Joueur Ouest (IA 3) */}
        <PlayerSlot
          joueur={joueurs[3]}
          position="ouest"
          carteJouee={carteJoueeParJoueur(3)}
          estSonTour={tourDeJoueur === 3}
          plisManche={getPlisGagnes(3)}
          estPartenaire={partenaireRévélé && contrat?.partenaireId === 3}
          estAnnonceur={contrat?.joueurId === 3}
          gagnantIdPli={pliEnCours.gagnantId}
          equipe={getEquipe(3)}
        />

        {/* Zone du pli central */}
        <ZonePli
          pliEnCours={pliEnCours}
          atout={atout}
          contrat={contrat}
        />

        {/* Joueur Est (IA 2) */}
        <PlayerSlot
          joueur={joueurs[1]}
          position="est"
          carteJouee={carteJoueeParJoueur(1)}
          estSonTour={tourDeJoueur === 1}
          plisManche={getPlisGagnes(1)}
          estPartenaire={partenaireRévélé && contrat?.partenaireId === 1}
          estAnnonceur={contrat?.joueurId === 1}
          gagnantIdPli={pliEnCours.gagnantId}
          equipe={getEquipe(1)}
        />
      </View>

      {/* ── Joueur Sud (Humain) ──────────────────── */}
      <PlayerSlot
        joueur={joueurs[0]}
        position="sud"
        carteJouee={carteJoueeParJoueur(0)}
        estSonTour={tourDeJoueur === 0}
        plisManche={getPlisGagnes(0)}
        estPartenaire={partenaireRévélé && contrat?.partenaireId === 0}
        estAnnonceur={contrat?.joueurId === 0}
        estHumain
        gagnantIdPli={pliEnCours.gagnantId}
        equipe={getEquipe(0)}
      />
    </View>
  );
};

// ──────────────────────────────────────────────
//  Slot d'un joueur
// ──────────────────────────────────────────────

interface PlayerSlotProps {
  joueur: Joueur;
  position: 'nord' | 'sud' | 'est' | 'ouest';
  carteJouee?: Carte;
  estSonTour: boolean;
  plisManche: number;
  estPartenaire: boolean;
  estAnnonceur: boolean;
  estHumain?: boolean;
  gagnantIdPli?: number;
  equipe?: 'A' | 'B'; // A: Annonceur/Partenaire, B: Défenseurs
}

const PlayerSlot: React.FC<PlayerSlotProps> = ({
  joueur,
  position,
  carteJouee,
  estSonTour,
  plisManche,
  estPartenaire,
  estAnnonceur,
  estHumain = false,
  gagnantIdPli,
  equipe,
}) => {
  const isHoriz = position === 'est' || position === 'ouest';
  const isLeft = position === 'ouest';
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const moveAnim = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  React.useEffect(() => {
    if (carteJouee) {
      // Apparition
      Animated.spring(fadeAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
      moveAnim.setValue({ x: 0, y: 0 });
    }
  }, [carteJouee]);

  // Animation vers le vainqueur
  React.useEffect(() => {
    if (gagnantIdPli !== undefined && carteJouee) {
      const posMap: Record<number, string> = { 0: 'sud', 1: 'est', 2: 'nord', 3: 'ouest' };
      const vPos = posMap[gagnantIdPli]; // position du vainqueur

      // Coordonnées virtuelles pour calculer le vecteur de direction
      const coords: Record<string, {x: number, y: number}> = {
        nord: { x: 0, y: -0.8 },
        sud:  { x: 0, y: 0.8 },
        est:  { x: 0.9, y: 0 },
        ouest: { x: -0.9, y: 0 }
      };

      const monCoord = coords[position];
      const vainqueurCoord = coords[vPos];

      // Calcul du déplacement vers le vainqueur
      const DIST_X = 120;
      const DIST_Y = 100;
      const toX = (vainqueurCoord.x - monCoord.x) * DIST_X;
      const toY = (vainqueurCoord.y - monCoord.y) * DIST_Y;

      // Si je suis le vainqueur, ma carte ne bouge pas
      const isWinner = posMap[gagnantIdPli] === position;

      Animated.sequence([
        // Ramassage immédiat (toujours en recto)
        Animated.timing(moveAnim, {
          toValue: { x: isWinner ? 0 : toX, y: isWinner ? 0 : toY },
          duration: 600,
          useNativeDriver: true,
        }),
        // Les cartes sont regroupées : on attend 2 secondes
        Animated.delay(2000),
        // Disparition finale
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [gagnantIdPli]);

  const teamColor = equipe === 'A' ? Colors.primary : Colors.error;
  const teamLabel = equipe === 'A' ? 'Offensive' : 'Défense';

  return (
    <View style={[
      styles.playerSlot,
      styles[`slot_${position}`],
      estSonTour && styles.slotActif,
      equipe && { backgroundColor: equipe === 'A' ? 'rgba(29, 158, 117, 0.05)' : 'rgba(226, 75, 74, 0.05)' }
    ]}>

      {/* Indicateur d'équipe visuel */}
      {equipe && (
        <View style={[
          styles.teamIndicator,
          { backgroundColor: teamColor },
          position === 'est' ? { right: 0 } : position === 'ouest' ? { left: 0 } : { top: 0, width: '100%', height: 3 }
        ]} />
      )}

      {/* Carte jouée (animation) */}
      {carteJouee && (
        <Animated.View style={[
          styles.cartePoseeAbsolue,
          styles[`cartePosee_${position}`],
          {
            opacity: fadeAnim,
            transform: [
              { scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
              { translateY: Animated.add(moveAnim.y, fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] })) },
              { translateX: moveAnim.x }
            ]
          }
        ]}>
          <CardFace carte={carteJouee} taille="table" />
        </Animated.View>
      )}

      {/* Dos des cartes (IA) */}
      {!estHumain && (
        <HandBack
          nbCartes={joueur.main.length}
          orientation={isHoriz ? 'horizontal' : 'horizontal'}
        />
      )}

      {/* Nom + score */}
      <View style={[styles.playerInfo, isHoriz && styles.playerInfoH]}>
        {estSonTour && <View style={styles.tourIndicateur} />}
        <View style={styles.nameWithBadge}>
          <Text style={[
            styles.playerNom,
            (estPartenaire || estAnnonceur) && styles.playerNomPartenaire,
          ]}>
            {joueur.nom}
            {estHumain ? ' (Vous)' : ''}
          </Text>
          {(estAnnonceur || estPartenaire) && (
            <View style={styles.roleBadge}>
               <Text style={styles.roleBadgeText}>{estAnnonceur ? '🎯' : '🤝'}</Text>
            </View>
          )}
        </View>
        <Text style={styles.playerScore}>
          {plisManche} pli{plisManche > 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
};

// ──────────────────────────────────────────────
//  Zone centrale du pli
// ──────────────────────────────────────────────

interface ZonePliProps {
  pliEnCours: Pli;
  atout: Couleur | null;
  contrat: ContratJoue | null;
}

const ZonePli: React.FC<ZonePliProps> = ({ pliEnCours, contrat }) => {
  return (
    <View style={styles.zonePli}>
      {pliEnCours.cartesJouees.length === 0 && (
        <Text style={styles.pliVide}>
          {contrat ? `${contrat.nom}` : 'En attente…'}
        </Text>
      )}
      {/* Les cartes sont maintenant gérées par les PlayerSlots pour être "à côté" des joueurs */}
    </View>
  );
};

// ─── Styles ────────────────────────────────────

const styles = StyleSheet.create({
  table: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    marginHorizontal: Spacing.sm,
  },

  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  badge: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  badgeContrat: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primary,
  },
  badgeTexte: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.3,
  },

  // Slots joueurs
  playerSlot: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    position: 'relative',
    minHeight: 80,
    justifyContent: 'center',
  },
  slot_nord: {
    marginBottom: Spacing.xs,
  },
  slot_sud: {
    marginTop: Spacing.xs,
  },
  slot_est: {
    flex: 0,
    width: 80,
  },
  slot_ouest: {
    flex: 0,
    width: 80,
  },
  slotActif: {
    // Légère surbrillance
  },
  playerInfo: {
    alignItems: 'center',
    marginTop: 3,
    flexDirection: 'row',
    gap: 4,
  },
  playerInfoH: {
    flexDirection: 'column',
    gap: 2,
  },
  tourIndicateur: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  playerNom: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  playerNomPartenaire: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  nameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleBadge: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.sm,
    paddingHorizontal: 2,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  roleBadgeText: {
    fontSize: 12,
  },
  teamIndicator: {
    position: 'absolute',
    width: 4,
    height: '60%',
    borderRadius: 2,
  },
  playerScore: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },

  // Cartes posées à côté des joueurs
  cartePoseeAbsolue: {
    position: 'absolute',
    ...Shadows.card,
    zIndex: 50, // Augmenté pour être sûr que c'est visible
  },
  cartePosee_nord: {
    top: 50, // Ajusté pour visibilité
  },
  cartePosee_sud: {
    bottom: 50,
  },
  cartePosee_est: {
    right: 50,
  },
  cartePosee_ouest: {
    left: 50,
  },

  // Rangée milieu
  milieu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Zone pli
  zonePli: {
    flex: 1,
    height: 120, // Augmenté pour éviter superposition
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pliVide: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  carteJoueeWrapper: {
    position: 'absolute',
    ...Shadows.card,
  },
  carteGagnante: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: CardSize.table.radius,
  },
  gagnantBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gagnantTexte: {
    fontSize: FontSize.xs,
    color: '#fff',
    fontWeight: FontWeight.bold,
  },
});
