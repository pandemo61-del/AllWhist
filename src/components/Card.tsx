// ─────────────────────────────────────────────
//  COMPOSANT — Carte
// ─────────────────────────────────────────────

import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity, View, Text, StyleSheet, Animated, Image, Easing,
} from 'react-native';
import { Carte, Couleur } from '../engine/types';
import { SYMBOLE, LABEL_VALEUR, estRouge } from '../engine/deck';
import { Colors, CardSize, FontSize, FontWeight, Shadows, Radius } from '../constants/theme';

// ─── Types ─────────────────────────────────────

interface CardProps {
  carte: Carte;
  selectionne?: boolean;
  jouable?: boolean;
  onPress?: (carte: Carte) => void;
  taille?: 'normal' | 'table' | 'mini';
  style?: object;
}

interface CardBackProps {
  orientation?: 'vertical' | 'horizontal';
  taille?: 'normal' | 'mini';
  style?: object;
}

// ─── Carte face ────────────────────────────────

const ASSETS_COULEURS: Record<string, any> = {
  [Couleur.COEUR]: require('../../assets/coeur.png'),
  [Couleur.CARREAU]: require('../../assets/carreau.png'),
  [Couleur.TREFLE]: require('../../assets/trefle.png'),
  [Couleur.PIQUE]: require('../../assets/pique.png'),
};

