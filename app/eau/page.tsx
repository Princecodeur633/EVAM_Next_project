"use client";

import { useEffect, useState } from "react";
import { Calculator, Check, X } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { CalculCoutEauVue, ChoixSiteMois, fcfaCentimes, useSiteEauParDefaut } from "@/components/eau";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions } from "@/lib/api";
import { STATUT_STANDARD_EAU_LABEL, moisCourant, moisSuivant } from "@/lib/eau";
import { useStore } from "@/lib/store";
import type { CalculCoutEau, CoutStandardEau, StatutStandardEau } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

const TONE: Record<StatutStandardEau, "warning" | "success" | "danger"> = { PROPOSE: "warning", VALIDE: "success", REJETE: "danger" };

/**
 * Coût standard de l'eau traitée : le logiciel calcule (onglet « Calcul coût eau » du classeur),
 * le contrôle de gestion propose puis valide. Un standard validé s'applique à partir du mois suivant.
 */
export default function CoutStandardEauPage() {
  const { state, dispatch, can } = useStore();
  const gestion = can("PARAM_EAU");
  const defaut = useSiteEauParDefaut();
  const [choixUsine, setUsine] = useState(0);
  const usine = choixUsine || defaut;
  const [mois, setMois] = useState(moisCourant());
  const [calcul, setCalcul] = useState<CalculCoutEau | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState<CoutStandardEau | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!usine || !mois) return;
    let actif = true;
    actions
      .calculCoutEau(usine, mois)
      .then((c) => {
        if (actif) {
          setCalcul(c);
          setErreur(null);
        }
      })
      .catch((e: unknown) => {
        if (actif) {
          setCalcul(null);
          setErreur(e instanceof Error ? e.message : "Calcul impossible.");
        }
      });
    return () => {
      actif = false;
    };
  }, [usine, mois, state.versionsElementsCoutEau, state.previsionsVolumesEau, state.previsionsCaptageEau]);

  const standards = [...state.coutsStandardsEau].filter((c) => !usine || c.usine === usine).sort((a, b) => b.mois_application.localeCompare(a.mois_application) || b.id - a.id);
  const enVigueur = standards.filter((c) => c.statut === "VALIDE" && c.mois_application <= moisCourant())[0];

  async function proposer() {
    setBusy(true);
    await dispatch({ type: "EXEC", run: () => actions.proposerCoutEau(usine, mois), refresh: ["coutsStandardsEau"] });
    setBusy(false);
  }

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Coût de l’eau"
        title="Coût standard de l’eau traitée"
        description="Forage (part du site eau) + traitement, divisé par le volume d’eau du mois. Les montants restent exacts pendant le calcul et ne sont arrondis qu’à l’affichage."
      />
      <Panel className="p-4 space-y-3">
        <ChoixSiteMois usine={usine} mois={mois} onUsine={setUsine} onMois={setMois}>
          <div className="flex-1" />
          {enVigueur && (
            <p className="text-[12.5px]">
              En vigueur : <span className="font-semibold num">{fcfaCentimes(enVigueur.cout_m3)}</span> / m³ depuis {enVigueur.mois_application}
            </p>
          )}
          {gestion && (
            <Button disabled={busy || !calcul || calcul.bloquants.length > 0} onClick={() => void proposer()}>
              <Calculator size={14} /> Proposer comme standard de {mois}
            </Button>
          )}
        </ChoixSiteMois>
        {gestion && (
          <p className="text-[12px] text-muted">
            Seul le tout premier standard du site peut porter sur un mois commencé ; ensuite, un standard validé s’applique au plus tôt en {moisSuivant(moisCourant())}.
          </p>
        )}
      </Panel>
      {erreur && <p className="text-[12.5px] text-danger">{erreur}</p>}
      {calcul && <CalculCoutEauVue calcul={calcul} />}
      <Panel className="overflow-hidden">
        <h2 className="px-4 py-3 border-b border-line text-[13.5px] font-semibold">Versions du coût standard</h2>
        <DataTable
          emptyText="Aucun standard proposé."
          columns={[
            { key: "m", label: "À partir de" },
            { key: "c", label: "Coût au m³", className: "text-right" },
            { key: "t", label: "Coût du mois", className: "text-right" },
            { key: "s", label: "Statut" },
            { key: "p", label: "Proposé / décidé" },
          ]}
          rows={standards.map((c) => ({
            _id: c.id,
            m: `${c.usine_code} · ${c.mois_application}`,
            c: <span className="num font-medium">{fcfaCentimes(c.cout_m3)}</span>,
            t: <span className="num">{fcfaCentimes(c.cout_mensuel)}</span>,
            s: (
              <span className="inline-flex items-center gap-1.5">
                <StatusBadge tone={TONE[c.statut]}>{STATUT_STANDARD_EAU_LABEL[c.statut]}</StatusBadge>
                {enVigueur?.id === c.id && <StatusBadge tone="info">En vigueur</StatusBadge>}
              </span>
            ),
            p: (
              <span className="inline-flex flex-col text-[12px]">
                <span>
                  {c.propose_par_nom ?? "—"} · {formatDateTime(c.date_proposition)}
                </span>
                {c.date_validation && (
                  <span className="text-muted">
                    {c.valide_par_nom} · {formatDateTime(c.date_validation)}
                    {c.motif ? ` · ${c.motif}` : ""}
                  </span>
                )}
              </span>
            ),
          }))}
          onRowClick={(row) => setOuvert(standards.find((c) => c.id === row._id) ?? null)}
        />
      </Panel>
      {ouvert && <DetailStandard standard={ouvert} gestion={gestion} onClose={() => setOuvert(null)} />}
    </div>
  );
}

function DetailStandard({ standard, gestion, onClose }: { standard: CoutStandardEau; gestion: boolean; onClose: () => void }) {
  const { dispatch } = useStore();
  const [motif, setMotif] = useState("");
  const [busy, setBusy] = useState(false);
  const propose = standard.statut === "PROPOSE";

  async function decider(valider: boolean) {
    setBusy(true);
    const ok = await dispatch({
      type: "EXEC",
      run: () => (valider ? actions.validerCoutEau(standard.id, motif.trim()) : actions.rejeterCoutEau(standard.id, motif.trim())),
      refresh: ["coutsStandardsEau"],
    });
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      width="lg"
      title={`Standard ${standard.usine_code} · ${standard.mois_application}`}
      subtitle={`${fcfaCentimes(standard.cout_m3)} / m³ · ${STATUT_STANDARD_EAU_LABEL[standard.statut]}`}
      footer={
        gestion && propose ? (
          <div className="flex gap-2 justify-end w-full">
            <Button variant="danger" disabled={busy || !motif.trim()} onClick={() => void decider(false)}>
              <X size={14} /> Rejeter
            </Button>
            <Button variant="success" disabled={busy} onClick={() => void decider(true)}>
              <Check size={14} /> Valider
            </Button>
          </div>
        ) : undefined
      }
    >
      {gestion && propose && (
        <DrawerSection title="Décision" hint="Le motif est obligatoire pour rejeter.">
          <Field label="Motif">
            <textarea className={cn(inputClass, "h-16 py-2")} value={motif} onChange={(e) => setMotif(e.target.value)} />
          </Field>
        </DrawerSection>
      )}
      <DrawerSection title="Calcul conservé" hint="Le détail qui a produit cette version.">
        <CalculCoutEauVue calcul={standard.detail} />
      </DrawerSection>
    </Drawer>
  );
}
