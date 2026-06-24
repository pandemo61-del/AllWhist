// ─────────────────────────────────────────────
//  Configuration des transitions modernes
// ─────────────────────────────────────────────

import { StackNavigationOptions } from '@react-navigation/stack';
import { Easing } from 'react-native';

/**
 * Types de transitions disponibles
 */
export const TRANSITIONS = {
  /**
   * Transition fluide avec fade + slide
   */
  fadeSlide: {
    transitionSpec: {
      open: {
        animation: 'timing' as const,
        config: {
          duration: 400,
          easing: Easing.out(Easing.cubic),
        },
      },
      close: {
        animation: 'timing' as const,
        config: {
          duration: 300,
          easing: Easing.in(Easing.cubic),
        },
      },
    },
    cardStyleInterpolator: ({ current, layouts }: any) => {
      return {
        cardStyle: {
          opacity: current.progress,
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0],
              }),
            },
          ],
        },
        overlayStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5],
          }),
        },
      };
    },
  } as StackNavigationOptions,

  /**
   * Transition fade simple
   */
  fade: {
    transitionSpec: {
      open: {
        animation: 'timing' as const,
        config: {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        },
      },
      close: {
        animation: 'timing' as const,
        config: {
          duration: 200,
          easing: Easing.in(Easing.cubic),
        },
      },
    },
    cardStyleInterpolator: ({ current }: any) => {
      return {
        cardStyle: {
          opacity: current.progress,
        },
      };
    },
  } as StackNavigationOptions,

  /**
   * Transition avec scale + fade (pop)
   */
  scalePopIn: {
    transitionSpec: {
      open: {
        animation: 'timing' as const,
        config: {
          duration: 350,
          easing: Easing.out(Easing.cubic),
        },
      },
      close: {
        animation: 'timing' as const,
        config: {
          duration: 250,
          easing: Easing.in(Easing.cubic),
        },
      },
    },
    cardStyleInterpolator: ({ current, layouts }: any) => {
      return {
        cardStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
          transform: [
            {
              scale: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1],
              }),
            },
          ],
        },
      };
    },
  } as StackNavigationOptions,

  /**
   * Transition du bas vers le haut (modal)
   */
  modalSlideUp: {
    transitionSpec: {
      open: {
        animation: 'timing' as const,
        config: {
          duration: 400,
          easing: Easing.out(Easing.cubic),
        },
      },
      close: {
        animation: 'timing' as const,
        config: {
          duration: 300,
          easing: Easing.in(Easing.cubic),
        },
      },
    },
    cardStyleInterpolator: ({ current, layouts }: any) => {
      return {
        cardStyle: {
          transform: [
            {
              translateY: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.height, 0],
              }),
            },
          ],
        },
      };
    },
  } as StackNavigationOptions,
};

export default TRANSITIONS;

