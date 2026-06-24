// ─────────────────────────────────────────────
//  Hooks personnalisés pour animations
// ─────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Hook pour animation fade-in
 */
export const useFadeIn = (duration = 300) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, duration]);

  return fadeAnim;
};

/**
 * Hook pour animation scale
 */
export const useScaleIn = (fromScale = 0.95, duration = 300) => {
  const scaleAnim = useRef(new Animated.Value(fromScale)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [scaleAnim, duration]);

  return scaleAnim;
};

/**
 * Hook pour animation slide du bas vers le haut
 */
export const useSlideUpIn = (distance = 50, duration = 400) => {
  const slideAnim = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [slideAnim, duration]);

  return slideAnim;
};

/**
 * Hook pour spring animation
 */
export const useSpring = (
  toValue = 1,
  fromValue = 0,
  tension = 40,
  friction = 7
) => {
  const springAnim = useRef(new Animated.Value(fromValue)).current;

  useEffect(() => {
    Animated.spring(springAnim, {
      toValue,
      tension,
      friction,
      useNativeDriver: true,
    }).start();
  }, [springAnim, toValue]);

  return springAnim;
};

/**
 * Hook pour animation de stagger (décalée)
 */
export const useStaggerAnimation = (
  items: number,
  delay = 80,
  duration = 400
) => {
  const animRefs = useRef(Array(items).fill(null).map(() => new Animated.Value(0)))
    .current;

  useEffect(() => {
    animRefs.forEach((anim, index) => {
      setTimeout(() => {
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }, index * delay);
    });
  }, [animRefs, delay, duration]);

  return animRefs;
};

/**
 * Hook pour animation pulse (pulsation)
 */
export const usePulse = (minOpacity = 0.5, duration = 1000) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startPulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: minOpacity,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) startPulse();
      });
    };
    startPulse();
  }, [pulseAnim, duration]);

  return pulseAnim;
};

/**
 * Hook pour animation rotation
 */
export const useRotation = (duration = 1000) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startSpin = () => {
      rotateAnim.setValue(0);
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) startSpin();
      });
    };
    startSpin();
  }, [rotateAnim, duration]);

  return rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
};

/**
 * Hook pour animation de bounce (rebond)
 */
export const useBounce = () => {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(bounceAnim, {
      toValue: 1,
      bounciness: 8,
      speed: 12,
      useNativeDriver: true,
    }).start();
  }, [bounceAnim]);

  return bounceAnim;
};

export default {
  useFadeIn,
  useScaleIn,
  useSlideUpIn,
  useSpring,
  useStaggerAnimation,
  usePulse,
  useRotation,
  useBounce,
};

