// ─────────────────────────────────────────────
//  app/learn/[varianteId].tsx — Tutoriel
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getVariante } from '../../src/variants/index';
import { SYMBOLE } from '../../src/engine/deck';
import { Couleur } from '../../src/engine/types';
import { useGameStore } from '../../src/store/gameStore';
import { SCENARIOS, Scenario } from '../../src/data/scenarios';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../src/constants/theme';
import { useTranslation } from '../../src/i18n';

type Onglet = 'regles' | 'contrats' | 'conseils' | 'scenarios';

export default function LearnScreen() {
  const { t } = useTranslation();
  const { varianteId } = useLocalSearchParams<{ varianteId: string }>();
  const [onglet, setOnglet] = useState<Onglet>('regles');
  const { initialiserPartie, chargerScenario } = useGameStore();

  const variante = React.useMemo(() => {
    try { return getVariante(varianteId ?? ''); } catch { return null; }
  }, [varianteId]);

  const scenariosFiltrés = React.useMemo(() => {
    return SCENARIOS.filter(s => s.varianteId === varianteId);
  }, [varianteId]);

  if (!variante) {
    return (
      <View style={styles.erreur}>
        <Text style={styles.erreurTexte}>{t('learn.erreur')}</Text>
      </View>
    );
  }

  const handleJouer = () => {
    initialiserPartie(variante.id);
    router.replace(`/game/${variante.id}`);
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* En-tête variante */}
      <View style={styles.header}>
        <Text style={styles.headerNom}>{t(`variants.${variante.id}.nom`)}</Text>
        <Text style={styles.headerDesc}>{t(`variants.${variante.id}.description`)}</Text>
      </View>

      {/* Onglets */}
      <View style={styles.onglets}>
        {(['regles', 'contrats', 'conseils', 'scenarios'] as Onglet[]).map(o => (
          <TouchableOpacity
            key={o}
            style={[styles.onglet, onglet === o && styles.ongletActif]}
            onPress={() => setOnglet(o)}
          >
            <Text style={[styles.ongletTexte, onglet === o && styles.ongletTexteActif]}>
              {{
                regles: t('learn.tabs.regles'),
                contrats: t('learn.tabs.contrats'),
                conseils: t('learn.tabs.conseils'),
                scenarios: t('learn.tabs.scenarios') || 'Pratique'
              }[o]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Onglet Règles ──────────────────── */}
        {onglet === 'regles' && (
          <View>
            <InfoBadgesRow variante={variante} t={t} />
            {(t(`variants.${variante.id}.regles`) as string[]).map((regle, i) => (
              <View key={i} style={styles.regleRow}>
                <View style={styles.regleNumBadge}>
                  <Text style={styles.regleNum}>{i + 1}</Text>
                </View>
                <Text style={styles.regleTexte}>{regle}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Onglet Contrats ────────────────── */}
        {onglet === 'contrats' && (
          <View style={styles.contratsListe}>
            {variante.contrats.filter(c => c.id !== 'passe').map(c => (
              <View key={c.id} style={styles.contratCard}>
                <View style={styles.contratCardHeader}>
                  <Text style={styles.contratCardNom}>{t(`variants.${variante.id}.contrats.${c.id}.nom`)}</Text>
                  <View style={styles.contratPts}>
                    <Text style={styles.contratPtsVal}>+{c.pointsReussite}</Text>
                    <Text style={styles.contratPtsLabel}> {t('learn.points')}</Text>
                  </View>
                </View>
                <Text style={styles.contratCardDesc}>
                  {t(`variants.${variante.id}.contrats.${c.id}.description`)}
                </Text>
                <View style={styles.contratMeta}>
                  <MetaTag label={`${t('learn.objective')} : ${c.plisMin === 0 ? `0 ${t('learn.trick')}` : `${c.plisMin} ${t('learn.tricks')}`}`} />
                  {c.seul && <MetaTag label={t('learn.playsSolo')} color={Colors.warning} />}
                  {c.partenaire && <MetaTag label={t('learn.withPartner')} color={Colors.info} />}
                  {c.sanAtout && <MetaTag label={t('learn.noTrump')} />}
                  {c.cartesVisibles && <MetaTag label={t('learn.visibleCards')} color={Colors.cardRed} />}
                  <MetaTag label={`${t('learn.failure')} : −${c.pointsEchec} ${t('learn.points')}`} color={Colors.cardRed} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Onglet Conseils ────────────────── */}
        {onglet === 'conseils' && (
          <View>
            {getConseils(variante.id).map((conseil, i) => (
              <View key={i} style={styles.conseilCard}>
                <Text style={styles.conseilIcon}>{conseil.icon}</Text>
                <View style={styles.conseilTextes}>
                  <Text style={styles.conseilTitre}>{conseil.titre}</Text>
                  <Text style={styles.conseilDesc}>{conseil.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Onglet Scénarios ────────────────── */}
        {onglet === 'scenarios' && (
          <View style={styles.scenariosListe}>
            <Text style={styles.sectionSousTitre}>
              Parties prédéfinies pour s'entraîner aux annonces
            </Text>
            {scenariosFiltrés.map(scenario => (
              <TouchableOpacity
                key={scenario.id}
                style={styles.scenarioCard}
                onPress={() => {
                  chargerScenario(scenario);
                  router.replace(`/game/${scenario.varianteId}`);
                }}
              >
                <View style={styles.scenarioHeader}>
                  <Text style={styles.scenarioTitre}>{scenario.titre}</Text>
                  <Text style={styles.scenarioGo}>Lancer →</Text>
                </View>
                <Text style={styles.scenarioDesc}>{scenario.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Bouton jouer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnJouer} onPress={handleJouer}>
          <Text style={styles.btnJouerTexte}>
            {t('learn.btnJouer').replace('%{nom}', t(`variants.${variante.id}.nom`))}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// ─── Sous-composants ───────────────────────────

const MetaTag: React.FC<{ label: string; color?: string }> = ({
  label, color = Colors.textMuted,
}) => (
  <View style={[metaStyles.tag, { borderColor: color + '44' }]}>
    <Text style={[metaStyles.tagTexte, { color }]}>{label}</Text>
  </View>
);
const metaStyles = StyleSheet.create({
  tag: {
    borderRadius: Radius.full,
    borderWidth: 0.5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: 'transparent',
  },
  tagTexte: { fontSize: 10, fontWeight: FontWeight.medium },
});

const InfoBadgesRow: React.FC<{ variante: any; t: any }> = ({ variante, t }) => (
  <View style={infoStyles.row}>
    {[
      { label: t('learn.joueurs'), val: variante.nbJoueurs },
      { label: t('learn.atout'), val: variante.atoutChoisi ? t('learn.atoutChoisi') : t('learn.atoutAleatoire') },
      { label: t('learn.equipe'), val: variante.equipeFixe ? t('learn.equipeFixe') : t('learn.equipeVariable') },
      { label: t('learn.joker'), val: variante.avecJoker ? t('learn.oui') : t('learn.non') },
    ].map(item => (
      <View key={item.label} style={infoStyles.badge}>
        <Text style={infoStyles.badgeLabel}>{item.label}</Text>
        <Text style={infoStyles.badgeVal}>{item.val}</Text>
      </View>
    ))}
  </View>
);
const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  badge: {
    flex: 1,
    minWidth: 70,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 0.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  badgeLabel: { fontSize: 10, color: Colors.textMuted },
  badgeVal: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginTop: 2 },
});

// ─── Conseils par variante ─────────────────────

function getConseils(id: string) {
  const BASE = [
    { icon: '♠', titre: 'Gérez vos atouts', desc: 'Ne coupez que si vous ne pouvez pas suivre. Gardez vos atouts pour les moments décisifs.' },
    { icon: '♥', titre: 'Observez les cartes', desc: 'Mémorisez les cartes jouées, surtout les As et les atouts. Ça change radicalement la stratégie.' },
    { icon: '♦', titre: 'Entamez les longues couleurs', desc: 'Une couleur longue génère souvent des plis supplémentaires une fois les cartes adverses épuisées.' },
    { icon: '♣', titre: 'Soutenez votre partenaire', desc: 'Si votre partenaire mène avec une forte carte, défaussez-vous d\'une petite carte — ne gaspillez pas de honneurs.' },
  ];

  const SPECIFIQUES: Record<string, typeof BASE> = {
    'whist-gand': [
      { icon: '🎯', titre: 'Évaluez avant d\'enchérir', desc: 'Comptez vos As, rois et longueurs d\'atout. Une demande requiert environ 12 points de force (A=3, R=2, D=1.5, V=1).' },
      { icon: '🤫', titre: 'Le partenaire secret', desc: 'Ne révélez pas l\'As partenaire trop tôt si ce n\'est pas nécessaire. Mais jouez-le dès que ça aide votre camp.' },
      { icon: '🎲', titre: 'La misère est risquée', desc: 'Ne la tentez que si vos 13 cartes sont toutes petites. Une seule mauvaise carte peut tout faire rater.' },
    ],
    'boston-whist': [
      { icon: '🎩', titre: 'Pensez individuel', desc: 'Aucune équipe fixe : chaque pli remporté par un adversaire vous coûte. Jouez pour vous, pas contre un seul adversaire.' },
      { icon: '⚡', titre: 'Piccolo = piège', desc: 'Faire exactement 1 pli est très difficile. Assurez-vous d\'avoir une carte isolée qui prendra exactement un pli.' },
    ],
    'bid-whist': [
      { icon: '🃏', titre: 'Le Kitty change tout', desc: 'Récupérer les 6 cartes cachées peut transformer une main médiocre. Enchérissez légèrement plus haut si vous pensez que le Kitty peut compléter votre jeu.' },
      { icon: '🔄', titre: 'Mode descendant', desc: 'En descendant, le 2 est la carte la plus forte ! Réapprenez complètement l\'ordre de force avant de jouer ce mode.' },
    ],
  };

  return [...(SPECIFIQUES[id] ?? []), ...BASE];
}

// ─── Styles ────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  erreur: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  erreurTexte: { color: Colors.textMuted, fontSize: FontSize.md },

  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerNom: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    lineHeight: 18,
  },

  onglets: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  onglet: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  ongletActif: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primary,
  },
  ongletTexte: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  ongletTexteActif: {
    color: Colors.primaryLight,
  },

  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },

  regleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  regleNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  regleNum: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.primaryLight,
  },
  regleTexte: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  contratsListe: { gap: Spacing.sm },
  contratCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  contratCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  contratCardNom: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  contratPts: { flexDirection: 'row', alignItems: 'baseline' },
  contratPtsVal: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  contratPtsLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  contratCardDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  contratMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },

  conseilCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 0.5,
    borderColor: Colors.border,
    alignItems: 'flex-start',
  },
  conseilIcon: { fontSize: 22, marginTop: 2 },
  conseilTextes: { flex: 1 },
  conseilTitre: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  conseilDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 18,
  },

  // Scénarios
  scenariosListe: { gap: Spacing.sm },
  sectionSousTitre: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  scenarioCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scenarioTitre: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  scenarioGo: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  scenarioDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  footer: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    padding: Spacing.md,
  },
  btnJouer: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  btnJouerTexte: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: '#fff',
  },
});
