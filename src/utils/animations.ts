// ─────────────────────────────────────────────
//  Utilitaires d'animations modernes
// ─────────────────────────────────────────────

import { Animated, EasingFunction, Easing } from 'react-native';

/**
 * Animation d'apparition progressive (fade in)
 */
export const fadeIn = (duration = 300): any => {
  const anim = new Animated.Value(0);
  Animated.timing(anim, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }).start();
  return {
    opacity: anim,
    stop: () => anim.setValue(0),
  };
};

/**
 * Animation de disparition progressive (fade out)
 */
export const fadeOut = (duration = 300): any => {
  const anim = new Animated.Value(1);
  Animated.timing(anim, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  }).start();
  return {
    opacity: anim,
    stop: () => anim.setValue(1),
  };
};

/**
 * Animation du ressort (spring) — élastique et fluide
 */
export const springPop = (
  fromScale = 0.8,
  tension = 40,
  friction = 8
): any => {
  const anim = new Animated.Value(fromScale);
  Animated.spring(anim, {
    toValue: 1,
    tension,
    friction,
    useNativeDriver: true,
  }).start();
  return { scale: anim };
};

/**
 * Animation de glissement avec accélération (slide + bounce)
 */
export const slideInFromBottom = (
  distance = 80,
  duration = 400
): any => {
  const anim = new Animated.Value(distance);
  const opacityAnim = new Animated.Value(0);

  Animated.parallel([
    Animated.timing(anim, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: duration * 0.6,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
  ]).start();

  return {
    translateY: anim,
    opacity: opacityAnim,
  };
};

/**
 * Animation de rotation fluide
 */
export const spin = (duration = 1000, repeat = true): any => {
  const anim = new Animated.Value(0);

  const startSpin = () => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && repeat) startSpin();
    });
  };

  startSpin();

  return {
    rotate: anim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    }),
  };
};

/**
 * Animation pulse (pulsation)
 */
export const pulse = (minOpacity = 0.5, duration = 1000): any => {
  const anim = new Animated.Value(1);

  const startPulse = () => {
    Animated.sequence([
      Animated.timing(anim, {
        toValue: minOpacity,
        duration: duration / 2,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: duration / 2,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) startPulse();
    });
  };

  startPulse();
  return { opacity: anim };
};

/**
 * Animation de shake (secousse)
 */
export const shake = (intensity = 10, duration = 500): any => {
  const anim = new Animated.Value(0);

  Animated.timing(anim, {
    toValue: 1,
    duration,
    easing: Easing.linear,
    useNativeDriver: true,
  }).start();

  return {
    translateX: anim.interpolate({
      inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      outputRange: [0, -intensity, intensity, -intensity, intensity, -intensity, intensity, -intensity, intensity, -intensity, 0],
    }),
  };
};

/**
 * Animation d'entrée avec elastic bounce
 */
export const elasticBounce = (): any => {
  const anim = new Animated.Value(0);

  Animated.spring(anim, {
    toValue: 1,
    bounciness: 8,
    speed: 12,
    useNativeDriver: true,
  }).start();

  return { scale: anim };
};

/**
 * Animation de flip (retournement) 3D
 */
export const flip3D = (duration = 600): any => {
  const anim = new Animated.Value(0);

  Animated.timing(anim, {
    toValue: 1,
    duration,
    easing: Easing.inOut(Easing.cubic),
    useNativeDriver: true,
  }).start();

  return {
    rotateY: anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['0deg', '90deg', '180deg'],
    }),
    perspective: 1000,
  };
};

/**
 * Animation complexe : Carte qui apparaît et monte
 */
export const cardAppear = (delay = 0): any => {
  const opacityAnim = new Animated.Value(0);
  const translateYAnim = new Animated.Value(30);
  const scaleAnim = new Animated.Value(0.9);

  setTimeout(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, delay);

  return {
    opacity: opacityAnim,
    translateY: translateYAnim,
    scale: scaleAnim,
  };
};

/**
 * Animation de transition d'écran : slide + fade
 */
export const screenTransition = (fromRight = true, duration = 400): any => {
  const anim = new Animated.Value(fromRight ? 1 : -1);
  const opacityAnim = new Animated.Value(0);

  Animated.parallel([
    Animated.timing(anim, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: duration * 0.7,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
  ]).start();

  return {
    translateX: anim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [-300, 0, 300],
    }),
    opacity: opacityAnim,
  };
};

/**
 * Crée un contrôleur d'animation réutilisable
 */
export const createAnimatedValue = (initialValue = 0) => {
  return new Animated.Value(initialValue);
};

/**
 * Interpole une valeur animée
 */
export const interpolate = (
  animatedValue: Animated.Value,
  inputRange: number[],
  outputRange: (string | number)[],
) => {
  return animatedValue.interpolate({
    inputRange,
    outputRange,
  });
};

/**
 * Animation de parallaxe (scroll)
 */
export const parallaxScroll = (scrollY: Animated.Value, multiplier = 0.5): any => {
  return {
    translateY: Animated.multiply(scrollY, multiplier),
  };
};

export default {
  fadeIn,
  fadeOut,
  springPop,
  slideInFromBottom,
  spin,
  pulse,
  shake,
  elasticBounce,
  flip3D,
  cardAppear,
  screenTransition,
  createAnimatedValue,
  interpolate,
  parallaxScroll,
};

