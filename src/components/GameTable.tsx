// ─────────────────────────────────────────────
//  COMPOSANT — Table de jeu (Version avec Animation Distribution)
// ─────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Carte, Couleur, Pli, ContratJoue, Joueur, CartePosee } from '../engine/types';
import { CardFace, CardBack, HandBack } from './Card';
import { SYMBOLE, estRouge } from '../engine/deck';
import { Colors, Shadows, FontWeight, CardSize } from '../constants/theme';
import { normalize } from '../utils/normalize';
import { useTranslation } from '../i18n';
import { getVariante } from '../variants/index';
import { determinerGagnant } from '../engine/rules';

import { useGameStore } from '../store/gameStore';
import { DistributionAnimation } from './DistributionAnimation';
import { TrickProgress } from './TrickProgress';

const { width: SW } = Dimensions.get('window');

export const GameTable: React.FC<any> = ({
  phase, varianteId, joueurs, pliEnCours, atout, contrat, tourDeJoueur, plisTermines, partenaireRévélé, children, centerContent, isBidding = false, isDiscarding = false,
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
  const contratAtout = contrat?.atout ?? atout;
  const estContratTrou = contrat?.id === 'trou' || contrat?.id === 'trou_royal';

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

  const currentWinnerId = React.useMemo(() => {
    if (pliEnCours.cartesJouees.length === 0) return undefined;
    try {
      return determinerGagnant(pliEnCours, atout);
    } catch {
      return undefined;
    }
  }, [pliEnCours, atout]);

  return (
    <View style={styles.container}>
      {/* ── Badges fixes en haut ── */}
      {!isBidding && (
        <View style={styles.topSection}>
          <View style={styles.topBadges}>
            {atout && (
              <View style={[styles.badge, { borderColor: estRouge(atout) ? Colors.cardRed : Colors.textPrimary }]}>
                <Text style={[styles.bTxt, { color: estRouge(atout) ? Colors.cardRed : Colors.textPrimary, fontSize: 13 }]}>
                  {SYMBOLE[atout]} Atout
                </Text>
              </View>
            )}
            {contrat && (
              <View style={[styles.badge, styles.bContrat]}>
                <Text style={styles.bTxtW}>
                  {contrat.nom}
                  {estContratTrou && contratAtout ? ` — Atout ${SYMBOLE[contratAtout]}` : ''}
                  : {nbPlisEq}/{contrat.plisObjectif}
                </Text>
              </View>
            )}
            <View style={styles.badge}><Text style={styles.bTxt}>Pli {plisTermines.length + 1}/13</Text></View>
          </View>
          {contrat && phase !== 'distribution' && (
            <View style={styles.trickProgressWrapper}>
              <TrickProgress
                contrat={contrat}
                plisTermines={plisTermines}
                nbPlisEq={nbPlisEq}
              />
            </View>
          )}
        </View>
      )}

      <View style={styles.arena}>
        {isBidding || isDiscarding ? (
          /* Enchères ou Écart : On cache les adversaires pour donner tout l'espace au centre */
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={styles.biddingContainer}>
              {centerContent}
              {isDiscarding && (
                <View style={styles.discardPrompt}>
                  <Text style={styles.discardTitle}>Petite Misère</Text>
                  <Text style={styles.discardText}>Touchez une carte dans votre main pour l'écarter définitivement de cette manche.</Text>
                </View>
              )}
            </View>
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
                isCurrentWinner={currentWinnerId === 2}
                contratId={contrat?.id}
              />
            </View>

            <View style={[styles.middleRow, { flex: 5, zIndex: 1000, elevation: 10 }]}>
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
                compact={phase === 'jeu' || phase === 'fin_pli'}
                isCurrentWinner={currentWinnerId === 1}
                contratId={contrat?.id}
              />

              <View style={styles.pliZone}>
                <View style={styles.tableCenter} />

                {/* Zone de pli — Centrage garanti avec absoluteFill et flex center */}
                <View style={styles.pliOverlayInternal} pointerEvents="none">
                  {(phase === 'jeu' || phase === 'fin_pli') && pliEnCours.cartesJouees.map((cp: CartePosee) => (
                    <PlayedCard
                      key={`${pliEnCours.numero}-${cp.joueurId}`}
                      cp={cp}
                      winner={pliEnCours.gagnantId}
                    />
                  ))}
                </View>

                {centerContent}
              </View>

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
                compact={phase === 'jeu' || phase === 'fin_pli'}
                isCurrentWinner={currentWinnerId === 3}
                contratId={contrat?.id}
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
              part={partenaireRévélé && contrat?.partenaireId === 0}
              hum
              obj={contrat?.plisObjectif}
              isDealer={joueurs[0].id === donneurId}
              phase={phase}
              cardsCount={phase === 'distribution' ? cardsReceived[0] : undefined}
              compact={phase === 'jeu' || phase === 'fin_pli'}
              isCurrentWinner={currentWinnerId === 0}
              contratId={contrat?.id}
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

      {/* Animation de distribution */}
      {phase === 'distribution' && (
        <DistributionAnimation onCardLanded={handleCardLanded} />
      )}
    </View>
  );
};

const PlayedCard = ({ cp, winner }: { cp: CartePosee, winner?: number }) => {
  // Départ depuis la main/position du joueur
  const startPos = [
    { x: 0, y: normalize(220) },             // Vous (Sud) - depuis la main
    { x: -normalize(220), y: 0 },            // Marc (Ouest) - depuis la gauche
    { x: 0, y: -normalize(220) },            // Julie (Nord) - depuis le haut
    { x: normalize(220), y: 0 }              // Paul (Est) - depuis la droite
  ][cp.joueurId];

  // Position intermédiaire de la carte posée sur le tapis (proche du centre)
  const tablePos = [
    { x: normalize(10), y: normalize(32) },   // Sud
    { x: -normalize(35), y: normalize(6) },  // Ouest
    { x: -normalize(10), y: -normalize(32) }, // Nord
    { x: normalize(35), y: -normalize(6) }   // Est
  ];

  // Envol final vers le joueur gagnant du pli
  const winnerPos = [
    { x: 0, y: normalize(250) },             // Gagnant Sud
    { x: -normalize(250), y: 0 },            // Gagnant Ouest
    { x: 0, y: -normalize(250) },            // Gagnant Nord
    { x: normalize(250), y: 0 }              // Gagnant Est
  ];

  const initialRotationDeg = [-3, 5, -4, 6][cp.joueurId];
  const isWinningCard = winner !== undefined && winner === cp.joueurId;

  // Regroupement SUR LA CARTE GAGNANTE (avec petit décalage naturel de 2-4px)
  const gatherTarget = winner !== undefined ? {
    x: tablePos[winner].x + [normalize(3), -normalize(3), -normalize(2), normalize(4)][cp.joueurId],
    y: tablePos[winner].y + [-normalize(2), normalize(3), normalize(2), -normalize(3)][cp.joueurId],
  } : tablePos[cp.joueurId];

  const gatheredRotationDeg = [-8, 4, -5, 7][cp.joueurId];

  const anim = useRef(new Animated.ValueXY(startPos)).current;
  const scale = useRef(new Animated.Value(1.18)).current;
  const rotateVal = useRef(new Animated.Value(initialRotationDeg)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const flipVal = useRef(new Animated.Value(0)).current;
  const winnerGlow = useRef(new Animated.Value(0)).current;

  const [isFlipped, setIsFlipped] = React.useState(false);

  useEffect(() => {
    // Animation d'arrivée : la carte part de la main vers sa position sur le tapis
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(anim, { toValue: tablePos[cp.joueurId], friction: 7, tension: 45, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (winner !== undefined) {
      const dest = winnerPos[winner];

      // Mise en évidence par halo doré sur la carte gagnante
      if (isWinningCard) {
        Animated.sequence([
          Animated.timing(winnerGlow, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(winnerGlow, { toValue: 0.7, duration: 350, useNativeDriver: true }),
        ]).start();
      }

      Animated.sequence([
        // Temps d'observation des 4 cartes avec mise en évidence de la carte gagnante
        Animated.delay(850),

        // Phase 1 : Regroupement SUR LA CARTE GAGNANTE + Retournement
        Animated.parallel([
          Animated.spring(anim, { toValue: gatherTarget, friction: 8, tension: 48, useNativeDriver: true }),
          Animated.timing(rotateVal, { toValue: gatheredRotationDeg, duration: 380, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.9, duration: 380, useNativeDriver: true }),
          Animated.timing(flipVal, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(winnerGlow, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),

        // Pause avec le tas de cartes retournées regroupées sur la carte gagnante
        Animated.delay(280),

        // Phase 2 : Envol du tas depuis la carte gagnante vers le joueur gagnant
        Animated.parallel([
          Animated.timing(anim, { toValue: dest, duration: 420, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.35, duration: 420, useNativeDriver: true }),
          Animated.timing(fade, { toValue: 0, duration: 420, useNativeDriver: true }),
        ]),
      ]).start();

      // Bascule vers le verso de la carte pendant le flip
      const timer = setTimeout(() => {
        setIsFlipped(true);
      }, 1020);

      return () => clearTimeout(timer);
    }
  }, [winner]);

  const rotateStr = rotateVal.interpolate({
    inputRange: [-180, 180],
    outputRange: ['-180deg', '180deg'],
  });

  const flipInterpolate = flipVal.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '0deg'],
  });

  return (
    <Animated.View style={[
      styles.pCard,
      isWinningCard && styles.winningCardGlow,
      {
        opacity: fade,
        transform: [
          { translateX: anim.x },
          { translateY: anim.y },
          { scale },
          { rotate: rotateStr },
          { rotateY: flipInterpolate },
        ]
      }
    ]}>
      {isWinningCard && (
        <Animated.View style={[styles.glowBorder, { opacity: winnerGlow }]} pointerEvents="none" />
      )}
      {isFlipped ? (
        <CardBack style={{ width: CardSize.table.width, height: CardSize.table.height }} />
      ) : (
        <CardFace carte={cp.carte} taille="table" />
      )}
    </Animated.View>
  );
};

const Player = ({ j, active, plis, eq, ann, part, orient = 'horizontal', hum, obj, isDealer, phase, cardsCount, compact, isCurrentWinner, contratId }: any) => {
  const { t } = useTranslation();
  const color = eq === 'A' ? Colors.primary : '#E24B4A';
  const nbCartes = cardsCount !== undefined ? cardsCount : j.main.length;

  // Libellés spécifiques au Whist Belge (Gand)
  let roleLabel = "";
  if (ann) {
    if (contratId === 'propose') roleLabel = "Propose";
    else if (contratId === 'demande') roleLabel = "Demande";
    else if (contratId === 'trou' || contratId === 'trou_royal') roleLabel = "Trou";
    else roleLabel = "Annonce";
  } else if (part) {
    if (contratId === 'propose') roleLabel = "Emballe";
    else if (contratId === 'demande') roleLabel = "Réponse";
    else if (contratId === 'trou' || contratId === 'trou_royal') roleLabel = "Bouche-Trou";
    else roleLabel = "Parten.";
  }

  return (
    <View style={[
      styles.pSlot,
      active && styles.pActive,
      eq && { borderColor: color, borderWidth: 2 },
      compact && styles.pSlotCompact,
      isCurrentWinner && { backgroundColor: '#FFF9C4', borderColor: '#FBC02D', borderWidth: 2.5 }
    ]}>
      {isDealer && <View style={styles.dealerBadge}><Text style={styles.dealerText}>D</Text></View>}
      {isCurrentWinner && !compact && (
        <View style={styles.winnerBadge}>
          <Text style={styles.winnerText}>🏆 Gagne le pli</Text>
        </View>
      )}
      {!hum && nbCartes > 0 && (
        <View style={compact ? { transform: [{ scale: 0.7 }] } : null}>
          <HandBack nbCartes={nbCartes} orientation={orient} />
        </View>
      )}
      <View style={[styles.pInfo, compact && { marginTop: 0 }]}>
        <View style={styles.pRow}>
          <Text style={[styles.pName, active && { color: Colors.primary }, compact && { fontSize: 10 }]}>
            {j.nom}{hum ? ' (Vous)' : ''}
          </Text>
          {(ann || part) && (
            <View style={styles.roleBadge}>
               <Text style={{ fontSize: compact ? 8 : 10, color: '#fff', fontWeight: 'bold' }}>
                 {ann ? '🎯' : '🤝'} {roleLabel}
               </Text>
            </View>
          )}
        </View>
        {!compact && (
          <Text style={[styles.pScore, hum && styles.pScoreHum]}>
            {active && !hum ? t('common.thinking') : `${plis}${obj ? `/${obj}` : ''} pli${plis > 1 ? 's' : ''}`}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f9', borderRadius: 20, margin: 8, overflow: 'hidden' },
  topSection: { alignItems: 'center', zIndex: 10, paddingTop: 6, paddingBottom: 2 },
  topBadges: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 4 },
  trickProgressWrapper: { alignItems: 'center', marginTop: 4, marginBottom: 2 },
  badge: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, ...Shadows.card, borderWidth: 0.5, borderColor: '#ddd' },
  bContrat: { backgroundColor: '#146e52' },
  bTxt: { fontSize: 11, color: '#455a64', fontWeight: 'bold' },
  bTxtW: { fontSize: 11, color: '#fff', fontWeight: 'bold' },
  arena: { flex: 1, padding: 5, justifyContent: 'space-between' },
  posNord: { alignItems: 'center', height: 80 },
  middleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pliZone: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
    zIndex: 999, // Passe au-dessus des joueurs latéraux Ouest/Est
    elevation: 10,
  },
  pliOverlayInternal: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 20,
    overflow: 'visible',
  },
  tableCenter: {
    position: 'absolute',
    width: SW * 0.55,
    height: SW * 0.55,
    borderRadius: SW * 0.3,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  biddingContainer: { flex: 1, width: '100%' },
  biddingWrapper: { flex: 1, position: 'relative', width: '100%' },
  sidePlayerLeft: {
    position: 'absolute',
    left: -10,
    top: '30%',
    zIndex: 10,
  },
  sidePlayerRight: {
    position: 'absolute',
    right: -10,
    top: '30%',
    zIndex: 10,
  },
  sudArea: { alignItems: 'center', width: SW, zIndex: 1 },
  handContainer: { width: SW, height: normalize(150), marginTop: 5 },
  pSlot: { backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 10, padding: 6, alignItems: 'center', minWidth: 80, position: 'relative' },
  pSlotCompact: { minWidth: 60, padding: 2 },
  pActive: { backgroundColor: '#fff', elevation: 6, shadowOpacity: 0.2 },
  pEq: { position: 'absolute', top: -10, left: '50%', marginLeft: -10, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  pEqT: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  pInfo: { marginTop: 4, alignItems: 'center' },
  pRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pName: { fontSize: 11, fontWeight: 'bold', color: '#78909c' },
  pScore: { fontSize: 10, color: '#455a64', fontWeight: 'bold' },
  pScoreHum: { fontSize: 14, color: Colors.primary },
  overlay: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center', zIndex: 50 },
  pliOverlay: { position: 'absolute', ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center', zIndex: 100, overflow: 'visible' },
  pliOverlayGlobal: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    elevation: 25,
    pointerEvents: 'none',
  },
  pCard: {
    position: 'absolute',
    marginLeft: -normalize(25), // Décale les cartes vers la droite pour centrer le pli
    marginTop: -normalize(64),
    ...Shadows.card,
    zIndex: 2000,
    elevation: 25,
  },
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
    fontWeight: FontWeight.bold,
  },
  winnerBadge: {
    position: 'absolute',
    top: -18,
    backgroundColor: '#FBC02D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 30,
    elevation: 5,
  },
  winnerText: {
    color: '#000',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  roleBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  discardPrompt: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#E24B4A',
    alignItems: 'center',
    marginHorizontal: 40,
    ...Shadows.panel,
  },
  discardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E24B4A',
    marginBottom: 8,
  },
  discardText: {
    fontSize: 14,
    color: '#455a64',
    textAlign: 'center',
    lineHeight: 20,
  },
});
