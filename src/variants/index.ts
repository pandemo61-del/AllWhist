// ─────────────────────────────────────────────
//  INDEX DES VARIANTES
// ─────────────────────────────────────────────

import { WhistGand }     from './whistGand';
import { WhistClassique, SoloWhist, BostonWhist, BidWhist } from './autres';
import { VariantConfig } from './types';

export { WhistGand, WhistClassique, SoloWhist, BostonWhist, BidWhist };
export type { VariantConfig };

/** Toutes les variantes dans l'ordre d'affichage. */
export const TOUTES_VARIANTES: VariantConfig[] = [
  WhistClassique,
  WhistGand,
  SoloWhist,
  BostonWhist,
  BidWhist,
];

/** Récupère une variante par son id. */
export function getVariante(id: string): VariantConfig {
  const v = TOUTES_VARIANTES.find(v => v.id === id);
  if (!v) throw new Error(`Variante inconnue : ${id}`);
  return v;
}

/** Récupère un contrat par son id dans une variante. */
export function getContrat(variante: VariantConfig, contratId: string) {
  const c = variante.contrats.find(c => c.id === contratId);
  if (!c) throw new Error(`Contrat inconnu : ${contratId}`);
  return c;
}
