// ─────────────────────────────────────────────
//  app/game/[varianteId].tsx — Écran de jeu
// ─────────────────────────────────────────────

import React, { useCallback, useEffect } from 'react';
import {
  View, StyleSheet,
  TouchableOpacity, Text, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useGameStore } from '../../src/store/gameStore';
import { GameTable }   from '../../src/components/GameTable';
import { Hand }        from '../../src/components/Hand';
import { BidPanel }    from '../../src/components/BidPanel';
import { ContractAnnouncement } from '../../src/components/ContractAnnouncement';
import { PliResultat, MancheResultat } from '../../src/components/ScorePanel';
import { AdBanner } from '../../src/components/Ads';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../src/constants/theme';
import { Carte, Couleur } from '../../src/engine/types';
import { getVariante } from '../../src/variants/index';

export default function GameScreen() {
  const { varianteId } = useLocalSearchParams<{ varianteId: string }>();

  const {
    phase,
    joueurs,
    pliEnCours,
    plisTermines,
    atout,
    contratEnCours,
    etatEnchere,
    scores,
    manche,
    tourDeJoueur,
    partenaireRévélé,
    historiqueManches,
    estScenario,
    jouerCarte,
    placerEnchere,
    passerEnchere,
    avancerPli,
    avancerManche,
    cartesJouablesHumain,
  } = useGameStore();

  // Récupère la variante (sécurisé)
  const variante = React.useMemo(() => {
    try { return getVariante(varianteId ?? ''); } catch { return null; }
  }, [varianteId]);

  // Quitter la partie
  const handleQuitter = () => {
    Alert.alert(
      'Quitter la partie',
      'La progression sera perdue.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Quitter', style: 'destructive', onPress: () => router.replace('/') },
      ],
    );
  };

  const handleJouerCarte = useCallback((carte: Carte) => {
    jouerCarte(carte);
  }, [jouerCarte]);

  const handleEnchere = useCallback((id: string, atout?: Couleur, as?: Carte) => {
    placerEnchere(id, atout, as);
  }, [placerEnchere]);

  // Score manche courante
  const dernierScoreManche = historiqueManches[historiqueManches.length - 1];

  if (!variante || joueurs.length === 0) {
    return (
      <View style={styles.centré}>
        <Text style={styles.erreur}>Partie non initialisée.</Text>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.lien}>← Accueil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Déterminer si la partie est terminée (ex: après 13 manches)
  const partieTerminee = manche >= 13;

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Barre du haut ────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleQuitter} style={styles.btnQuitter}>
          <Text style={styles.btnQuitterTexte}>✕</Text>
        </TouchableOpacity>
        <View style={styles.topInfo}>
          <View style={styles.topTitleRow}>
            <Text style={styles.topVariante}>{variante.nom}</Text>
            {estScenario && (
              <View style={styles.badgeEntrainement}>
                <Text style={styles.badgeEntrainementTexte}>Entraînement</Text>
              </View>
            )}
          </View>
          <Text style={styles.topManche}>
            {estScenario ? "Partie pédagogique" : `Manche ${manche} / 13`}
          </Text>
        </View>
        {/* Scores compacts */}
        <View style={styles.scoresRow}>
          {joueurs.map(j => (
            <View key={j.id} style={styles.scoreBadge}>
              <Text style={styles.scoreNom}>{j.id === 0 ? 'Vous' : j.nom.slice(0, 3)}</Text>
              <Text style={[styles.scoreVal, j.id === 0 && styles.scoreValHumain]}>
                {estScenario ? '—' : scores[j.id]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Corps principal ──────────────────── */}
      <View style={styles.corps}>

        {/* Phase : Enchères */}
        {phase === 'encheres' && (
          <BidPanel
            variante={variante}
            meilleureEnchere={etatEnchere.meilleureEnchere as any}
            joueurEnCours={joueurs[etatEnchere.joueurCourantId]?.nom ?? ''}
            onEnchere={handleEnchere}
            onPasse={passerEnchere}
            main={joueurs[0]?.main ?? []}
            modeApprentissage={true}
          />
        )}

        {/* Phase : Transition annonce contrat */}
        {phase === 'annonce_contrat' && contratEnCours && (
          <ContractAnnouncement
            contrat={contratEnCours}
            joueurs={joueurs}
            atout={atout}
          />
        )}

        {/* Phase : Jeu / fin_pli */}
        {(phase === 'jeu' || phase === 'fin_pli') && (
          <View style={styles.jeuZone}>

            {/* Table */}
            <GameTable
              joueurs={joueurs}
              pliEnCours={pliEnCours}
              atout={atout}
              contrat={contratEnCours}
              tourDeJoueur={tourDeJoueur}
              plisTermines={plisTermines}
              partenaireRévélé={partenaireRévélé}
              scores={scores}
            />

            {/* Résultat fin de pli */}
            {phase === 'fin_pli' && pliEnCours.gagnantId !== undefined && (
              <PliResultat
                gagnantNom={joueurs[pliEnCours.gagnantId]?.nom ?? ''}
                gagnantId={pliEnCours.gagnantId}
                humanId={0}
                onContinuer={avancerPli}
                autoAvance={pliEnCours.gagnantId !== 0}
              />
            )}

            {/* Contrat info overlay (misère ouverte) */}
            {contratEnCours?.cartesVisibles && (
              <View style={styles.misereOuverte}>
                <Text style={styles.misereOuverteTexte}>
                  Misère ouverte — cartes visibles
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Phase : Fin de manche */}
        {phase === 'fin_manche' && dernierScoreManche && (
          <MancheResultat
            scoreManche={dernierScoreManche}
            scoresTotal={scores}
            joueurs={joueurs}
            manche={manche}
            onMancheSuivante={partieTerminee ? () => router.replace('/') : avancerManche}
            partieTerminee={partieTerminee}
          />
        )}

      </View>

      {/* Main du joueur humain (Toujours visible pendant le jeu/enchères) */}
      {(phase === 'encheres' || phase === 'jeu' || phase === 'fin_pli' || phase === 'annonce_contrat') && (
        <View style={styles.mainConteneurFixe}>
          <Hand
            cartes={joueurs[0]?.main ?? []}
            cartesJouables={phase === 'jeu' ? cartesJouablesHumain() : []}
            onJouerCarte={handleJouerCarte}
            phase={
              phase === 'encheres' ? 'encheres' :
              (tourDeJoueur === 0 && phase === 'jeu' ? 'jeu' : 'attente')
            }
            cartesVisibles={contratEnCours?.cartesVisibles}
          />
          <AdBanner marginTop={Spacing.sm} />
        </View>
      )}

    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // Barre du haut
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  btnQuitter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  btnQuitterTexte: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  topInfo: { flex: 1 },
  topTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  badgeEntrainement: {
    backgroundColor: Colors.warning + '22',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.sm,
    borderWidth: 0.5,
    borderColor: Colors.warning,
  },
  badgeEntrainementTexte: {
    fontSize: 9,
    color: Colors.warning,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  topVariante: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  topManche: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  scoresRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  scoreBadge: {
    alignItems: 'center',
    minWidth: 36,
  },
  scoreNom: {
    fontSize: 9,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  scoreVal: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  scoreValHumain: {
    color: Colors.primary,
  },

  // Corps
  corps: {
    flex: 1,
  },
  jeuZone: {
    flex: 1,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },

  // Misère ouverte
  misereOuverte: {
    backgroundColor: '#2a1000',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    alignSelf: 'center',
    borderWidth: 0.5,
    borderColor: Colors.warning,
  },
  misereOuverteTexte: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: FontWeight.medium,
  },

  // Fixation de la main
  mainConteneurFixe: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.bg,
  },

  // Erreur
  centré: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    gap: Spacing.lg,
  },
  erreur: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  lien: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
});
