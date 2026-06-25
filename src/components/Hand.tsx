// ─────────────────────────────────────────────
//  COMPOSANT — Main du joueur
// ─────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import {
  View, ScrollView, Text, TouchableOpacity,
  StyleSheet, Animated, Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { Carte } from '../engine/types';
import { CardFace } from './Card';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../constants/theme';
import { useTranslation } from '../i18n';

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

  const jouablesIds = new Set(cartesJouables.map(c => c.id));
  const peutJouer = phase === 'jeu' && cartesJouables.length > 0;

  // Reset de la sélection si elle n'est plus jouable ou si le tour passe
  React.useEffect(() => {
    if (carteSelectionnee && (!peutJouer || !jouablesIds.has(carteSelectionnee))) {
      setCarteSelectionnee(null);
    }
  }, [peutJouer, jouablesIds, carteSelectionnee]);

  const getLabel = () => {
    switch (phase) {
      case 'jeu':
        return peutJouer ? t('hand.yourTurn') : t('hand.invalidCard');
      case 'encheres':
        return t('hand.biddingHand');
      default:
        return t('hand.waiting');
    }
  };

  const handlePress = useCallback((carte: Carte) => {
    // On permet la sélection même si on ne peut pas jouer (pour voir les détails)
    if (carteSelectionnee === carte.id) {
      if (peutJouer && jouablesIds.has(carte.id)) {
        // Animation avant de confirmer
        setCarteSelectionnee(null);
        // On laisse un petit délai pour que l'action soit visible
        setTimeout(() => onJouerCarte(carte), 100);
      } else {
        setCarteSelectionnee(null);
      }
    } else {
      setCarteSelectionnee(carte.id);
    }
  }, [carteSelectionnee, peutJouer, jouablesIds, onJouerCarte]);

  const carteSelObj = cartes.find(c => c.id === carteSelectionnee);

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
            const estEnchere = phase === 'encheres';

            const isFirstOfSuit = index === 0 || cartes[index - 1].couleur !== carte.couleur;

            const diff = index - mid;

            // Paramètres pour un éventail réaliste et uniforme
            const rotation = diff * (cartes.length > 10 ? 6 : 8);
            const translateY = Math.abs(diff) * (cartes.length > 10 ? 3 : 5);
            const spread = (cartes.length > 10 ? 28 : 34);

            // On applique le décalage de couleur pour une séparation nette
            const translateX = (diff * spread) + (suitOffsets[index] - totalExtraOffset / 2);

            return (
              <View
                key={carte.id}
                style={[
                  styles.carteWrapper,
                  {
                    transform: [
                      { translateX },
                      { translateY: sel ? -60 : translateY },
                      { rotate: `${rotation}deg` },
                      { scale: sel ? 1.2 : 1 },
                    ],
                    zIndex: sel ? 100 : index,
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
                    // Bordure noire encore plus épaisse pour la visibilité
                    isFirstOfSuit && {
                      borderLeftWidth: 5,
                      borderLeftColor: '#000',
                      // On rajoute un petit effet de relief sur le bord noir
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    }
                  ]}
                />
              </View>
            );
          });
        })()}
      </View>

      {/* Bouton de confirmation si une carte est sélectionnée */}
      {carteSelObj && peutJouer && (
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>
            {t('hand.confirmPlay')}{' '}
            <Text style={styles.confirmCard}>
              {/* Afficher nom de la carte */}
              {(() => {
                if (carteSelObj.estJoker) return t('hand.joker');
                let valStr: string = String(carteSelObj.valeur);
                if (carteSelObj.valeur === 14) valStr = t('hand.ace');
                else if (carteSelObj.valeur === 13) valStr = t('hand.king');
                else if (carteSelObj.valeur === 12) valStr = t('hand.queen');
                else if (carteSelObj.valeur === 11) valStr = t('hand.jack');

                return `${valStr} ${t('hand.of')} ${t(`suits.${carteSelObj.couleur}`)}`;
              })()}
            </Text>{' '}?
          </Text>
          <View style={styles.confirmBtns}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondaire]}
              onPress={() => setCarteSelectionnee(null)}
            >
              <Text style={styles.btnSecondaireTexte}>{t('hand.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimaire]}
              onPress={() => {
                setCarteSelectionnee(null);
                onJouerCarte(carteSelObj);
              }}
            >
              <Text style={styles.btnPrimaireTexte}>{t('hand.play')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    height: 180,
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

  // Zone de confirmation
  confirmRow: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  confirmLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  confirmCard: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },
  confirmBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  btnPrimaire: {
    backgroundColor: Colors.primary,
  },
  btnPrimaireTexte: {
    color: '#fff',
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  btnSecondaire: {
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  btnSecondaireTexte: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
});
