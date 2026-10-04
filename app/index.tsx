// ─────────────────────────────────────────────
//  app/index.tsx — Écran d'accueil
// ─────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useGameStore } from '../src/store/gameStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../src/constants/theme';
import { normalize } from '../src/utils/normalize';
import { useTranslation } from '../src/i18n';
import { AdBanner } from '../src/components/Ads';
import { WelcomeOverlay } from '../src/components/WelcomeOverlay';

// ─── Composant MenuItem animé ─────────────

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  isPrimary?: boolean;
  isResume?: boolean;
  iconColor?: string;
  animValue: Animated.Value;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  isPrimary,
  isResume,
  iconColor,
  animValue,
}) => {
  let iconBgColor = styles.iconLearn;
  if (isPrimary) iconBgColor = styles.iconPrimaire;
  else if (isResume) iconBgColor = styles.iconResume;
  else if (iconColor === 'stats') iconBgColor = styles.iconStats;
  else if (iconColor === 'settings') iconBgColor = styles.iconSettings;

  return (
    <Animated.View
      style={{
        opacity: animValue,
        transform: [
          {
            translateX: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [40, 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity
        style={[
          styles.menuItem,
          isPrimary && styles.menuItemPrimaire,
          isResume && styles.menuItemResume,
        ]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={[styles.menuIcon, iconBgColor]}>
          <Text style={styles.menuIconTexte}>{icon}</Text>
        </View>
        <View style={styles.menuTexte}>
          <Text style={[styles.menuTitre, isPrimary && styles.menuTitrePrimaire]}>
            {title}
          </Text>
          <Text style={styles.menuSous}>{subtitle}</Text>
        </View>
        <Text style={styles.menuChevron}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const { t } = useTranslation();
  const [isHydrated, setIsHydrated] = React.useState(false);
  const { phase, varianteId, scores } = useGameStore();
  const { hasSeenOnboarding, setHasSeenOnboarding } = useSettingsStore();
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  useEffect(() => {
    // Attendre que les stores soient chargés du stockage local
    const unsubGame = useGameStore.persist.onFinishHydration(() => {
      checkHydration();
    });
    const unsubSettings = useSettingsStore.persist.onFinishHydration(() => {
      checkHydration();
    });

    const checkHydration = () => {
      if (useGameStore.persist.hasHydrated() && useSettingsStore.persist.hasHydrated()) {
        setIsHydrated(true);
        // Appliquer la récompense quotidienne
        useSettingsStore.getState().checkDailyReward();

        if (!useSettingsStore.getState().hasSeenOnboarding) {
          setShowOnboarding(true);
        }
      }
    };

    checkHydration();

    return () => {
      unsubGame();
      unsubSettings();
    };
  }, []);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  };

  const partieEnCours = isHydrated && phase !== 'idle' && phase !== 'fin_partie';

  // Animations des éléments
  const logoAnim = useRef(new Animated.Value(0)).current;
  const menuAnimations = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Animation du logo
    Animated.timing(logoAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Animation décalée des items de menu
    menuAnimations.forEach((anim, index) => {
      setTimeout(() => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }, index * 80);
    });
  }, [logoAnim, menuAnimations]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.logoZone,
            {
              opacity: logoAnim,
              transform: [
                {
                  translateY: logoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Image
            source={require('../assets/allwhist_icon_512x512.png')}
            style={styles.logoIcon}
          />
          <Text style={styles.logoNom}>AllWhist</Text>
          <Text style={styles.logoTagline}>{t('home.tagline') || 'Toutes les variantes du Whist'}</Text>
        </Animated.View>

        {/* ── Menu principal (Zone flexible) ───────────── */}
        <View style={styles.menu}>

          {/* Nouvelle partie */}
          <MenuItem
            icon="▶"
            title={t('home.newGame') || 'Nouvelle partie'}
            subtitle={t('home.newGameSub') || 'Choisir une variante · 4 joueurs'}
            isPrimary
            onPress={() => router.push('/variantes')}
            animValue={menuAnimations[0]}
          />

          {/* Reprendre (si partie en cours) */}
          {partieEnCours && (
            <MenuItem
              icon="↩"
              title={t('home.resumeGame') || 'Reprendre la partie'}
              subtitle={`${t('home.score') || 'Score'} : ${scores[0]} pts · ${t(`variants.${varianteId}.nom`) || varianteId}`}
              isResume
              onPress={() => router.push(`/game/${varianteId}`)}
              animValue={menuAnimations[1]}
            />
          )}

          {/* Apprendre */}
          <MenuItem
            icon="📖"
            title={t('home.learn') || 'Apprendre'}
            subtitle={t('home.learnSub') || 'Règles · Tutoriels · Contrats'}
            onPress={() => router.push('/variantes?mode=learn')}
            animValue={menuAnimations[partieEnCours ? 2 : 1]}
          />

          {/* Statistiques */}
          <MenuItem
            icon="📊"
            title={t('home.stats') || 'Statistiques'}
            subtitle={t('home.statsSub') || 'Historique · Taux de réussite'}
            iconColor="stats"
            onPress={() => router.push('/stats')}
            animValue={menuAnimations[partieEnCours ? 3 : 2]}
          />

          {/* Paramètres */}
          <MenuItem
            icon="⚙"
            title={t('common.settings') || 'Paramètres'}
            subtitle={t('home.settingsSub') || 'Difficulté IA · Thème · Son'}
            iconColor="settings"
            onPress={() => router.push('/settings')}
            animValue={menuAnimations[partieEnCours ? 4 : 3]}
          />

        </View>
      </ScrollView>

      {/* ── Zone fixe en bas (Pub + Pied de page) ── */}
      <View style={styles.fixedFooter}>
        <AdBanner />
        <Text style={styles.footer}>
          AllWhist v1.1 · 5 {t('home.variantsCount') || 'variantes'}
        </Text>
      </View>

      <WelcomeOverlay
        visible={showOnboarding}
        onClose={handleCloseOnboarding}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },

  // Logo
  logoZone: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
    width: '100%',
  },
  logoIcon: {
    width: 120,
    height: 120,
    borderRadius: Radius.xl,
    marginBottom: Spacing.sm,
  },
  logoSym: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: FontWeight.black,
  },
  logoNom: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  logoTagline: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // Menu
  menu: {
    width: '100%',
    maxWidth: 500,
    gap: Spacing.md,
    justifyContent: 'flex-start',
    marginBottom: Spacing.xxl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: Spacing.md,
    minHeight: 80,
    // Ombre légère
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemPrimaire: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primary,
    elevation: 4,
  },
  menuItemResume: {
    borderColor: Colors.info,
    backgroundColor: '#ebf5ff',
    elevation: 3,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPrimaire:  { backgroundColor: Colors.primary },
  iconResume:    { backgroundColor: Colors.info },
  iconLearn:     { backgroundColor: '#e8f5e9' },
  iconStats:     { backgroundColor: '#f3e5f5' },
  iconSettings:  { backgroundColor: '#eceff1' },
  menuIconTexte: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
  menuTexte: { flex: 1 },
  menuTitre: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  menuTitrePrimaire: {
    color: '#fff',
  },
  menuSous: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  menuChevron: {
    fontSize: 20,
    color: Colors.textMuted,
  },

  fixedFooter: {
    backgroundColor: Colors.bg,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    paddingBottom: Spacing.xs,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    opacity: 0.5,
  },
});
