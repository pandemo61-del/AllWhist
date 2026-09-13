// ─────────────────────────────────────────────
//  app/variantes.tsx — Sélection de variante
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TOUTES_VARIANTES } from '../src/variants/index';
import { VariantCard } from '../src/components/VariantCard';
import { useGameStore } from '../src/store/gameStore';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../src/constants/theme';
import { useTranslation } from '../src/i18n';

export default function VariantesScreen() {
  const { t } = useTranslation();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isLearnMode = mode === 'learn';

  const [varianteSel, setVarianteSel] = useState<string>('whist-gand');
  const initialiserPartie = useGameStore(s => s.initialiserPartie);

  const handleDemarrer = () => {
    if (isLearnMode) {
      router.push(`/learn/${varianteSel}`);
    } else {
      initialiserPartie(varianteSel);
      router.replace(`/game/${varianteSel}`);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── En-tête ───────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.titre}>
          {isLearnMode ? (t('variantes.learnTitle') || 'Quelle variante apprendre ?') : (t('variantes.playTitle') || 'Choisir une variante')}
        </Text>
        <Text style={styles.sous}>
          {t('variantes.subtitle') || 'Touchez une variante pour voir ses règles et contrats'}
        </Text>
      </View>

      {/* ── Liste des variantes ───────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {TOUTES_VARIANTES.map(v => (
          <VariantCard
            key={v.id}
            variante={v}
            selectionne={varianteSel === v.id}
            onSelect={setVarianteSel}
          />
        ))}
      </ScrollView>

      {/* ── Bouton principal ─────────────────── */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <View style={styles.selInfo}>
            <Text style={styles.selLabel}>{t('variantes.selected') || 'Sélectionné'}</Text>
            <Text style={styles.selNom}>
              {(() => {
                const v = TOUTES_VARIANTES.find(v => v.id === varianteSel);
                return v ? t(`variants.${v.id}.nom`) : '—';
              })()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.btnDemarrer}
            onPress={handleDemarrer}
            activeOpacity={0.85}
          >
            <Text style={styles.btnDemarrerTexte}>
              {isLearnMode ? (t('variantes.btnLearn') || 'Apprendre →') : (t('variantes.btnPlay') || 'Jouer →')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  titre: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  sous: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  footer: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bgSurface,
    padding: Spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  selInfo: { flex: 1 },
  selLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selNom: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  btnDemarrer: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  btnDemarrerTexte: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: '#fff',
  },
});
