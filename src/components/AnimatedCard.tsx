// ─────────────────────────────────────────────
//  Animation des cartes de jeu - Effets modernes
// ─────────────────────────────────────────────

import React, { ReactNode } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Wrapper animé pour les cartes jouées à la table
 */
export const AnimatedCardContainer: React.FC<{
  children: ReactNode;
  isWinning?: boolean;
}> = ({ children, isWinning }) => {
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Apparition avec bounce et rotation légère
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim, rotateAnim]);

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [
          { scale: scaleAnim },
          {
            rotate: rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['-10deg', '0deg'],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Wrapper pour les cartes gagnantes avec pulsation
 */
export const WinningCardContainer: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const glowAnim = React.useRef(new Animated.Value(0)).current;
  const bounceAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const startGlowAndBounce = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.sine),
            useNativeDriver: false, // Pas disponible pour shadowOpacity
          }),
          Animated.spring(bounceAnim, {
            toValue: 1,
            tension: 30,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1500),
      ]).start(({ finished }) => {
        if (finished) {
          glowAnim.setValue(0);
          bounceAnim.setValue(0);
          startGlowAndBounce();
        }
      });
    };
    startGlowAndBounce();
  }, [glowAnim, bounceAnim]);

  return (
    <Animated.View
      style={{
        transform: [
          {
            scale: bounceAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 1.1, 1],
            }),
          },
        ],
        // Glow effect optionnel
        shadowOpacity: glowAnim,
      }}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Wrapper pour cartes qui disparaissent vers le centre
 */
export const CardDisappearAnimation: React.FC<{
  children: ReactNode;
  targetX?: number;
  targetY?: number;
}> = ({ children, targetX = 0, targetY = 0 }) => {
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const moveX = React.useRef(new Animated.Value(0)).current;
  const moveY = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.delay(2000), // Attendre que le pli soit complètement joué
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(moveX, {
          toValue: targetX,
          duration: 400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(moveY, {
          toValue: targetY,
          duration: 400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 400,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, moveX, moveY, scaleAnim, targetX, targetY]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateX: moveX },
          { translateY: moveY },
          { scale: scaleAnim },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Wrapper pour particules/effets de célébration
 */
export const CelebrationParticle: React.FC<{
  children: ReactNode;
  duration?: number;
}> = ({ children, duration = 600 }) => {
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(floatAnim, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 2,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: duration / 2,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [floatAnim, rotateAnim, scaleAnim, duration]);

  return (
    <Animated.View
      style={{
        opacity: floatAnim.interpolate({
          inputRange: [0, 0.8, 1],
          outputRange: [1, 1, 0],
        }),
        transform: [
          {
            translateY: floatAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -100],
            }),
          },
          {
            rotate: rotateAnim.interpolate({
              inputRange: [0, 2],
              outputRange: ['0deg', '720deg'],
            }),
          },
          { scale: scaleAnim },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

export default {
  AnimatedCardContainer,
  WinningCardContainer,
  CardDisappearAnimation,
  CelebrationParticle,
};

