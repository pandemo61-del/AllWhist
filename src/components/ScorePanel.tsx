// ─────────────────────────────────────────────
//  COMPOSANT — Panneau de score
// ─────────────────────────────────────────────

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScoreManche, Joueur } from '../engine/types';
import { useGameStore } from '../store/gameStore';
import { CardFace } from './Card';
import { SYMBOLE } from '../engine/deck';
import { analyserPli, CommentaireExpert } from '../engine/analysis';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../constants/theme';

// ─── Résultat fin de pli ──────────────────────

interface PliResultatProps {
  gagnantNom: string;
  gagnantId: number;
  humanId?: number;
  onContinuer: () => void;
  autoAvance?: boolean;
}

export const PliResultat: React.FC<PliResultatProps> = ({
  onContinuer,
}) => {
  React.useEffect(() => {
    onContinuer();
  }, [onContinuer]);

  return null;
};

// ─── Résultat fin de manche ───────────────────

interface MancheResultatProps {
  scoreManche: ScoreManche;
  scoresTotal: number[];
  joueurs: Joueur[];
  manche: number;
  onMancheSuivante: () => void;
  partieTerminee?: boolean;
}

export const MancheResultat: React.FC<MancheResultatProps> = ({
  scoreManche,
  scoresTotal,
  joueurs,
  manche,
  onMancheSuivante,
  partieTerminee = false,
}) => {
  const { contrat, reussite, details, plisParJoueur, deltaScores } = scoreManche;
  const [voirPlis, setVoirPlis] = React.useState(false);
  const [commentSel, setCommentSel] = React.useState<CommentaireExpert | null>(null);
  const { plisTermines, atout, estScenario } = useGameStore();
  const insets = useSafeAreaInsets();

  const classement = [...joueurs].sort(
    (a, b) => scoresTotal[b.id] - scoresTotal[a.id],
  );

  if (voirPlis) {
    return (
      <View style={[mancheStyles.container, { paddingTop: insets.top }]}>
        <View style={mancheStyles.headerPlis}>
          <TouchableOpacity
            onPress={() => setVoirPlis(false)}
            style={[mancheStyles.backBtn, { padding: Spacing.md }]}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={mancheStyles.backBtnTexte}>← Retour</Text>
          </TouchableOpacity>
          <Text style={mancheStyles.titrePlis}>{contrat.nom}</Text>
        </View>

        <View style={mancheStyles.plisTableauHeader}>
          <Text style={mancheStyles.pliColNum}>#</Text>
          <Text style={mancheStyles.pliColProgress}>Total</Text>
          <View style={mancheStyles.pliColPlayers}>
            {joueurs.map(j => {
              const estAnnonceur = j.id === contrat.joueurId;
              const estPartenaire = j.id === contrat.partenaireId;
              return (
                <Text key={j.id} style={[
                  mancheStyles.pliPlayerHeaderNom,
                  (estAnnonceur || estPartenaire) && mancheStyles.pliPlayerHeaderContrat
                ]}>
                  {j.id === 0 ? 'Vous' : j.nom.slice(0, 3)}
                  {estAnnonceur ? ' 🎯' : estPartenaire ? ' 🤝' : ''}
                </Text>
              );
            })}
          </View>
        </View>

        <ScrollView contentContainerStyle={[mancheStyles.plisList, { paddingBottom: insets.bottom + Spacing.xl }]}>
          {(() => {
            let totalEquipe = 0;
            return plisTermines.map((pli, idx) => {
              const estGagnantEquipe = pli.gagnantId === contrat.joueurId || pli.gagnantId === contrat.partenaireId;
              if (estGagnantEquipe) totalEquipe++;
              const commentaires = analyserPli(pli, contrat, atout);

              return (
                <View key={idx} style={mancheStyles.pliDetailRow}>
                  <View style={mancheStyles.pliLeftCol}>
                    <Text style={mancheStyles.pliNumeroLabel}>{idx + 1}</Text>
                    <Text style={mancheStyles.pliProgressLabel}>{totalEquipe}</Text>
                    <View style={mancheStyles.expertIcons}>
                      {commentaires.map((c, ci) => (
                        <TouchableOpacity key={ci} onPress={() => setCommentSel(c)}>
                          <Text style={[
                            mancheStyles.expertIcon,
                            c.type === 'error' && mancheStyles.expertIconError,
                            c.type === 'warning' && mancheStyles.expertIconWarn,
                            c.type === 'good' && mancheStyles.expertIconGood,
                          ]}>
                            {c.type === 'error' ? '!' : c.type === 'warning' ? '?' : '★'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={mancheStyles.pliCartesGrid}>
                    {joueurs.map(j => {
                      if (!j || !pli || !pli.cartesJouees) return null;

                      const cj = pli.cartesJouees.find(c => c && c.joueurId === j.id);
                      const estPremiere = pli.cartesJouees[0]?.joueurId === j.id;
                      const estGagnante = pli.gagnantId === j.id;
                      const estContrat = j.id === contrat.joueurId || j.id === contrat.partenaireId;

                      return (
                        <View key={j.id} style={[mancheStyles.pliCell, estContrat && mancheStyles.pliCellContrat]}>
                          {cj && cj.carte ? (
                            <View style={[
                              mancheStyles.pliCarteMini,
                              estGagnante && mancheStyles.pliCarteGagnante,
                              estPremiere && mancheStyles.pliCartePremiere
                            ]}>
                              <CardFace carte={cj.carte} taille="mini" />
                              {estPremiere && <View style={stylesBadge.labelPremiere}><Text style={stylesBadge.labelTexte}>1ère</Text></View>}
                              {estGagnante && <View style={stylesBadge.labelGagnante}><Text style={stylesBadge.labelTexte}>Gagné</Text></View>}
                            </View>
                          ) : (
                            <View style={mancheStyles.pliCellVide} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            });
          })()}
        </ScrollView>

        {commentSel && (
          <View style={mancheStyles.expertOverlay}>
            <View style={mancheStyles.expertCard}>
              <Text style={[
                mancheStyles.expertTitre,
                commentSel.type === 'error' && { color: Colors.error },
                commentSel.type === 'warning' && { color: Colors.warning },
                commentSel.type === 'good' && { color: Colors.primary },
              ]}>
                {commentSel.type === 'error' ? '🛑 Erreur Tactique' : commentSel.type === 'warning' ? '⚠️ Attention' : '✨ Beau jeu'}
                {'\n'}{commentSel.titre}
              </Text>
              <Text style={mancheStyles.expertDesc}>{commentSel.description}</Text>
              <TouchableOpacity style={mancheStyles.expertClose} onPress={() => setCommentSel(null)}>
                <Text style={mancheStyles.expertCloseTexte}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        style={mancheStyles.container}
        contentContainerStyle={[mancheStyles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={mancheStyles.header3DContainer}>
          <View style={[mancheStyles.header3D, reussite ? mancheStyles.header3DOk : mancheStyles.header3DFail]}>
            <View style={mancheStyles.header3DInner}>
              <Text style={mancheStyles.header3DIcon}>{reussite ? '🏆' : '💣'}</Text>
              <View>
                <Text style={mancheStyles.header3DTitre}>{reussite ? 'VICTOIRE !' : 'CHUTE...'}</Text>
                <Text style={mancheStyles.header3DContrat}>
                  {contrat.nom}
                  {contrat.atout ? ` (${SYMBOLE[contrat.atout]})` : ''}
                  {contrat.asPartenaire ? ` (As ${SYMBOLE[contrat.asPartenaire.couleur]})` : ''}
                </Text>
              </View>
            </View>
            <View style={mancheStyles.glossyEffect} />
          </View>
          <View style={[mancheStyles.header3DShadow, reussite ? { backgroundColor: '#0F6E56' } : { backgroundColor: '#801a1a' }]} />
        </View>

        <Text style={mancheStyles.details}>{details}</Text>

        <View style={mancheStyles.section}>
          <Text style={mancheStyles.sectionLabel}>
            {estScenario ? "Résultat pédagogique" : "Cette manche"}
          </Text>
          {joueurs.map(j => {
            const delta = deltaScores[j.id] ?? 0;
            const plis = plisParJoueur[j.id] ?? 0;
            return (
              <View key={j.id} style={mancheStyles.joueurRow}>
                <View style={mancheStyles.joueurInfo}>
                  <Text style={mancheStyles.joueurNom}>
                    {j.nom}{j.id === 0 ? ' (Vous)' : ''}{j.id === contrat.joueurId ? ' 🎯' : ''}{j.id === contrat.partenaireId ? ' 🤝' : ''}
                  </Text>
                  <Text style={mancheStyles.joueurPlis}>{plis} pli{plis > 1 ? 's' : ''}</Text>
                </View>
                <Text style={[
                  mancheStyles.delta,
                  delta > 0 && mancheStyles.deltaPos,
                  delta < 0 && mancheStyles.deltaNeg,
                  estScenario && { opacity: 0.6 }
                ]}>
                  {delta > 0 ? '+' : ''}{delta}
                  {estScenario ? '*' : ''}
                </Text>
              </View>
            );
          })}
          {estScenario && (
            <Text style={mancheStyles.noteEntrainement}>
              * En mode entraînement, les points ne sont pas comptabilisés au score global.
            </Text>
          )}
        </View>

        {!estScenario && (
          <View style={mancheStyles.section}>
            <Text style={mancheStyles.sectionLabel}>Classement total</Text>
            {classement.map((j, rang) => (
              <View key={j.id} style={mancheStyles.classementRow}>
                <Text style={mancheStyles.rang}>{rang + 1}</Text>
                <View style={mancheStyles.rangBar}>
                  <View style={[mancheStyles.rangFill, { width: `${Math.max(5, (scoresTotal[j.id] / (Math.max(...scoresTotal, 1) || 1)) * 100)}%`, backgroundColor: j.id === 0 ? Colors.primary : Colors.bgSurface }]} />
                </View>
                <Text style={mancheStyles.rangNom}>{j.id === 0 ? 'Vous' : j.nom}</Text>
                <Text style={mancheStyles.rangScore}>{scoresTotal[j.id]}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Footer fixe pour les boutons - Toujours visible avec Safe Area Insets */}
      <View style={[mancheStyles.footerActions, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        <View style={mancheStyles.actionsRow}>
          <TouchableOpacity
            style={[mancheStyles.btnSuivant, { flex: 1, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border }]}
            onPress={() => setVoirPlis(true)}
          >
            <Text style={[mancheStyles.btnSuivantTexte, { color: Colors.textPrimary }]}>Analyse</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[mancheStyles.btnSuivant, { flex: 1.5, marginLeft: Spacing.sm }]}
            onPress={onMancheSuivante}
          >
            <Text style={mancheStyles.btnSuivantTexte}>
              {partieTerminee ? 'Fin' : 'Continuer'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const mancheStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.md },
  header3DContainer: { marginBottom: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm },
  header3D: { width: '100%', padding: Spacing.lg, borderRadius: Radius.lg, position: 'relative', overflow: 'hidden', zIndex: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  header3DInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  header3DOk: { backgroundColor: Colors.primary },
  header3DFail: { backgroundColor: Colors.cardRed },
  header3DShadow: { position: 'absolute', bottom: -6, width: '98%', height: '100%', borderRadius: Radius.lg, zIndex: 1 },
  glossyEffect: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(255,255,255,0.15)' },
  header3DIcon: { fontSize: 40 },
  header3DTitre: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: '#fff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  header3DContrat: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.9)', fontWeight: FontWeight.bold },
  details: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.sm, fontStyle: 'italic' },
  noteEntrainement: {
    fontSize: 10,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  section: { marginBottom: Spacing.sm },
  sectionLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: FontWeight.semibold, marginBottom: Spacing.sm },
  joueurRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  joueurInfo: { flex: 1 },
  joueurNom: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  joueurPlis: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  delta: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textSecondary, minWidth: 44, textAlign: 'right' },
  deltaPos: { color: Colors.primary },
  deltaNeg: { color: Colors.cardRed },
  classementRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs, gap: Spacing.sm },
  rang: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.bold, width: 20, textAlign: 'center' },
  rangBar: { flex: 1, height: 6, backgroundColor: Colors.bgSurface, borderRadius: Radius.full, overflow: 'hidden' },
  rangFill: { height: '100%', borderRadius: Radius.full },
  rangNom: { fontSize: FontSize.sm, color: Colors.textSecondary, width: 60 },
  rangScore: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, width: 36, textAlign: 'right' },
  footerActions: {
    padding: Spacing.md,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionsRow: { flexDirection: 'row' },
  btnSuivant: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center' },
  btnSuivantTexte: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: '#fff' },
  headerPlis: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgSurface },
  backBtn: { padding: Spacing.xs },
  backBtnTexte: { color: Colors.primary, fontWeight: FontWeight.bold },
  titrePlis: { flex: 1, textAlign: 'center', fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginRight: 40 },
  plisList: { padding: Spacing.md },
  pliDetailRow: { backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row' },
  pliNumeroLabel: { width: 30, fontSize: FontSize.xs, fontWeight: 'bold', color: Colors.textMuted, alignSelf: 'center', textAlign: 'center' },
  pliProgressLabel: { width: 40, fontSize: FontSize.sm, fontWeight: 'bold', color: Colors.primary, textAlign: 'center', alignSelf: 'center' },
  pliCartesGrid: { flex: 1, flexDirection: 'row' },
  pliCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pliCellContrat: { backgroundColor: 'rgba(29, 158, 117, 0.05)' },
  pliCellVide: { width: 30, height: 40 },
  pliCarteMini: { padding: 2 },
  pliCarteGagnante: { borderWidth: 2, borderColor: Colors.primary, borderRadius: 4, backgroundColor: 'rgba(29, 158, 117, 0.1)' },
  pliCartePremiere: { borderColor: Colors.info, borderWidth: 1, borderRadius: 4 },
  plisTableauHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pliColNum: { width: 30, fontSize: 10, fontWeight: 'bold', color: Colors.textMuted, textAlign: 'center' },
  pliColProgress: { width: 40, fontSize: 10, fontWeight: 'bold', color: Colors.primary, textAlign: 'center' },
  pliColPlayers: { flex: 1, flexDirection: 'row' },
  pliPlayerHeaderNom: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 'bold', color: Colors.textMuted, textTransform: 'uppercase' },
  pliPlayerHeaderContrat: { color: Colors.primary },
  pliLeftCol: { flexDirection: 'row', alignItems: 'center', width: 90 },
  expertIcons: { flexDirection: 'row', marginLeft: 4, gap: 2 },
  expertIcon: { width: 18, height: 18, borderRadius: 9, textAlign: 'center', lineHeight: 18, fontSize: 12, fontWeight: 'bold', color: '#fff', overflow: 'hidden' },
  expertIconError: { backgroundColor: Colors.error },
  expertIconWarn: { backgroundColor: Colors.warning },
  expertIconGood: { backgroundColor: Colors.primary },
  expertOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  expertCard: { width: '80%', backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', elevation: 5 },
  expertTitre: { fontSize: FontSize.md, fontWeight: FontWeight.bold, textAlign: 'center', marginBottom: Spacing.sm },
  expertDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg },
  expertClose: { backgroundColor: Colors.bgSurface, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  expertCloseTexte: { color: Colors.textPrimary, fontWeight: FontWeight.bold },
});

const stylesBadge = StyleSheet.create({
  labelPremiere: { position: 'absolute', top: -8, backgroundColor: Colors.info, paddingHorizontal: 4, borderRadius: 4, zIndex: 10 },
  labelGagnante: { position: 'absolute', bottom: -8, backgroundColor: Colors.primary, paddingHorizontal: 4, borderRadius: 4, zIndex: 10 },
  labelTexte: { fontSize: 8, color: '#fff', fontWeight: 'bold' },
});
