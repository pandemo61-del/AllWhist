// ─────────────────────────────────────────────
//  COMPOSANT — Panneau d'enchères
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal,
} from 'react-native';
import { Carte, Couleur, ContratJoue } from '../engine/types';
import { ContratConfig, VariantConfig } from '../variants/types';
import { SYMBOLE, estRouge } from '../engine/deck';
import { choisirEnchere } from '../ai/SimpleAI';
import { useSettingsStore } from '../store/settingsStore';
import {
  Colors, Spacing, FontSize, FontWeight, Radius,
} from '../constants/theme';

// ─── Props ─────────────────────────────────────

interface BidPanelProps {
  variante: VariantConfig;
  meilleureEnchere: ContratJoue | null;
  joueurEnCours: string;   // nom
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
  onEnchere,
  onPasse,
  main,
  modeApprentissage = false,
}) => {
  const [contratSel, setContratSel] = useState<ContratConfig | null>(null);
  const [atoutSel, setAtoutSel] = useState<Couleur | null>(null);
  const [asPartenaireSel, setAsPartenaireSel] = useState<Carte | null>(null);
  const [etape, setEtape] = useState<'contrat' | 'atout' | 'as'>('contrat');

  const ordreCouleurs = useSettingsStore(s => s.ordreCouleurs);

  // Recommendation IA pour l'apprentissage
  const recommendation = React.useMemo(() => {
    if (!modeApprentissage) return null;
    return choisirEnchere(main, variante, meilleureEnchere as any, 'expert', ordreCouleurs);
  }, [main, variante, meilleureEnchere, modeApprentissage, ordreCouleurs]);

  // Détection du Trou (3 As) ou Trou Royal (4 As) - Obligatoire au Whist de Gand
  const forceTrou = React.useMemo(() => {
    if (variante.id !== 'whist-gand') return null;
    const nbAs = main.filter(c => c.valeur === 14).length;
    const currentPriorite = meilleureEnchere?.priorite ?? -1;

    // Le Trou n'est obligatoire que si personne n'a dit mieux
    if (nbAs === 3 && currentPriorite < 2) return 'trou';
    if (nbAs === 4 && currentPriorite < 3) return 'trou_royal';
    return null;
  }, [main, variante, meilleureEnchere]);

  // Contrats disponibles (priorité > enchère actuelle)
  const contratsDisponibles = variante.contrats.filter(c => {
    if (c.id === 'passe') return false;

    // Si on a 3 ou 4 As, on ne peut choisir QUE le Trou correspondant
    if (forceTrou) {
      return c.id === forceTrou;
    }

    return c.priorite > (meilleureEnchere?.priorite ?? -1);
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

    if (contrat.sanAtout) {
      // Misère → pas d'atout, aller directement à l'As si nécessaire
      setEtape(contrat.partenaire ? 'as' : 'contrat');
    } else if (variante.atoutChoisi && !contrat.sanAtout) {
      setEtape('atout');
    }
  };

  const handleConfirmer = () => {
    if (!contratSel) return;

    // Pour le Trou, l'atout est la couleur de l'As demandé
    let atoutFinal = atoutSel;
    if ((contratSel.id === 'trou' || contratSel.id === 'trou_royal') && asPartenaireSel) {
      atoutFinal = asPartenaireSel.couleur;
    }

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
    if (contratSel?.id === 'trou_royal') {
      // Pour Trou Royal, on cherche le Roi de Cœur par défaut
      const roiCoeurInMain = main.find(c => c.valeur === 13 && c.couleur === Couleur.COEUR);
      if (roiCoeurInMain) return [];
      return [{ couleur: Couleur.COEUR, carte: { id: `13_${Couleur.COEUR}`, valeur: 13 as any, couleur: Couleur.COEUR }, label: 'Roi' }];
    }

    // Sinon (Demande / Trou), on cherche les As manquants
    return [Couleur.PIQUE, Couleur.COEUR, Couleur.CARREAU, Couleur.TREFLE].flatMap(col => {
      const asInMain = main.find(c => c.valeur === 14 && c.couleur === col);
      if (asInMain) return [];
      return [{ couleur: col, carte: { id: `14_${col}`, valeur: 14 as any, couleur: col }, label: 'As' }];
    });
  }, [main, contratSel]);

  return (
    <View style={styles.container}>

      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.titre}>Enchères</Text>
        <Text style={styles.sousTitre}>
          {meilleureEnchere
            ? `Meilleure enchère : ${
                variante.contrats.find(c => c.id === meilleureEnchere.id)?.nom ?? '—'
              }`
            : 'Aucune enchère — soyez le premier'}
        </Text>
      </View>

      {/* Recommendation Apprentissage */}
      {modeApprentissage && recommendation && (
        <View style={styles.recommendationBox}>
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
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Étape 1 : Choix du contrat ─────────── */}
        <Text style={styles.sectionLabel}>Choisir un contrat</Text>
        {contratsDisponibles.map(contrat => (
          <TouchableOpacity
            key={contrat.id}
            style={[styles.contratBtn, contratSel?.id === contrat.id && styles.contratBtnSel]}
            onPress={() => handleSelContrat(contrat)}
            activeOpacity={0.8}
          >
            <View style={styles.contratInfo}>
              <Text style={styles.contratNom}>{contrat.nom}</Text>
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
        ))}

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

        {/* ── Boutons d'action ────────────────────── */}
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

          <TouchableOpacity
            style={[styles.btnPasse, forceTrou && styles.btnDisabled]}
            onPress={onPasse}
            disabled={!!forceTrou}
          >
            <Text style={styles.btnPasseTexte}>
              {forceTrou ? "Trou Obligatoire" : "Passer"}
            </Text>
          </TouchableOpacity>
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
    backgroundColor: Colors.bg,
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
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
  mainContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.lg,
    paddingVertical: 0,
    marginBottom: 0,
  },

  recommendationBox: {
    backgroundColor: '#fff9c4',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#fbc02d',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  btnAppliquer: {
    backgroundColor: '#fbc02d',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  btnAppliquerTexte: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#bc5100',
  },
  recommendationTitre: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#bc5100',
    marginBottom: 4,
  },
  recommendationTexte: {
    fontSize: FontSize.xs,
    color: '#5d4037',
    lineHeight: 16,
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
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  contratBtnSel: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.bgSurface,
  },
  contratInfo: {
    flex: 1,
  },
  contratNom: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  contratDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 3,
    lineHeight: 16,
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
