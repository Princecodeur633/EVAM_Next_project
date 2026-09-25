"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Button, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { STATUT_FT_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatQty, num } from "@/lib/utils";

export default function FicheTechniqueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, articleName, matieres, can, canEditParam } = useStore();
  const ft = state.fichesTechniques.find((f) => f.id === Number(id));
  const compo = state.compositions.filter((c) => c.fiche_technique === Number(id));
  const [matiere, setMatiere] = useState(matieres[0]?.id ?? 0);
  const [qty, setQty] = useState(0);
  const [editionQte, setEditionQte] = useState<Record<number, string>>({});
  if (!ft) return <p className="text-[13px] text-muted">Fiche introuvable.</p>;
  const writable = canEditParam("/parametrage/fiches-techniques");
  // Une fiche validée est figée (on la version plutôt que de la modifier) :
  // la composition ne reste éditable que tant qu'elle est en brouillon.
  const editableCompo = writable && ft.statut === "BROUILLON";

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Fiche technique"
        title={`${articleName(ft.article)} v${ft.version}`}
        status={<StatusBadge tone={ft.statut === "VALIDEE" ? "success" : "neutral"}>{STATUT_FT_LABEL[ft.statut]}</StatusBadge>}
        actions={ft.statut === "BROUILLON" && can("VALIDER_FT") ? (
          <Button onClick={() => void dispatch({ type: "VALIDER_FT", id: ft.id })}>Valider</Button>
        ) : null}
      />
      {writable && ft.statut === "BROUILLON" && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <Field label="Matière">
            <select className={inputClass} value={matiere} onChange={(e) => setMatiere(Number(e.target.value))}>
              {matieres.map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}
            </select>
          </Field>
          <Field label="Qté / unité"><input type="number" className={inputClass} value={qty} onChange={(e) => setQty(Number(e.target.value))} /></Field>
          <Button onClick={() => void dispatch({ type: "CREATE_COMPOSITION", fiche_technique: ft.id, matiere, quantite_necessaire: qty })}>Ajouter</Button>
        </Panel>
      )}
      <Panel className="p-4">
        <h2 className="text-[13px] font-semibold mb-2">Composition</h2>
        {compo.length === 0 && <p className="text-[13px] text-muted">Aucune matière renseignée pour le moment.</p>}
        <div className="divide-y divide-line">
          {compo.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 py-2">
              <span className="text-[13px]">{articleName(c.matiere)}</span>
              {editableCompo ? (
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    className="h-8 w-24 border border-line rounded px-2 text-[12px] text-right"
                    value={editionQte[c.id] ?? c.quantite_necessaire}
                    onChange={(e) => setEditionQte((m) => ({ ...m, [c.id]: e.target.value }))}
                  />
                  <button
                    className="text-primary text-[12px]"
                    onClick={() => void dispatch({ type: "PATCH_COMPOSITION", id: c.id, quantite_necessaire: Number(editionQte[c.id] ?? c.quantite_necessaire) })}
                  >
                    Enregistrer
                  </button>
                  <button
                    className="text-danger text-[12px]"
                    onClick={() => void dispatch({ type: "DELETE_COMPOSITION", id: c.id })}
                  >
                    Supprimer
                  </button>
                </span>
              ) : (
                <span className="text-[13px] num">{formatQty(num(c.quantite_necessaire), 4)}</span>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
