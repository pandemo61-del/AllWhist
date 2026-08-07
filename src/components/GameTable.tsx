// ─────────────────────────────────────────────
//  COMPOSANT — Table de jeu (Version avec Animation Distribution)
// ─────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Carte, Couleur, Pli, ContratJoue, Joueur, CartePosee } from '../engine/types';
import { CardFace, HandBack } from './Card';
import { SYMBOLE } from '../engine/deck';
import { Colors, Shadows } from '../constants/theme';
import { normalize } from '../utils/normalize';
import { useTranslation } from '../i18n';
import { getVariante } from '../variants/index';

import { useGameStore } from '../store/gameStore';
import { DistributionAnimation } from './DistributionAnimation';

const { width: SW } = Dimensions.get('window');

export const GameTable: React.FC<any> = ({
  phase, varianteId, joueurs, pliEnCours, atout, contrat, tourDeJoueur, plisTermines, partenaireRévélé, children, centerContent, isBidding = false,
}) => {
  const [cardsReceived, setCardsReceived] = React.useState<number[]>([0, 0, 0, 0]);

  // Reset counts when distribution starts
  React.useEffect(() => {
    if (phase === 'distribution') {
      setCardsReceived([0, 0, 0, 0]);
    }
  }, [phase]);

  const handleCardLanded = (playerId: number) => {
    setCardsReceived(prev => {
      const next = [...prev];
      next[playerId]++;
      return next;
    });
  };

  const getPlis = (id: number) => plisTermines.filter((p: Pli) => p.gagnantId === id).length;
  const currentVariante = getVariante(varianteId);

  const getEq = (id: number) => {
    if (currentVariante?.equipeFixe) return (id % 2 === 0) ? 'A' : 'B';
    if (!contrat) return undefined;
    const estAnnonceur = id === contrat.joueurId;
    if (contrat.seul) return estAnnonceur ? 'A' : 'B';
    if (estAnnonceur) return 'A';
    if (partenaireRévélé) return (id === contrat.partenaireId) ? 'A' : 'B';
    return undefined;
  };

  const nbPlisEq = contrat ? (
    contrat.seul ? getPlis(contrat.joueurId) : (getPlis(contrat.joueurId) + (contrat.partenaireId !== undefined ? getPlis(contrat.partenaireId) : 0))
  ) : 0;

  const donneurId = useGameStore.getState().donneur;

  return (
    <View style={styles.container}>
      {/* ── Badges fixes en haut ── */}
      {!isBidding && (
        <View style={styles.topBadges}>
          {atout && <View style={styles.badge}><Text style={styles.bTxt}>{SYMBOLE[atout]} Atout</Text></View>}
          {contrat && <View style={[styles.badge, styles.bContrat]}><Text style={styles.bTxtW}>{contrat.nom}: {nbPlisEq}/{contrat.plisObjectif}</Text></View>}
          <View style={styles.badge}><Text style={styles.bTxt}>Pli {plisTermines.length + 1}/13</Text></View>
        </View>
      )}

      <View style={styles.arena}>
        {isBidding ? (
          <View style={styles.biddingContainer}>
            {centerContent}
          </View>
        ) : (
          <>
            <View style={styles.posNord}>
              <Player
                j={joueurs[2]}
                active={tourDeJoueur === 2}
                plis={getPlis(2)}
                eq={getEq(2)}
                ann={contrat?.joueurId === 2}
                part={partenaireRévélé && contrat?.partenaireId === 2}
                isDealer={joueurs[2].id === donneurId}
                phase={phase}
                cardsCount={phase === 'distribution' ? cardsReceived[2] : undefined}
              />
            </View>

            <View style={styles.middleRow}>
              <Player
                j={joueurs[1]}
                active={tourDeJoueur === 1}
                plis={getPlis(1)}
                eq={getEq(1)}
                ann={contrat?.joueurId === 1}
                part={partenaireRévélé && contrat?.partenaireId === 1}
                orient="vertical"
                isDealer={joueurs[1].id === donneurId}
                phase={phase}
                cardsCount={phase === 'distribution' ? cardsReceived[1] : undefined}
              />
              <View style={styles.pliZone}>{centerContent}</View>
              <Player
                j={joueurs[3]}
                active={tourDeJoueur === 3}
                plis={getPlis(3)}
                eq={getEq(3)}
                ann={contrat?.joueurId === 3}
                part={partenaireRévélé && contrat?.partenaireId === 3}
                orient="vertical"
                isDealer={joueurs[3].id === donneurId}
                phase={phase}
                cardsCount={phase === 'distribution' ? cardsReceived[3] : undefined}
              />
            </View>
          </>
        )}

        <View style={styles.sudArea}>
          {!isBidding && (
            <Player
              j={joueurs[0]}
              active={tourDeJoueur === 0}
              plis={getPlis(0)}
              eq={getEq(0)}
              ann={contrat?.joueurId === 0}
              hum
              obj={contrat?.plisObjectif}
              isDealer={joueurs[0].id === donneurId}
              phase={phase}
              cardsCount={phase === 'distribution' ? cardsReceived[0] : undefined}
            />
          )}
          <View style={styles.handContainer}>
            {phase === 'distribution'
              ? (React.isValidElement(children) ? React.cloneElement(children as any, { maxVisible: cardsReceived[0] }) : null)
              : children
            }
          </View>
        </View>
      </View>

      {/* Cartes sur la table (Overlay) */}
      {!isBidding && phase !== 'distribution' && (
        <View style={styles.overlay} pointerEvents="none">
          {pliEnCours.cartesJouees.map((cp: CartePosee, i: number) => (
            <PlayedCard key={i} cp={cp} winner={pliEnCours.gagnantId} />
          ))}
        </View>
      )}

      {/* Animation de distribution */}
      {phase === 'distribution' && (
        <DistributionAnimation onCardLanded={handleCardLanded} />
      )}
    </View>
  );
};

