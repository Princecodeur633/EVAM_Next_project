"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Guard, PageHeader, Panel } from "@/components/ui";
import { actions } from "@/lib/api";
import type { PlanningProduction } from "@/lib/types";
import { cn, formatDateTime, formatQty, num } from "@/lib/utils";

const jour = (d: Date) => d.toISOString().slice(0, 10);
function decaler(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return jour(d);
}
const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

/** Planning par ligne : heures planifiées par jour face à la capacité (paramètres de production), surcharges, OF non planifiés. */
export default function ChargeLignesPage() {
  const [du, setDu] = useState(() => jour(new Date()));
  const [planning, setPlanning] = useState<PlanningProduction | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const au = decaler(du, 6);

  useEffect(() => {
    let annule = false;
    setPlanning(null);
    setErreur(null);
    void actions
      .planning({ du, au })
      .then((p) => !annule && setPlanning(p))
      .catch((e: unknown) => !annule && setErreur(e instanceof Error ? e.message : "Planning indisponible."));
    return () => {
      annule = true;
    };
  }, [du, au]);

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Production"
        title="Charge des lignes"
        description="Créneaux des OF sur chaque ligne (deux OF ne se chevauchent pas), charge journalière face à la capacité, et OF encore sans créneau."
        actions={
          <div className="flex items-center gap-1.5">
            <Button variant="secondary" className="h-9 w-9 px-0" aria-label="Semaine précédente" onClick={() => setDu(decaler(du, -7))}>
              <ChevronLeft size={15} />
            </Button>
            <input type="date" aria-label="Début de la période" className="h-9 px-2 rounded-[7px] border border-line-strong bg-surface text-[13px]" value={du} onChange={(e) => e.target.value && setDu(e.target.value)} />
            <Button variant="secondary" className="h-9 w-9 px-0" aria-label="Semaine suivante" onClick={() => setDu(decaler(du, 7))}>
              <ChevronRight size={15} />
            </Button>
          </div>
        }
      />
      {erreur && <Guard variant="block" title="Planning indisponible">{erreur}</Guard>}
      {!planning && !erreur && <p className="text-[13px] text-muted">Chargement…</p>}
      {planning && (
        <>
          <Panel className="overflow-hidden">
            {planning.lignes.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-muted">Aucune ligne active.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12.5px] min-w-[860px]">
                  <thead>
                    <tr className="border-b border-line bg-surface-2 text-[11px] uppercase tracking-[0.08em] text-muted">
                      <th className="px-4 py-2.5 text-left font-medium">Ligne</th>
                      {planning.lignes[0].jours.map((j) => (
                        <th key={j.date} className="px-2 py-2.5 text-center font-medium">
                          {JOURS[new Date(`${j.date}T00:00:00`).getDay()]} {j.date.slice(8, 10)}/{j.date.slice(5, 7)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {planning.lignes.map((l) => (
                      <tr key={l.ligne} className="align-top">
                        <td className="px-4 py-2.5 min-w-[220px]">
                          <p className="font-medium">
                            {l.ligne} · {l.designation}
                          </p>
                          <p className="text-[11.5px] text-muted">
                            {l.usine} · {l.activite}
                            {l.cadence && ` · ${formatQty(num(l.cadence), 0)} ${l.unite_cadence}`}
                          </p>
                          {l.ordres_fabrication.length > 0 && (
                            <ul className="mt-1.5 space-y-0.5">
                              {l.ordres_fabrication.map((o) => (
                                <li key={o.id} className="text-[11.5px]">
                                  <Link href={`/production/of/${o.id}`} className="num text-primary hover:underline">
                                    {o.numero}
                                  </Link>{" "}
                                  <span className="text-muted">
                                    {o.article} · {formatQty(num(o.quantite), 0)} · {formatDateTime(o.debut)} → {formatDateTime(o.fin)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        {l.jours.map((j) => {
                          const h = num(j.heures_planifiees);
                          return (
                            <td key={j.date} className="px-2 py-2.5 text-center">
                              <div
                                className={cn(
                                  "rounded-[6px] px-1.5 py-1 num",
                                  j.surcharge ? "bg-danger/15 text-danger font-semibold" : h > 0 ? "bg-primary-soft text-ink" : "text-muted",
                                )}
                                title={`${formatQty(h, 1)} h / ${formatQty(num(j.capacite_heures), 1)} h`}
                              >
                                {h > 0 ? `${formatQty(h, 1)} h` : "—"}
                                {j.taux_charge != null && h > 0 && <span className="block text-[10.5px]">{formatQty(j.taux_charge, 0)} %</span>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
          <Panel className="overflow-hidden">
            <h2 className="px-4 py-3 border-b border-line text-[13px] font-semibold">OF sans créneau ({planning.of_non_planifies.length})</h2>
            {planning.of_non_planifies.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12.5px] text-muted">Tous les OF actifs sont planifiés.</p>
            ) : (
              <ul className="divide-y divide-line text-[12.5px]">
                {planning.of_non_planifies.map((o) => (
                  <li key={o.id} className="px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <Link href={`/production/of/${o.id}`} className="num font-medium text-primary hover:underline">
                      {o.numero}
                    </Link>
                    <span className="text-muted">
                      {o.article} · {formatQty(num(o.quantite), 0)} · {o.ligne ? `ligne ${o.ligne}` : "sans ligne"} · {o.statut}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
