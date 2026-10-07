"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Ban, Check, GitBranch, ShieldCheck, X } from "lucide-react";
import { LotBadge } from "@/components/badges";
import { Historique } from "@/components/Historique";
import { ControleLigne, NcBadge, SaisieControleDrawer, controlesEnAttente } from "@/components/qualite";
import { Button, DataTable, Guard, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions, endpoints } from "@/lib/api";
import type { ControleRealise, Lot, NonConformite, TracabiliteLot } from "@/lib/types";
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
  // Les contrôles du plan font référence : tant qu’un contrôle bloquant reste à faire ou qu’une NC
  // bloquante est ouverte, le lot ne peut pas être déclaré conforme (le backend le refuse aussi).
  const blocages = blocagesDuLot(lot, state.controlesRealises, state.nonConformites);
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
    ["Stock produits finis", state.depots.find((d) => d.id === lot.depot)?.nom ?? "Dépôt produits finis"],
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

      <ControlesDuLot lot={lot} />

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
            <h2 className="text-[13px] font-semibold flex-1">Décision finale du lot</h2>
            {ctrl && <StatusBadge tone={ctrl.resultat === "CONFORME" ? "success" : "danger"}>{ctrl.resultat === "CONFORME" ? "Conforme" : "Non conforme"}</StatusBadge>}
          </div>
          <div className="p-4 space-y-3">
            {blocages.length > 0 && !ctrl && (
              <Guard variant="block" title="Contrôles du plan à terminer">
                <ul className="space-y-0.5">
                  {blocages.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </Guard>
            )}
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

      <Tracabilite lot={lot} />

      <Historique endpoint={endpoints.lots} id={lot.id} />

      {/* Barre d’action fixée en bas */}
      {barre && (
        <div className="sticky bottom-0 z-20 -mx-3 sm:mx-0 px-3 sm:px-4 py-3 border-t sm:border border-line bg-surface/95 backdrop-blur-md sm:rounded-[10px] shadow-[var(--shadow)] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-[12px] text-muted flex-1 min-w-0">
            {aControler
              ? blocages.length
                ? "Terminez d’abord les contrôles du plan : le lot ne peut pas encore être déclaré conforme."
                : "Contrôles du plan terminés : enregistrez la décision finale du lot."
              : peutLiberer ? "Contrôle conforme : libérez le lot pour le rendre vendable." : "Le lot n’est pas conforme : bloquez-le."}
          </p>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {aControler && (
              <>
                <Button variant="danger" disabled={!!busy} onClick={() => void run("nc", { type: "CREATE_CONTROLE", lot: lot.id, resultat: "NON_CONFORME", observations: obs })}>
                  <X size={14} /> Non conforme
                </Button>
                <Button
                  variant="success"
                  disabled={!!busy || blocages.length > 0}
                  title={blocages.length ? "Contrôles du plan à terminer avant de déclarer le lot conforme" : undefined}
                  onClick={() => void run("c", { type: "CREATE_CONTROLE", lot: lot.id, resultat: "CONFORME", observations: obs })}
                >
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

/**
 * Contrôles du plan rattachés au lot (et ceux de son OF sans lot précis) : un contrôle bloquant non
 * réalisé ou une NC bloquante ouverte empêche de déclarer le lot conforme et de le libérer.
 */
function ControlesDuLot({ lot }: { lot: Lot }) {
  const { state } = useStore();
  const [ouvert, setOuvert] = useState<ControleRealise | null>(null);
  const controles = state.controlesRealises.filter((c) => c.lot === lot.id || (lot.ordre_fabrication != null && c.ordre_fabrication === lot.ordre_fabrication && c.lot == null));
  const ncs = state.nonConformites.filter((n) => n.lot === lot.id || (lot.ordre_fabrication != null && n.ordre_fabrication === lot.ordre_fabrication));
  const bloquants = controlesEnAttente(controles).filter((c) => c.bloquant).length + ncs.filter((n) => n.bloquante && n.statut !== "CLOTUREE").length;
  if (controles.length === 0 && ncs.length === 0) return null;
  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <Panel className="overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center gap-2">
          <h2 className="text-[13px] font-semibold flex-1">Contrôles du plan ({controles.length})</h2>
          {bloquants > 0 && <StatusBadge tone="danger">{bloquants} blocage(s)</StatusBadge>}
        </div>
        <div className="divide-y divide-line max-h-[360px] overflow-y-auto">
          {controles.length === 0 && <p className="px-4 py-6 text-center text-[12.5px] text-muted">Aucun contrôle.</p>}
          {controles.map((c) => (
            <ControleLigne key={c.id} controle={c} onClick={() => setOuvert(c)} />
          ))}
        </div>
      </Panel>
      <Panel className="overflow-hidden">
        <h2 className="px-4 py-3 border-b border-line text-[13px] font-semibold">Non-conformités ({ncs.length})</h2>
        {ncs.length === 0 ? (
          <p className="px-4 py-6 text-center text-[12.5px] text-muted">Aucune non-conformité.</p>
        ) : (
          <ul className="divide-y divide-line">
            {ncs.map((n) => (
              <li key={n.id} className="px-4 py-2.5 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium">
                    {n.numero}
                    {n.bloquante && <span className="text-danger"> · bloquante</span>}
                  </p>
                  <p className="text-[12px] text-muted break-words">{n.description}</p>
                </div>
                <NcBadge nc={n} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {ouvert && <SaisieControleDrawer controle={ouvert} onClose={() => setOuvert(null)} />}
    </div>
  );
}

/** Traçabilité amont du lot : OF, ligne, recette, lots matières consommés, contrôles, NC et transferts. */
function Tracabilite({ lot }: { lot: Lot }) {
  const [t, setT] = useState<TracabiliteLot | null>(null);
  const [erreur, setErreur] = useState(false);
  useEffect(() => {
    let annule = false;
    void actions
      .tracabiliteLot(lot.id)
      .then((r) => !annule && setT(r))
      .catch(() => !annule && setErreur(true));
    return () => {
      annule = true;
    };
  }, [lot.id, lot.statut]);
  if (erreur) return null;
  return (
    <Panel className="overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center gap-2">
        <GitBranch size={15} className="text-muted" />
        <h2 className="text-[13px] font-semibold">Traçabilité</h2>
      </div>
      {!t ? (
        <p className="px-4 py-6 text-[12.5px] text-muted">Chargement…</p>
      ) : (
        <div className="p-4 space-y-4">
          {t.of ? (
            <dl className="grid sm:grid-cols-3 gap-x-6 gap-y-1.5 text-[12.5px]">
              {[
                ["OF", t.of.numero],
                ["Ligne", t.of.ligne ?? "—"],
                ["Usine", t.of.usine ?? "—"],
                ["Circuit", t.of.circuit ?? "—"],
                ["Recette", t.of.recette ?? "—"],
                ["Production", t.of.date_debut ? formatDateTime(t.of.date_debut) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium text-right">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-[12.5px] text-muted">Lot sans OF rattaché.</p>
          )}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted font-medium mb-1.5">Matières et emballages consommés</p>
            <div className="rounded-[9px] border border-line overflow-hidden">
              <DataTable
                emptyText="Aucun lot matière tracé (stock antérieur au suivi par lot)."
                columns={[
                  { key: "a", label: "Article" },
                  { key: "l", label: "Lot interne" },
                  { key: "f", label: "Lot fournisseur" },
                  { key: "x", label: "Fournisseur" },
                  { key: "d", label: "DLC" },
                  { key: "q", label: "Quantité", className: "text-right" },
                ]}
                rows={t.matieres.map((m) => ({
                  a: m.article,
                  l: <span className="num">{m.lot}</span>,
                  f: m.lot_fournisseur || "—",
                  x: m.fournisseur ?? "—",
                  d: m.date_peremption ? formatDate(m.date_peremption) : "—",
                  q: <span className="num">{formatQty(num(m.quantite), 3)}</span>,
                }))}
              />
            </div>
          </div>
          {t.transferts.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted font-medium mb-1.5">Transferts vers les dépôts</p>
              <ul className="rounded-[9px] border border-line divide-y divide-line">
                {t.transferts.map((x) => (
                  <li key={x.bon} className="px-3 py-2 flex justify-between gap-3 text-[12.5px]">
                    <span>
                      <span className="num font-medium">{x.bon}</span> → {x.vers}
                    </span>
                    <span className="text-muted">
                      {formatQty(num(x.quantite), 0)} · {x.statut}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

/** Ce qui empêche de déclarer le lot conforme : contrôles bloquants à faire, NC bloquantes ouvertes. */
function blocagesDuLot(lot: Lot, controles: ControleRealise[], ncs: NonConformite[]) {
  const duLot = (o: { lot: number | null; ordre_fabrication: number | null }) =>
    o.lot === lot.id || (lot.ordre_fabrication != null && o.ordre_fabrication === lot.ordre_fabrication && o.lot == null);
  const aFaire = controlesEnAttente(controles.filter(duLot)).filter((c) => c.bloquant);
  const ouvertes = ncs.filter((n) => duLot(n) && n.bloquante && n.statut !== "CLOTUREE");
  return [
    ...aFaire.map((c) => `Contrôle bloquant à réaliser : ${c.controle ?? c.numero}`),
    ...ouvertes.map((n) => `Non-conformité bloquante ouverte : ${n.numero}`),
  ];
}
