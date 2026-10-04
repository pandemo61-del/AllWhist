// ─────────────────────────────────────────────
//  app/stats.tsx — Écran de statistiques
// ─────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useStatsStore } from '../src/store/statsStore';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../src/constants/theme';

export default function StatsScreen() {
  const stats = useStatsStore();
  const router = useRouter();

  const renderStatCard = (label: string, value: string | number, color: string = Colors.primary) => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* --- RÉSUMÉ GLOBAL --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Globale</Text>
          <View style={styles.row}>
            {renderStatCard('Manches', stats.totalManches)}
            {renderStatCard('Chutes (Vous)', stats.totalChutesJoueur, Colors.error)}
            {renderStatCard('Chutes (IA)', stats.totalChutesIA, Colors.warning)}
          </View>
        </View>

        {/* --- COMPARATIF PRÉCISION --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Précision Tactique</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Votre Précision</Text>
              <Text style={styles.progressValue}>{stats.precisionMoyenneJoueur.toFixed(1)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${stats.precisionMoyenneJoueur}%`, backgroundColor: Colors.primary }]} />
            </View>
          </View>

          <View style={[styles.progressContainer, { marginTop: Spacing.md }]}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Précision de l'IA</Text>
              <Text style={styles.progressValue}>{stats.precisionMoyenneIA.toFixed(1)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${stats.precisionMoyenneIA}%`, backgroundColor: Colors.info }]} />
            </View>
          </View>
          <Text style={styles.precisionNote}>
            L'IA progresse avec vous. Plus vous jouez bien, plus elle s'adapte pour rester compétitive.
          </Text>
        </View>

        {/* --- ERREURS FRÉQUENTES --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Points à Améliorer</Text>
          {stats.erreursFrequentesJoueur.length > 0 ? (
            stats.erreursFrequentesJoueur.map((err, i) => (
              <View key={i} style={styles.errorRow}>
                <View style={[styles.errorBullet, { backgroundColor: err.type === 'error' ? Colors.error : Colors.warning }]} />
                <View style={styles.errorContent}>
                  <Text style={styles.errorTitre}>{err.titre}</Text>
                  <Text style={styles.errorCompte}>{err.compte} occurrence{err.compte > 1 ? 's' : ''}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Aucune erreur majeure détectée. Continuez comme ça !</Text>
          )}
        </View>

        <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => stats.resetStats()}
        >
          <Text style={styles.resetBtnText}>Réinitialiser les statistiques</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: Spacing.lg },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
  card: { flex: 1, backgroundColor: Colors.bgCard, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cardLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  cardValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  progressContainer: { width: '100%' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  progressValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  progressBarBg: { height: 10, backgroundColor: Colors.bgSurface, borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },
  precisionNote: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm, fontStyle: 'italic' },

  errorRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, padding: Spacing.sm, borderRadius: Radius.md, marginBottom: Spacing.xs, borderWidth: 1, borderColor: Colors.border },
  errorBullet: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.md },
  errorContent: { flex: 1 },
  errorTitre: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  errorCompte: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.md },

  resetBtn: { marginTop: Spacing.xxl, padding: Spacing.md, alignItems: 'center' },
  resetBtnText: { color: Colors.cardRed, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
