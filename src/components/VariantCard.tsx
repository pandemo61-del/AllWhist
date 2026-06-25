// ─────────────────────────────────────────────
//  COMPOSANT — Carte de variante
// ─────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, LayoutAnimation, Platform, UIManager, Easing,
} from 'react-native';
import { VariantConfig } from '../variants/types';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../constants/theme';
import { useTranslation } from '../i18n';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export const VariantCard: React.FC<VariantCardProps> = ({
  variante,
  selectionne,
  onSelect,
}) => {
  const { t } = useTranslation();

  const LABEL_DIFFICULTE: Record<string, string> = {
    debutant:      t('variants.difficulty.debutant'),
    intermediaire: t('variants.difficulty.intermediaire'),
    expert:        t('variants.difficulty.expert'),
  };

  const [expanded, setExpanded] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Animation d'entrée de la carte
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  // Animation du chevron
  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded, rotateAnim]);

  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (selectionne) {
      setExpanded(e => !e);
    } else {
      onSelect(variante.id);
      setExpanded(true);
    }
  };

  const couleurDiff: Record<string, string> = {
    debutant:      Colors.debutant,
    intermediaire: Colors.intermediaire,
    expert:        Colors.expert,
  };

  const tagsCles = buildTags(variante, t);

  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      <TouchableOpacity
        style={[styles.card, selectionne && styles.cardSel]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
      {/* ── En-tête ──────────────────────────── */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.nom}>{t(`variants.${variante.id}.nom`)}</Text>
          <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>
            {t(`variants.${variante.id}.description`)}
          </Text>
        </View>
           <View style={styles.headerRight}>
             <View style={[styles.diffBadge, { backgroundColor: couleurDiff[variante.difficulte] + '22' }]}>
               <Text style={[styles.diffTexte, { color: couleurDiff[variante.difficulte] }]}>
                 {LABEL_DIFFICULTE[variante.difficulte]}
               </Text>
             </View>
             <Animated.Text
               style={[
                 styles.chevron,
                 { transform: [{ rotate: chevronRotation }] }
               ]}
             >
               ▼
             </Animated.Text>
           </View>
         </View>

      {/* ── Tags ─────────────────────────────── */}
      <View style={styles.tagsRow}>
        {tagsCles.map((tag, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.tagTexte}>{tag}</Text>
          </View>
        ))}
      </View>

      {/* ── Règles dépliables ────────────────── */}
      {expanded && (
        <View style={styles.regles}>
          <View style={styles.reglesDivider} />
          <Text style={styles.reglesLabel}>{t('variants.rulesLabel')}</Text>
          {(() => {
            const rules = t(`variants.${variante.id}.regles`);
            if (Array.isArray(rules)) {
              return rules.map((regle, i) => (
                <View key={i} style={styles.regleRow}>
                  <View style={[styles.regleNum, selectionne && styles.regleNumSel]}>
                    <Text style={[styles.regleNumTexte, selectionne && styles.regleNumTexteSel]}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text style={styles.regleTexte}>{regle}</Text>
                </View>
              ));
            }
            return <Text style={styles.regleTexte}>{String(rules)}</Text>;
          })()}

          {/* Contrats disponibles */}
          <Text style={[styles.reglesLabel, { marginTop: Spacing.md }]}>{t('variants.contractsLabel')}</Text>
          <View style={styles.contratsGrid}>
            {variante.contrats.filter(c => c.id !== 'passe').map(c => (
              <View key={c.id} style={styles.contratPill}>
                <Text style={styles.contratPillTexte}>
                  {t(`variants.${variante.id}.contrats.${c.id}.nom`) || c.nom}
                </Text>
                <Text style={styles.contratPillPts}>+{c.pointsReussite}</Text>
              </View>
            ))}
          </View>
        </View>
       )}
       </TouchableOpacity>
     </Animated.View>
   );
 };

function buildTags(v: VariantConfig, t: any): string[] {
  const tags: string[] = [`${v.nbJoueurs} ${t('variants.tags.players')}`];
  if (v.atoutChoisi)   tags.push(t('variants.tags.bidding'));
  if (!v.atoutChoisi)  tags.push(t('variants.tags.randomTrump'));
  if (v.equipeFixe)    tags.push(t('variants.tags.fixedTeams'));
  if (v.partenaire === 'as-secret') tags.push(t('variants.tags.secretPartner'));
  if (v.partenaire === 'aucun') tags.push(t('variants.tags.individual'));
  if (v.avecJoker)     tags.push(t('variants.tags.joker'));
  if (v.avecKitty)     tags.push(t('variants.tags.kitty'));
  return tags;
}

// ─── Styles ────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardSel: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.bgSurface,
  },

  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  headerLeft: { flex: 1 },
  headerRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },

  nom: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 18,
  },

  diffBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  diffTexte: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.3,
  },
  chevron: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  tagTexte: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  // Règles
  regles: {
    marginTop: Spacing.sm,
  },
  reglesDivider: {
    height: 0.5,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  reglesLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  regleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    alignItems: 'flex-start',
  },
  regleNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    borderWidth: 0.5,
    borderColor: Colors.border,
    flexShrink: 0,
  },
  regleNumSel: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primary,
  },
  regleNumTexte: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
  },
  regleNumTexteSel: {
    color: Colors.primaryLight,
  },
  regleTexte: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  // Contrats
  contratsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  contratPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  contratPillTexte: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  contratPillPts: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
});
