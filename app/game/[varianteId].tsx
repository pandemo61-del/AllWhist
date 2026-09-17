// ─────────────────────────────────────────────
//  app/game/[varianteId].tsx — Écran de jeu
// ─────────────────────────────────────────────

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View, StyleSheet,
  TouchableOpacity, Text, Alert, Animated, Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useGameStore } from '../../src/store/gameStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { GameTable }   from '../../src/components/GameTable';
import { Hand }        from '../../src/components/Hand';
import { BidPanel }    from '../../src/components/BidPanel';
import { ContractAnnouncement } from '../../src/components/ContractAnnouncement';
import { PliResultat, MancheResultat } from '../../src/components/ScorePanel';
import { useInterstitialAd, useRewardedInterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { INTERSTITIAL_ID, END_GAME_INTERSTITIAL_ID } from '../../src/components/Ads';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../src/constants/theme';
import { Carte, Couleur } from '../../src/engine/types';
import { getVariante } from '../../src/variants/index';

// Petit composant de barre de progression pour le minuteur
const AnimatedTimer = ({ duration }: { duration: number }) => {
  const widthAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    widthAnim.setValue(100);
    Animated.timing(widthAnim, {
      toValue: 0,
      duration: duration,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [duration]);

  return (
    <View style={timerStyles.track}>
      <Animated.View
        style={[
          timerStyles.bar,
          { width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%']
            })
          }
        ]}
      />
    </View>
  );
};

const timerStyles = StyleSheet.create({
  track: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2,
    marginTop: Spacing.lg,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: Colors.primary,
  }
});

