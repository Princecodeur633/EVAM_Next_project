"use client";

import { useMemo, useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import {
  STATUT_DEMANDE_COMPLEMENTAIRE_LABEL,
  STATUT_DEMANDE_MATIERE_LABEL,
  TYPE_SORTIE_LABEL,
} from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatQty, num } from "@/lib/utils";
import type { TypeSortie } from "@/lib/types";

export default function SortiesPage() {
  const { state, dispatch, articleName, ofNumero, matieres, can } = useStore();
  const ofOptions = useMemo(
    () =>
      state.ofList.length > 0
        ? state.ofList.map((o) => ({ id: o.id, label: o.numero }))
        : Array.from(
            new Set([
              ...state.besoinsMatieres.map((b) => b.ordre_fabrication),
              ...state.demandesMatieres.map((d) => d.ordre_fabrication),
              ...state.sortiesMatieres.map((s) => s.ordre_fabrication),
            ]),
          ).map((id) => ({ id, label: ofNumero(id) })),
    [state, ofNumero],
  );

  const [ofId, setOfId] = useState(ofOptions[0]?.id ?? 0);
  const [matiere, setMatiere] = useState(matieres[0]?.id ?? 0);
  const [qty, setQty] = useState(0);
  const [type, setType] = useState<TypeSortie>("NORMALE");
  const [motif, setMotif] = useState("");
  const [dmOf, setDmOf] = useState(ofOptions[0]?.id ?? 0);
  const [dmMat, setDmMat] = useState(matieres[0]?.id ?? 0);
  const [dmQty, setDmQty] = useState(0);
  const [compOf, setCompOf] = useState(ofOptions[0]?.id ?? 0);
  const [compMat, setCompMat] = useState(matieres[0]?.id ?? 0);
  const [compQty, setCompQty] = useState(0);
  const [compMotif, setCompMotif] = useState("");
  const [retourOf, setRetourOf] = useState(ofOptions[0]?.id ?? 0);
  const [retourMat, setRetourMat] = useState(matieres[0]?.id ?? 0);
  const [retourQty, setRetourQty] = useState(0);

  const motifObligatoire = type === "COMPLEMENTAIRE";
  const canSortir = ofId && matiere && qty > 0 && (!motifObligatoire || motif.trim().length > 0);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Magasin / Production"
        title="Matières atelier"
        description="Demandes au magasin, livraison, sorties, compléments et retours. Une livraison de demande génère automatiquement la sortie."
      />

      {can("CREATE_DEMANDE_MATIERE") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <h2 className="col-span-full text-[13px] font-semibold">Demande matière (production → magasin)</h2>
          <Field label="OF">
            <select className={inputClass} value={dmOf} onChange={(e) => setDmOf(Number(e.target.value))}>
              {ofOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Matière">
            <select className={inputClass} value={dmMat} onChange={(e) => setDmMat(Number(e.target.value))}>
              {matieres.map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}
            </select>
          </Field>
          <Field label="Quantité">
            <input type="number" className={inputClass} value={dmQty} onChange={(e) => setDmQty(Number(e.target.value))} />
          </Field>
          <Button
            disabled={!dmOf || !dmMat || dmQty <= 0}
            onClick={() => void dispatch({ type: "CREATE_DEMANDE_MATIERE", ordre_fabrication: dmOf, matiere: dmMat, quantite_demandee: dmQty })}
          >
            Demander
          </Button>
        </Panel>
      )}

      <Panel>
        <DataTable
          columns={[
            { key: "n", label: "N°" },
            { key: "of", label: "OF" },
            { key: "m", label: "Matière" },
            { key: "q", label: "Qté" },
            { key: "s", label: "Statut" },
            { key: "a", label: "" },
          ]}
          rows={state.demandesMatieres.map((d) => ({
            n: d.numero,
            of: ofNumero(d.ordre_fabrication),
            m: articleName(d.matiere),
            q: formatQty(num(d.quantite_demandee), 3),
            s: STATUT_DEMANDE_MATIERE_LABEL[d.statut] ?? d.statut,
            a:
              can("LIVRER_DEMANDE_MATIERE") && d.statut !== "LIVREE_A_LA_PRODUCTION" && d.statut !== "ANNULEE" ? (
                <Button className="h-8 px-2.5 text-[12px]" onClick={() => void dispatch({ type: "LIVRER_DEMANDE_MATIERE", id: d.id })}>
                  Livrer
                </Button>
              ) : (
                "—"
              ),
          }))}
        />
      </Panel>

      {can("CREATE_COMPLEMENT") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
          <h2 className="col-span-full text-[13px] font-semibold">Demande complémentaire</h2>
          <Field label="OF">
            <select className={inputClass} value={compOf} onChange={(e) => setCompOf(Number(e.target.value))}>
              {ofOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Matière">
            <select className={inputClass} value={compMat} onChange={(e) => setCompMat(Number(e.target.value))}>
              {matieres.map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}
            </select>
          </Field>
          <Field label="Quantité">
            <input type="number" className={inputClass} value={compQty} onChange={(e) => setCompQty(Number(e.target.value))} />
          </Field>
          <Field label="Motif">
            <input className={inputClass} value={compMotif} onChange={(e) => setCompMotif(e.target.value)} />
          </Field>
          <Button
            disabled={!compOf || !compMat || compQty <= 0 || !compMotif.trim()}
            onClick={() =>
              void dispatch({
                type: "CREATE_COMPLEMENT",
                ordre_fabrication: compOf,
                matiere: compMat,
                quantite: compQty,
                motif: compMotif.trim(),
              })
            }
          >
            Demander complément
          </Button>
        </Panel>
      )}

      <Panel>
        <DataTable
          columns={[
            { key: "n", label: "N°" },
            { key: "of", label: "OF" },
            { key: "m", label: "Matière" },
            { key: "q", label: "Qté" },
            { key: "s", label: "Statut" },
            { key: "a", label: "" },
          ]}
          rows={state.demandesComplementaires.map((d) => ({
            n: d.numero,
            of: ofNumero(d.ordre_fabrication),
            m: articleName(d.matiere),
            q: formatQty(num(d.quantite), 3),
            s: STATUT_DEMANDE_COMPLEMENTAIRE_LABEL[d.statut] ?? d.statut,
            a:
              can("APPROUVER_COMPLEMENT") && d.statut === "EN_ATTENTE" ? (
                <div className="flex gap-2">
                  <Button className="h-8 px-2.5 text-[12px]" onClick={() => void dispatch({ type: "APPROUVER_COMPLEMENT", id: d.id })}>
                    Approuver
                  </Button>
                  <Button className="h-8 px-2.5 text-[12px]" variant="danger" onClick={() => void dispatch({ type: "REJETER_COMPLEMENT", id: d.id })}>
                    Rejeter
                  </Button>
                </div>
              ) : (
                "—"
              ),
          }))}
        />
      </Panel>

      {can("CREATE_SORTIE") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
          <h2 className="col-span-full text-[13px] font-semibold">Sortie manuelle</h2>
          <Field label="OF">
            <select className={inputClass} value={ofId} onChange={(e) => setOfId(Number(e.target.value))}>
              {ofOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Matière">
            <select className={inputClass} value={matiere} onChange={(e) => setMatiere(Number(e.target.value))}>
              {matieres.map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}
            </select>
          </Field>
          <Field label="Quantité">
            <input type="number" className={inputClass} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </Field>
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as TypeSortie)}>
              {(Object.keys(TYPE_SORTIE_LABEL) as TypeSortie[]).map((k) => (
                <option key={k} value={k}>{TYPE_SORTIE_LABEL[k]}</option>
              ))}
            </select>
          </Field>
          <Field label={motifObligatoire ? "Motif (obligatoire)" : "Motif"}>
            <input className={inputClass} value={motif} onChange={(e) => setMotif(e.target.value)} />
          </Field>
          <Button
            disabled={!canSortir}
            onClick={() => void dispatch({ type: "CREATE_SORTIE", ordre_fabrication: ofId, matiere, quantite_sortie: qty, type_sortie: type, motif })}
          >
            Sortir
          </Button>
        </Panel>
      )}

      <Panel>
        <DataTable
          columns={[{ key: "of", label: "OF" }, { key: "m", label: "Matière" }, { key: "q", label: "Qté" }, { key: "t", label: "Type" }]}
          rows={state.sortiesMatieres.map((s) => ({
            of: ofNumero(s.ordre_fabrication),
            m: articleName(s.matiere),
            q: formatQty(num(s.quantite_sortie), 3),
            t: TYPE_SORTIE_LABEL[s.type_sortie] ?? s.type_sortie,
          }))}
        />
      </Panel>

      {can("CREATE_RETOUR_MAT") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <h2 className="col-span-full text-[13px] font-semibold">Retour matière</h2>
          <Field label="OF">
            <select className={inputClass} value={retourOf} onChange={(e) => setRetourOf(Number(e.target.value))}>
              {ofOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Matière">
            <select className={inputClass} value={retourMat} onChange={(e) => setRetourMat(Number(e.target.value))}>
              {matieres.map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}
            </select>
          </Field>
          <Field label="Quantité">
            <input type="number" className={inputClass} value={retourQty} onChange={(e) => setRetourQty(Number(e.target.value))} />
          </Field>
          <Button
            disabled={!retourOf || !retourMat || retourQty <= 0}
            onClick={() => void dispatch({ type: "CREATE_RETOUR_MAT", ordre_fabrication: retourOf, matiere: retourMat, quantite_retournee: retourQty })}
          >
            Retourner
          </Button>
        </Panel>
      )}

      <Panel>
        <DataTable
          columns={[{ key: "of", label: "OF" }, { key: "m", label: "Matière" }, { key: "q", label: "Qté retournée" }]}
          rows={state.retoursMatieres.map((r) => ({
            of: ofNumero(r.ordre_fabrication),
            m: articleName(r.matiere),
            q: formatQty(num(r.quantite_retournee), 3),
          }))}
        />
      </Panel>
    </div>
  );
}