export const CardFace: React.FC<CardProps> = ({
  carte,
  selectionne = false,
  jouable = true,
  onPress,
  taille = 'normal',
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0.8)).current;

  // Animation d'apparition fluide
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  let dim = CardSize.hand;
  if (taille === 'table') dim = CardSize.table;
  if (taille === 'mini')  dim = CardSize.mini;

  const rouge = estRouge(carte.couleur);
  const couleurTexte = rouge ? Colors.cardRed : Colors.cardBlue;
  const valLabel = carte.estJoker ? 'J' : LABEL_VALEUR[carte.valeur];
  const symImage = !carte.estJoker ? ASSETS_COULEURS[carte.couleur] : null;

  const isMini = taille === 'mini';
  const isTable = taille === 'table';

  // Tailles de police adaptatives
  const fontSizeValeur = isMini ? 14 : (isTable ? 24 : 26);
  const fontSizeSymCorner = isMini ? 10 : (isTable ? 16 : 18);

  const cardStyle = [
    styles.card,
    {
      width: dim.width,
      height: dim.height,
      borderRadius: dim.radius,
      padding: isMini ? 3 : 6,
    },
    selectionne && styles.selectionne,
    !jouable && styles.nonJouable,
    style,
  ];

  const animatedCardStyle = {
    transform: [
      { scale: scaleAnim },
    ],
    opacity: opacityAnim,
  };

  const cardContent = (
    <View style={cardStyle}>
      {/* Coin haut-gauche */}
      <View style={[styles.corner, { gap: isMini ? -4 : -2 }]}>
        <Text style={[styles.valeur, { color: couleurTexte, fontSize: fontSizeValeur, lineHeight: fontSizeValeur }]}>
          {valLabel}
        </Text>
        {taille !== 'table' && (
          symImage ? (
            <Image source={symImage} style={{ width: fontSizeSymCorner, height: fontSizeSymCorner, resizeMode: 'contain' }} />
          ) : (
            <Text style={[styles.symboleCorner, { color: couleurTexte, fontSize: fontSizeSymCorner }]}>★</Text>
          )
        )}
      </View>

      {/* Symbole central */}
      <View style={styles.centerContainer}>
        {symImage ? (
          <Image
            source={symImage}
            style={{ width: isMini ? 18 : 42, height: isMini ? 18 : 42, resizeMode: 'contain' }}
          />
        ) : (
          <Text style={[styles.symboleCentral, { color: couleurTexte, fontSize: isMini ? 24 : 54 }]}>★</Text>
        )}
      </View>

      {/* Coin bas-droit (inversé symétriquement) */}
      <View style={[styles.corner, styles.cornerBas, { gap: isMini ? -4 : -2 }]}>
        {taille !== 'table' && (
          symImage ? (
            <Image source={symImage} style={{ width: fontSizeSymCorner, height: fontSizeSymCorner, resizeMode: 'contain', transform: [{ rotate: '180deg' }] }} />
          ) : (
            <Text style={[styles.symboleCorner, { color: couleurTexte, fontSize: fontSizeSymCorner, transform: [{ rotate: '180deg' }] }]}>★</Text>
          )
        )}
        <Text style={[
          styles.valeur,
          {
            color: couleurTexte,
            fontSize: isTable ? fontSizeValeur : fontSizeValeur * 0.8,
            lineHeight: isTable ? fontSizeValeur : fontSizeValeur * 0.8,
            transform: [{ rotate: '180deg' }]
          }
        ]}>
          {valLabel}
        </Text>
      </View>

      {jouable && !isMini && <View style={styles.jouableIndicateur} />}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={() => onPress(carte)}
        disabled={!jouable}
        activeOpacity={0.85}
        style={selectionne ? styles.selectionneWrapper : undefined}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

// ─── Carte dos ─────────────────────────────────

export const CardBack: React.FC<CardBackProps> = ({
  orientation = 'vertical',
  taille = 'normal',
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const isH = orientation === 'horizontal';
  const dim  = taille === 'mini' ? CardSize.back : CardSize.back;

  return (
    <Animated.View
      style={[
        styles.cardBack,
        {
          width:  isH ? dim.height : dim.width,
          height: isH ? dim.width  : dim.height,
          borderRadius: dim.radius,
          overflow: 'hidden',
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <Image
        source={require('../../assets/allwhist_icon_512x512.png')}
        style={{ width: '100%', height: '100%', opacity: 0.8 }}
      />
    </Animated.View>
  );
};

// ─── Pile de cartes dos (adversaire) ───────────

interface HandBackProps {
  nbCartes: number;
  orientation?: 'horizontal' | 'vertical';
}

export const HandBack: React.FC<HandBackProps> = ({ nbCartes, orientation = 'horizontal' }) => {
  const visible = Math.min(nbCartes, 7);
  return (
    <View style={styles.handBackH}>
      {Array.from({ length: visible }).map((_, i) => (
        <CardBack
          key={i}
          orientation="vertical"
          style={{ marginLeft: i === 0 ? 0 : -20 }}
        />
      ))}
    </View>
  );
};

// ─── Styles ────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#ddd',
    justifyContent: 'space-between',
    padding: 5,
    ...Shadows.card,
  },
  selectionneWrapper: {
    transform: [{ translateY: -12 }],
  },
  selectionne: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  nonJouable: {
    opacity: 0.4,
  },
  corner: {
    alignItems: 'flex-start',
  },
  cornerBas: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  centerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  valeur: {
    fontWeight: FontWeight.black,
  },
  symboleCorner: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.sm,
  },
  symboleCornerImage: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },
  symboleCentral: {
    fontSize: FontSize.cardLg,
    fontWeight: FontWeight.black,
    textAlign: 'center',
    position: 'absolute',
    alignSelf: 'center',
    top: '38%',
    // Effet brillant/glossy inspiré de l'image
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  symboleCentralImage: {
    width: 35,
    height: 35,
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -17.5, // Centrage vertical parfait
    resizeMode: 'contain',
    zIndex: -1, // S'assurer que les coins passent devant si nécessaire
  },
  jouableIndicateur: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    opacity: 0.7,
  },

  // Dos de carte
  cardBack: {
    backgroundColor: Colors.bgCard,
    borderWidth: 0.5,
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackInner: {
    width: '70%',
    height: '70%',
    borderWidth: 0.5,
    borderColor: Colors.borderLight,
    borderRadius: 2,
  },

  handBackH: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  handBackV: {
    flexDirection: 'row', // Changé de column à row pour le landscape sur les côtés
    alignItems: 'center',
  },
});
