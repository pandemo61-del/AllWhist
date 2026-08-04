import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, Modal,
} from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../constants/theme';
import { useTranslation } from '../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WelcomeOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const steps = [
    {
      icon: '🃏',
      title: t('onboarding.step1Title'),
      subtitle: t('onboarding.step1Sub'),
    },
    {
      icon: '🌍',
      title: t('onboarding.step2Title'),
      subtitle: t('onboarding.step2Sub'),
    },
    {
      icon: '🎓',
      title: t('onboarding.step3Title'),
      subtitle: t('onboarding.step3Sub'),
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setStep(step + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <Text style={styles.icon}>{steps[step].icon}</Text>
            <Text style={styles.title}>{steps[step].title}</Text>
            <Text style={styles.subtitle}>{steps[step].subtitle}</Text>
          </Animated.View>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, step === i && styles.dotActive]}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleNext}>
              <Text style={styles.btnTexte}>
                {step === steps.length - 1 ? t('onboarding.btnStart') : t('onboarding.btnNext')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.bg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  content: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 20,
  },
  btn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    width: '100%',
    alignItems: 'center',
  },
  btnTexte: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
