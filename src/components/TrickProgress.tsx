// ─────────────────────────────────────────────
//  COMPOSANT — Jauge des 13 plis (TrickProgress)
// ─────────────────────────────────────────────

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ContratJoue, Pli } from '../engine/types';
import { Shadows } from '../constants/theme';

interface TrickProgressProps {
  contrat: ContratJoue;
  plisTermines: Pli[];
  nbPlisEq?: number;
}

export const TrickProgress: React.FC<TrickProgressProps> = ({
  contrat,
  plisTermines,
  nbPlisEq,
}) => {
  const isMisere = Boolean(
    contrat.id?.includes('misere') || contrat.plisObjectif === 0
  );
  const totalDots = contrat.id === 'petite_misere' ? 12 : 13;
  const target = isMisere ? 0 : (contrat.plisObjectif ?? 0);

  const wonBid = nbPlisEq !== undefined
    ? nbPlisEq
    : plisTermines.filter(p => {
        const isBidder = p.gagnantId === contrat.joueurId;
        const isPartner = contrat.partenaireId !== undefined && p.gagnantId === contrat.partenaireId;
        return isBidder || isPartner;
      }).length;

  const wonDef = plisTermines.length - wonBid;

  const dots = [];
  for (let i = 0; i < totalDots; i++) {
    const isTarget = target > 0 && i === target - 1;
    let isGood = false;
    let isBad = false;

    if (isMisere) {
      // Pour la misère : les plis des adversaires sont bons (vert)
      if (i < wonDef) isGood = true;
      // Tout pli pris par le preneur fait chuter (rouge)
      if (i >= totalDots - wonBid) isBad = true;
    } else {
      if (i < wonBid) isGood = true;
      if (i >= totalDots - wonDef) isBad = true;
    }

    dots.push(
      <View
        key={i}
        style={[
          styles.dot,
          isTarget && styles.targetDot,
          isGood && styles.goodDot,
          isBad && styles.badDot,
        ]}
      />
    );
  }

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={
        isMisere
          ? `${wonDef} plis adversaires évités, ${wonBid} plis preneur`
          : `${wonBid} plis équipe, ${wonDef} plis défense (objectif: ${target})`
      }
    >
      {dots}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4.5,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#d1d5db',
    ...Shadows.card,
  },
  dot: {
    width: 7.5,
    height: 7.5,
    borderRadius: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  targetDot: {
    width: 11.5,
    height: 11.5,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#059669',
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
  },
  goodDot: {
    backgroundColor: '#34D399',
    borderColor: '#A7F3D0',
    borderWidth: 1,
  },
  badDot: {
    backgroundColor: '#FB7185',
    borderColor: '#FECDD3',
    borderWidth: 1,
  },
});