const PlayedCard = ({ cp, winner }: { cp: CartePosee, winner?: number }) => {
  const target = [{ x: 0, y: 60 }, { x: -75, y: 0 }, { x: 0, y: -60 }, { x: 75, y: 0 }][cp.joueurId];
  const start = [{ x: 0, y: 200 }, { x: -150, y: 0 }, { x: 0, y: -200 }, { x: 150, y: 0 }][cp.joueurId];
  const anim = useRef(new Animated.ValueXY(start)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(anim, { toValue: target, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (winner !== undefined) {
      Animated.sequence([
        Animated.delay(1200),
        Animated.parallel([
          Animated.timing(anim, { toValue: [{ x: 0, y: 60 }, { x: -75, y: 0 }, { x: 0, y: -60 }, { x: 75, y: 0 }][winner], duration: 400, useNativeDriver: true }),
          Animated.timing(fade, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      ]).start();
    }
  }, [winner]);

  return (
    <Animated.View style={[styles.pCard, { opacity: fade, transform: [{ translateX: anim.x }, { translateY: anim.y }] }]}>
      <CardFace carte={cp.carte} taille="table" />
    </Animated.View>
  );
};

const Player = ({ j, active, plis, eq, ann, part, orient = 'horizontal', hum, obj, isDealer, phase, cardsCount }: any) => {
  const { t } = useTranslation();
  const color = eq === 'A' ? Colors.primary : '#E24B4A';
  const nbCartes = cardsCount !== undefined ? cardsCount : j.main.length;

  return (
    <View style={[styles.pSlot, active && styles.pActive, eq && { borderColor: color, borderWidth: 2 }]}>
      {isDealer && <View style={styles.dealerBadge}><Text style={styles.dealerText}>D</Text></View>}
      {!hum && nbCartes > 0 && <HandBack nbCartes={nbCartes} orientation={orient} />}
      <View style={styles.pInfo}>
        <View style={styles.pRow}>
          <Text style={[styles.pName, active && { color: Colors.primary }]}>{j.nom}{hum ? ' (Vous)' : ''}</Text>
          {(ann || part) && <Text style={{ fontSize: 12 }}>{ann ? '🎯' : '🤝'}</Text>}
        </View>
        <Text style={[styles.pScore, hum && styles.pScoreHum]}>
          {active && !hum ? t('common.thinking') : `${plis}${obj ? `/${obj}` : ''} pli${plis > 1 ? 's' : ''}`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f9', borderRadius: 20, margin: 8, overflow: 'hidden' },
  topBadges: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 10, zIndex: 10 },
  badge: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, ...Shadows.card, borderWidth: 0.5, borderColor: '#ddd' },
  bContrat: { backgroundColor: '#146e52' },
  bTxt: { fontSize: 11, color: '#455a64', fontWeight: 'bold' },
  bTxtW: { fontSize: 11, color: '#fff', fontWeight: 'bold' },
  arena: { flex: 1, padding: 10, justifyContent: 'space-between' },
  posNord: { alignItems: 'center', height: 80 },
  middleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 },
  pliZone: { flex: 1 },
  biddingContainer: { flex: 1, width: '100%', marginBottom: 10 },
  sudArea: { alignItems: 'center', width: SW },
  handContainer: { width: SW, height: normalize(150), marginTop: 5 },
  pSlot: { backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 10, padding: 6, alignItems: 'center', minWidth: 80, position: 'relative' },
  pActive: { backgroundColor: '#fff', elevation: 6, shadowOpacity: 0.2 },
  pEq: { position: 'absolute', top: -10, left: '50%', marginLeft: -10, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  pEqT: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  pInfo: { marginTop: 4, alignItems: 'center' },
  pRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pName: { fontSize: 11, fontWeight: 'bold', color: '#78909c' },
  pScore: { fontSize: 10, color: '#455a64', fontWeight: 'bold' },
  pScoreHum: { fontSize: 14, color: Colors.primary },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 50 },
  pCard: { position: 'absolute', ...Shadows.card },
  dealerBadge: {
    position: 'absolute',
    top: -12,
    right: -10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#378ADD',
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    elevation: 4,
  },
  dealerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
