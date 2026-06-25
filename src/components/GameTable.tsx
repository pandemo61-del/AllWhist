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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Props ─────────────────────────────────────

interface GameTableProps {
  joueurs: Joueur[];
  pliEnCours: Pli;
  atout: Couleur | null;
  contrat: ContratJoue | null;
  tourDeJoueur: number;
  plisTermines: Pli[];
  partenaireRévélé: boolean;
  scores: number[];
}

// ─── Composant Principal ───────────────────────

export const GameTable: React.FC<GameTableProps> = ({
  joueurs,
  pliEnCours,
  atout,
  contrat,
  tourDeJoueur,
  plisTermines,
  partenaireRévélé,
}) => {
  const getPlisGagnes = (joueurId: number) => {
    return plisTermines.filter(p => p.gagnantId === joueurId).length;
  };

  // Déterminer l'équipe de chaque joueur
  const getEquipe = (id: number): 'A' | 'B' | undefined => {
    if (!contrat) return undefined;
    const estAnnonceur = id === contrat.joueurId;
    const estPartenaire = partenaireRévélé && id === contrat.partenaireId;
    if (estAnnonceur || estPartenaire) return 'A';
    if (!partenaireRévélé && contrat.partenaireId !== undefined) {
      return estAnnonceur ? 'A' : undefined;
    }
    return 'B';
  };

  const nbPlisEquipe = contrat ? (
    contrat.seul
      ? getPlisGagnes(contrat.joueurId)
      : (getPlisGagnes(contrat.joueurId) + (contrat.partenaireId !== undefined ? getPlisGagnes(contrat.partenaireId) : 0))
  ) : 0;

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
              : {nbPlisEquipe} / {contrat.plisObjectif}
            </Text>
          </View>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeTexte}>Pli {plisTermines.length + 1}/13</Text>
        </View>
      </View>

      {/* ── Joueur Nord ──────── */}
      <PlayerSlot
        joueur={joueurs[2]}
        position="nord"
        estSonTour={tourDeJoueur === 2}
        plisManche={getPlisGagnes(2)}
        estPartenaire={partenaireRévélé && contrat?.partenaireId === 2}
        estAnnonceur={contrat?.joueurId === 2}
        equipe={getEquipe(2)}
      />

      <View style={styles.milieu}>
        {/* Joueur Ouest */}
        <PlayerSlot
          joueur={joueurs[1]}
          position="ouest"
          estSonTour={tourDeJoueur === 1}
          plisManche={getPlisGagnes(1)}
          estPartenaire={partenaireRévélé && contrat?.partenaireId === 1}
          estAnnonceur={contrat?.joueurId === 1}
          equipe={getEquipe(1)}
        />

        {/* ZONE DE JEU CENTRALE (Shared container for cards) */}
        <View style={styles.zonePli}>
          <TableCards
            cartesJouees={pliEnCours.cartesJouees}
            gagnantId={pliEnCours.gagnantId}
          />
        </View>

        {/* Joueur Est */}
        <PlayerSlot
          joueur={joueurs[3]}
          position="est"
          estSonTour={tourDeJoueur === 3}
          plisManche={getPlisGagnes(3)}
          estPartenaire={partenaireRévélé && contrat?.partenaireId === 3}
          estAnnonceur={contrat?.joueurId === 3}
          equipe={getEquipe(3)}
        />
      </View>

      {/* Joueur Sud */}
      <PlayerSlot
        joueur={joueurs[0]}
        position="sud"
        estSonTour={tourDeJoueur === 0}
        plisManche={getPlisGagnes(0)}
        estPartenaire={partenaireRévélé && contrat?.partenaireId === 0}
        estAnnonceur={contrat?.joueurId === 0}
        estHumain
        equipe={getEquipe(0)}
      />
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

