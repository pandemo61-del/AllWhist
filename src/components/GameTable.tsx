// ─────────────────────────────────────────────
//  COMPOSANT — Table de jeu
// ─────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Carte, Couleur, Pli, ContratJoue, Joueur, CartePosee } from '../engine/types';
import { CardFace, CardBack, HandBack } from './Card';
import { SYMBOLE } from '../engine/deck';
import {
  Colors, Spacing, FontSize, FontWeight,
  Radius, Shadows, CardSize,
} from '../constants/theme';
import { useTranslation } from '../i18n';

import { getVariante } from '../variants/index';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Props ─────────────────────────────────────

interface GameTableProps {
  varianteId: string;
  joueurs: Joueur[];
  pliEnCours: Pli;
  atout: Couleur | null;
  contrat: ContratJoue | null;
  tourDeJoueur: number;
  plisTermines: Pli[];
  partenaireRévélé: boolean;
  scores: number[];
  children?: React.ReactNode;
  centerContent?: React.ReactNode;
  isBidding?: boolean;
}

// ─── Composant Principal ───────────────────────

export const GameTable: React.FC<GameTableProps> = ({
  varianteId,
  joueurs,
  pliEnCours,
  atout,
  contrat,
  tourDeJoueur,
  plisTermines,
  partenaireRévélé,
  children,
  centerContent,
  isBidding = false,
}) => {
  const getPlisGagnes = (joueurId: number) => {
    return plisTermines.filter(p => p.gagnantId === joueurId).length;
  };

  const currentVariante = getVariante(varianteId);

  // Déterminer l'équipe de chaque joueur
  const getEquipe = (id: number): 'A' | 'B' | undefined => {
    // 1. Cas des variantes à équipes fixes (ex: Whist classique)
    if (currentVariante?.equipeFixe) {
      return (id % 2 === 0) ? 'A' : 'B';
    }

    if (!contrat) return undefined;

    const estAnnonceur = id === contrat.joueurId;

    // Cas Solo / Abondance / Misère (Seul contre tous)
    if (contrat.seul) {
      if (estAnnonceur) return 'A';
      return 'B';
    }

    // Cas avec partenaire secret (Demande / Trou)
    if (estAnnonceur) return 'A';

    if (partenaireRévélé) {
      const estPartenaire = id === contrat.partenaireId;
      return estPartenaire ? 'A' : 'B';
    }

    return undefined;
  };

  const nbPlisEquipe = contrat ? (
    contrat.seul
      ? getPlisGagnes(contrat.joueurId)
      : (getPlisGagnes(contrat.joueurId) + (contrat.partenaireId !== undefined ? getPlisGagnes(contrat.partenaireId) : 0))
  ) : 0;

  return (
    <View style={[styles.table, children && styles.tableWithHand]}>
      {/* ── Badges info (Toujours visibles ou masqués si enchères ?) ── */}
      {!isBidding && (
        <View style={styles.badgesRow}>
          {atout && (
            <View style={styles.badge}>
              <Text style={styles.badgeTexte}>{SYMBOLE[atout]} Atout</Text>
            </View>
          )}
          {contrat && (
            <View style={[styles.badge, styles.badgeContrat]}>
              <Text style={styles.badgeTexteBlanc}>
                {contrat.nom}
                {contrat.atout ? ` (${SYMBOLE[contrat.atout]})` : ''}
                : {nbPlisEquipe} / {contrat.plisObjectif}
              </Text>
            </View>
          )}
          <View style={styles.badge}>
            <Text style={styles.badgeTexte}>Pli {plisTermines.length + 1}/13</Text>
          </View>
        </View>
      )}

      {isBidding ? (
        /* ── VUE ENCHÈRES : Panneau complet occupant tout le haut ── */
        <View style={styles.biddingContent}>
          {centerContent}
        </View>
      ) : (
        /* ── VUE JEU : Disposition classique ── */
        <>
          {/* Joueur Nord */}
          <PlayerSlot
            joueur={joueurs[2]}
            position="nord"
            estSonTour={tourDeJoueur === 2}
            plisManche={getPlisGagnes(2)}
            estPartenaire={partenaireRévélé && contrat?.partenaireId === 2}
            estAnnonceur={contrat?.joueurId === 2}
            equipe={getEquipe(2)}
            rotationCards="180deg"
          />

          <View style={styles.milieu}>
            <PlayerSlot
              joueur={joueurs[1]}
              position="ouest"
              estSonTour={tourDeJoueur === 1}
              plisManche={getPlisGagnes(1)}
              estPartenaire={partenaireRévélé && contrat?.partenaireId === 1}
              estAnnonceur={contrat?.joueurId === 1}
              equipe={getEquipe(1)}
              orientation="vertical"
              rotationCards="-90deg"
            />
            <View style={styles.zonePliPlaceholder}>
              {centerContent}
            </View>
            <PlayerSlot
              joueur={joueurs[3]}
              position="est"
              estSonTour={tourDeJoueur === 3}
              plisManche={getPlisGagnes(3)}
              estPartenaire={partenaireRévélé && contrat?.partenaireId === 3}
              estAnnonceur={contrat?.joueurId === 3}
              equipe={getEquipe(3)}
              orientation="vertical"
              rotationCards="90deg"
            />
          </View>
        </>
      )}

      {/* Joueur Sud + Main (Toujours présent) */}
      <View style={styles.sudSection}>
        <PlayerSlot
          joueur={joueurs[0]}
          position="sud"
          estSonTour={tourDeJoueur === 0}
          plisManche={getPlisGagnes(0)}
          estPartenaire={partenaireRévélé && contrat?.partenaireId === 0}
          estAnnonceur={contrat?.joueurId === 0}
          estHumain
          equipe={getEquipe(0)}
          objectif={contrat?.plisObjectif}
        />
        {children && (
          <View style={styles.handWrapperInside}>
            {children}
          </View>
        )}
      </View>

      {/* ZONE DE PLI (Rendered LAST to be on top of avatars) */}
      <View style={[styles.zonePliAbsolute, { zIndex: 1000 }]} pointerEvents="none">
        <TableCards
          cartesJouees={pliEnCours.cartesJouees}
          gagnantId={pliEnCours.gagnantId}
          pliNum={pliEnCours.numero}
        />
      </View>
    </View>
  );
};

