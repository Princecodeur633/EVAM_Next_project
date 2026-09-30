"use client";

import { useMemo, useState } from "react";
import { FilterBar, FilterSelect, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { DataTable, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { ModuleMetier } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const MODULE_LABEL: Record<ModuleMetier, string> = {
  ACCUEIL: "Accueil",
  REFERENTIEL: "Référentiel",
  ACHATS: "Achats",
  STOCKS: "Stocks",
  PRODUCTION: "Production",
  QUALITE: "Qualité",
  COMMERCIAL: "Commercial",
  CAISSE: "Caisse",
  DISTRIBUTION: "Distribution",
  COUTS: "Coûts",
  COMPTABILITE: "Comptabilité",
  ADMINISTRATION: "Administration",
};

type Periode = "JOUR" | "7J" | "30J" | "TOUT";
const PERIODE_JOURS: Record<Periode, number | null> = { JOUR: 0, "7J": 7, "30J": 30, TOUT: null };

function dansPeriode(iso: string, p: Periode) {
  const jours = PERIODE_JOURS[p];
  if (jours == null) return true;
  const debut = new Date();
  debut.setHours(0, 0, 0, 0);
  debut.setDate(debut.getDate() - jours);
  return new Date(iso).getTime() >= debut.getTime();
}

export default function AuditPage() {
  const { state, userName } = useStore();
  const [query, setQuery] = useState("");
  const [utilisateur, setUtilisateur] = useState("");
  const [module, setModule] = useState("");
  const [periode, setPeriode] = useState<Periode>("7J");

  const auteurs = useMemo(() => {
    const ids = [...new Set(state.journal.map((j) => j.utilisateur))];
    return ids.map((id) => ({ value: String(id), label: userName(id) })).sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [state.journal, userName]);
  const modules = useMemo(() => [...new Set(state.journal.map((j) => j.module))].map((m) => ({ value: m, label: MODULE_LABEL[m] ?? m })), [state.journal]);

  const rows = useMemo(
    () =>
      [...state.journal]
        .filter((j) => dansPeriode(j.date_action, periode))
        .filter((j) => !utilisateur || String(j.utilisateur) === utilisateur)
        .filter((j) => !module || j.module === module)
        .filter((j) => matchSearch(query, j.action, j.document_type, j.document_id, j.motif, userName(j.utilisateur)))
        .sort((a, b) => new Date(b.date_action).getTime() - new Date(a.date_action).getTime()),
    [state.journal, periode, utilisateur, module, query, userName],
  );

  const actif = !!query || !!utilisateur || !!module || periode !== "7J";
  const reset = () => {
    setQuery("");
    setUtilisateur("");
    setModule("");
    setPeriode("7J");
  };

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Administration" title="Journal des actions" description="Historique des opérations réalisées dans EVAM : qui a fait quoi, quand, sur quel document." />
      <Panel className="overflow-hidden">
        <FilterBar shown={rows.length} total={state.journal.length} active={actif} onReset={reset}>
          <SearchInput value={query} onChange={setQuery} placeholder="Action, document, motif…" />
          <Segmented
            label="Période"
            value={periode}
            onChange={setPeriode}
            options={[
              { value: "JOUR", label: "Aujourd’hui" },
              { value: "7J", label: "7 jours" },
              { value: "30J", label: "30 jours" },
              { value: "TOUT", label: "Tout" },
            ]}
          />
          <FilterSelect label="Utilisateur" allLabel="Tous les utilisateurs" value={utilisateur} onChange={setUtilisateur} options={auteurs} />
          <FilterSelect label="Module" allLabel="Tous les modules" value={module} onChange={setModule} options={modules} />
        </FilterBar>
        <DataTable
          columns={[
            { key: "d", label: "Date" },
            { key: "u", label: "Utilisateur" },
            { key: "m", label: "Module" },
            { key: "a", label: "Action" },
            { key: "doc", label: "Document" },
          ]}
          rows={rows.map((j) => ({
            d: <span className="num whitespace-nowrap">{formatDateTime(j.date_action)}</span>,
            u: userName(j.utilisateur),
            m: <StatusBadge tone="neutral">{MODULE_LABEL[j.module] ?? j.module}</StatusBadge>,
            a: j.action,
            doc: [j.document_type, j.document_id].filter(Boolean).join(" · ") || "—",
          }))}
        />
      </Panel>
    </div>
  );
}
