// Les règles déterministes sont partagées avec le client Web dans shared/game-domain.js.
export {
  cartesJouables,
  estPlusForte,
  determinerGagnant,
  misereEchouee,
  compterPlisParJoueur,
  mancheTerminee,
  estRevelationPartenaire as estRevélationPartenaire,
} from '../../shared/game-domain.js';

import type { Couleur, Pli } from './types';

/**
 * Détermine les couleurs que le soliste de la misère n'a plus
 * (renonces / chicanes connues), à partir des plis terminés et du pli en cours.
 */
export function determinerCouleursEpuiseesMisere(
  solisteId: number,
  plisTermines: Pli[] = [],
  pliEnCours?: Pli,
): Set<Couleur> {
  const epuisees = new Set<Couleur>();

  for (const pli of [...plisTermines, ...(pliEnCours ? [pliEnCours] : [])]) {
    if (!pli.couleurDemandee) continue;
    const carteSoliste = pli.cartesJouees.find(c => c.joueurId === solisteId);
    if (carteSoliste && carteSoliste.carte.couleur !== pli.couleurDemandee) {
      epuisees.add(pli.couleurDemandee);
    }
  }

  return epuisees;
}
