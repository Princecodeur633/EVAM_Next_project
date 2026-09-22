import type { Tarif } from "./types";

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

/**
 * Tarif applicable aujourd'hui pour un article : celui du client s'il en a un
 * en vigueur, sinon le tarif public. En cas de chevauchement, le plus récent
 * (date de début la plus tardive) l'emporte.
 */
export function tarifEnVigueur(tarifs: Tarif[], articleId: number, clientId: number | null): Tarif | undefined {
  const today = aujourdhui();
  const enVigueur = (t: Tarif) =>
    t.article === articleId &&
    t.date_debut_validite <= today &&
    (!t.date_fin_validite || t.date_fin_validite >= today);
  const plusRecent = (a: Tarif | undefined, b: Tarif) =>
    !a || b.date_debut_validite > a.date_debut_validite ? b : a;

  let specifique: Tarif | undefined;
  let publicTarif: Tarif | undefined;
  for (const t of tarifs) {
    if (!enVigueur(t)) continue;
    if (t.client == null) publicTarif = plusRecent(publicTarif, t);
    else if (clientId && t.client === clientId) specifique = plusRecent(specifique, t);
  }
  return specifique ?? publicTarif;
}
