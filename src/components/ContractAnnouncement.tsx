import React from 'react';
import { View, Text, StyleSheet, Animated, Image, TouchableOpacity } from 'react-native';
import { ContratJoue, Joueur, Couleur } from '../engine/types';
import { useGameStore } from '../store/gameStore';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadows } from '../constants/theme';
import { SYMBOLE } from '../engine/deck';

interface Props {
  contrat: ContratJoue;
  joueurs: Joueur[];
  atout: Couleur | null;
}

const ASSETS_COULEURS: Record<string, any> = {
  [Couleur.COEUR]: require('../../assets/coeur.png'),
  [Couleur.CARREAU]: require('../../assets/carreau.png'),
  [Couleur.TREFLE]: require('../../assets/trefle.png'),
  [Couleur.PIQUE]: require('../../assets/pique.png'),
};

export const ContractAnnouncement: React.FC<Props> = ({ contrat, joueurs, atout }) => {
  const { passerAnnonceContrat } = useGameStore();
  const [showInfo, setShowInfo] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const annonceur = joueurs[contrat.joueurId];
  const partenaire = contrat.partenaireId !== undefined ? joueurs[contrat.partenaireId] : null;

  const explication = React.useMemo(() => {
    const noms = [annonceur.nom];
    if (partenaire) noms.push(partenaire.nom);
    const listeNoms = noms.join(' et ');

    if (contrat.id.startsWith('misere')) {
      return `${listeNoms} ${noms.length > 1 ? 'doivent' : 'doit'} ne faire AUCUN pli pour réussir ce contrat.`;
    }
    return `${listeNoms} ${noms.length > 1 ? 'doivent' : 'doit'} réaliser au moins ${contrat.plisObjectif} plis pour gagner.`;
  }, [contrat, annonceur, partenaire]);

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity style={styles.infoBtn} onPress={() => setShowInfo(!showInfo)}>
          <Text style={styles.infoBtnText}>ⓘ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeBtn} onPress={passerAnnonceContrat}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.label}>CONTRAT FINAL</Text>
        <Text style={styles.nomContrat}>{contrat.nom}</Text>

        {showInfo && (
          <View style={styles.explicationBox}>
            <Text style={styles.explicationTexte}>{explication}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Annonceur :</Text>
          <Text style={styles.infoValue}>{annonceur.nom} {contrat.joueurId === 0 ? '(Vous)' : ''}</Text>
        </View>

        {!contrat.seul && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Partenaire :</Text>
            <Text style={styles.infoValue}>
              {contrat.asPartenaire
                ? `Porteur de l'As de ${SYMBOLE[contrat.asPartenaire.couleur]}`
                : partenaire ? partenaire.nom : 'À révéler'}
            </Text>
          </View>
        )}

        {atout && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Atout :</Text>
            <View style={styles.atoutValue}>
              <Image source={ASSETS_COULEURS[atout]} style={styles.atoutIcon} />
              <Text style={styles.infoValue}>{atout}</Text>
            </View>
          </View>
        )}

        {contrat.sanAtout && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type :</Text>
            <Text style={styles.infoValue}>Sans Atout</Text>
          </View>
        )}

        <View style={styles.badge}>
          <Text style={styles.badgeTexte}>Objectif : {contrat.plisObjectif} plis</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.panel,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 110,
  },
  infoBtn: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 110,
  },
  infoBtnText: {
    fontSize: FontSize.xl,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  closeBtnText: {
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    fontWeight: FontWeight.bold,
  },
  explicationBox: {
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  explicationTexte: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: FontWeight.medium,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  nomContrat: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  infoValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  atoutValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  atoutIcon: {
    width: 16,
    height: 16,
  },
  badge: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  badgeTexte: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  }
});
