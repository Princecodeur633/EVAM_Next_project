"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Historique } from "@/components/Historique";
import { Button, Field, PageHeader, StatusBadge, inputClass } from "@/components/ui";
import { endpoints } from "@/lib/api";
import {
  RESULTAT_CONTROLE_RETOUR_LABEL,
  STATUT_RECLAMATION_LABEL,
  STATUT_RECONDITIONNEMENT_LABEL,
  STATUT_RETOUR_PHYSIQUE_LABEL,
  TYPE_PROBLEME_LABEL,
  TYPE_SOLUTION_LABEL,
} from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { ResultatControleRetour, TypeSolution } from "@/lib/types";
import { cn, formatDa, formatDateTime, formatQty, num } from "@/lib/utils";

type Etape = { key: string; titre: string; done: boolean; contenu: ReactNode; date?: string };

export default function ReclamationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, articleName, clientName, can, userName } = useStore();
  const reclamation = state.reclamations.find((r) => r.id === Number(id));
  const retour = state.retoursPhysiques.find((r) => r.reclamation === reclamation?.id);
  const controle = state.controlesRetour.find((c) => c.retour_physique === retour?.id);
  const recond = state.reconditionnements.find((r) => r.controle_retour === controle?.id);
  const solution = state.solutionsReclamation.find((s) => s.reclamation === reclamation?.id);

  const [qtyRetour, setQtyRetour] = useState("");
  const [resultat, setResultat] = useState<ResultatControleRetour>("RECUPERABLE_DIRECT");
  const [obs, setObs] = useState("");
  const [typeSol, setTypeSol] = useState<TypeSolution>("AVOIR");
  const [montant, setMontant] = useState("");
  const [qtyRecond, setQtyRecond] = useState("");
  const [busy, setBusy] = useState(false);

  if (!reclamation) return <p className="text-[13px] text-muted">Réclamation introuvable.</p>;
  const qtyDefaut = num(reclamation.quantite);

  async function run(action: Parameters<typeof dispatch>[0]) {
    setBusy(true);
    await dispatch(action);
    setBusy(false);
  }

  const etapes: Etape[] = [
    {
      key: "creee",
      titre: "Réclamation enregistrée",
      done: true,
      date: reclamation.date_creation,
      contenu: (
        <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13px]">
          <dt className="text-muted">Problème</dt>
          <dd>{TYPE_PROBLEME_LABEL[reclamation.type_probleme]}</dd>
          <dt className="text-muted">Quantité</dt>
          <dd className="num">{formatQty(qtyDefaut, 0)}</dd>
          <dt className="text-muted">Description</dt>
          <dd className="break-words">{reclamation.description || "—"}</dd>
          <dt className="text-muted">Par</dt>
          <dd>{userName(reclamation.cree_par)}</dd>
          <dt className="text-muted">Produit retourné</dt>
          <dd>{reclamation.produit_retourne ? "Oui" : "Non"}</dd>
        </dl>
      ),
    },
  ];

  if (reclamation.produit_retourne) {
    etapes.push({
      key: "retour",
      titre: "Retour physique en quarantaine",
      done: !!retour,
      date: retour?.date_reception,
      contenu: retour ? (
        <p className="text-[13px]">
          {formatQty(num(retour.quantite_retournee), 0)} reçu(s) · {STATUT_RETOUR_PHYSIQUE_LABEL[retour.statut]} · par {userName(retour.receptionne_par)}
        </p>
      ) : can("CREATE_RETOUR_PHYSIQUE") ? (
        <div className="flex flex-col sm:flex-row sm:items-end gap-2">
          <Field label="Quantité retournée">
            <input type="number" min="0" className={cn(inputClass, "num text-right sm:w-40")} value={qtyRetour} placeholder={String(qtyDefaut)} onChange={(e) => setQtyRetour(e.target.value)} />
          </Field>
          <Button disabled={busy} onClick={() => void run({ type: "CREATE_RETOUR_PHYSIQUE", reclamation: reclamation.id, quantite_retournee: Number(qtyRetour) || qtyDefaut })}>
            Réceptionner en quarantaine
          </Button>
        </div>
      ) : (
        <p className="text-[12.5px] text-muted">En attente de réception par le magasin.</p>
      ),
    });
    etapes.push({
      key: "controle",
      titre: "Contrôle du retour",
      done: !!controle,
      date: controle?.date_controle,
      contenu: controle ? (
        <div className="text-[13px] space-y-1">
          <StatusBadge tone={controle.resultat === "NON_RECUPERABLE" ? "danger" : "success"}>{RESULTAT_CONTROLE_RETOUR_LABEL[controle.resultat]}</StatusBadge>
          <p className="text-muted">{controle.observations || "Aucune observation."} · par {userName(controle.controle_par)}</p>
        </div>
      ) : can("CREATE_CONTROLE_RETOUR") ? (
        <div className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-2">
            {(Object.keys(RESULTAT_CONTROLE_RETOUR_LABEL) as ResultatControleRetour[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setResultat(k)}
                aria-pressed={resultat === k}
                className={cn(
                  "min-h-10 px-3 py-2 rounded-[8px] border text-[12.5px] font-medium text-left transition-colors",
                  resultat === k ? (k === "NON_RECUPERABLE" ? "bg-danger text-white border-danger" : "bg-primary text-white border-primary") : "border-line-strong bg-surface hover:bg-surface-2",
                )}
              >
                {RESULTAT_CONTROLE_RETOUR_LABEL[k]}
              </button>
            ))}
          </div>
          <Field label="Observations">
            <input className={inputClass} value={obs} onChange={(e) => setObs(e.target.value)} />
          </Field>
          <Button disabled={busy || !retour} onClick={() => retour && void run({ type: "CREATE_CONTROLE_RETOUR", retour_physique: retour.id, resultat, observations: obs })}>
            Enregistrer le contrôle
          </Button>
          <p className="text-[11.5px] text-muted">La décision s’applique automatiquement : réintégration, reconditionnement ou rebut.</p>
        </div>
      ) : (
        <p className="text-[12.5px] text-muted">En attente du contrôle qualité.</p>
      ),
    });
  }

  if (recond) {
    etapes.push({
      key: "recond",
      titre: "Reconditionnement",
      done: recond.statut !== "EN_ATTENTE",
      date: recond.date_traitement ?? recond.date_creation,
      contenu:
        recond.statut === "EN_ATTENTE" && can("TERMINER_RECONDITIONNEMENT") ? (
          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
            <Field label="Quantité reconditionnée">
              <input type="number" min="0" className={cn(inputClass, "num text-right sm:w-40")} value={qtyRecond} placeholder={String(qtyDefaut)} onChange={(e) => setQtyRecond(e.target.value)} />
            </Field>
            <Button disabled={busy} onClick={() => void run({ type: "TERMINER_RECONDITIONNEMENT", id: recond.id, quantite_reconditionnee: Number(qtyRecond) || qtyDefaut })}>
              Terminer & réintégrer
            </Button>
          </div>
        ) : (
          <p className="text-[13px]">
            {STATUT_RECONDITIONNEMENT_LABEL[recond.statut]}
            {recond.quantite_reconditionnee != null && ` · ${formatQty(num(recond.quantite_reconditionnee), 0)} réintégré(s)`}
          </p>
        ),
    });
  }

  etapes.push({
    key: "solution",
    titre: "Solution client et clôture",
    done: !!solution,
    date: solution?.date_creation,
    contenu: solution ? (
      <p className="text-[13px]">
        {TYPE_SOLUTION_LABEL[solution.type_solution]}
        {solution.montant_avoir != null && ` · avoir ${formatDa(num(solution.montant_avoir))}`}
        {solution.montant_rembourse != null && ` · remboursé ${formatDa(num(solution.montant_rembourse))}`} · réclamation clôturée
      </p>
    ) : can("CREATE_SOLUTION") && reclamation.statut !== "CLOTUREE" ? (
      <div className="flex flex-col sm:flex-row sm:items-end gap-2 flex-wrap">
        <Field label="Type">
          <select className={inputClass} value={typeSol} onChange={(e) => setTypeSol(e.target.value as TypeSolution)}>
            {(Object.keys(TYPE_SOLUTION_LABEL) as TypeSolution[]).map((k) => (
              <option key={k} value={k}>
                {TYPE_SOLUTION_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
        {(typeSol === "AVOIR" || typeSol === "REMBOURSEMENT") && (
          <Field label="Montant">
            <input type="number" min="0" className={cn(inputClass, "num text-right sm:w-40")} value={montant} onChange={(e) => setMontant(e.target.value)} />
          </Field>
        )}
        <Button
          disabled={busy}
          onClick={() =>
            void run({
              type: "CREATE_SOLUTION",
              reclamation: reclamation.id,
              type_solution: typeSol,
              montant_avoir: typeSol === "AVOIR" ? Number(montant) : undefined,
              montant_rembourse: typeSol === "REMBOURSEMENT" ? Number(montant) : undefined,
            })
          }
        >
          Appliquer la solution
        </Button>
      </div>
    ) : (
      <p className="text-[12.5px] text-muted">En attente de la solution commerciale.</p>
    ),
  });

  // Parcours : seules les étapes franchies + l’étape courante sont visibles.
  const courante = etapes.findIndex((e) => !e.done);
  const visibles = courante === -1 ? etapes : etapes.slice(0, courante + 1);

  return (
    <div className="space-y-4 max-w-[860px]">
      <Link href="/reclamations" className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
        <ArrowLeft size={13} /> Réclamations
      </Link>
      <PageHeader
        eyebrow="Réclamation"
        title={reclamation.numero}
        description={`${clientName(reclamation.client)} · ${articleName(reclamation.article)}`}
        status={<StatusBadge tone={reclamation.statut === "CLOTUREE" ? "success" : reclamation.statut === "EN_COURS" ? "info" : "warning"}>{STATUT_RECLAMATION_LABEL[reclamation.statut]}</StatusBadge>}
      />

      <ol className="relative">
        {visibles.map((e, i) => {
          const actif = i === courante;
          const dernier = i === visibles.length - 1;
          return (
            <li key={e.key} className="relative pl-11 pb-4 last:pb-0">
              {!dernier && <span className={cn("absolute left-[15px] top-8 bottom-0 w-px", e.done ? "bg-success/50" : "bg-line-strong")} aria-hidden />}
              <span
                className={cn(
                  "absolute left-0 top-1 h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-semibold num",
                  e.done ? "bg-success text-white" : "bg-primary text-white ring-4 ring-primary/20",
                )}
              >
                {e.done ? <Check size={15} strokeWidth={2.5} /> : i + 1}
              </span>
              <div className={cn("rounded-[10px] border p-4 space-y-2.5", actif ? "border-primary/40 bg-primary-soft/40 shadow-[var(--shadow)]" : "border-line bg-surface")}>
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <h2 className="text-[13.5px] font-semibold">
                    {e.titre}
                    {actif && <span className="ml-2 text-[10px] uppercase tracking-wide font-semibold text-primary">Étape en cours</span>}
                  </h2>
                  {e.date && e.done && <span className="text-[11.5px] text-muted num">{formatDateTime(e.date)}</span>}
                </div>
                {e.contenu}
              </div>
            </li>
          );
        })}
      </ol>

      <Historique endpoint={endpoints.reclamations} id={reclamation.id} />
    </div>
  );
}
