"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { RefCrud } from "@/components/RefCrud";
import { Button, Panel, PageHeader, StatusBadge, inputClass } from "@/components/ui";
import { actions, endpoints } from "@/lib/api";
import { SENS_COMPTE_LABEL, TYPE_ARTICLE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { SensCompte, TypeArticle } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ParametresComptablesPage() {
  const { state, dispatch, can } = useStore();
  const writable = can("PATCH_COMPTE_PARAMETRE");
  const [numeros, setNumeros] = useState<Record<number, string>>({});
  const [seuils, setSeuils] = useState<Record<number, string>>({});

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Comptabilité"
        title="Paramètres comptables"
        description="Plan de comptes utilisé par les écritures automatiques (valeurs SYSCOHADA proposées par défaut) et seuils des contrôles d'anomalies — modifiables sans intervention technique."
      />
      <Panel className="p-4 space-y-2">
        <h2 className="text-[13px] font-semibold">Plan de comptes</h2>
        <div className="divide-y divide-line">
          {state.comptesParametres.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 py-2 text-[13px]">
              <span>{c.role}</span>
              {writable ? (
                <span className="flex items-center gap-2">
                  <input
                    className="h-8 w-28 border border-line rounded px-2 text-[12px] text-right num"
                    value={numeros[c.id] ?? c.numero}
                    onChange={(e) => setNumeros((m) => ({ ...m, [c.id]: e.target.value }))}
                  />
                  <button
                    className="text-primary text-[12px]"
                    onClick={() => void dispatch({ type: "PATCH_COMPTE_PARAMETRE", id: c.id, numero: numeros[c.id] ?? c.numero })}
                  >
                    Enregistrer
                  </button>
                </span>
              ) : (
                <span className="num">{c.numero}</span>
              )}
            </div>
          ))}
        </div>
      </Panel>
      <Panel className="p-4 space-y-2">
        <h2 className="text-[13px] font-semibold">Seuils des contrôles automatiques</h2>
        <div className="divide-y divide-line">
          {state.seuilsControles.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 py-2 text-[13px]">
              <span>
                {s.libelle}
                <span className="text-muted"> (entre {s.minimum} et {s.maximum})</span>
              </span>
              {writable ? (
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    className="h-8 w-24 border border-line rounded px-2 text-[12px] text-right num"
                    value={seuils[s.id] ?? s.valeur}
                    onChange={(e) => setSeuils((m) => ({ ...m, [s.id]: e.target.value }))}
                  />
                  <button
                    className="text-primary text-[12px]"
                    onClick={() => void dispatch({ type: "PATCH_SEUIL_CONTROLE", id: s.id, valeur: Number(seuils[s.id] ?? s.valeur) })}
                  >
                    Enregistrer
                  </button>
                </span>
              ) : (
                <span className="num">{s.valeur}</span>
              )}
            </div>
          ))}
        </div>
      </Panel>
      <ReglesComptes />
    </div>
  );
}

/**
 * Règles de comptes : un article est rattaché au compte de la règle la plus précise (article >
 * format / unité de vente > catégorie > activité), sinon au compte par défaut du plan ci-dessus.
 */
function ReglesComptes() {
  const { state, can, articleName } = useStore();
  const writable = can("GERER_REGLES_COMPTES");
  const [article, setArticle] = useState(0);
  const [resultat, setResultat] = useState<{ article: string; compte_vente: string; compte_achat: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const opt = <T extends string>(labels: Record<T, string>) => (Object.keys(labels) as T[]).map((k) => ({ value: k, label: labels[k] }));

  return (
    <>
      <RefCrud
        titre="Règles de comptes"
        description="Compte de vente (702x…) ou d’achat (60x…) selon l’article, l’activité, la catégorie, le format ou l’unité de vente. La règle la plus précise l’emporte."
        items={state.reglesComptes}
        endpoint={endpoints.reglesComptes}
        refresh={["reglesComptes"]}
        writable={writable}
        rechercheDans={(r) => [r.compte, r.libelle, SENS_COMPTE_LABEL[r.sens], r.article ? articleName(r.article) : ""]}
        libelleItem={(r) => `${r.compte} · ${r.libelle || SENS_COMPTE_LABEL[r.sens]}`}
        valeursInitiales={{ sens: "VENTE", compte: "", libelle: "", article: 0, activite: 0, type_article: "", format: 0, unite_vente: 0, actif: true }}
        champs={[
          { cle: "sens", label: "Sens", type: "select", requis: true, options: opt<SensCompte>(SENS_COMPTE_LABEL) },
          { cle: "compte", label: "Numéro de compte", requis: true, placeholder: "7021, 6011…" },
          { cle: "libelle", label: "Libellé", pleineLargeur: true },
          { cle: "article", label: "Article", type: "select", options: state.articles.map((a) => ({ value: a.id, label: `${a.code} · ${a.designation}` })) },
          { cle: "activite", label: "Activité", type: "select", options: state.activites.map((a) => ({ value: a.id, label: a.designation })) },
          { cle: "type_article", label: "Catégorie d’article", type: "select", options: opt<TypeArticle>(TYPE_ARTICLE_LABEL) },
          { cle: "format", label: "Format", type: "select", options: state.formatsArticle.map((f) => ({ value: f.id, label: f.valeur })) },
          { cle: "unite_vente", label: "Unité de vente", type: "select", options: state.unitesVente.map((u) => ({ value: u.id, label: u.nom })) },
          { cle: "actif", label: "Active", type: "checkbox" },
        ]}
        colonnes={[
          { cle: "s", label: "Sens", rendu: (r) => SENS_COMPTE_LABEL[r.sens] },
          { cle: "c", label: "Compte", rendu: (r) => <span className="num font-medium">{r.compte}</span> },
          { cle: "l", label: "Libellé", rendu: (r) => r.libelle || "—" },
          {
            cle: "k",
            label: "Critère",
            rendu: (r) =>
              [
                r.article ? articleName(r.article) : null,
                r.activite ? state.activites.find((a) => a.id === r.activite)?.designation : null,
                r.type_article ? (TYPE_ARTICLE_LABEL[r.type_article as TypeArticle] ?? r.type_article) : null,
                r.format ? (state.formatsArticle.find((f) => f.id === r.format)?.valeur ?? `Format n°${r.format}`) : null,
                r.unite_vente ? (state.unitesVente.find((u) => u.id === r.unite_vente)?.nom ?? `Unité n°${r.unite_vente}`) : null,
              ]
                .filter(Boolean)
                .join(" · ") || "Tous",
          },
          { cle: "a", label: "Statut", rendu: (r) => (r.actif ? <StatusBadge tone="success">Active</StatusBadge> : <StatusBadge tone="neutral">Inactive</StatusBadge>) },
        ]}
      />
      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold flex items-center gap-2">
          <Calculator size={15} className="text-muted" /> Simuler l’affectation d’un article
        </h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <select aria-label="Article à simuler" className={cn(inputClass, "flex-1")} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
            <option value={0}>Choisir un article…</option>
            {state.articles.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.designation}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            disabled={!article || busy}
            onClick={async () => {
              setBusy(true);
              try {
                setResultat(await actions.simulerRegleCompte(article));
              } catch {
                setResultat(null);
              }
              setBusy(false);
            }}
          >
            Simuler
          </Button>
        </div>
        {resultat && (
          <p className="text-[13px]">
            <span className="font-medium">{resultat.article}</span> : vente au compte <span className="num font-semibold">{resultat.compte_vente}</span>, achat au compte{" "}
            <span className="num font-semibold">{resultat.compte_achat}</span>.
          </p>
        )}
      </Panel>
    </>
  );
}
