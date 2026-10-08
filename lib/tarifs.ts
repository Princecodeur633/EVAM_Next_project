import type { ContratClient, Tarif } from "./types";

const aujourdhui = () => new Date().toISOString().slice(0, 10);

/** Statut d'un tarif selon ses dates de validité, comparées à aujourd'hui. */
export function statutTarif(t: Pick<Tarif, "date_debut_validite" | "date_fin_validite">): {
  label: string;
  tone: "success" | "warning" | "danger";
} {
  const today = aujourdhui();
  if (t.date_debut_validite > today) return { label: "À venir", tone: "warning" };
  if (t.date_fin_validite && t.date_fin_validite < today) return { label: "Expiré", tone: "danger" };
  return { label: "En vigueur", tone: "success" };
}

/** Contrat en vigueur aujourd'hui pour un client (le plus récent), comme ContratClient.actif_pour. */
export function contratActif(contrats: ContratClient[], clientId: number | null): ContratClient | undefined {
  if (!clientId) return undefined;
  const today = aujourdhui();
  return contrats
    .filter((c) => c.client === clientId && c.date_debut <= today && (!c.date_fin || c.date_fin >= today))
    .sort((a, b) => b.date_debut.localeCompare(a.date_debut))[0];
}

/**
 * Tarif applicable aujourd'hui (règle du backend, Tarif.applicable) : tarif du contrat en vigueur
 * du client, sinon tarif propre au client, sinon tarif public. À niveau égal, le plus récent l'emporte.
 * Le prix est imposé : le backend reprend lui-même ce tarif sur chaque ligne.
 */
export function tarifEnVigueur(tarifs: Tarif[], articleId: number, clientId: number | null, contratId?: number | null): Tarif | undefined {
  const today = aujourdhui();
  const enVigueur = (t: Tarif) =>
    t.article === articleId &&
    t.date_debut_validite <= today &&
    (!t.date_fin_validite || t.date_fin_validite >= today);
  const plusRecent = (a: Tarif | undefined, b: Tarif) =>
    !a || b.date_debut_validite > a.date_debut_validite ? b : a;

  let duContrat: Tarif | undefined;
  let specifique: Tarif | undefined;
  let publicTarif: Tarif | undefined;
  for (const t of tarifs) {
    if (!enVigueur(t)) continue;
    if (t.contrat != null) {
      if (contratId && t.contrat === contratId) duContrat = plusRecent(duContrat, t);
    } else if (t.client == null) publicTarif = plusRecent(publicTarif, t);
    else if (clientId && t.client === clientId) specifique = plusRecent(specifique, t);
  }
  return duContrat ?? specifique ?? publicTarif;
}
