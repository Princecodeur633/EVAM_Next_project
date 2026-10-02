"use client";

import { useState } from "react";
import { Percent, Plus } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/api/resources";
import { useStore } from "@/lib/store";
import type { FamilleFiscale } from "@/lib/types";
import { cn, num } from "@/lib/utils";

/** Fiscalité : familles à gauche, codes de la famille à droite, création de code en tiroir (code généré). */
export default function FiscalitePage() {
  const { state, canEditParam, dispatch, role } = useStore();
  const canEdit = canEditParam("/parametrage/fiscalite");
  const [choix, setChoix] = useState<number | null>(null);
  const [nouvelle, setNouvelle] = useState("");
  const [creation, setCreation] = useState(false);
  const familles = [...state.famillesFiscales].sort((a, b) => Number(b.actif) - Number(a.actif) || a.nom.localeCompare(b.nom, "fr"));
  const famille = familles.find((f) => f.id === choix) ?? familles[0] ?? null;
  const codes = famille ? state.codesFiscaux.filter((c) => c.famille_fiscale === famille.id) : [];
  const nbCodes = (f: FamilleFiscale) => state.codesFiscaux.filter((c) => c.famille_fiscale === f.id).length;
  const sansCode = state.articles.filter((a) => a.actif && a.type_article === "PRODUIT_FINI" && !a.code_fiscal).length;

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow={role === "COMPTABILITE_DAF" ? "Finance · étape 0" : "Référentiel"}
        title="Fiscalité"
        description="Matrice fiscale EVAM. Les taux ne se choisissent jamais à la vente : ils viennent du code fiscal rattaché à l’article."
        actions={
          canEdit && famille ? (
            <Button onClick={() => setCreation(true)}>
              <Plus size={15} /> Nouveau code
            </Button>
          ) : null
        }
      />
      {sansCode > 0 && (
        <p className="text-[12.5px] rounded-[9px] border border-warning/30 bg-warning-soft px-3.5 py-2.5">
          <span className="font-semibold text-warning">{sansCode} produit(s) fini(s) sans code fiscal</span> : leurs factures ne pourront pas être générées.
        </p>
      )}

      <div className="grid lg:grid-cols-[minmax(260px,1fr)_minmax(0,2fr)] gap-4 items-start">
        {/* Gauche : familles fiscales */}
        <Panel className="overflow-hidden lg:sticky lg:top-[72px]">
          <h2 className="px-4 py-3 border-b border-line text-[13px] font-semibold">Familles fiscales</h2>
          {familles.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12.5px] text-muted">Aucune famille fiscale.</p>
          ) : (
            <ul className="divide-y divide-line">
              {familles.map((f) => {
                const actif = f.id === famille?.id;
                return (
                  <li key={f.id} className={cn("flex items-center border-l-2", actif ? "bg-primary-soft border-primary" : "border-transparent")}>
                    <button type="button" onClick={() => setChoix(f.id)} className="flex-1 min-w-0 text-left px-4 py-2.5 hover:bg-surface-2/60">
                      <span className={cn("block text-[13px] truncate", actif ? "font-semibold" : "font-medium", !f.actif && "line-through text-muted")}>{f.nom}</span>
                      <span className="block text-[11.5px] text-muted">{nbCodes(f)} code(s)</span>
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        className="text-[11.5px] text-muted hover:text-primary px-3"
                        onClick={() => void dispatch({ type: "TOGGLE_VALEUR_LISTE", liste: "famille_fiscale", id: f.id, actif: !f.actif })}
                      >
                        {f.actif ? "Désactiver" : "Activer"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {canEdit && (
            <div className="p-3 border-t border-line flex gap-2">
              <input className={cn(inputClass, "h-8 text-[12.5px]")} value={nouvelle} onChange={(e) => setNouvelle(e.target.value)} placeholder="Nouvelle famille…" />
              <Button
                className="h-8 px-3"
                disabled={!nouvelle.trim()}
                onClick={() => {
                  void dispatch({ type: "CREATE_VALEUR_LISTE", liste: "famille_fiscale", valeur: nouvelle.trim() });
                  setNouvelle("");
                }}
              >
                <Plus size={14} />
              </Button>
            </div>
          )}
        </Panel>

        {/* Droite : codes de la famille */}
        <Panel className="overflow-hidden min-w-0">
          <div className="px-4 py-3 border-b border-line">
            <h2 className="text-[13px] font-semibold">{famille ? famille.nom : "Codes fiscaux"}</h2>
            <p className="text-[11.5px] text-muted">Centimes additionnels exprimés en % de la TVA.</p>
          </div>
          <DataTable
            emptyText={famille ? "Aucun code pour cette famille." : "Choisissez une famille."}
            columns={[
              { key: "c", label: "Code" },
              { key: "t", label: "TVA", className: "text-right" },
              { key: "a", label: "Accise", className: "text-right" },
              { key: "ca", label: "Centimes", className: "text-right" },
              { key: "art", label: "Articles", className: "text-right" },
              { key: "s", label: "Statut" },
            ]}
            rows={codes.map((c) => ({
              c: <span className="num font-medium">{c.code}</span>,
              t: <span className="num">{c.exonere ? "Exonéré" : `${num(c.taux_tva)} %`}</span>,
              a: <span className="num">{num(c.taux_accise)} %</span>,
              ca: <span className="num">{num(c.taux_centimes_additionnels)} %</span>,
              art: <span className="num">{state.articles.filter((a) => a.code_fiscal === c.id).length}</span>,
              s: c.actif ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="neutral">Inactif</StatusBadge>,
            }))}
          />
        </Panel>
      </div>

      {creation && famille && <NouveauCodeDrawer famille={famille} onClose={() => setCreation(false)} />}
    </div>
  );
}

function NouveauCodeDrawer({ famille, onClose }: { famille: FamilleFiscale; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [fam, setFam] = useState(famille.id);
  const [tva, setTva] = useState("18");
  const [centimes, setCentimes] = useState("5");
  const [accise, setAccise] = useState("0");
  const [exonere, setExonere] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setErr(null);
    try {
      await api.post(endpoints.codesFiscaux, {
        famille_fiscale: fam,
        exonere,
        taux_tva: exonere ? "0" : tva,
        taux_centimes_additionnels: centimes,
        taux_accise: accise,
        sfec_actif: true,
        actif: true,
      });
      await dispatch({ type: "REFRESH" });
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Création impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Nouveau code fiscal"
      subtitle="Le code (ex. EV-FISC-JUS-18) est généré automatiquement."
      icon={<Percent size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!fam || saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer le code"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Famille">
        <select className={inputClass} value={fam} onChange={(e) => setFam(Number(e.target.value))}>
          {state.famillesFiscales
            .filter((f) => f.actif || f.id === fam)
            .map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
        </select>
      </DrawerSection>
      <DrawerSection title="Taux">
        <label className="flex items-center gap-2.5 rounded-[9px] border border-line px-3.5 py-2.5 text-[13px] cursor-pointer">
          <input type="checkbox" className="h-4 w-4" checked={exonere} onChange={(e) => setExonere(e.target.checked)} />
          Exonéré de TVA
        </label>
        <div className="grid grid-cols-3 gap-3">
          <Field label="TVA %">
            <input className={cn(inputClass, "num text-right")} value={exonere ? "0" : tva} disabled={exonere} onChange={(e) => setTva(e.target.value)} />
          </Field>
          <Field label="Accise %">
            <input className={cn(inputClass, "num text-right")} value={accise} onChange={(e) => setAccise(e.target.value)} />
          </Field>
          <Field label="Centimes %">
            <input className={cn(inputClass, "num text-right")} value={centimes} onChange={(e) => setCentimes(e.target.value)} />
          </Field>
        </div>
        {err && <p className="text-[12.5px] text-danger">{err}</p>}
      </DrawerSection>
    </Drawer>
  );
}
