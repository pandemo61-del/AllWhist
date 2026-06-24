// ─────────────────────────────────────────────
//  COMPOSANT — Panneau d'enchères
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal,
} from 'react-native';
import { Carte, Couleur } from '../engine/types';
import { ContratConfig, VariantConfig } from '../variants/types';
import { SYMBOLE, estRouge } from '../engine/deck';
import { choisirEnchere } from '../ai/SimpleAI';
import { Hand } from './Hand';
import {
  Colors, Spacing, FontSize, FontWeight, Radius,
} from '../constants/theme';

// ─── Props ─────────────────────────────────────

interface BidPanelProps {
  variante: VariantConfig;
  meilleureEnchere: { id: string; priorite: number } | null;
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

  // Recommendation IA pour l'apprentissage
  const recommendation = React.useMemo(() => {
    if (!modeApprentissage) return null;
    return choisirEnchere(main, variante, meilleureEnchere as any, 'expert');
  }, [main, variante, meilleureEnchere, modeApprentissage]);

  // Contrats disponibles (priorité > enchère actuelle)
  const contratsDisponibles = variante.contrats.filter(c =>
    c.id !== 'passe' &&
    c.priorite > (meilleureEnchere?.priorite ?? -1),
  );

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
    onEnchere(contratSel.id, atoutSel ?? undefined, asPartenaireSel ?? undefined);
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

  // As disponibles pour la Demande (As que le joueur ne possède pas)
  const asDisponibles: { couleur: Couleur; carte: Carte }[] = [
    Couleur.PIQUE, Couleur.COEUR, Couleur.CARREAU, Couleur.TREFLE,
  ].flatMap(col => {
    const asInMain = main.find(c => c.valeur === 14 && c.couleur === col);
    if (asInMain) return []; // on ne peut pas désigner son propre As
    return [{ couleur: col, carte: { id: `14_${col}`, valeur: 14 as any, couleur: col } }];
  });

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

      {/* ── Main du joueur (pour décider) ─────── */}
      <View style={styles.mainContainer}>
        <Hand
          cartes={main}
          cartesJouables={[]}
          onJouerCarte={() => {}}
          phase="encheres"
        />
      </View>

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
              {[Couleur.PIQUE, Couleur.COEUR, Couleur.CARREAU, Couleur.TREFLE].map(col => (
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

        {/* ── Étape 3 : Choisir l'As (Demande) ───── */}
        {contratSel?.partenaire && asDisponibles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Désigner l'As partenaire</Text>
            <Text style={styles.asInfo}>
              Le porteur de cet As sera votre partenaire secret.
            </Text>
            <View style={styles.atoutRow}>
              {asDisponibles.map(({ couleur, carte }) => (
                <TouchableOpacity
                  key={couleur}
                  style={[styles.atoutBtn, asPartenaireSel?.couleur === couleur && styles.atoutBtnSel]}
                  onPress={() => setAsPartenaireSel(carte)}
                >
                  <Text style={[
                    styles.atoutSym,
                    estRouge(couleur) ? styles.symRouge : styles.symNoir,
                  ]}>
                    A{SYMBOLE[couleur]}
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

          <TouchableOpacity style={styles.btnPasse} onPress={onPasse}>
            <Text style={styles.btnPasseTexte}>Passer</Text>
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
