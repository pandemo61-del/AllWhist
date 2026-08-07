import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { CardBack } from './Card';
import { useGameStore } from '../store/gameStore';

const { width: SW, height: SH } = Dimensions.get('window');

/**
 * Schémas de distribution officiels par variante.
 */
const PATTERNS: Record<string, number[]> = {
  'whist-gand': [3, 3, 3, 3, 1],
  'solo-whist': [3, 3, 3, 3, 1],
  'boston-whist': [4, 4, 5],
  'bid-whist': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  'whist-classique': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};

export const DistributionAnimation: React.FC<{ onCardLanded: (playerId: number) => void }> = ({ onCardLanded }) => {
  const { finaliserDistribution, donneur, varianteId } = useGameStore();
  const [cards, setCards] = useState<any[]>([]);

  const targets = [
    { x: 0, y: SH * 0.35 },   // Sud (Humain)
    { x: -SW * 0.38, y: 0 },  // Ouest
    { x: 0, y: -SH * 0.35 },  // Nord
    { x: SW * 0.38, y: 0 },   // Est
  ];

  const startPos = targets[donneur];
  const pattern = PATTERNS[varianteId] || [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

  useEffect(() => {
    let cardCount = 0;
    let currentDelay = 0;
    const newCards: any[] = [];

    // Vitesse adaptée pour les paquets
    const cardInterval = 60;   // Temps entre cartes d'un même paquet
    const playerPause = 120;   // Pause entre deux joueurs
    const roundPause = 300;    // Pause entre deux tours de table

    pattern.forEach((batchSize) => {
      for (let p = 0; p < 4; p++) {
        const targetPlayerId = (donneur + 1 + p) % 4;
        const targetPos = targets[targetPlayerId];

        for (let b = 0; b < batchSize; b++) {
          newCards.push({
            id: cardCount,
            start: startPos,
            target: targetPos,
            targetPlayerId,
            delay: currentDelay,
            indexInBatch: b,
          });
          cardCount++;
          currentDelay += cardInterval;
        }
        currentDelay += playerPause;
      }
      currentDelay += roundPause;
    });

    setCards(newCards);

    const totalDuration = currentDelay + 800;
    const timer = setTimeout(finaliserDistribution, totalDuration);

    return () => clearTimeout(timer);
  }, [varianteId, donneur]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
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

const SingleMovingCard = ({ start, target, targetPlayerId, delay, indexInBatch, onLanded }: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 750, // Animation plus longue pour apprécier l'effet de vol
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }).start(() => {
        // Trigger callback when animation is done
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

  // EFFET DE MONTÉE ET DESCENTE (Impression de 3D / Grandissant au milieu)
  // La carte commence petite au donneur, grossit au milieu du vol (monte), puis rétrécit (descend)
  const scale = anim.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0.6, 1.6, 0.5], // Monte très haut (1.6) puis descend
  });

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', (indexInBatch * 6 - 12) + 'deg'], // S'étale légèrement dans la main
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.1, 0.85, 1],
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
  }
});
