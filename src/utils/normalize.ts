import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const baseWidth = 375;

export const normalize = (size: number) => {
  const currentWidth = SCREEN_WIDTH > 0 ? SCREEN_WIDTH : baseWidth;
  const scale = currentWidth / baseWidth;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};
