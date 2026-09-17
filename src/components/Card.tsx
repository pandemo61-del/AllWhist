import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Carte, Couleur } from '../engine/types';
import { LABEL_VALEUR, estRouge } from '../engine/deck';
import { Colors, CardSize, Shadows, normalize } from '../constants/theme';

const SYM: Record<string, any> = {
  [Couleur.COEUR]: require('../../assets/coeur.png'),
  [Couleur.CARREAU]: require('../../assets/carreau.png'),
  [Couleur.TREFLE]: require('../../assets/trefle.png'),
  [Couleur.PIQUE]: require('../../assets/pique.png'),
};

export const CardFace: React.FC<any> = ({ carte, selectionne, jouable = true, onPress, taille = 'normal' }) => {
  const isTable = taille === 'table';
  const dim = isTable ? CardSize.table : (taille === 'mini' ? CardSize.mini : CardSize.hand);
  const isRed = estRouge(carte.couleur);
  const color = isRed ? Colors.cardRed : Colors.cardBlue;
  const label = carte.estJoker ? 'J' : LABEL_VALEUR[carte.valeur];

  const content = (
    <View style={[styles.card, { width: dim.width, height: dim.height }, selectionne && styles.sel, !jouable && { opacity: 0.4 }]}>
      {/* Top Left: Value + Suit icon below */}
      <View style={styles.topContainer}>
        <Text style={[styles.val, { color, fontSize: Math.floor(dim.width * 0.35) }]}>{label}</Text>
        <Image source={SYM[carte.couleur]} style={{ width: dim.width * 0.22, height: dim.width * 0.22, marginTop: -2 }} resizeMode="contain" />
      </View>

      {/* Center: Large Suit Image */}
      <View style={styles.center}>
        <Image source={SYM[carte.couleur]} style={{ width: dim.width * 0.55, height: dim.width * 0.55 }} resizeMode="contain" />
      </View>

      {/* Bottom Right: Value + Suit icon (inverted) */}
      <View style={styles.bottomContainer}>
        <Image source={SYM[carte.couleur]} style={{ width: dim.width * 0.22, height: dim.width * 0.22, marginBottom: -2 }} resizeMode="contain" />
        <Text style={[styles.val, { color, fontSize: Math.floor(dim.width * 0.35), transform: [{ rotate: '180deg' }] }]}>{label}</Text>
      </View>
    </View>
  );

  return onPress ? (
    <TouchableOpacity onPress={() => onPress(carte)} disabled={!jouable} activeOpacity={0.9} style={selectionne ? { transform: [{ translateY: -15 }] } : null}>
      {content}
    </TouchableOpacity>
  ) : content;
};

export const CardBack: React.FC<any> = ({ style }) => (
  <View style={[styles.card, { backgroundColor: '#f0f4f7', width: CardSize.hand.width, height: CardSize.hand.height }, style]}>
    <Image source={require('../../assets/allwhist_icon_512x512.png')} style={{ width: '100%', height: '100%', opacity: 1.0 }} resizeMode="contain" />
  </View>
);

export const HandBack: React.FC<any> = ({ nbCartes, orientation }) => {
  const maxCards = Math.min(nbCartes, 6);
  const isVertical = orientation === 'vertical';

  return (
    <View style={{
      flexDirection: isVertical ? 'column' : 'row',
      height: isVertical ? normalize(140) : normalize(80),
      width: isVertical ? normalize(80) : normalize(140),
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {Array.from({ length: maxCards }).map((_, i) => {
        const mid = (maxCards - 1) / 2;
        const offset = i - mid;

        const rotate = `${offset * 10}deg`;
        const arcTranslation = Math.abs(offset) * 4;

        const style: any = isVertical ? {
          marginTop: i ? -normalize(60) : 0,
          transform: [
            { translateX: offset * 4 },
            { rotate: rotate }
          ]
        } : {
          marginLeft: i ? -normalize(40) : 0,
          transform: [
            { translateY: -arcTranslation },
            { rotate: rotate }
          ]
        };

        return <CardBack key={i} style={[style, { zIndex: i }]} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: '#ccc', padding: 2, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, overflow: 'hidden' },
  sel: { borderColor: '#1D9E75', borderWidth: 2.5 },
  topContainer: { alignItems: 'flex-start', paddingLeft: 1, paddingTop: 1 },
  bottomContainer: { position: 'absolute', bottom: 1, right: 1, alignItems: 'flex-end' },
  val: { fontWeight: '900', textAlign: 'left', letterSpacing: -1 },
  center: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center', zIndex: -1 },
});
