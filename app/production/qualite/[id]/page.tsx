"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Ban, Check, ShieldCheck, X } from "lucide-react";
import { LotBadge } from "@/components/badges";
import { Historique } from "@/components/Historique";
import { Button, Guard, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { useStore } from "@/lib/store";
import { cn, formatDate, formatDateTime, formatQty, num } from "@/lib/utils";

export default function LotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, articleName, ofNumero, can, userName } = useStore();
  const lot = state.lots.find((l) => l.id === Number(id));
  const [obs, setObs] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  if (!lot) return <p className="text-[13px] text-muted">Lot introuvable.</p>;

  const ctrl = state.controles.filter((c) => c.lot === lot.id).sort((a, b) => new Date(b.date_controle).getTime() - new Date(a.date_controle).getTime())[0];
  const aControler = !ctrl && lot.statut === "EN_ATTENTE" && can("CREATE_CONTROLE");
  const peutLiberer = lot.statut === "CONFORME" && can("LIBERER_LOT");
  const peutBloquer = lot.statut !== "LIBERE" && lot.statut !== "BLOQUE" && !!ctrl && can("BLOQUER_LOT");
  const barre = aControler || peutLiberer || peutBloquer;

  async function run(key: string, action: Parameters<typeof dispatch>[0]) {
    setBusy(key);
    await dispatch(action);
    setBusy(null);
  }

  const lignes: [string, string][] = [
    ["Article", articleName(lot.article)],
    ["OF", ofNumero(lot.ordre_fabrication)],
    ["Quantité", formatQty(num(lot.quantite), 0)],
    ["Production", formatDate(lot.date_production)],
    ["Péremption", lot.date_peremption ? formatDate(lot.date_peremption) : "—"],
    ["Créé le", formatDateTime(lot.date_creation)],
  ];

  return (
    <div className="space-y-4 max-w-[1280px]">
      <Link href="/production/qualite" className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
        <ArrowLeft size={13} /> Lots qualité
      </Link>
      <PageHeader eyebrow="Lot" title={lot.numero_lot} status={<LotBadge status={lot.statut} />} description={`${articleName(lot.article)} · ${formatQty(num(lot.quantite), 0)}`} />

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* Gauche : synthèse + statut de vente */}
        <div className="space-y-3 min-w-0">
          {lot.statut === "LIBERE" ? (
            <Guard variant="ok" title="Lot libéré — vendable">
              Seul ce statut autorise la vente.
            </Guard>
          ) : lot.statut === "BLOQUE" || lot.statut === "NON_CONFORME" ? (
            <Guard variant="block" title={lot.statut === "BLOQUE" ? "Lot bloqué — non vendable" : "Lot non conforme — non vendable"}>
              {lot.statut === "BLOQUE" ? "Le lot ne peut être ni vendu ni livré." : "Bloquez le lot pour l’écarter définitivement."}
            </Guard>
          ) : (
            <Guard variant="warn" title="Lot non vendable pour l’instant">
              {lot.statut === "CONFORME" ? "Contrôle conforme : il reste à libérer le lot." : "Le lot doit être contrôlé puis libéré avant toute vente."}
            </Guard>
          )}
          <Panel className="overflow-hidden">
            <h2 className="px-4 py-3 border-b border-line text-[13px] font-semibold">Synthèse</h2>
            <dl className="divide-y divide-line">
              {lignes.map(([k, v]) => (
                <div key={k} className="px-4 py-2.5 flex justify-between gap-3 text-[13px]">
                  <dt className="text-muted shrink-0">{k}</dt>
                  <dd className="text-right min-w-0 break-words font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>

        {/* Droite : résultat du contrôle */}
        <Panel className="overflow-hidden min-w-0">
          <div className="px-4 py-3 border-b border-line flex items-center gap-2">
            <ShieldCheck size={15} className="text-muted" />
            <h2 className="text-[13px] font-semibold flex-1">Résultat du contrôle</h2>
            {ctrl && <StatusBadge tone={ctrl.resultat === "CONFORME" ? "success" : "danger"}>{ctrl.resultat === "CONFORME" ? "Conforme" : "Non conforme"}</StatusBadge>}
          </div>
          <div className="p-4 space-y-3">
            {ctrl ? (
              <div className="text-[13px] space-y-1">
                <p>
                  Contrôlé par <span className="font-medium">{userName(ctrl.controleur)}</span> le {formatDateTime(ctrl.date_controle)}
                </p>
                <p className="text-muted">{ctrl.observations || "Aucune observation."}</p>
              </div>
            ) : (
              <p className="text-[12.5px] text-muted">Pas encore contrôlé.</p>
            )}
            {(aControler || peutBloquer) && (
              <label className="block">
                <span className="block text-[11px] uppercase tracking-wide text-muted mb-1.5 font-medium">
                  {aControler ? "Observations" : "Motif du blocage"}
                </span>
                <textarea
                  className={cn(inputClass, "h-28 py-2 resize-none")}
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder={aControler ? "Analyses, aspect, étiquetage…" : "Obligatoire pour bloquer"}
                />
              </label>
            )}
          </div>
        </Panel>
      </div>

      <Historique endpoint={endpoints.lots} id={lot.id} />

      {/* Barre d’action fixée en bas */}
      {barre && (
        <div className="sticky bottom-0 z-20 -mx-3 sm:mx-0 px-3 sm:px-4 py-3 border-t sm:border border-line bg-surface/95 backdrop-blur-md sm:rounded-[10px] shadow-[var(--shadow)] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-[12px] text-muted flex-1 min-w-0">
            {aControler ? "Enregistrez le résultat du contrôle." : peutLiberer ? "Contrôle conforme : libérez le lot pour le rendre vendable." : "Le lot n’est pas conforme : bloquez-le."}
          </p>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {aControler && (
              <>
                <Button variant="danger" disabled={!!busy} onClick={() => void run("nc", { type: "CREATE_CONTROLE", lot: lot.id, resultat: "NON_CONFORME", observations: obs })}>
                  <X size={14} /> Non conforme
                </Button>
                <Button variant="success" disabled={!!busy} onClick={() => void run("c", { type: "CREATE_CONTROLE", lot: lot.id, resultat: "CONFORME", observations: obs })}>
                  <Check size={14} /> Conforme
                </Button>
              </>
            )}
            {peutBloquer && (
              <Button variant={peutLiberer ? "secondary" : "danger"} className={cn(peutLiberer && "text-danger")} disabled={!!busy || !obs.trim()} onClick={() => void run("b", { type: "BLOQUER_LOT", id: lot.id, motif: obs.trim() })}>
                <Ban size={14} /> Bloquer
              </Button>
            )}
            {peutLiberer && (
              <Button variant="success" disabled={!!busy} onClick={() => void run("l", { type: "LIBERER_LOT", id: lot.id })}>
                <ShieldCheck size={14} /> Libérer le lot
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
