"use client";

import { RefCrud } from "@/components/RefCrud";
import { PageHeader, StatusBadge } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { TYPE_COMPTEUR_LABEL, optionsDe } from "@/lib/eau";
import { useStore } from "@/lib/store";
import type { CompteurEau, ReleveCompteurEau, TypeCompteurEau } from "@/lib/types";
import { dateISO, formatDate, formatQty, num } from "@/lib/utils";

/**
 * Compteur du forage (eau captée au total) et un débitmètre par site desservi, relevés chaque jour.
 * Un index ne baisse jamais ; un relevé par compteur et par jour.
 */
export default function CompteursEauPage() {
  const { state, can } = useStore();
  const usine = (id: number | null) => (id == null ? "—" : state.usines.find((u) => u.id === id)?.nom ?? `Site ${id}`);
  const jour = dateISO();
  const relevesDuJour = new Set(state.relevesCompteursEau.filter((r) => r.date === jour).map((r) => r.compteur));
  const dernier = (c: CompteurEau) => [...state.relevesCompteursEau].filter((r) => r.compteur === c.id).sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader eyebrow="Traitement de l’eau" title="Compteurs et relevés" description="Les débitmètres donnent la part de chaque site dans le forage ; le compteur du forage, le contrôle des pertes." />
      <RefCrud<CompteurEau>
        titre="Compteurs et débitmètres"
        items={state.compteursEau}
        endpoint={endpoints.compteursEau}
        refresh={["compteursEau"]}
        writable={can("GERER_COMPTEURS_EAU")}
        rechercheDans={(c) => [c.code, c.libelle]}
        libelleItem={(c) => `${c.code} · ${c.libelle}`}
        vide="Aucun compteur."
        valeursInitiales={{ code: "", libelle: "", type_compteur: "COMPTEUR_FORAGE", usine: state.usines[0]?.id ?? 0, site_desservi: 0, actif: true }}
        colonnes={[
          { cle: "c", label: "Compteur", rendu: (c) => `${c.code} · ${c.libelle}` },
          { cle: "t", label: "Type", rendu: (c) => TYPE_COMPTEUR_LABEL[c.type_compteur] },
          { cle: "s", label: "Site desservi", rendu: (c) => usine(c.site_desservi) },
          {
            cle: "d",
            label: "Dernier relevé",
            rendu: (c) => {
              const r = dernier(c);
              return r ? <span className="num">{formatQty(num(r.index), 3)} m³ · {formatDate(r.date)}</span> : "—";
            },
          },
          {
            cle: "j",
            label: "Aujourd’hui",
            rendu: (c) => (!c.actif ? <StatusBadge tone="neutral">Inactif</StatusBadge> : relevesDuJour.has(c.id) ? <StatusBadge tone="success">Relevé</StatusBadge> : <StatusBadge tone="warning">À relever</StatusBadge>),
          },
        ]}
        champs={[
          { cle: "code", label: "Code", requis: true, placeholder: "CF, D1, D2…" },
          { cle: "libelle", label: "Libellé", requis: true },
          { cle: "type_compteur", label: "Type", type: "select", requis: true, options: optionsDe<TypeCompteurEau>(TYPE_COMPTEUR_LABEL) },
          { cle: "usine", label: "Site qui le relève", type: "select", requis: true, options: state.usines.map((u) => ({ value: u.id, label: u.nom })) },
          {
            cle: "site_desservi",
            label: "Site desservi",
            type: "select",
            requis: true,
            visible: (f) => f.type_compteur === "DEBITMETRE",
            options: state.usines.map((u) => ({ value: u.id, label: u.nom })),
          },
          { cle: "actif", label: "Actif", type: "checkbox" },
        ]}
      />
      <RefCrud<ReleveCompteurEau>
        titre="Relevés"
        items={[...state.relevesCompteursEau].sort((a, b) => b.date.localeCompare(a.date) || a.compteur_code.localeCompare(b.compteur_code))}
        endpoint={endpoints.relevesCompteursEau}
        refresh={["relevesCompteursEau"]}
        writable={can("RELEVER_EAU")}
        rechercheDans={(r) => [r.compteur_code, r.date]}
        libelleItem={(r) => `${r.compteur_code} · ${formatDate(r.date)}`}
        supprimable={() => true}
        vide="Aucun relevé."
        valeursInitiales={{ compteur: 0, date: jour, index: "", observations: "" }}
        colonnes={[
          { cle: "d", label: "Jour", rendu: (r) => formatDate(r.date) },
          { cle: "c", label: "Compteur", rendu: (r) => r.compteur_code },
          { cle: "i", label: "Index", className: "text-right", rendu: (r) => <span className="num">{formatQty(num(r.index), 3)} m³</span> },
          { cle: "o", label: "Observations", rendu: (r) => r.observations || "—" },
          { cle: "p", label: "Saisi par", rendu: (r) => r.saisi_par_nom ?? "—" },
        ]}
        champs={[
          { cle: "compteur", label: "Compteur", type: "select", requis: true, options: state.compteursEau.filter((c) => c.actif).map((c) => ({ value: c.id, label: `${c.code} · ${c.libelle}` })) },
          { cle: "date", label: "Date du relevé", type: "date", requis: true },
          { cle: "index", label: "Index (m³)", type: "number", requis: true, aide: "Jamais inférieur au relevé précédent." },
          { cle: "observations", label: "Observations", pleineLargeur: true },
        ]}
      />
    </div>
  );
}
