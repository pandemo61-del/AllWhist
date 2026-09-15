import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Carte, Couleur } from '../engine/types';
import { LABEL_VALEUR, estRouge } from '../engine/deck';
import { Colors, CardSize, Shadows } from '../constants/theme';

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
    </View>
  );

  return onPress ? (
    <TouchableOpacity onPress={() => onPress(carte)} disabled={!jouable} activeOpacity={0.9} style={selectionne ? { transform: [{ translateY: -15 }] } : null}>
      {content}
    </TouchableOpacity>
  ) : content;
};

export const CardBack: React.FC<any> = ({ style }) => (
  <View style={[styles.card, { backgroundColor: '#f0f4f7', width: 34, height: 46 }, style]}>
    <Image source={require('../../assets/allwhist_icon_512x512.png')} style={{ width: '100%', height: '100%', opacity: 1.0 }} resizeMode="contain" />
  </View>
);

export const HandBack: React.FC<any> = ({ nbCartes, orientation }) => (
  <View style={{ flexDirection: orientation === 'vertical' ? 'column' : 'row', height: orientation === 'vertical' ? 100 : 'auto', alignItems: 'center' }}>
    {Array.from({ length: Math.min(nbCartes, 6) }).map((_, i) => (
      <CardBack key={i} style={orientation === 'vertical' ? { marginTop: i ? -35 : 0 } : { marginLeft: i ? -25 : 0 }} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: '#ccc', padding: 2, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, overflow: 'hidden' },
  sel: { borderColor: '#1D9E75', borderWidth: 2.5 },
  topContainer: { alignItems: 'flex-start', paddingLeft: 1, paddingTop: 1 },
  val: { fontWeight: '900', textAlign: 'left', letterSpacing: -1 },
  center: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center', zIndex: -1 },
});
