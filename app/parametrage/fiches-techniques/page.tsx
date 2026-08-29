"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { STATUT_FT_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";

export default function FichesTechniquesPage() {
  const { state, dispatch, articleName, produitsFinis, canEditParam } = useStore();
  const router = useRouter();
  const writable = canEditParam("/parametrage/fiches-techniques");
  const [article, setArticle] = useState(produitsFinis[0]?.id ?? 0);

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Référentiel" title="Fiches techniques" description="Validez une recette pour qu’elle serve au calcul des besoins d’un OF." />
      {writable && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <Field label="Article">
            <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
              {produitsFinis.map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}
            </select>
          </Field>
          <Button disabled={!article} onClick={() => void dispatch({ type: "CREATE_FT", article })}>Créer brouillon</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "a", label: "Article" }, { key: "v", label: "Version" }, { key: "s", label: "Statut" }]}
          rows={state.fichesTechniques.map((f) => ({
            a: articleName(f.article),
            v: f.version,
            s: <StatusBadge tone={f.statut === "VALIDEE" ? "success" : "neutral"}>{STATUT_FT_LABEL[f.statut]}</StatusBadge>,
            href: `/parametrage/fiches-techniques/${f.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
    </div>
  );
}
