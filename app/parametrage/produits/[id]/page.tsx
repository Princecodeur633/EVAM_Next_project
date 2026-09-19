"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { MOMENT_CONTROLE_LABEL, TYPE_ARTICLE_LABEL, UNITE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { MomentControle } from "@/lib/types";

export default function ProduitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, canEditParam, role, familleFiscaleName } = useStore();
  const article = state.articles.find((a) => a.id === Number(id));
  const canEditFiche = canEditParam("/parametrage/produits");
  const canGererQualite = role === "RESPONSABLE_PRODUCTION" || role === "RESPONSABLE_QUALITE" || role === "ADMIN_SI";

  const [form, setForm] = useState(() => ({
    designation: article?.designation ?? "",
    famille: article?.famille ?? 0,
    sous_famille: article?.sous_famille ?? "",
    marque: article?.marque ?? "",
    format: article?.format ?? 0,
    parfum: article?.parfum ?? 0,
    unite_vente: article?.unite_vente ?? 0,
    code_fiscal: article?.code_fiscal ?? 0,
    suivi_par_lot: article?.suivi_par_lot ?? true,
    duree_conservation_jours: article?.duree_conservation_jours ?? 0,
    stock_minimum: article?.stock_minimum ?? "0",
    stock_alerte: article?.stock_alerte ?? "0",
    emplacement_stockage: article?.emplacement_stockage ?? "",
    compte_vente: article?.compte_vente ?? "",
    activite_analytique: article?.activite_analytique ?? "",
    centre_cout: article?.centre_cout ?? "",
  }));

  useEffect(() => {
    if (!article) return;
    setForm({
      designation: article.designation,
      famille: article.famille ?? 0,
      sous_famille: article.sous_famille ?? "",
      marque: article.marque ?? "",
      format: article.format ?? 0,
      parfum: article.parfum ?? 0,
      unite_vente: article.unite_vente ?? 0,
      code_fiscal: article.code_fiscal ?? 0,
      suivi_par_lot: article.suivi_par_lot ?? true,
      duree_conservation_jours: article.duree_conservation_jours ?? 0,
      stock_minimum: article.stock_minimum ?? "0",
      stock_alerte: article.stock_alerte ?? "0",
      emplacement_stockage: article.emplacement_stockage ?? "",
      compte_vente: article.compte_vente ?? "",
      activite_analytique: article.activite_analytique ?? "",
      centre_cout: article.centre_cout ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.id]);

  const controles = state.controlesQualiteRequis.filter((c) => c.article === Number(id));
  const [typeControle, setTypeControle] = useState("");
  const [norme, setNorme] = useState("");
  const [moment, setMoment] = useState<MomentControle>("AVANT_LIBERATION");
  const [obligatoire, setObligatoire] = useState(true);

  if (!article) return <p className="text-[13px] text-muted">Article introuvable.</p>;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Référentiel"
        title={`${article.code} · ${article.designation}`}
        description={TYPE_ARTICLE_LABEL[article.type_article]}
      />

      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Identité</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <Field label="Désignation">
            <input className={inputClass} disabled={!canEditFiche} value={form.designation} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} />
          </Field>
          <Field label="Famille">
            <select className={inputClass} disabled={!canEditFiche} value={form.famille} onChange={(e) => setForm((f) => ({ ...f, famille: Number(e.target.value) }))}>
              <option value={0}>—</option>
              {state.famillesArticle.filter((v) => v.actif || v.id === form.famille).map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
            </select>
          </Field>
          <Field label="Sous-famille">
            <input className={inputClass} disabled={!canEditFiche} value={form.sous_famille} onChange={(e) => setForm((f) => ({ ...f, sous_famille: e.target.value }))} />
          </Field>
          <Field label="Marque">
            <input className={inputClass} disabled={!canEditFiche} value={form.marque} onChange={(e) => setForm((f) => ({ ...f, marque: e.target.value }))} />
          </Field>
          <Field label="Format">
            <select className={inputClass} disabled={!canEditFiche} value={form.format} onChange={(e) => setForm((f) => ({ ...f, format: Number(e.target.value) }))}>
              <option value={0}>—</option>
              {state.formatsArticle.filter((v) => v.actif || v.id === form.format).map((v) => <option key={v.id} value={v.id}>{v.valeur}</option>)}
            </select>
          </Field>
          <Field label="Parfum / variante">
            <select className={inputClass} disabled={!canEditFiche} value={form.parfum} onChange={(e) => setForm((f) => ({ ...f, parfum: Number(e.target.value) }))}>
              <option value={0}>—</option>
              {state.parfums.filter((v) => v.actif || v.id === form.parfum).map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
            </select>
          </Field>
          <Field label="Unité de gestion">
            <input className={inputClass} disabled value={UNITE_LABEL[article.unite_mesure]} />
          </Field>
          <Field label="Unité de vente">
            <select className={inputClass} disabled={!canEditFiche} value={form.unite_vente} onChange={(e) => setForm((f) => ({ ...f, unite_vente: Number(e.target.value) }))}>
              <option value={0}>—</option>
              {state.unitesVente.filter((v) => v.actif || v.id === form.unite_vente).map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
            </select>
          </Field>
        </div>
      </Panel>

      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Fiscalité</h2>
        <p className="text-[12px] text-muted">
          Le taux de TVA/accise n&apos;est jamais choisi à la vente : il découle du code fiscal rattaché ici. Sans code fiscal actif, l&apos;article ne peut pas être facturé.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Code fiscal">
            <select className={inputClass} disabled={!canEditFiche} value={form.code_fiscal} onChange={(e) => setForm((f) => ({ ...f, code_fiscal: Number(e.target.value) }))}>
              <option value={0}>— aucun (non facturable) —</option>
              {state.codesFiscaux.filter((c) => c.actif).map((c) => (
                <option key={c.id} value={c.id}>{c.code} · {familleFiscaleName(c.famille_fiscale)}</option>
              ))}
            </select>
          </Field>
        </div>
      </Panel>

      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Stock & traçabilité</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <label className="flex items-center gap-2 text-[13px] pb-2">
            <input type="checkbox" disabled={!canEditFiche} checked={form.suivi_par_lot} onChange={(e) => setForm((f) => ({ ...f, suivi_par_lot: e.target.checked }))} />
            Suivi par lot
          </label>
          <Field label="Durée de conservation (jours)">
            <input type="number" className={inputClass} disabled={!canEditFiche} value={form.duree_conservation_jours ?? 0} onChange={(e) => setForm((f) => ({ ...f, duree_conservation_jours: Number(e.target.value) }))} />
          </Field>
          <Field label="Stock minimum">
            <input type="number" className={inputClass} disabled={!canEditFiche} value={form.stock_minimum} onChange={(e) => setForm((f) => ({ ...f, stock_minimum: e.target.value }))} />
          </Field>
          <Field label="Stock d'alerte">
            <input type="number" className={inputClass} disabled={!canEditFiche} value={form.stock_alerte} onChange={(e) => setForm((f) => ({ ...f, stock_alerte: e.target.value }))} />
          </Field>
          <Field label="Emplacement de stockage">
            <input className={inputClass} disabled={!canEditFiche} value={form.emplacement_stockage} onChange={(e) => setForm((f) => ({ ...f, emplacement_stockage: e.target.value }))} />
          </Field>
        </div>
      </Panel>

      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Comptabilité analytique</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <Field label="Compte de vente (ex : 701200)">
            <input className={inputClass} disabled={!canEditFiche} value={form.compte_vente} onChange={(e) => setForm((f) => ({ ...f, compte_vente: e.target.value }))} />
          </Field>
          <Field label="Activité analytique">
            <input className={inputClass} disabled={!canEditFiche} value={form.activite_analytique} onChange={(e) => setForm((f) => ({ ...f, activite_analytique: e.target.value }))} />
          </Field>
          <Field label="Centre de coût">
            <input className={inputClass} disabled={!canEditFiche} value={form.centre_cout} onChange={(e) => setForm((f) => ({ ...f, centre_cout: e.target.value }))} />
          </Field>
        </div>
      </Panel>

      {canEditFiche && (
        <Button
          onClick={() =>
            void dispatch({
              type: "PATCH_ARTICLE",
              id: article.id,
              designation: form.designation,
              famille: form.famille || null,
              sous_famille: form.sous_famille,
              marque: form.marque,
              format: form.format || null,
              parfum: form.parfum || null,
              unite_vente: form.unite_vente || null,
              code_fiscal: form.code_fiscal || null,
              suivi_par_lot: form.suivi_par_lot,
              duree_conservation_jours: form.duree_conservation_jours || null,
              stock_minimum: Number(form.stock_minimum),
              stock_alerte: Number(form.stock_alerte),
              emplacement_stockage: form.emplacement_stockage,
              compte_vente: form.compte_vente,
              activite_analytique: form.activite_analytique,
              centre_cout: form.centre_cout,
            })
          }
        >
          Enregistrer la fiche article
        </Button>
      )}

      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Contrôles qualité requis</h2>
        <p className="text-[12px] text-muted">Liste théorique des contrôles attendus pour cet article, distincte des contrôles réellement effectués sur un lot (module Qualité).</p>
        {canGererQualite && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
            <Field label="Type de contrôle">
              <input className={inputClass} placeholder="pH, Microbiologie…" value={typeControle} onChange={(e) => setTypeControle(e.target.value)} />
            </Field>
            <Field label="Norme / seuil">
              <input className={inputClass} placeholder="pH entre 3,5 et 4,2" value={norme} onChange={(e) => setNorme(e.target.value)} />
            </Field>
            <Field label="Moment">
              <select className={inputClass} value={moment} onChange={(e) => setMoment(e.target.value as MomentControle)}>
                {(Object.keys(MOMENT_CONTROLE_LABEL) as MomentControle[]).map((k) => (
                  <option key={k} value={k}>{MOMENT_CONTROLE_LABEL[k]}</option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-[13px] pb-2">
              <input type="checkbox" checked={obligatoire} onChange={(e) => setObligatoire(e.target.checked)} />
              Obligatoire avant libération
            </label>
            <Button
              disabled={!typeControle.trim() || !norme.trim()}
              onClick={() => {
                void dispatch({
                  type: "CREATE_CONTROLE_QUALITE_REQUIS",
                  article: article.id,
                  type_controle: typeControle.trim(),
                  norme_ou_seuil: norme.trim(),
                  moment,
                  obligatoire,
                });
                setTypeControle("");
                setNorme("");
              }}
            >
              Ajouter
            </Button>
          </div>
        )}
        <DataTable
          columns={[
            { key: "t", label: "Type de contrôle" },
            { key: "n", label: "Norme / seuil" },
            { key: "m", label: "Moment" },
            { key: "o", label: "Obligatoire" },
          ]}
          rows={controles.map((c) => ({
            t: c.type_controle,
            n: c.norme_ou_seuil,
            m: MOMENT_CONTROLE_LABEL[c.moment] ?? c.moment,
            o: c.obligatoire ? "Oui" : "Non",
          }))}
        />
      </Panel>
    </div>
  );
}
