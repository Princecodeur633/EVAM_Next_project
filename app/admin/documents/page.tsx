"use client";

import { useEffect, useState } from "react";
import { Eye, ImageUp, Trash2 } from "lucide-react";
import { Button, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions, apiBlob } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { ParametreEntreprise } from "@/lib/types";
import { cn } from "@/lib/utils";

type Champ = { cle: keyof ParametreEntreprise; label: string; long?: boolean };

const IDENTITE: Champ[] = [
  { cle: "raison_sociale", label: "Raison sociale" },
  { cle: "forme_juridique", label: "Forme juridique" },
  { cle: "capital", label: "Capital social" },
  { cle: "activite", label: "Activité" },
  { cle: "adresse", label: "Adresse" },
  { cle: "ville", label: "Ville / pays" },
  { cle: "telephone", label: "Téléphone" },
  { cle: "email", label: "Email" },
  { cle: "site_web", label: "Site web" },
];
const LEGAL: Champ[] = [
  { cle: "ifu", label: "IFU" },
  { cle: "rccm", label: "RCCM" },
  { cle: "regime_fiscal", label: "Régime fiscal" },
  { cle: "centre_impots", label: "Centre des impôts" },
  { cle: "banque", label: "Banque et RIB" },
];
const MENTIONS: Champ[] = [
  { cle: "conditions_paiement", label: "Conditions de paiement (factures)", long: true },
  { cle: "mentions_pied_de_page", label: "Autres mentions de pied de page", long: true },
];

/**
 * Identité de l’entreprise imprimée sur tous les documents PDF (factures, avoirs, bons de commande,
 * reçus, bons de livraison, de transfert et de sortie) : en-tête, pied de page, mentions légales, logo.
 */
export default function DocumentsPage() {
  const { dispatch, can } = useStore();
  const writable = can("PARAM_DOCUMENTS");
  const [param, setParam] = useState<ParametreEntreprise | null>(null);
  const [form, setForm] = useState<Partial<ParametreEntreprise>>({});
  const [logo, setLogo] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function charger() {
    try {
      const p = await actions.entreprise();
      setParam(p);
      setForm(p);
      if (p.a_un_logo) {
        const blob = await apiBlob("/documents/entreprise/logo/");
        setLogo((ancien) => {
          if (ancien) URL.revokeObjectURL(ancien);
          return URL.createObjectURL(blob);
        });
      } else {
        setLogo(null);
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Paramètres indisponibles.");
    }
  }

  useEffect(() => {
    void charger();
  }, []);

  const dirty = !!param && Object.keys(form).some((k) => form[k as keyof ParametreEntreprise] !== param[k as keyof ParametreEntreprise]);
  const couleurValide = /^#[0-9A-Fa-f]{6}$/.test(String(form.couleur ?? ""));

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    const ok = await dispatch({ type: "EXEC", run: fn, refresh: [] });
    setBusy(false);
    if (ok) await charger();
  }

  const champ = (c: Champ) => (
    <div key={c.cle} className={cn(c.long && "sm:col-span-2")}>
      <Field label={c.label}>
        {c.long ? (
          <textarea className={cn(inputClass, "h-20 py-2")} disabled={!writable} value={String(form[c.cle] ?? "")} onChange={(e) => setForm((f) => ({ ...f, [c.cle]: e.target.value }))} />
        ) : (
          <input className={inputClass} disabled={!writable} value={String(form[c.cle] ?? "")} onChange={(e) => setForm((f) => ({ ...f, [c.cle]: e.target.value }))} />
        )}
      </Field>
    </div>
  );

  if (erreur) return <Panel className="p-4 text-[13px] text-danger">{erreur}</Panel>;
  if (!param) return <Panel className="p-4 text-[13px] text-muted">Chargement…</Panel>;

  return (
    <div className="space-y-4 max-w-[1100px]">
      <PageHeader
        eyebrow="Administration"
        title="Documents imprimés"
        description="Identité de l’entreprise reprise sur tous les PDF : factures, avoirs, bons de commande, reçus de caisse, bons de livraison, de transfert et de sortie matières."
        status={!writable ? <StatusBadge tone="neutral">Consultation</StatusBadge> : undefined}
        actions={
          <Button variant="secondary" onClick={() => void actions.pdf("apercu", null, "exemple").catch(() => {})}>
            <Eye size={15} /> Aperçu d’un document
          </Button>
        }
      />
      <Panel className="p-4 grid sm:grid-cols-[180px_minmax(0,1fr)] gap-4 items-start">
        <div className="h-[120px] rounded-[10px] border border-dashed border-line-strong bg-surface-2 flex items-center justify-center overflow-hidden">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="Logo de l’entreprise" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-[12px] text-muted">Aucun logo</span>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <h2 className="text-[13px] font-semibold">Logo et couleur</h2>
            <p className="text-[12px] text-muted">PNG ou JPEG, 2 Mo maximum. La couleur sert aux titres et aux tableaux des documents.</p>
          </div>
          {writable && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-medium rounded-[7px] border border-line-strong bg-surface hover:bg-surface-2 cursor-pointer">
                <ImageUp size={15} /> {param.a_un_logo ? "Remplacer le logo" : "Envoyer un logo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const fichier = e.target.files?.[0];
                    if (fichier) void run(() => actions.envoyerLogo(fichier));
                    e.target.value = "";
                  }}
                />
              </label>
              {param.a_un_logo && (
                <Button variant="ghost" className="text-danger" disabled={busy} onClick={() => void run(() => actions.supprimerLogo())}>
                  <Trash2 size={14} /> Retirer
                </Button>
              )}
            </div>
          )}
          <div className="flex items-end gap-2">
            <Field label="Couleur des documents">
              <input className={cn(inputClass, "w-[130px] font-mono", !couleurValide && "border-danger")} disabled={!writable} value={String(form.couleur ?? "")} onChange={(e) => setForm((f) => ({ ...f, couleur: e.target.value }))} />
            </Field>
            {writable && <input type="color" aria-label="Choisir la couleur" className="h-9 w-12 rounded-[7px] border border-line-strong bg-surface" value={couleurValide ? String(form.couleur) : "#0A6676"} onChange={(e) => setForm((f) => ({ ...f, couleur: e.target.value.toUpperCase() }))} />}
          </div>
        </div>
      </Panel>
      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Identité</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{IDENTITE.map(champ)}</div>
      </Panel>
      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Mentions légales et bancaires</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{LEGAL.map(champ)}</div>
      </Panel>
      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Mentions des documents</h2>
        <div className="grid sm:grid-cols-2 gap-3">{MENTIONS.map(champ)}</div>
      </Panel>
      {writable && (
        <div className="sticky bottom-0 z-20 px-4 py-3 border border-line bg-surface/95 backdrop-blur-md rounded-[10px] shadow-[var(--shadow)] flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted">{dirty ? "Modifications non enregistrées." : "À jour."}</p>
          <Button
            disabled={!dirty || !couleurValide || busy}
            onClick={() => {
              const { a_un_logo: _ignore, ...champs } = form;
              void _ignore;
              void run(() => actions.modifierEntreprise(champs));
            }}
          >
            {busy ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      )}
    </div>
  );
}
