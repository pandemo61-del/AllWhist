import { melanger, creerJeu, distribuer, SYMBOLE, LABEL_VALEUR } from '../engine/deck';
import { choisirEnchere, choisirCarte, DecisionEnchere } from '../ai/SimpleAI';
import { determinerGagnant, compterPlisParJoueur, estRevélationPartenaire } from '../engine/rules';
import { evaluerReussite, calculerScoreGenerique } from '../engine/scoring';
import { WhistGand } from '../variants/whistGand';
import { getContrat } from '../variants/index';
import { Couleur, ContratJoue, Pli, Joueur, Carte } from '../engine/types';

jest.setTimeout(120000); // 2 minutes pour 200 parties

describe('Simulation intensive - 200 parties de Whist de Gand', () => {

  const formatMain = (main: Carte[]) => {
    return [...main]
      .sort((a, b) => a.couleur === b.couleur ? a.valeur - b.valeur : a.couleur.localeCompare(b.couleur))
      .map(c => `${LABEL_VALEUR[c.valeur]}${SYMBOLE[c.couleur]}`)
      .join(' ');
  };

  test('Simuler 200 parties et analyser les échecs', () => {
    const echecs: any[] = [];
    let totalReussites = 0;
    let totalEchecs = 0;
    let totalPasses = 0;

    for (let i = 0; i < 200; i++) {
      const jeu = melanger(creerJeu(WhistGand.avecJoker));
      const mainsInitiales = distribuer(jeu, 4, 0);
      const joueurs: Joueur[] = mainsInitiales.map((m, idx) => ({
        id: idx,
        nom: `IA-${idx}`,
        main: [...m],
        type: 'ia_expert'
      }));

      // --- Enchères ---
      let meilleureEnchere: ContratJoue | null = null;
      let passesConsecutifs = 0;
      let tour = 0;

      while (passesConsecutifs < 4) {
        const id = tour % 4;
        const decision: DecisionEnchere = choisirEnchere(joueurs[id].main, WhistGand, meilleureEnchere, 'expert');

        if (decision.action === 'passe') {
          passesConsecutifs++;
        } else {
          passesConsecutifs = 0;
          const config = getContrat(WhistGand, decision.contratId!);
          meilleureEnchere = {
            id: decision.contratId!,
            nom: config.nom,
            joueurId: id,
            atout: config.sanAtout ? undefined : decision.atout,
            asPartenaire: decision.asPartenaire ? joueurs.flatMap(j => j.main).find(c => c.id === decision.asPartenaire) : undefined,
            plisObjectif: config.plisMin,
            seul: config.seul,
            sanAtout: config.sanAtout,
            cartesVisibles: config.cartesVisibles,
            pointsReussite: config.pointsReussite,
            pointsEchec: config.pointsEchec,
            priorite: config.priorite,
          };
        }
        tour++;
        if (tour > 20) break; // Sécurité
      }

      if (!meilleureEnchere) {
        totalPasses++;
        continue;
      }

      // --- Jeu ---
      let atout = meilleureEnchere.atout ?? null;
      let tourDeJoueur = 0; // Le donneur est 3, le premier est 0
      let plisTermines: Pli[] = [];
      let partenaireId = meilleureEnchere.partenaireId;
      let partenaireRévélé = false;

      // Sauvegarde de la main initiale du soliste pour le rapport d'échec
      const mainInitialeSoliste = formatMain(mainsInitiales[meilleureEnchere.joueurId]);

      for (let pIdx = 0; pIdx < 13; pIdx++) {
        let pli: Pli = { numero: pIdx + 1, cartesJouees: [] };

        for (let jCount = 0; jCount < 4; jCount++) {
          const jId = (tourDeJoueur + jCount) % 4;
          const j = joueurs[jId];
          const cartesDejaJouees = plisTermines.flatMap(pt => pt.cartesJouees.map(c => c.carte));

          const carte = choisirCarte(j, pli, atout, meilleureEnchere, cartesDejaJouees, 'expert');

          // Révélation partenaire
          if (meilleureEnchere && estRevélationPartenaire(carte, meilleureEnchere)) {
             partenaireId = jId;
             partenaireRévélé = true;
          }

          pli.cartesJouees.push({ joueurId: jId, carte });
          j.main = j.main.filter(c => c.id !== carte.id);
          if (pli.cartesJouees.length === 1) pli.couleurDemandee = carte.couleur;
        }

        const gagnant = determinerGagnant(pli, atout);
        pli.gagnantId = gagnant;
        plisTermines.push(pli);
        tourDeJoueur = gagnant;
      }

      // --- Résultat ---
      const plisCpte = compterPlisParJoueur(plisTermines);
      const contratFinal = { ...meilleureEnchere, partenaireId };
      const reussite = evaluerReussite(contratFinal, plisCpte);

      if (reussite) {
        totalReussites++;
      } else {
        totalEchecs++;
        const plisFaits = (plisCpte[contratFinal.joueurId] || 0) + (contratFinal.partenaireId !== undefined ? (plisCpte[contratFinal.partenaireId] || 0) : 0);
        echecs.push({
          contrat: contratFinal.nom,
          soliste: contratFinal.joueurId,
          partenaire: contratFinal.partenaireId,
          mainSoliste: mainInitialeSoliste,
          plisObjectif: contratFinal.plisObjectif,
          plisFaits,
          atout: contratFinal.atout ? SYMBOLE[contratFinal.atout] : 'SA',
        });
      }
    }

    console.log(`--- RAPPORT DE SIMULATION (200 PARTIES) ---`);
    console.log(`Réussites: ${totalReussites}`);
    console.log(`Échecs: ${totalEchecs}`);
    console.log(`Toutes passes: ${totalPasses}`);
    console.log(`-------------------------------------------`);

    if (echecs.length > 0) {
      console.log(`DÉTAILS DES ÉCHECS :`);
      echecs.forEach((e, idx) => {
        console.log(`${idx + 1}. [${e.contrat}] Atout:${e.atout} | Fait:${e.plisFaits}/${e.plisObjectif}`);
        console.log(`   Main: ${e.mainSoliste}`);
      });
    }

    expect(totalReussites + totalEchecs + totalPasses).toBe(200);
  });
});
