// ─────────────────────────────────────────────
//  COMPOSANT — Panneau d'enchères
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Vibration,
} from 'react-native';
import { Carte, Couleur, ContratJoue, Joueur } from '../engine/types';
import { ContratConfig, VariantConfig } from '../variants/types';
import { SYMBOLE, estRouge } from '../engine/deck';
import { choisirEnchere } from '../ai/SimpleAI';
import { useSettingsStore } from '../store/settingsStore';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../i18n';
import {
  Colors, Spacing, FontSize, FontWeight, Radius,
} from '../constants/theme';

// ─── Props ─────────────────────────────────────

interface BidPanelProps {
  variante: VariantConfig;
  meilleureEnchere: ContratJoue | null;
  joueurEnCours: string;   // nom
  joueurs: Joueur[];       // pour afficher le nom du meilleur encherisseur
  onEnchere: (contratId: string, atout?: Couleur, asPartenaire?: Carte) => void;
  onPasse: () => void;
  main: Carte[];           // main du joueur humain (pour choisir l'As partenaire)
  modeApprentissage?: boolean;
}

// ─── Composant ─────────────────────────────────

export const BidPanel: React.FC<BidPanelProps> = ({
  variante,
  meilleureEnchere,
  joueurEnCours,
  joueurs,
  onEnchere,
  onPasse,
  main,
  modeApprentissage = false,
}) => {
  const [contratSel, setContratSel] = useState<ContratConfig | null>(null);
  const [atoutSel, setAtoutSel] = useState<Couleur | null>(null);
  const [asPartenaireSel, setAsPartenaireSel] = useState<Carte | null>(null);
  const [etape, setEtape] = useState<'contrat' | 'atout' | 'as'>('contrat');
  const [coachUnlocked, setCoachUnlocked] = useState(false);

  const { ordreCouleurs, coachCredits, useCoachCredit } = useSettingsStore();
  const { t } = useTranslation();
  const estScenario = useGameStore(s => s.estScenario);
  const scenarioActuel = useGameStore(s => s.scenarioActuel);

  // Pré-sélection de l'annonce cible du scénario
  React.useEffect(() => {
    if (estScenario && scenarioActuel?.contratId && !contratSel) {
      const target = variante.contrats.find(c => c.id === scenarioActuel.contratId);
      if (target) {
        setContratSel(target);
      }
    }
  }, [estScenario, scenarioActuel, variante, contratSel]);

  // Recommendation IA pour l'apprentissage
  const recommendation = React.useMemo(() => {
    if (!modeApprentissage) return null;
    return choisirEnchere(main, variante, meilleureEnchere as any, 'expert', 0, ordreCouleurs);
  }, [main, variante, meilleureEnchere, modeApprentissage, ordreCouleurs]);

  const handleUnlockCoach = () => {
    if (useCoachCredit()) {
      setCoachUnlocked(true);
      if (useSettingsStore.getState().vibration) Vibration.vibrate(30);
    }
  };

  // Détection du Trou (3 As) ou Trou Royal (4 As) - Obligatoire au Whist de Gand
  const forceTrou = React.useMemo(() => {
    if (variante.id !== 'whist-gand') return null;
    const nbAs = main.filter(c => c.valeur === 14).length;
    const currentPriorite = meilleureEnchere?.priorite ?? -1;

    // Le Trou n'est obligatoire que si personne n'a dit mieux
    if (nbAs === 3 && currentPriorite < 7) return 'trou';
    if (nbAs === 4 && currentPriorite < 7.5) return 'trou_royal';
    return null;
  }, [main, variante, meilleureEnchere]);

  // Est-on le partenaire d'un Trou annoncé ?
  const peutBoucher = React.useMemo(() => {
    if (variante.id !== 'whist-gand' || !meilleureEnchere) return false;
    if (meilleureEnchere.id !== 'trou' && meilleureEnchere.id !== 'trou_royal') return false;

    const targetAce = meilleureEnchere.asPartenaire;
    if (!targetAce) return false;

    return main.some(c => c.valeur === targetAce.valeur && c.couleur === targetAce.couleur);
  }, [main, variante, meilleureEnchere]);

  // Contrats disponibles
  const contratsDisponibles = variante.contrats.filter(c => {
    if (c.id === 'passe') return false;

    const currentPrio = meilleureEnchere?.priorite ?? -1;

    // "Je propose" est disponible si aucune enchère n'a été faite (priorité -1 ou 0)
    if (c.id === 'propose') {
      return currentPrio <= 0;
    }

    // "J'emballe" est disponible uniquement si la meilleure enchère est "Je propose"
    if (c.id === 'emballe') {
      return meilleureEnchere?.id === 'propose';
    }

    // Si on a 3 ou 4 As, on est forcé de proposer un Trou
    if (forceTrou) {
      return c.id === forceTrou || c.id === 'propose';
    }

    // Vérifier si le contrat est disponible selon la main
    if (c.disponibleSi && !c.disponibleSi(main, meilleureEnchere as any, 0)) {
      return false;
    }

    return c.priorite > currentPrio;
  });

  // Si on est forcé de jouer Trou, on sélectionne le contrat immédiatement
  React.useEffect(() => {
    if (forceTrou && !contratSel) {
      const c = variante.contrats.find(v => v.id === forceTrou);
      if (c) {
        setContratSel(c);
        setEtape('as'); // Aller directement au choix de l'As partenaire
      }
    }
  }, [forceTrou, contratSel, variante]);

  const handleSelContrat = (contrat: ContratConfig) => {
    setContratSel(contrat);
    setAtoutSel(null);
    setAsPartenaireSel(null);

    if (contrat.id === 'propose' || contrat.id === 'emballe') {
      // Proposition/Emballage : Choix de l'atout puis validation (pas d'As)
      setEtape('atout');
    } else if (contrat.sanAtout) {
      // Misère → pas d'atout, aller directement à l'As si nécessaire
      setEtape(contrat.partenaire ? 'as' : 'contrat');
    } else if (variante.atoutChoisi && !contrat.sanAtout) {
      setEtape('atout');
    }
  };

  const handleConfirmer = () => {
    if (!contratSel) return;
    const { vibration } = useSettingsStore.getState();

    // Pour le Trou, l'atout est la couleur de l'As demandé
    let atoutFinal = atoutSel;
    if ((contratSel.id === 'trou' || contratSel.id === 'trou_royal') && asPartenaireSel) {
      atoutFinal = asPartenaireSel.couleur;
    }

    if (vibration) Vibration.vibrate(40);
    onEnchere(contratSel.id, atoutFinal ?? undefined, asPartenaireSel ?? undefined);

    // Reset
    setContratSel(null);
    setAtoutSel(null);
    setAsPartenaireSel(null);
    setEtape('contrat');
  };

  // Peut-on confirmer ?
  const peutConfirmer =
    contratSel !== null &&
    (contratSel.sanAtout || !variante.atoutChoisi || atoutSel !== null) &&
    (!contratSel.partenaire || asPartenaireSel !== null);

  // Cartes disponibles pour désigner le partenaire (As ou Roi de Cœur pour Trou Royal)
  const cartesPartenairesDisponibles = React.useMemo(() => {
    // Si le contrat ne demande pas de partenaire via un As, on n'affiche rien
    if (!contratSel?.partenaire) return [];

    if (contratSel.id === 'trou_royal') {
      // Pour Trou Royal, on cherche le Roi de Cœur par défaut
      const roiCoeurInMain = main.find(c => c.valeur === 13 && c.couleur === Couleur.COEUR);
      if (roiCoeurInMain) return [];
      return [{ couleur: Couleur.COEUR, carte: { id: `13_${Couleur.COEUR}`, valeur: 13 as any, couleur: Couleur.COEUR }, label: 'Roi' }];
    }

    // Sinon (Demande / Trou), on cherche les As manquants dans l'ordre Cœur, Carreau, Trèfle, Pique
    return [Couleur.COEUR, Couleur.CARREAU, Couleur.TREFLE, Couleur.PIQUE].flatMap(col => {
      const asInMain = main.find(c => c.valeur === 14 && c.couleur === col);
      if (asInMain) return [];
      return [{ couleur: col, carte: { id: `14_${col}`, valeur: 14 as any, couleur: col }, label: 'As' }];
    });
  }, [main, contratSel]);

  // Récupérer le nom du joueur qui a fait la meilleure enchère
  const meilleurEncherisseur = React.useMemo(() => {
    if (!meilleureEnchere) return null;
    return joueurs.find(j => j.id === meilleureEnchere.joueurId)?.nom ?? '—';
  }, [meilleureEnchere, joueurs]);

  return (
    <View style={styles.container}>

      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.titre}>Enchères</Text>
          <View style={styles.tourBadge}>
            <Text style={styles.tourTexte}>Tour de : {joueurEnCours}</Text>
          </View>
        </View>

        {meilleureEnchere ? (
          <View style={styles.currentBidBox}>
            <Text style={styles.currentBidLabel}>Meilleure enchère actuelle :</Text>
            <View style={styles.bidBadge}>
              <Text style={styles.bidPlayer}>{meilleurEncherisseur}</Text>
              <Text style={styles.bidAction}>
                {meilleureEnchere.id === 'propose' ? 'propose' :
                 meilleureEnchere.id === 'emballe' ? 'emballe' :
                 'annonce'}
              </Text>
              <Text style={styles.bidValue}>
                {/* Pour Propose/Emballe, on n'affiche que l'atout pour éviter la répétition (ex: Marc propose à Coeur) */}
                {meilleureEnchere.id === 'propose' || meilleureEnchere.id === 'emballe'
                  ? (meilleureEnchere.atout ? ` à ${SYMBOLE[meilleureEnchere.atout]}` : '')
                  : `${meilleureEnchere.nom}${meilleureEnchere.atout ? ` à ${SYMBOLE[meilleureEnchere.atout]}` : ''}`
                }
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.sousTitre}>Aucune enchère — soyez le premier</Text>
        )}
      </View>

      {/* Recommendation Apprentissage */}
      {modeApprentissage && recommendation && (
        <View style={styles.recommendationBox}>
          {!coachUnlocked ? (
            <View style={styles.lockedCoach}>
              <View style={styles.coachHeader}>
                <Text style={styles.recommendationTitre}>💡 {t('settings.coachCredits') || 'Avis du coach'}</Text>
                <View style={styles.creditBadge}>
                  <Text style={styles.creditText}>{coachCredits} 🪙</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.btnUnlock, coachCredits <= 0 && styles.btnDisabled]}
                onPress={handleUnlockCoach}
                disabled={coachCredits <= 0}
              >
                <Text style={styles.btnUnlockTexte}>Demander l'avis (1 🪙)</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.recommendationHeader}>
                <Text style={styles.recommendationTitre}>💡 Conseil de l'expert</Text>
                {recommendation.action !== 'passe' && (
                  <TouchableOpacity
                    style={styles.btnAppliquer}
                    onPress={() => onEnchere(recommendation.contratId!, recommendation.atout, recommendation.asPartenaire ? { id: recommendation.asPartenaire, valeur: 14 as any, couleur: recommendation.asPartenaire.split('_')[1] as any } : undefined)}
                  >
                    <Text style={styles.btnAppliquerTexte}>Appliquer</Text>
                  </TouchableOpacity>
                )}
                {recommendation.action === 'passe' && (
                  <TouchableOpacity style={styles.btnAppliquer} onPress={onPasse}>
                    <Text style={styles.btnAppliquerTexte}>Passer</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.recommendationTexte}>
                {recommendation.action === 'passe'
                  ? "Votre main est un peu faible pour cette enchère. Je vous conseille de passer."
                  : `Je vous suggère d'annoncer "${
                      variante.contrats.find(c => c.id === recommendation.contratId)?.nom
                    }"${recommendation.atout ? ` à ${SYMBOLE[recommendation.atout]}` : ""}. Vous avez une main solide pour ce contrat.`
                }
              </Text>
            </>
          )}
        </View>
      )}

      {/* Bannière Scénario */}
      {estScenario && scenarioActuel && (
        <View style={styles.scenarioBanner}>
          <Text style={styles.scenarioBannerTitre}>🎯 Scénario : {scenarioActuel.titre}</Text>
          <Text style={styles.scenarioBannerSub}>
            Main configurée pour tester l'annonce « {
              variante.contrats.find(c => c.id === scenarioActuel.contratId)?.nom || scenarioActuel.contratId || 'Cible'
            } »
          </Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Étape 1 : Choix du contrat ─────────── */}
        <Text style={styles.sectionLabel}>Choisir un contrat</Text>
        {contratsDisponibles.map(contrat => {
          const estCibleScenario = estScenario && scenarioActuel?.contratId === contrat.id;

          return (
            <TouchableOpacity
              key={contrat.id}
              style={[
                styles.contratBtn,
                contratSel?.id === contrat.id && styles.contratBtnSel,
                estCibleScenario && styles.contratBtnTargetScenario,
              ]}
              onPress={() => handleSelContrat(contrat)}
              activeOpacity={0.8}
            >
              <View style={styles.contratInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.contratNom}>{contrat.nom}</Text>
                  {estCibleScenario && (
                    <View style={styles.badgeCibleScenario}>
                      <Text style={styles.badgeCibleScenarioTexte}>⭐ Jouer l'annonce</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.contratDesc}>{contrat.description}</Text>
                {(contrat.sanAtout || contrat.cartesVisibles) && (
                  <View style={styles.tagsRow}>
                    {contrat.sanAtout && (
                      <View style={styles.tag}><Text style={styles.tagTexte}>Sans atout</Text></View>
                    )}
                    {contrat.cartesVisibles && (
                      <View style={styles.tag}><Text style={styles.tagTexte}>Cartes visibles</Text></View>
                    )}
                  </View>
                )}
              </View>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsVal}>+{contrat.pointsReussite}</Text>
                <Text style={styles.pointsLabel}>pts</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* ── Étape 2 : Choix de l'atout ─────────── */}
        {contratSel && !contratSel.sanAtout && variante.atoutChoisi && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Choisir l'atout</Text>
            <View style={styles.atoutRow}>
              {ordreCouleurs.map(col => (
                <TouchableOpacity
                  key={col}
                  style={[styles.atoutBtn, atoutSel === col && styles.atoutBtnSel]}
                  onPress={() => setAtoutSel(col)}
                >
                  <Text style={[
                    styles.atoutSym,
                    estRouge(col) ? styles.symRouge : styles.symNoir,
                  ]}>
                    {SYMBOLE[col]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Étape 3 : Choisir l'As (Demande/Trou) ───── */}
        {contratSel?.partenaire && cartesPartenairesDisponibles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Désigner {contratSel.id === 'trou_royal' ? "le Roi" : "l'As"} partenaire
            </Text>
            <Text style={styles.asInfo}>
              Le porteur de cette carte sera votre partenaire secret.
            </Text>
            <View style={styles.atoutRow}>
              {cartesPartenairesDisponibles.map(({ couleur, carte, label }) => (
                <TouchableOpacity
                  key={couleur}
                  style={[styles.atoutBtn, asPartenaireSel?.id === carte.id && styles.atoutBtnSel]}
                  onPress={() => setAsPartenaireSel(carte)}
                >
                  <Text style={[
                    styles.atoutSym,
                    estRouge(couleur) ? styles.symRouge : styles.symNoir,
                  ]}>
                    {label[0]}{SYMBOLE[couleur]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Bouton Passer (même look que les autres) */}
        <TouchableOpacity
          style={[
            styles.contratBtn,
            forceTrou && styles.btnDisabled,
            peutBoucher && { borderColor: Colors.primary, backgroundColor: '#f0fcf9' }
          ]}
          onPress={() => {
            if (useSettingsStore.getState().vibration) Vibration.vibrate(20);
            onPasse();
          }}
          disabled={!!forceTrou}
        >
          <View style={styles.contratInfo}>
            <Text style={[styles.contratNom, peutBoucher && { color: Colors.primary }]}>
              {forceTrou ? "Trou Obligatoire" : (peutBoucher ? "Je bouche (Accepter)" : "Passer")}
            </Text>
            <Text style={styles.contratDesc}>
              {forceTrou ? "Vous devez annoncer le Trou." : "Je ne joue pas ce coup."}
            </Text>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={[styles.pointsVal, { color: Colors.textMuted }]}>0</Text>
            <Text style={styles.pointsLabel}>pts</Text>
          </View>
        </TouchableOpacity>

        {/* ── Boutons d'action (Confirmation seulement) ── */}
        <View style={styles.actions}>
          {contratSel && (
            <TouchableOpacity
              style={[styles.btnPrimaire, !peutConfirmer && styles.btnDisabled]}
              onPress={handleConfirmer}
              disabled={!peutConfirmer}
            >
              <Text style={styles.btnPrimaireTexte}>
                Annoncer {contratSel.nom}
                {atoutSel && !contratSel.sanAtout ? ` à ${SYMBOLE[atoutSel]}` : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Historique enchères ─────────────────── */}
        {/* Peut être ajouté ici ultérieurement */}

      </ScrollView>
    </View>
  );
};

// ─── Overlay enchère IA ────────────────────────

interface BidOverlayProps {
  visible: boolean;
  nomJoueur: string;
  contrat: string;
}

export const BidOverlay: React.FC<BidOverlayProps> = ({ visible, nomJoueur, contrat }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.overlayCard}>
        <Text style={styles.overlayNom}>{nomJoueur}</Text>
        <Text style={styles.overlayContrat}>{contrat}</Text>
      </View>
    </View>
  </Modal>
);

// ─── Styles ────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xs,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  titre: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  sousTitre: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  tourBadge: {
    backgroundColor: Colors.info + '22',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 0.5,
    borderColor: Colors.info,
  },
  tourTexte: {
    fontSize: 10,
    color: Colors.info,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  currentBidBox: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.bgCard,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currentBidLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  bidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bidPlayer: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  bidAction: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  bidValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.black,
    color: Colors.primary,
  },
  mainContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.lg,
    paddingVertical: 0,
    marginBottom: 0,
  },

  scenarioBanner: {
    backgroundColor: Colors.primaryDark + '33',
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  scenarioBannerTitre: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primaryLight,
  },
  scenarioBannerSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contratBtnTargetScenario: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    backgroundColor: Colors.primaryDark + '15',
  },
  badgeCibleScenario: {
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeCibleScenarioTexte: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.primaryLight,
  },

  recommendationBox: {
    backgroundColor: '#fffbe6',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#ffe58f',
    // Ombre pédagogique
    shadowColor: '#d48806',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  btnAppliquer: {
    backgroundColor: '#faad14',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  btnAppliquerTexte: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },
  recommendationTitre: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#d48806',
  },
  recommendationTexte: {
    fontSize: FontSize.sm,
    color: '#856404',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  lockedCoach: {
    alignItems: 'center',
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.sm,
  },
  creditBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#ffe58f',
  },
  creditText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d48806',
  },
  btnUnlock: {
    backgroundColor: '#faad14',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 8,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  btnUnlockTexte: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: FontSize.sm,
  },

  sectionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },

  // Boutons contrat
  contratBtn: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    // Ombre douce
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  contratBtnSel: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: '#f0fcf9',
    elevation: 4,
  },
  contratInfo: {
    flex: 1,
  },
  contratNom: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  contratDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tag: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  tagTexte: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  pointsBadge: {
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  pointsVal: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  pointsLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },

  // Atout
  section: {
    marginTop: Spacing.xs,
  },
  atoutRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  atoutBtn: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  atoutBtnSel: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.bgSurface,
  },
  atoutSym: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  symRouge: { color: Colors.cardRed },
  symNoir:  { color: Colors.textPrimary },

  // As partenaire
  asInfo: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },

  // Boutons action
  actions: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  btnPrimaire: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnPrimaireTexte: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: '#fff',
  },
  btnPasse: {
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  btnPasseTexte: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },

  // Overlay IA
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 200,
  },
  overlayNom: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  overlayContrat: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
});
