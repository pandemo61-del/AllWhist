import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { CardBack } from './Card';
import { useGameStore } from '../store/gameStore';

const { width: SW, height: SH } = Dimensions.get('window');

/**
 * Schémas de distribution officiels par variante.
 */
const PATTERNS: Record<string, number[]> = {
  'whist-gand': [4, 3, 3, 3],
  'solo-whist': [4, 3, 3, 3],
  'boston-whist': [4, 3, 3, 3],
  'bid-whist': [4, 3, 3, 3],
  'whist-classique': [4, 3, 3, 3],
};

export const DistributionAnimation: React.FC<{ onCardLanded: (playerId: number) => void }> = ({ onCardLanded }) => {
  const { finaliserDistribution, donneur, varianteId } = useGameStore();
  const [cards, setCards] = useState<any[]>([]);
  const [deckCount, setDeckCount] = useState(52);

  const targets = [
    { x: 0, y: SH * 0.35 },   // Sud (Humain)
    { x: -SW * 0.38, y: 0 },  // Ouest
    { x: 0, y: -SH * 0.35 },  // Nord
    { x: SW * 0.38, y: 0 },   // Est
  ];

  const startPos = targets[donneur];
  const pattern = PATTERNS[varianteId] || [4, 3, 3, 3];
  const timers = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    let cardCount = 0;
    let currentDelay = 0;
    const newCards: any[] = [];

    // Vitesse adaptée pour les paquets
    const cardInterval = 50;   // Temps entre cartes d'un même paquet
    const playerPause = 100;   // Pause entre deux joueurs
    const roundPause = 250;    // Pause entre deux tours de table

    pattern.forEach((batchSize) => {
      for (let p = 0; p < 4; p++) {
        const targetPlayerId = (donneur + 1 + p) % 4;
        const targetPos = targets[targetPlayerId];

        for (let b = 0; b < batchSize; b++) {
          const delay = currentDelay;
          newCards.push({
            id: cardCount,
            start: startPos,
            target: targetPos,
            targetPlayerId,
            delay,
            indexInBatch: b,
          });

          // Diminuer le paquet visuel au moment où la carte part
          const t = setTimeout(() => {
            setDeckCount(prev => prev - 1);
          }, delay);
          timers.current.push(t);

          cardCount++;
          currentDelay += cardInterval;
        }
        currentDelay += playerPause;
      }
      currentDelay += roundPause;
    });

    setCards(newCards);

    const totalDuration = currentDelay + 800;
    const finalTimer = setTimeout(finaliserDistribution, totalDuration);
    timers.current.push(finalTimer);

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [varianteId, donneur]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Affichage du paquet chez le donneur */}
      <DeckVisual pos={startPos} count={deckCount} />

      {cards.map((c) => (
        <SingleMovingCard
          key={c.id}
          start={c.start}
          target={c.target}
          targetPlayerId={c.targetPlayerId}
          delay={c.delay}
          indexInBatch={c.indexInBatch}
          onLanded={onCardLanded}
        />
      ))}
    </View>
  );
};

const DeckVisual = ({ pos, count }: { pos: { x: number, y: number }, count: number }) => {
  if (count <= 0) return null;
  // On affiche quelques cartes empilées pour donner un effet de volume
  const visibleStacks = Math.min(Math.ceil(count / 4), 10);

  return (
    <View style={[
      styles.deckContainer,
      {
        transform: [
          { translateX: pos.x },
          { translateY: pos.y },
          { scale: 1.6 } // Grosses cartes chez le donneur
        ]
      }
    ]}>
      {Array.from({ length: visibleStacks }).map((_, i) => (
        <View key={i} style={[
          styles.deckCard,
          {
            left: -17 + (i * 0.4),
            top: -23 - (i * 0.4),
            zIndex: 100 + i
          }
        ]}>
          <CardBack />
        </View>
      ))}
    </View>
  );
};

const SingleMovingCard = ({ start, target, targetPlayerId, delay, indexInBatch, onLanded }: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 650, // Animation fluide
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        onLanded(targetPlayerId);
      });
    }, delay);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [start.x, target.x],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [start.y, target.y],
  });

  // DIMINUTION DE LA TAILLE : Commence à 1.6 (taille paquet) et finit à 0.6 (taille main)
  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.6, 0.6],
  });

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', (indexInBatch * 4 - 6) + 'deg'],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.05, 0.9, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View style={[
      styles.card,
      {
        transform: [
          { translateX },
          { translateY },
          { rotate },
          { scale }
        ],
        opacity
      }
    ]}>
      <CardBack />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -17,
    marginTop: -23,
    zIndex: 200,
  },
  deckContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 150,
  },
  deckCard: {
    position: 'absolute',
  }
});
