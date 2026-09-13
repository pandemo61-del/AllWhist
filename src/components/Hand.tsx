import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Vibration } from 'react-native';
import { CardFace } from './Card';
import { Carte } from '../engine/types';
import { useTranslation } from '../i18n';
import { useSettingsStore } from '../store/settingsStore';
import { Colors, Spacing, FontSize } from '../constants/theme';
import { normalize } from '../utils/normalize';

const { width: SW } = Dimensions.get('window');

export const Hand: React.FC<any> = ({ cartes, cartesJouables, onJouerCarte, phase, maxVisible }) => {
  const { t } = useTranslation();
  const [sel, setSel] = useState<string | null>(null);
  const jIds = new Set(cartesJouables.map((c: any) => c.id));

  // Limiter le nombre de cartes affichées (pour l'animation de distribution)
  const visibleCards = maxVisible !== undefined ? cartes.slice(0, maxVisible) : cartes;

  // Taille de carte normalisée
  const cardWidth = normalize(52);
  const cardHeight = normalize(74);

  // Calcul de l'espacement pour que 13 cartes tiennent sur l'écran
  const overlap = cardWidth * 0.6;
  const visibleWidth = cardWidth - overlap;
  const suitGap = normalize(10);

  let totalGap = 0;
  const offsets: number[] = [];
  visibleCards.forEach((c: any, i: number) => {
    if (i > 0 && c.couleur !== visibleCards[i - 1].couleur) totalGap += suitGap;
    offsets.push((i * visibleWidth) + totalGap);
  });

  const totalW = offsets.length > 0 ? offsets[offsets.length - 1] + cardWidth : cardWidth;
  const startX = (SW - totalW) / 2;

  let label = t('hand.waiting');
  if (phase === 'jeu') label = t('hand.yourTurn');
  else if (phase === 'encheres') label = t('hand.biddingHand');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.text}>{label}</Text>
        <Text style={styles.text}>{visibleCards.length} {t('hand.cards')}</Text>
      </View>
      <View style={[styles.fan, { height: cardHeight + normalize(20) }]}>
        {visibleCards.map((c: any, i: number) => {
          const isSel = sel === c.id;
          const jouable = jIds.has(c.id) || phase === 'encheres';
          const tx = startX + offsets[i];
          const mid = (cartes.length - 1) / 2;
          const ty = Math.abs(i - mid) * 2;

          return (
            <View key={c.id} style={[styles.wrap, { left: tx, transform: [{ translateY: isSel ? -normalize(30) : ty }], zIndex: isSel ? 100 : i }]}>
              <CardFace
                carte={c}
                selectionne={isSel}
                jouable={jouable}
                onPress={(card: Carte) => {
                  if (isSel && jouable) {
                    onJouerCarte(card);
                    setSel(null);
                  } else {
                    if (useSettingsStore.getState().vibration) Vibration.vibrate(10);
                    setSel(card.id);
                  }
                }}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: SW },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 5 },
  text: { fontSize: 11, color: Colors.textMuted, fontWeight: 'bold', textTransform: 'uppercase' },
  fan: { position: 'relative', width: '100%' },
  wrap: { position: 'absolute', bottom: 10 },
});
