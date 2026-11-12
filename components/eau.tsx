"use client";

import type { ReactNode } from "react";
import { DataTable, Field, Guard, Panel, StatusBadge, inputClass } from "@/components/ui";
import { BLOC_EAU_LABEL, CATEGORIE_CHARGE_LABEL, FAMILLE_CHARGE_LABEL, PERIODE_EAU_LABEL } from "@/lib/eau";
import { useStore } from "@/lib/store";
import type { CalculCoutEau } from "@/lib/types";
import { cn, formatDa, formatQty, num } from "@/lib/utils";

/** Site eau par défaut : celui qui porte déjà des éléments de coût ou des compteurs, sinon le premier. */
export function useSiteEauParDefaut() {
  const { state } = useStore();
  return state.elementsCoutEau[0]?.usine ?? state.compteursEau[0]?.usine ?? state.usines[0]?.id ?? 0;
}

/** Choix du site et du mois (AAAA-MM). */
export function ChoixSiteMois({
  usine,
  mois,
  onUsine,
  onMois,
  children,
}: {
  usine: number;
  mois: string;
  onUsine: (v: number) => void;
  onMois: (v: string) => void;
  children?: ReactNode;
}) {
  const { state } = useStore();
  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
      <div className="sm:w-60">
        <Field label="Site">
          <select className={inputClass} value={usine} onChange={(e) => onUsine(Number(e.target.value))}>
            <option value={0}>Choisir…</option>
            {state.usines.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nom}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="sm:w-44">
        <Field label="Mois">
          <input type="month" className={inputClass} value={mois} onChange={(e) => onMois(e.target.value)} />
        </Field>
      </div>
      {children}
    </div>
  );
}

const fcfa = (v: string | null | undefined) => (v == null ? "—" : formatDa(num(v)));

/** Montant au centime (le classeur se retrouve au centime près). */
const fcfaCentimes = (v: string | null | undefined) =>
  v == null ? "—" : `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num(v))} FCFA`;