export default function GameScreen() {
  const { varianteId } = useLocalSearchParams<{ varianteId: string }>();

  // Publicité interstitielle de fin de manche
  const { isLoaded, isClosed, load, show } = useInterstitialAd(INTERSTITIAL_ID, {
    requestNonPersonalizedAdsOnly: true,
  });

  // Publicité interstitielle de fin de partie (Victoire finale)
  const {
    isLoaded: isEndGameLoaded,
    isClosed: isEndGameClosed,
    load: loadEndGame,
    show: showEndGame
  } = useRewardedInterstitialAd(END_GAME_INTERSTITIAL_ID, {
    requestNonPersonalizedAdsOnly: true,
  });

  // États pour gérer l'affichage différé des résultats après la pub
  const [resultatsPretsAAfficher, setResultatsPretsAAfficher] = React.useState(false);
  const [prochaineAction, setProchaineAction] = React.useState<'accueil' | 'manche_suivante' | null>(null);

  // Charger les pubs au montage
  useEffect(() => {
    load();
    loadEndGame();
  }, [load, loadEndGame]);

  // Surveiller le passage en fin de manche pour lancer la pub
  const {
    phase, joueurs, pliEnCours, plisTermines, atout,
    contratEnCours, etatEnchere, scores, manche,
    tourDeJoueur, partenaireRévélé, historiqueManches,
    estScenario, notification,
    jouerCarte, ecarterCarte, placerEnchere, passerEnchere, avancerPli, avancerManche, terminerPartie, cartesJouablesHumain
  } = useGameStore();

  useEffect(() => {
    if (phase === 'fin_manche' && !resultatsPretsAAfficher) {
      if (isLoaded) {
        show();
      } else {
        // Si pas chargée, on affiche les résultats direct pour ne pas bloquer
        setResultatsPretsAAfficher(true);
      }
    }
    // Reset de l'état quand on change de manche
    if (phase === 'encheres' || phase === 'jeu') {
      setResultatsPretsAAfficher(false);
    }
  }, [phase, isLoaded, show]);

  // Si la pub est fermée, on exécute l'action prévue
  useEffect(() => {
    if (isClosed || isEndGameClosed) {
      if (prochaineAction === 'accueil') {
        router.replace('/');
      } else if (prochaineAction === 'manche_suivante') {
        avancerManche();
        load();
        setProchaineAction(null);
      } else {
        // Cas normal : on venait juste de finir la manche, on montre les résultats
        setResultatsPretsAAfficher(true);
        load(); // Précharger pour la fin de la prochaine manche
      }
    }
  }, [isClosed, isEndGameClosed, prochaineAction, avancerManche, load]);

  // Récupère la variante (sécurisé)
  const variante = React.useMemo(() => {
    try { return getVariante(varianteId ?? ''); } catch { return null; }
  }, [varianteId]);

  // Quitter la partie
  const handleQuitter = () => {
    router.replace('/');
  };

  const handleJouerCarte = useCallback((carte: Carte) => {
    if (phase === 'ecart') {
      ecarterCarte(carte);
    } else {
      jouerCarte(carte);
    }
  }, [jouerCarte, ecarterCarte, phase]);

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

  // Déterminer si la partie est terminée
  const settings = useSettingsStore.getState();
  const MAX_MANCHES = settings.nbManchesParPartie;
  const partieTerminee = manche >= MAX_MANCHES;

  const handleContinuerApresResultats = () => {
    if (partieTerminee) {
      terminerPartie(); // Marquer comme fini dans le store (le bouton "reprendre" disparaîtra)
      setProchaineAction('accueil');
      if (isEndGameLoaded) {
        showEndGame();
      } else {
        router.replace('/');
      }
    } else {
      avancerManche();
    }
  };

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
            {estScenario ? "Partie pédagogique" : `Manche ${manche} / ${MAX_MANCHES}`}
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

        {/* Phase : Enchères, Distribution ou Jeu */}
        {(phase === 'distribution' || phase === 'encheres' || phase === 'jeu' || phase === 'fin_pli' || phase === 'annonce_contrat' || phase === 'ecart') && (
          <View style={styles.jeuZone}>

            {/* Table (Visible pour toutes les phases actives) */}
            <GameTable
              phase={phase}
              varianteId={varianteId!}
              joueurs={joueurs}
              pliEnCours={pliEnCours}
              atout={atout}
              contrat={contratEnCours}
              tourDeJoueur={tourDeJoueur}
              plisTermines={plisTermines}
              partenaireRévélé={partenaireRévélé}
              scores={scores}
              isBidding={phase === 'encheres'}
              isDiscarding={phase === 'ecart'}
              centerContent={
                (phase === 'encheres' && !notification) ? (
                  <BidPanel
                    variante={variante}
                    meilleureEnchere={etatEnchere.meilleureEnchere as any}
                    joueurEnCours={joueurs[etatEnchere.joueurCourantId]?.nom ?? ''}
                    joueurs={joueurs}
                    onEnchere={handleEnchere}
                    onPasse={passerEnchere}
                    main={joueurs[0]?.main ?? []}
                    modeApprentissage={true}
                  />
                ) : null
              }
            >
              <Hand
                cartes={joueurs[0]?.main ?? []}
                cartesJouables={phase === 'jeu' ? cartesJouablesHumain() : []}
                onJouerCarte={handleJouerCarte}
                phase={
                  phase === 'encheres' ? 'encheres' :
                  phase === 'ecart' ? 'ecart' :
                  (tourDeJoueur === 0 && phase === 'jeu' ? 'jeu' : 'attente')
                }
                cartesVisibles={contratEnCours?.cartesVisibles}
              />
            </GameTable>

            {/* Transition annonce contrat overlay */}
            {phase === 'annonce_contrat' && contratEnCours && (
              <View style={StyleSheet.absoluteFill}>
                <ContractAnnouncement
                  contrat={contratEnCours}
                  joueurs={joueurs}
                  atout={atout}
                />
              </View>
            )}

            {/* Résultat fin de pli */}
            {phase === 'fin_pli' && pliEnCours.gagnantId !== undefined && (
              <PliResultat
                key={pliEnCours.numero}
                gagnantNom={joueurs[pliEnCours.gagnantId]?.nom ?? ''}
                gagnantId={pliEnCours.gagnantId}
                humanId={0}
                onContinuer={avancerPli}
                autoAvance={pliEnCours.gagnantId !== 0}
              />
            )}

            {/* Contrat info overlay (misère ouverte) */}
            {contratEnCours?.cartesVisibles && phase === 'jeu' && (
              <View style={styles.misereOuverte}>
                <Text style={styles.misereOuverteTexte}>
                  Misère ouverte — cartes visibles
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Phase : Fin de manche */}
        {phase === 'fin_manche' && dernierScoreManche && resultatsPretsAAfficher && (
          <MancheResultat
            scoreManche={dernierScoreManche}
            scoresTotal={scores}
            joueurs={joueurs}
            manche={manche}
            onMancheSuivante={handleContinuerApresResultats}
            partieTerminee={partieTerminee}
          />
        )}

        {/* Notification temporaire avec barre de progression */}
        {notification && (
          <View style={styles.notificationOverlay}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitre}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>

              {/* Petit minuteur moderne (barre de progression) */}
              <View style={styles.timerContainer}>
                <AnimatedTimer duration={5000} />
              </View>
            </View>
          </View>
        )}

      </View>

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
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  btnQuitter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgInput,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
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
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  topManche: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  scoresRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  scoreBadge: {
    alignItems: 'center',
    minWidth: 40,
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  scoreNom: {
    fontSize: 8,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  scoreVal: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
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

  // Notification overlay
  notificationOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  notificationContent: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  notificationTitre: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  notificationMessage: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  timerContainer: {
    width: '100%',
    marginTop: Spacing.sm,
  },
});