// ──────────────────────────────────────────────
//  COMPOSANT — TableCards (Overlay des cartes jouées)
// ──────────────────────────────────────────────

interface TableCardsProps {
  cartesJouees: CartePosee[];
  gagnantId?: number;
}

const TableCards: React.FC<TableCardsProps & { pliNum: number }> = ({ cartesJouees, gagnantId, pliNum }) => {
  return (
    <View style={styles.cardsOverlay}>
      {cartesJouees.map((cp, index) => (
        <AnimatedPlayedCard
          key={`${pliNum}_${cp.carte.id}_${index}`} // Clé plus unique pour forcer le remount
          cartePosee={cp}
          playOrder={index}
          isTrickFinished={gagnantId !== undefined}
          gagnantId={gagnantId}
        />
      ))}
    </View>
  );
};

// ──────────────────────────────────────────────
//  COMPOSANT — AnimatedPlayedCard
// ──────────────────────────────────────────────

interface AnimatedPlayedCardProps {
  cartePosee: CartePosee;
  playOrder: number;
  isTrickFinished: boolean;
  gagnantId?: number;
}

const AnimatedPlayedCard: React.FC<AnimatedPlayedCardProps> = ({
  cartePosee, playOrder, isTrickFinished, gagnantId
}) => {
  const { joueurId, carte } = cartePosee;

  // Points de départ (venant des joueurs) pour éviter le spawn au centre
  const START_POS: Record<number, { x: number, y: number }> = {
    0: { x: 0,   y: 250 },
    1: { x: -200, y: 0   },
    2: { x: 0,   y: -250 },
    3: { x: 200,  y: 0   },
  };

  const POS_MAP: Record<number, { x: number, y: number }> = {
    0: { x: 0,   y: 70  }, // Sud (Remonté pour visibilité totale)
    1: { x: -80, y: 0   },
    2: { x: 0,   y: -70 },
    3: { x: 80,  y: 0   },
  };

  const startPos = START_POS[joueurId] || { x: 0, y: 0 };
  const targetPos = POS_MAP[joueurId] || { x: 0, y: 0 };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const moveAnim = useRef(new Animated.ValueXY(startPos)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;

  const rotation = '0deg'; // Toutes les cartes à 0° comme demandé

  // Animation d'entrée
  useEffect(() => {
    // Si c'est le joueur humain (0), la main a déjà fait l'animation de mouvement
    // On fait apparaître la carte directement à sa cible pour un effet "seamless"
    if (joueurId === 0) {
      moveAnim.setValue(targetPos);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    } else {
      // Pour les IA, on garde l'animation de jet depuis leur avatar
      moveAnim.setValue(startPos);
      fadeAnim.setValue(0);
      scaleAnim.setValue(1);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(moveAnim, {
          toValue: targetPos,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        }),
      ]).start();
    }
  }, [joueurId]);

  // Animation de fin de pli
  useEffect(() => {
    if (isTrickFinished && gagnantId !== undefined) {
      const winnerPos = POS_MAP[gagnantId] || { x: 0, y: 0 };

      Animated.sequence([
        Animated.delay(1000),
        Animated.parallel([
          Animated.timing(moveAnim, {
            toValue: winnerPos,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isTrickFinished, gagnantId]);

  const frontRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <Animated.View style={[
      styles.animatedCardWrapper,
      {
        zIndex: playOrder + 1,
        opacity: fadeAnim,
        transform: [
          { translateX: moveAnim.x },
          { translateY: moveAnim.y },
          { rotate: rotation },
          { scale: scaleAnim },
        ]
      }
    ]}>
      {/* Recto */}
      <Animated.View style={{ backfaceVisibility: 'hidden', transform: [{ rotateY: frontRotation }] }}>
        <CardFace carte={carte} taille="table" />
      </Animated.View>

      {/* Verso (apparaît à la fin du trajet) */}
      <Animated.View style={[StyleSheet.absoluteFill, { backfaceVisibility: 'hidden', transform: [{ rotateY: backRotation }] }]}>
        <CardBack style={{ width: CardSize.table.width, height: CardSize.table.height }} />
      </Animated.View>
    </Animated.View>
  );
};

// ──────────────────────────────────────────────
//  COMPOSANT — Slot Joueur (Avatar + Info)
// ──────────────────────────────────────────────

interface PlayerSlotProps {
  joueur: Joueur;
  position: 'nord' | 'sud' | 'est' | 'ouest';
  estSonTour: boolean;
  plisManche: number;
  estPartenaire: boolean;
  estAnnonceur: boolean;
  estHumain?: boolean;
  equipe?: 'A' | 'B';
  orientation?: 'horizontal' | 'vertical';
  rotationCards?: string;
  objectif?: number;
  thinking?: boolean;
}

const PlayerSlot: React.FC<PlayerSlotProps> = ({
  joueur, position, estSonTour, plisManche, estPartenaire, estAnnonceur, estHumain, equipe, orientation = 'horizontal', rotationCards, objectif, thinking
}) => {
  const { t } = useTranslation();
  const isV = orientation === 'vertical';
  const teamColor = equipe === 'A' ? Colors.primary : Colors.error;
  const teamLabel = equipe ? `ÉQUIPE ${equipe}` : '';

  // Animation pour le tour de joueur
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (estSonTour) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [estSonTour]);

  return (
    <Animated.View style={[
      styles.playerSlot,
      styles[`slot_${position}`],
      estSonTour && styles.slotActif,
      isV && { flexDirection: 'row' },
      equipe && {
        borderColor: teamColor,
        borderWidth: 2,
        borderRadius: Radius.lg,
        backgroundColor: equipe === 'A' ? 'rgba(29, 158, 117, 0.05)' : 'rgba(226, 75, 74, 0.05)'
      },
      {
        transform: [{ scale: pulseAnim }]
      }
    ]}>
      {equipe && (
        <View style={[
          styles.teamBadge,
          { backgroundColor: teamColor },
          position === 'est' ? { left: -10, top: -10 } : { left: 5, top: -10 }
        ]}>
          <Text style={styles.teamBadgeText}>{teamLabel}</Text>
        </View>
      )}

      {!estHumain && (
        <HandBack nbCartes={joueur.main.length} orientation={orientation} rotationCards={rotationCards} />
      )}

      <View style={[styles.playerInfo, !isV ? styles.playerInfoH : styles.playerInfoV]}>
        {estSonTour && <View style={styles.tourIndicateur} />}
        <View style={styles.nameWithBadge}>
          <Text style={[styles.playerNom, (estPartenaire || estAnnonceur) && styles.playerNomPartenaire, estSonTour && { color: Colors.primary }]}>
            {joueur.nom}{estHumain ? ' (Vous)' : ''}
          </Text>
          {(estAnnonceur || estPartenaire) && (
            <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>{estAnnonceur ? '🎯' : '🤝'}</Text></View>
          )}
        </View>
        <Text style={[styles.playerScore, estHumain && styles.playerScoreHumain]}>
          {(!estHumain && estSonTour) ? t('common.thinking') : `${plisManche}${objectif ? ` / ${objectif}` : ''} pli${plisManche > 1 ? 's' : ''}`}
        </Text>
      </View>
    </Animated.View>
  );
};

// ─── Styles ────────────────────────────────────

const styles = StyleSheet.create({
  table: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    marginHorizontal: Spacing.sm,
    height: 480, // Hauteur fixe pour stabiliser la table
    justifyContent: 'space-between',
  },
  tableWithHand: {
    height: 600, // Augmenter la hauteur pour inclure la main
  },
  sudSection: {
    alignItems: 'center',
    width: '100%',
  },
  biddingContent: {
    flex: 1,
    width: '100%',
    paddingTop: Spacing.md,
  },
  handWrapperInside: {
    width: SCREEN_WIDTH - Spacing.lg * 2,
    marginTop: -20, // Chevaucher légèrement les infos joueur pour gagner de la place
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    position: 'absolute',
    top: Spacing.sm,
    left: 0,
    right: 0,
    zIndex: 200,
  },
  badge: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: Colors.border,
    ...Shadows.panel,
  },
  badgeContrat: { backgroundColor: Colors.primaryDark, borderColor: Colors.primary },
  badgeTexte: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  badgeTexteBlanc: { fontSize: FontSize.xs, color: '#ffffff', fontWeight: FontWeight.bold },

  milieu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    zIndex: 1,
  },
  zonePliAbsolute: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  zonePliPlaceholder: {
    flex: 1,
  },
  zonePli: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedCardWrapper: {
    position: 'absolute',
    ...Shadows.card,
  },

  playerSlot: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    position: 'relative',
    minHeight: 90,
    justifyContent: 'center',
  },
  slot_nord: { marginTop: Spacing.xl },
  slot_sud: { marginBottom: Spacing.sm },
  slot_est: { width: 80 },
  slot_ouest: { width: 80 },
  slotActif: {},

  playerInfo: { alignItems: 'center', marginTop: 5, flexDirection: 'row', gap: 4 },
  playerInfoH: { flexDirection: 'row', gap: 4 },
  playerInfoV: { flexDirection: 'column', gap: 2, marginLeft: 8 },
  tourIndicateur: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  playerNom: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium, textTransform: 'uppercase' },
  playerNomPartenaire: { color: Colors.primary, fontWeight: FontWeight.bold },
  nameWithBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roleBadge: { backgroundColor: Colors.bgSurface, borderRadius: Radius.sm, paddingHorizontal: 2, borderWidth: 0.5, borderColor: Colors.border },
  roleBadgeText: { fontSize: 12 },
  teamBadge: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.sm,
    zIndex: 10,
    elevation: 3,
  },
  teamBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: FontWeight.bold,
  },
  playerScoreHumain: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.black,
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  playerScore: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
});
