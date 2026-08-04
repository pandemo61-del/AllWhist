// ─────────────────────────────────────────────
//  COMPOSANT — Main du joueur
// ─────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import {
  View, ScrollView, Text, TouchableOpacity,
  StyleSheet, Animated, Dimensions, Easing,
  Vibration,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { Carte } from '../engine/types';
import { CardFace } from './Card';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../constants/theme';
import { useTranslation } from '../i18n';
import { useSettingsStore } from '../store/settingsStore';

interface HandProps {
  cartes: Carte[];
  cartesJouables: Carte[];        // ids des cartes que le joueur peut jouer
  onJouerCarte: (carte: Carte) => void;
  phase: 'jeu' | 'attente' | 'encheres';       // attente = pas le tour du joueur
  cartesVisibles?: boolean;        // misère ouverte : montrer les cartes adverses
}

export const Hand: React.FC<HandProps> = ({
  cartes,
  cartesJouables,
  onJouerCarte,
  phase,
  cartesVisibles = false,
}) => {
  const { t } = useTranslation();
  const [carteSelectionnee, setCarteSelectionnee] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);

  // Valeur animée pour le mouvement de "jeu" de la carte
  const playAnim = React.useRef(new Animated.Value(0)).current;

  const jouablesIds = new Set(cartesJouables.map(c => c.id));
  const peutJouer = phase === 'jeu' && cartesJouables.length > 0 && !isSubmitting;

  // Reset de la sélection et du verrou si le tour change
  React.useEffect(() => {
    if (phase !== 'jeu') {
      setIsSubmitting(false);
      setPlayingCardId(null);
      playAnim.setValue(0);
    }
    if (carteSelectionnee && (!peutJouer || !jouablesIds.has(carteSelectionnee))) {
      setCarteSelectionnee(null);
    }
  }, [peutJouer, jouablesIds, carteSelectionnee, phase, playAnim]);

  const getLabel = () => {
    switch (phase) {
      case 'jeu':
        if (isSubmitting) return t('hand.waiting') || 'Envoi...';
        return peutJouer ? t('hand.yourTurn') : t('hand.invalidCard');
      case 'encheres':
        return t('hand.biddingHand');
      default:
        return t('hand.waiting');
    }
  };

  const handlePress = useCallback((carte: Carte) => {
    if (isSubmitting || playingCardId) return;

    const jouable = jouablesIds.has(carte.id) && peutJouer;
    const isSelected = carteSelectionnee === carte.id;
    const { vibration } = useSettingsStore.getState();

    if (isSelected && jouable) {
      // Deuxième clic sur une carte déjà sélectionnée et jouable -> On joue !
      setPlayingCardId(carte.id);
      setIsSubmitting(true);
      if (vibration) Vibration.vibrate(50); // Vibration courte au lancer

      // Animation qui "lance" la carte vers le centre
      Animated.timing(playAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }).start(() => {
        onJouerCarte(carte);
      });
    } else {
      // Premier clic ou carte non jouable -> On met en évidence ou on désélectionne
      if (vibration && !isSelected) Vibration.vibrate(10); // Micro-vibration au touché
      setCarteSelectionnee(prev => prev === carte.id ? null : carte.id);
    }
  }, [carteSelectionnee, isSubmitting, peutJouer, jouablesIds, onJouerCarte, playingCardId, playAnim]);

  return (
    <View style={styles.container}>

      {/* Label de contexte */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>{getLabel()}</Text>
        {cartes.length > 0 && (
          <Text style={styles.compteur}>
            {cartes.length} {cartes.length > 1 ? t('hand.cards') : t('hand.card')}
          </Text>
        )}
      </View>

      {/* Cartes en éventail */}
      <View style={styles.fanContainer}>
        {(() => {
          const mid = (cartes.length - 1) / 2;

          // 1. Pré-calculer les décalages pour marquer les changements de couleur
          let suitOffsetAccumulator = 0;
          const suitOffsets: number[] = [];
          cartes.forEach((carte, index) => {
            if (index > 0 && cartes[index - 1].couleur !== carte.couleur) {
              suitOffsetAccumulator += 15; // Créer un espace physique entre les couleurs
            }
            suitOffsets.push(suitOffsetAccumulator);
          });

          const totalExtraOffset = suitOffsetAccumulator;

          return cartes.map((carte, index) => {
            const jouable = jouablesIds.has(carte.id) && peutJouer;
            const sel = carteSelectionnee === carte.id;
            const isPlaying = playingCardId === carte.id;
            const estEnchere = phase === 'encheres';

            const isFirstOfSuit = index === 0 || cartes[index - 1].couleur !== carte.couleur;

            const diff = index - mid;

            // Paramètres pour un éventail très compact
            const rotation = diff * (cartes.length > 10 ? 4 : 5);
            const translateY = Math.abs(diff) * (cartes.length > 10 ? 1 : 2);
            const spread = (cartes.length > 10 ? 20 : 24);

            // On applique le décalage de couleur pour une séparation nette + un décalage global vers la gauche
            const handShift = -20;
            const translateX = (diff * spread) + (suitOffsets[index] - totalExtraOffset / 2) + handShift;

            // Animation de jet de carte vers le tapis (position finale sur la table)
            const animatedTranslateY = isPlaying
              ? playAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-60, -140], // Réduit (était à -220) pour éviter que la carte ne monte trop haut
                })
              : (sel ? -60 : translateY);

            const animatedTranslateX = isPlaying
              ? playAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [translateX, 0], // Se centre horizontalement
                })
              : translateX;

            const animatedRotate = isPlaying
              ? playAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [`${rotation}deg`, '0deg'], // Redressement
                })
              : `${rotation}deg`;

            const animatedOpacity = isPlaying
              ? playAnim.interpolate({
                  inputRange: [0, 0.9, 1],
                  outputRange: [1, 1, 0.2], // Transition douce vers la carte de la table
                })
              : 1;

            const animatedScale = isPlaying
              ? playAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1.2, 2.2, 1.96], // Ratio 90/46 pour taille table exacte
                })
              : (sel ? 1.2 : 1);

            return (
              <Animated.View
                key={carte.id}
                style={[
                  styles.carteWrapper,
                  {
                    transform: [
                      { translateX: animatedTranslateX },
                      { translateY: animatedTranslateY },
                      { rotate: animatedRotate },
                      { scale: animatedScale },
                    ],
                    zIndex: sel || isPlaying ? 100 : index,
                    opacity: animatedOpacity,
                  }
                ]}
              >
                <CardFace
                  carte={carte}
                  selectionne={sel}
                  jouable={jouable || estEnchere}
                  onPress={handlePress}
                  style={[
                    !sel && styles.carteShadow,
                    // Masquer la bordure de tri pendant le mouvement pour un rendu propre sur tapis
                    isFirstOfSuit && !isPlaying && {
                      borderLeftWidth: 5,
                      borderLeftColor: '#000',
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    }
                  ]}
                />
              </Animated.View>
            );
          });
        })()}
      </View>
    </View>
  );
};

// ─── Styles ────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: FontWeight.medium,
  },
  compteur: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  fanContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 120,
    width: SCREEN_WIDTH,
    paddingHorizontal: Spacing.xl,
    overflow: 'visible',
    marginTop: 0,
  },
  carteWrapper: {
    position: 'absolute',
    bottom: 50, // Ajusté pour l'équilibre visuel
  },
  carteWrapperSel: {
    // Élévation gérée par CardFace (selectionneWrapper)
  },
  carteShadow: {
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