/** Le calcul détaillé du coût de l'eau, comme l'onglet « Calcul coût eau » du classeur. */
export function CalculCoutEauVue({ calcul }: { calcul: Partial<CalculCoutEau> }) {
  const s = calcul.synthese;
  return (
    <div className="space-y-3">
      {!!calcul.bloquants?.length && (
        <Guard variant="block" title="Calcul impossible">
          <ul className="space-y-0.5">
            {calcul.bloquants.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Guard>
      )}
      {!!calcul.alertes?.length && (
        <Guard variant="warn" title={`${calcul.alertes.length} alerte(s)`}>
          <ul className="space-y-0.5">
            {calcul.alertes.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </Guard>
      )}
      {s && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Chiffre label="Coût de l’eau du mois" valeur={fcfaCentimes(s.cout_mensuel)} sous={`Contrôle : ${s.controle}`} fort />
          <Chiffre label="Coût standard au m³" valeur={fcfaCentimes(s.cout_m3)} sous={s.cout_litre ? `${s.cout_litre} FCFA / litre` : undefined} fort />
          <Chiffre label="Forage (part du site eau)" valeur={fcfaCentimes(s.cout_forage)} sous={s.cout_forage_m3 ? `${fcfaCentimes(s.cout_forage_m3)} / m³` : undefined} />
          <Chiffre label="Traitement" valeur={fcfaCentimes(s.cout_traitement)} sous={s.cout_traitement_m3 ? `${fcfaCentimes(s.cout_traitement_m3)} / m³` : undefined} />
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-3">
        <Panel className="overflow-hidden">
          <h3 className="px-4 py-2.5 border-b border-line text-[13px] font-semibold">
            1. Volume du mois : {calcul.volume?.total_m3 ? `${formatQty(num(calcul.volume.total_m3), 3)} m³` : "—"}
          </h3>
          <DataTable
            emptyText="Aucune prévision de bouteilles."
            columns={[
              { key: "a", label: "Format" },
              { key: "b", label: "Bouteilles / mois", className: "text-right" },
              { key: "c", label: "Contenance", className: "text-right" },
              { key: "v", label: "m³", className: "text-right" },
            ]}
            rows={(calcul.volume?.formats ?? []).map((f) => ({
              a: f.article,
              b: <span className="num">{formatQty(f.bouteilles_par_mois, 0)}</span>,
              c: <span className="num">{f.contenance_l ? `${f.contenance_l} L` : "—"}</span>,
              v: <span className="num">{formatQty(num(f.volume_m3), 3)}</span>,
            }))}
          />
        </Panel>
        <Panel className="p-4 space-y-1 text-[13px]">
          <h3 className="text-[13px] font-semibold mb-1">2. Partage du forage</h3>
          <p>Vers le site eau : <span className="num">{calcul.partage_forage?.volume_site_eau_m3 ?? "—"}</span> m³/mois</p>
          <p>Vers les autres sites : <span className="num">{calcul.partage_forage?.volume_autres_sites_m3 ?? "—"}</span> m³/mois</p>
          <p className="font-medium">
            Part du site eau : {calcul.partage_forage?.part_site_eau != null ? `${formatQty(num(calcul.partage_forage.part_site_eau) * 100, 2)} %` : "—"}
          </p>
          <p className="text-[12px] text-muted">Elle s’applique à toutes les charges du bloc Forage ; le Traitement est compté à 100 %.</p>
        </Panel>
      </div>
      <Panel className="overflow-hidden">
        <h3 className="px-4 py-2.5 border-b border-line text-[13px] font-semibold">3. Charges du mois</h3>
        <DataTable
          emptyText="Aucun élément de coût."
          columns={[
            { key: "l", label: "Élément" },
            { key: "f", label: "Famille / catégorie" },
            { key: "v", label: "Valeurs" },
            { key: "p", label: "Part site", className: "text-right" },
            { key: "m", label: "Coût mensuel", className: "text-right" },
            { key: "u", label: "Au m³", className: "text-right" },
          ]}
          rows={(calcul.charges ?? []).map((c) => ({
            l: (
              <span className="inline-flex flex-col">
                <span>{c.libelle}</span>
                <span className="text-[11.5px] text-muted">
                  {BLOC_EAU_LABEL[c.bloc].split(" (")[0]} · {c.etape}
                  {c.equipement ? ` · ${c.equipement}` : ""}
                </span>
              </span>
            ),
            f: (
              <span className="inline-flex flex-col">
                <span>{FAMILLE_CHARGE_LABEL[c.famille]}</span>
                <span className="text-[11.5px] text-muted">{CATEGORIE_CHARGE_LABEL[c.categorie]}</span>
              </span>
            ),
            v:
              c.quantite == null ? (
                <span className="text-muted">{c.famille === "AU_BESOIN" ? "Jamais prévue" : "Non chiffré"}</span>
              ) : (
                <span className="num text-[12px]">
                  {c.quantite} {c.unite} × {c.prix_unitaire}
                  {c.duree_vie_mois ? ` ÷ ${c.duree_vie_mois} mois` : c.frequence ? ` × ${c.frequence} / ${c.periode ? PERIODE_EAU_LABEL[c.periode].split(" (")[0].toLowerCase() : "?"}` : ""}
                </span>
              ),
            p: <span className="num">{c.part_site != null ? `${formatQty(num(c.part_site) * 100, 2)} %` : "—"}</span>,
            m: <span className="num">{fcfaCentimes(c.cout_mensuel)}</span>,
            u: <span className="num">{fcfaCentimes(c.cout_m3)}</span>,
          }))}
        />
      </Panel>
    </div>
  );
}

function Chiffre({ label, valeur, sous, fort }: { label: string; valeur: string; sous?: string; fort?: boolean }) {
  return (
    <Panel className="p-3">
      <p className="text-[11.5px] text-muted">{label}</p>
      <p className={cn("num mt-0.5", fort ? "text-[18px] font-semibold" : "text-[15px] font-medium")}>{valeur}</p>
      {sous && <p className="text-[11.5px] text-muted mt-0.5">{sous}</p>}
    </Panel>
  );
}

/** Badge « En vigueur » / « Figée » / « À venir » d'une version datée. */
export function BadgeVersion({ enVigueur, figee, avenir }: { enVigueur: boolean; figee: boolean; avenir: boolean }) {
  if (enVigueur) return <StatusBadge tone="success">En vigueur</StatusBadge>;
  if (avenir) return <StatusBadge tone="info">À venir</StatusBadge>;
  return <StatusBadge tone="neutral">{figee ? "Ancienne (figée)" : "Ancienne"}</StatusBadge>;
}

export { fcfa, fcfaCentimes };