const TableCards: React.FC<TableCardsProps> = ({ cartesJouees, gagnantId }) => {
  return (
    <View style={styles.cardsOverlay}>
      {cartesJouees.map((cp, index) => (
        <AnimatedPlayedCard
          key={`${cp.carte.id}_${index}`}
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const moveAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Déterminer la position cible sur la table pour ce joueur
  const POS_MAP: Record<number, { x: number, y: number }> = {
    0: { x: 0,   y: 60  }, // Sud
    1: { x: -70, y: 0   }, // Ouest
    2: { x: 0,   y: -60 }, // Nord
    3: { x: 70,  y: 0   }, // Est
  };

  const pos = POS_MAP[joueurId];

  // Animation d'entrée
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.spring(moveAnim, {
        toValue: { x: pos.x, y: pos.y },
        friction: 7, tension: 30, useNativeDriver: true
      }),
    ]).start();
  }, []);

  // Animation de fin de pli
  useEffect(() => {
    if (isTrickFinished && gagnantId !== undefined) {
      const winnerPos = POS_MAP[gagnantId];

      Animated.sequence([
        Animated.delay(1000), // Laisser le temps de voir le pli complet
        // Déplacement groupé vers le gagnant (côté face)
        Animated.parallel([
          Animated.timing(moveAnim, {
            toValue: { x: winnerPos.x, y: winnerPos.y },
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.6,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      ]).start();
    }
  }, [isTrickFinished, gagnantId]);

  return (
    <Animated.View style={[
      styles.animatedCardWrapper,
      {
        zIndex: playOrder + 1, // Le dernier est toujours au dessus
        opacity: fadeAnim,
        transform: [
          { translateX: moveAnim.x },
          { translateY: moveAnim.y },
          { scale: scaleAnim },
        ]
      }
    ]}>
      <CardFace carte={carte} taille="table" />
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
}

const PlayerSlot: React.FC<PlayerSlotProps> = ({
  joueur, position, estSonTour, plisManche, estPartenaire, estAnnonceur, estHumain, equipe
}) => {
  const isHoriz = position === 'est' || position === 'ouest';
  const teamColor = equipe === 'A' ? Colors.primary : Colors.error;

  return (
    <View style={[
      styles.playerSlot,
      styles[`slot_${position}`],
      estSonTour && styles.slotActif,
    ]}>
      {equipe && (
        <View style={[
          styles.teamIndicator,
          { backgroundColor: teamColor },
          position === 'est' ? { right: 0 } : position === 'ouest' ? { left: 0 } : { top: 0, width: '100%', height: 3 }
        ]} />
      )}

      {!estHumain && (
        <HandBack nbCartes={joueur.main.length} />
      )}

      <View style={[styles.playerInfo, isHoriz && styles.playerInfoH]}>
        {estSonTour && <View style={styles.tourIndicateur} />}
        <View style={styles.nameWithBadge}>
          <Text style={[styles.playerNom, (estPartenaire || estAnnonceur) && styles.playerNomPartenaire]}>
            {joueur.nom}{estHumain ? ' (Vous)' : ''}
          </Text>
          {(estAnnonceur || estPartenaire) && (
            <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>{estAnnonceur ? '🎯' : '🤝'}</Text></View>
          )}
        </View>
        <Text style={styles.playerScore}>{plisManche} pli{plisManche > 1 ? 's' : ''}</Text>
      </View>
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
    height: 480, // Hauteur fixe pour stabiliser la table
    justifyContent: 'space-between',
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

  milieu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  playerInfoH: { flexDirection: 'column', gap: 2 },
  tourIndicateur: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  playerNom: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium, textTransform: 'uppercase' },
  playerNomPartenaire: { color: Colors.primary, fontWeight: FontWeight.bold },
  nameWithBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roleBadge: { backgroundColor: Colors.bgSurface, borderRadius: Radius.sm, paddingHorizontal: 2, borderWidth: 0.5, borderColor: Colors.border },
  roleBadgeText: { fontSize: 12 },
  teamIndicator: { position: 'absolute', width: 4, height: '60%', borderRadius: 2 },
  playerScore: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
});
