"use client";

import { useEffect, useState } from "react";
import { ChoixSiteMois, useSiteEauParDefaut } from "@/components/eau";
import { DataTable, Guard, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { actions } from "@/lib/api";
import { BLOC_EAU_LABEL, TYPE_COMPTEUR_LABEL, moisCourant } from "@/lib/eau";
import { useStore } from "@/lib/store";
import type { SyntheseTraitementEau } from "@/lib/types";
import { formatDate, formatQty, num } from "@/lib/utils";

const m3 = (v: string | null) => (v == null ? "—" : `${formatQty(num(v), 3)} m³`);

/** Synthèse du mois du traitement de l'eau (sans aucun coût) : volumes, partage du forage, heures machine, pertes. */
export default function SyntheseTraitementPage() {
  const { state } = useStore();
  const defaut = useSiteEauParDefaut();
  const [choixUsine, setUsine] = useState(0);
  const usine = choixUsine || defaut;
  const [mois, setMois] = useState(moisCourant());
  const [s, setS] = useState<SyntheseTraitementEau | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!usine || !mois) return;
    let actif = true;
    actions
      .syntheseTraitementEau(usine, mois)
      .then((r) => {
        if (actif) {
          setS(r);
          setErreur(null);
        }
      })
      .catch((e: unknown) => {
        if (actif) {
          setS(null);
          setErreur(e instanceof Error ? e.message : "Synthèse impossible.");
        }
      });
    return () => {
      actif = false;
    };
  }, [usine, mois, state.relevesCompteursEau, state.exceptionsHeuresEau, state.pertesEau]);

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Traitement de l’eau"
        title="Synthèse du mois"
        description="Volume d’un compteur = dernier index du mois − dernier index du mois précédent. Heures machine = heures standard − exceptions (jusqu’à aujourd’hui pour le mois en cours)."
      />
      <Panel className="p-4">
        <ChoixSiteMois usine={usine} mois={mois} onUsine={setUsine} onMois={setMois}>
          {s && <p className="text-[12.5px] text-muted sm:ml-auto">Compté jusqu’au {formatDate(s.jusqu_au)}</p>}
        </ChoixSiteMois>
      </Panel>
      {erreur && <p className="text-[12.5px] text-danger">{erreur}</p>}
      {s && (
        <>
          {s.alertes.length > 0 && (
            <Guard variant="warn" title={`${s.alertes.length} alerte(s)`}>
              <ul className="space-y-0.5">
                {s.alertes.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </Guard>
          )}
          <div className="grid lg:grid-cols-2 gap-3">
            <Panel className="overflow-hidden">
              <h2 className="px-4 py-2.5 border-b border-line text-[13px] font-semibold">Compteurs</h2>
              <DataTable
                emptyText="Aucun compteur actif."
                columns={[
                  { key: "c", label: "Compteur" },
                  { key: "t", label: "Type" },
                  { key: "v", label: "Volume du mois", className: "text-right" },
                ]}
                rows={s.compteurs.map((c) => ({
                  c: `${c.code} · ${c.libelle}`,
                  t: c.site_desservi ? `${TYPE_COMPTEUR_LABEL[c.type].split(" (")[0]} → ${c.site_desservi}` : TYPE_COMPTEUR_LABEL[c.type].split(" (")[0],
                  v: <span className="num">{m3(c.volume_m3)}</span>,
                }))}
              />
            </Panel>
            <Panel className="p-4 space-y-1 text-[13px]">
              <h2 className="text-[13px] font-semibold mb-1">Partage réel du forage</h2>
              <p>Vers le site eau : <span className="num">{m3(s.partage_forage.volume_site_eau_m3)}</span></p>
              <p>Vers les autres sites : <span className="num">{m3(s.partage_forage.volume_autres_sites_m3)}</span></p>
              <p className="font-medium">
                Part du site eau : {s.partage_forage.part_site_eau != null ? `${formatQty(num(s.partage_forage.part_site_eau) * 100, 2)} %` : "—"}
              </p>
              <p>Compteur du forage : <span className="num">{m3(s.partage_forage.compteur_forage_m3)}</span></p>
              <p>
                Écart compteur − débitmètres : <span className="num">{m3(s.partage_forage.ecart_compteur_debitmetres_m3)}</span>
              </p>
              <h2 className="text-[13px] font-semibold pt-2">Pertes du mois</h2>
              <p>
                Normales : <span className="num">{m3(s.pertes.normales_m3)}</span> · Anormales : <span className="num">{m3(s.pertes.anormales_m3)}</span> ({s.pertes.declarations} déclaration(s))
              </p>
            </Panel>
          </div>
          <Panel className="overflow-hidden">
            <h2 className="px-4 py-2.5 border-b border-line text-[13px] font-semibold">
              Heures machine · total {formatQty(num(s.total_kw_heures), 1)} kWh
            </h2>
            <DataTable
              emptyText="Aucun équipement avec des heures standard ce mois."
              columns={[
                { key: "e", label: "Équipement" },
                { key: "j", label: "Jours", className: "text-right" },
                { key: "h", label: "Standard − exceptions", className: "text-right" },
                { key: "r", label: "Heures retenues", className: "text-right" },
                { key: "k", label: "kW × h", className: "text-right" },
              ]}
              rows={s.heures_machine.map((h) => ({
                e: (
                  <span className="inline-flex flex-col">
                    <span>
                      {h.code} · {h.designation}
                    </span>
                    <span className="text-[11.5px] text-muted">{h.bloc ? BLOC_EAU_LABEL[h.bloc].split(" (")[0] : <StatusBadge tone="neutral">Hors coût de l’eau</StatusBadge>}</span>
                  </span>
                ),
                j: <span className="num">{h.jours_de_marche}</span>,
                h: (
                  <span className="num">
                    {h.heures_standard} − {h.heures_en_moins}
                  </span>
                ),
                r: <span className="num font-medium">{h.heures_retenues} h</span>,
                k: <span className="num">{h.kw_heures ?? "—"}</span>,
              }))}
            />
          </Panel>
        </>
      )}
    </div>
  );
}
