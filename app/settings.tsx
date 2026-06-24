import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSettingsStore, DirectionTri, OrdreValeur, Langue } from '../src/store/settingsStore';
import { useGameStore } from '../src/store/gameStore';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../src/constants/theme';
import { Couleur } from '../src/engine/types';
import { SYMBOLE } from '../src/engine/deck';
import { useTranslation } from '../src/i18n';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const {
    directionTri, setDirectionTri,
    ordreValeur, setOrdreValeur,
    ordreCouleurs, setOrdreCouleurs,
    autoJeu, setAutoJeu,
    langue, setLangue,
  } = useSettingsStore();

  const { appliquerTriParametres } = useGameStore();

  const handleToggleDirection = (dir: DirectionTri) => {
    setDirectionTri(dir);
    appliquerTriParametres();
  };

  const handleToggleValeur = (val: OrdreValeur) => {
    setOrdreValeur(val);
    appliquerTriParametres();
  };

  const handleToggleSuitOrder = () => {
    // Rotation simple pour l'exemple ou toggle entre deux ordres courants
    const nouveaux = [...ordreCouleurs].reverse();
    setOrdreCouleurs(nouveaux as any);
    appliquerTriParametres();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnTexte}>←</Text>
        </TouchableOpacity>
        <Text style={styles.titre}>{t('common.settings') || 'Paramètres'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.section}>
          <Text style={styles.sectionTitre}>{t('settings.language') || 'Langue'}</Text>
          <View style={styles.langGrid}>
            {(['fr', 'en', 'nl', 'de', 'es', 'pt'] as Langue[]).map(l => (
              <TouchableOpacity
                key={l}
                style={[styles.langBtn, langue === l && styles.btnActive]}
                onPress={() => setLangue(l)}
              >
                <Text style={[styles.btnTexte, langue === l && styles.btnTexteActive]}>
                  {l.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitre}>{t('settings.cardSorting') || 'Tri des cartes'}</Text>

          <View style={styles.option}>
            <Text style={styles.optionLabel}>{t('settings.sortDirection') || 'Direction de tri'}</Text>
            <View style={styles.btnGroup}>
              <TouchableOpacity
                style={[styles.btn, directionTri === 'gauche_droite' && styles.btnActive]}
                onPress={() => handleToggleDirection('gauche_droite')}
              >
                <Text style={[styles.btnTexte, directionTri === 'gauche_droite' && styles.btnTexteActive]}>G → D</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, directionTri === 'droite_gauche' && styles.btnActive]}
                onPress={() => handleToggleDirection('droite_gauche')}
              >
                <Text style={[styles.btnTexte, directionTri === 'droite_gauche' && styles.btnTexteActive]}>D → G</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.option}>
            <Text style={styles.optionLabel}>{t('settings.valueOrder') || 'Ordre des valeurs'}</Text>
            <View style={styles.btnGroup}>
              <TouchableOpacity
                style={[styles.btn, ordreValeur === 'croissant' && styles.btnActive]}
                onPress={() => handleToggleValeur('croissant')}
              >
                <Text style={[styles.btnTexte, ordreValeur === 'croissant' && styles.btnTexteActive]}>2 → As</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, ordreValeur === 'decroissant' && styles.btnActive]}
                onPress={() => handleToggleValeur('decroissant')}
              >
                <Text style={[styles.btnTexte, ordreValeur === 'decroissant' && styles.btnTexteActive]}>As → 2</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.option}>
            <Text style={styles.optionLabel}>{t('settings.suitOrder') || 'Ordre des couleurs'}</Text>
            <TouchableOpacity style={styles.suitOrderBtn} onPress={handleToggleSuitOrder}>
              <Text style={styles.suitOrderTexte}>
                {ordreCouleurs.map(c => SYMBOLE[c]).join(' ')}
              </Text>
              <Text style={styles.smallAction}>{t('common.change') || 'Changer'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.option}>
            <Text style={styles.optionLabel}>{t('settings.autoPlay') || 'Jeu automatique'}</Text>
            <View style={styles.btnGroup}>
              <TouchableOpacity
                style={[styles.btn, autoJeu === true && styles.btnActive]}
                onPress={() => setAutoJeu(true)}
              >
                <Text style={[styles.btnTexte, autoJeu === true && styles.btnTexteActive]}>{t('common.yes') || 'Oui'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, autoJeu === false && styles.btnActive]}
                onPress={() => setAutoJeu(false)}
              >
                <Text style={[styles.btnTexte, autoJeu === false && styles.btnTexteActive]}>{t('common.no') || 'Non'}</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    paddingRight: Spacing.md,
  },
  backBtnTexte: {
    fontSize: FontSize.xl,
    color: Colors.primary,
  },
  titre: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitre: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  optionLabel: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  btnGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.sm,
    padding: 2,
  },
  btn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  btnActive: {
    backgroundColor: Colors.primary,
  },
  btnTexte: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  btnTexteActive: {
    color: '#fff',
    fontWeight: FontWeight.semibold,
  },
  suitOrderBtn: {
    alignItems: 'flex-end',
  },
  suitOrderTexte: {
    fontSize: FontSize.lg,
    color: Colors.primary,
    letterSpacing: 2,
  },
  smallAction: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  langBtn: {
    flex: 1,
    minWidth: '28%',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgSurface,
  },
});
