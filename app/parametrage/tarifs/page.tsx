"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { FilterBar, FilterSelect, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { useStore } from "@/lib/store";
import { formatDa, formatDate, num } from "@/lib/utils";
import { statutTarif } from "@/lib/tarifs";

export default function TarifsPage() {
  const router = useRouter();
  const { state, dispatch, articleName, clientName, canEditParam, produitsFinis } = useStore();
  const writable = canEditParam("/parametrage/tarifs");
  const [article, setArticle] = useState(produitsFinis[0]?.id ?? 0);
  const [client, setClient] = useState<number>(0);
  const [prix, setPrix] = useState(0);
  const [debut, setDebut] = useState(new Date().toISOString().slice(0, 10));
  const [fin, setFin] = useState("");
  const [q, setQ] = useState("");
  const [fClient, setFClient] = useState("");
  const [fStatut, setFStatut] = useState<"TOUS" | "En vigueur" | "À venir" | "Expiré">("TOUS");
  const clientsTarifes = [...new Set(state.tarifs.map((t) => t.client).filter((c): c is number => c != null))].map((c) => ({ value: String(c), label: clientName(c) }));
  const filtered = state.tarifs.filter(
    (t) =>
      matchSearch(q, articleName(t.article), t.client ? clientName(t.client) : "Public") &&
      (!fClient || (fClient === "PUBLIC" ? t.client == null : String(t.client) === fClient)) &&
      (fStatut === "TOUS" || statutTarif(t).label === fStatut),
  );
  const nbStatut = (l: string) => state.tarifs.filter((t) => statutTarif(t).label === l).length;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Référentiel" title="Tarifs" description="Prix public ou prix spécifique à un client. Cliquez sur une ligne pour voir la fiche complète." />
      {writable && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 items-end">
          <Field label="Article">
            <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
              {produitsFinis.map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}
            </select>
          </Field>
          <Field label="Client">
            <select className={inputClass} value={client} onChange={(e) => setClient(Number(e.target.value))}>
              <option value={0}>Public</option>
              {state.clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </Field>
          <Field label="Prix"><input type="number" className={inputClass} value={prix} onChange={(e) => setPrix(Number(e.target.value))} /></Field>
          <Field label="Début"><input type="date" className={inputClass} value={debut} onChange={(e) => setDebut(e.target.value)} /></Field>
          <Field label="Fin (optionnelle)"><input type="date" className={inputClass} value={fin} onChange={(e) => setFin(e.target.value)} /></Field>
          <Button
            disabled={!article}
            onClick={() => void dispatch({ type: "CREATE_TARIF", article, client: client || null, prix_unitaire: prix, date_debut_validite: debut, date_fin_validite: fin || undefined })}
          >
            Créer
          </Button>
        </Panel>
      )}
      <Panel className="overflow-hidden">
        <FilterBar shown={filtered.length} total={state.tarifs.length} active={!!q || !!fClient || fStatut !== "TOUS"} onReset={() => { setQ(""); setFClient(""); setFStatut("TOUS"); }}>
          <SearchInput value={q} onChange={setQ} placeholder="Article ou client…" />
          <Segmented label="Statut" value={fStatut} onChange={setFStatut} options={[
            { value: "TOUS", label: "Tous" },
            { value: "En vigueur", label: "En vigueur", count: nbStatut("En vigueur") },
            { value: "À venir", label: "À venir", count: nbStatut("À venir") },
            { value: "Expiré", label: "Expirés", count: nbStatut("Expiré") },
          ]} />
          <FilterSelect label="Client" allLabel="Public et clients" value={fClient} onChange={setFClient} options={[{ value: "PUBLIC", label: "Tarif public uniquement" }, ...clientsTarifes]} />
        </FilterBar>
        <DataTable
          emptyText="Aucun tarif ne correspond à ces filtres."
          columns={[
            { key: "a", label: "Article" },
            { key: "c", label: "Client" },
            { key: "p", label: "Prix" },
            { key: "d", label: "Début" },
            { key: "f", label: "Fin" },
            { key: "s", label: "Statut" },
          ]}
          rows={filtered.map((t) => {
            const s = statutTarif(t);
            return {
              a: articleName(t.article),
              c: t.client ? `${clientName(t.client)}${t.contrat ? " (contrat)" : ""}` : "Public",
              p: formatDa(num(t.prix_unitaire)),
              d: formatDate(t.date_debut_validite),
              f: t.date_fin_validite ? formatDate(t.date_fin_validite) : "—",
              s: <StatusBadge tone={s.tone}>{s.label}</StatusBadge>,
              href: `/parametrage/tarifs/${t.id}`,
            };
          })}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
    </div>
  );
}
