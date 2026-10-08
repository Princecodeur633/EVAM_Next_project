"use client";

import { useState } from "react";
import { AlertTriangle, Ban, Beaker, ClipboardCheck, FlaskConical, Paperclip, RotateCcw } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { Button, Field, StatusBadge, inputClass } from "@/components/ui";
import { actions, ouvrirPdf } from "@/lib/api";
import { DECISION_NC_LABEL, STATUT_CONTROLE_REALISE_LABEL, STATUT_LOT_MATIERE_LABEL, STATUT_NC_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { ControleRealise, DecisionNC, NonConformite, PieceJointeQualite, StatutControleRealise, StatutLotMatiere, StatutNC } from "@/lib/types";
import { cn, formatDateTime, formatQty, num } from "@/lib/utils";

const TONE_CONTROLE: Record<StatutControleRealise, "neutral" | "info" | "success" | "warning" | "danger"> = {
  A_REALISER: "warning",
  EN_ATTENTE_VALIDATION: "info",
  CONFORME: "success",
  NON_CONFORME: "danger",
  ANNULE: "neutral",
};

export function ControleBadge({ controle }: { controle: Pick<ControleRealise, "statut" | "en_retard"> }) {
  if (controle.en_retard) return <StatusBadge tone="danger">En retard</StatusBadge>;
  return <StatusBadge tone={TONE_CONTROLE[controle.statut]}>{STATUT_CONTROLE_REALISE_LABEL[controle.statut]}</StatusBadge>;
}

const TONE_NC: Record<StatutNC, "danger" | "warning" | "success"> = { OUVERTE: "danger", EN_COURS: "warning", CLOTUREE: "success" };

export function NcBadge({ nc }: { nc: Pick<NonConformite, "statut"> }) {
  return <StatusBadge tone={TONE_NC[nc.statut]}>{STATUT_NC_LABEL[nc.statut]}</StatusBadge>;
}

const TONE_LOT_MATIERE: Record<StatutLotMatiere, "warning" | "success" | "danger" | "neutral"> = {
  A_CONTROLER: "warning",
  LIBERE: "success",
  BLOQUE: "danger",
  EPUISE: "neutral",
};

export function LotMatiereBadge({ statut }: { statut: StatutLotMatiere }) {
  return <StatusBadge tone={TONE_LOT_MATIERE[statut]}>{STATUT_LOT_MATIERE_LABEL[statut]}</StatusBadge>;
}

/**
 * Pièce jointe qualité (photo, bulletin d’analyse) : stockée en base et servie par une adresse
 * protégée, donc ouverte avec le jeton (un simple lien ne l’enverrait pas).
 */
export function PieceJointeLien({ piece }: { piece: PieceJointeQualite }) {
  const chemin = piece.url.replace(/^\/api/, "");
  const taille = piece.taille ? ` · ${Math.max(1, Math.round(piece.taille / 1024))} Ko` : "";
  return (
    <button
      type="button"
      className="text-[12.5px] flex items-center gap-1.5 text-primary hover:underline text-left min-w-0"
      onClick={() => void ouvrirPdf(chemin, piece.nom_fichier).catch(() => {})}
    >
      <Paperclip size={12} className="text-muted shrink-0" />
      <span className="truncate">
        {piece.description || piece.nom_fichier}
        <span className="text-muted">{taille}</span>
      </span>
    </button>
  );
}

/** Contrôles encore à faire (à réaliser ou au laboratoire), les plus urgents d’abord. */
export function controlesEnAttente(controles: ControleRealise[]) {
  return controles
    .filter((c) => c.statut === "A_REALISER" || c.statut === "EN_ATTENTE_VALIDATION")
    .sort((a, b) => Number(b.en_retard) - Number(a.en_retard) || Number(b.bloquant) - Number(a.bloquant) || (a.date_prevue ?? "").localeCompare(b.date_prevue ?? ""));
}

/** Ligne compacte d’un contrôle (liste atelier, fiche OF, lot matière). */
export function ControleLigne({ controle, onClick }: { controle: ControleRealise; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-surface-2 transition-colors disabled:hover:bg-transparent"
    >
      <span className={cn("mt-0.5 h-7 w-7 shrink-0 rounded-[7px] flex items-center justify-center", controle.bloquant ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary")}>
        <ClipboardCheck size={14} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium truncate">{controle.controle ?? controle.numero}</span>
        <span className="block text-[11.5px] text-muted truncate">
          {controle.numero}
          {controle.critere ? ` · ${controle.critere}${controle.unite ? ` ${controle.unite}` : ""}` : ""}
          {controle.bloquant ? " · bloquant" : ""}
        </span>
        {controle.valeur != null && (
          <span className="block text-[11.5px] num mt-0.5">
            Mesuré : {formatQty(num(controle.valeur), 3)} {controle.unite}
          </span>
        )}
      </span>
      <ControleBadge controle={controle} />
    </button>
  );
}

/**
 * Saisie du résultat d’un contrôle (valeur mesurée ou conforme / non conforme). La conformité est
 * calculée par le backend selon le plan ; un résultat non conforme ouvre automatiquement une NC
 * (bloquante si le contrôle l’est). La Qualité peut aussi annuler ou ouvrir une reprise.
 */
export function SaisieControleDrawer({ controle, onClose }: { controle: ControleRealise; onClose: () => void }) {
  const { state, dispatch, can } = useStore();
  const numerique = controle.type_resultat !== "QUALITATIF";
  const sansCritere = numerique && !controle.critere;
  const [valeur, setValeur] = useState("");
  const [qualitatif, setQualitatif] = useState<"" | "CONFORME" | "NON_CONFORME">("");
  const [instrument, setInstrument] = useState<number>(controle.instrument ?? 0);
  const [echantillon, setEchantillon] = useState(controle.reference_echantillon ?? "");
  const [commentaire, setCommentaire] = useState("");
  const [motifAnnulation, setMotifAnnulation] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const ouvert = controle.statut === "A_REALISER" || controle.statut === "EN_ATTENTE_VALIDATION";
  const instruments = state.instruments.filter((i) => i.actif);
  const refresh = ["controlesRealises", "nonConformites", "lots", "lotsMatieres", "ofList"] as const;

  const valide = numerique ? valeur.trim() !== "" && (!sansCritere || qualitatif !== "") : qualitatif !== "";

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    const ok = await dispatch({ type: "EXEC", run: fn, refresh: [...refresh] });
    setBusy(false);
    if (ok) onClose();
  }

  async function enregistrer() {
    await run(async () => {
      await actions.enregistrerControle(controle.id, {
        ...(numerique ? { valeur: Number(valeur) } : {}),
        ...(qualitatif ? { resultat_qualitatif: qualitatif } : {}),
        instrument: instrument || null,
        commentaire: commentaire.trim(),
        reference_echantillon: echantillon.trim(),
      });
      if (fichier) await actions.joindrePieceQualite({ resultat: controle.id }, fichier);
    });
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={controle.controle ?? "Contrôle"}
      subtitle={
        <span>
          {controle.numero}
          {controle.of_numero && ` · OF ${controle.of_numero}`}
          {controle.lot_numero && ` · lot ${controle.lot_numero}`}
          {controle.lot_matiere_numero && ` · lot matière ${controle.lot_matiere_numero}`}
        </span>
      }
      icon={<ClipboardCheck size={17} />}
      footer={
        ouvert && can("SAISIR_CONTROLE") ? (
          <>
            {controle.statut === "A_REALISER" && (
              <Button variant="secondary" disabled={busy} onClick={() => void run(() => actions.envoyerAuLaboratoire(controle.id, echantillon.trim()))}>
                <FlaskConical size={14} /> Au laboratoire
              </Button>
            )}
            <Button disabled={!valide || busy} onClick={() => void enregistrer()}>
              {busy ? "Enregistrement…" : "Enregistrer le résultat"}
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="flex flex-wrap gap-1.5">
        <ControleBadge controle={controle} />
        {controle.bloquant && <StatusBadge tone="danger">Bloquant</StatusBadge>}
        {controle.est_reprise && <StatusBadge tone="info">Reprise</StatusBadge>}
      </div>

      <DrawerSection title="Critère du plan de contrôle">
        <dl className="text-[12.5px] space-y-1.5">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Paramètre</dt>
            <dd className="font-medium text-right">
              {controle.parametre ?? "—"}
              {controle.unite ? ` (${controle.unite})` : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Critère d’acceptation</dt>
            <dd className="font-medium text-right">{controle.critere ?? (numerique ? "Non chiffré au plan" : "Conforme / non conforme")}</dd>
          </div>
          {controle.date_prevue && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Prévu le</dt>
              <dd className={cn("text-right", controle.en_retard && "text-danger font-medium")}>{formatDateTime(controle.date_prevue)}</dd>
            </div>
          )}
          {controle.date_realisation && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Réalisé le</dt>
              <dd className="text-right">
                {formatDateTime(controle.date_realisation)}
                {controle.operateur_nom ? ` par ${controle.operateur_nom}` : ""}
              </dd>
            </div>
          )}
          {controle.valeur != null && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Valeur mesurée</dt>
              <dd className="font-semibold num text-right">
                {formatQty(num(controle.valeur), 3)} {controle.unite}
              </dd>
            </div>
          )}
          {controle.commentaire && <p className="text-muted pt-1">{controle.commentaire}</p>}
        </dl>
      </DrawerSection>

      {ouvert && can("SAISIR_CONTROLE") && (
        <DrawerSection title="Résultat" hint="La conformité est calculée automatiquement à partir du critère ; un résultat non conforme ouvre une non-conformité.">
          {numerique && (
            <Field label={`Valeur mesurée${controle.unite ? ` (${controle.unite})` : ""}`}>
              <input type="number" inputMode="decimal" step="any" className={cn(inputClass, "h-11 num text-right text-[17px] font-semibold")} value={valeur} onChange={(e) => setValeur(e.target.value)} autoFocus />
            </Field>
          )}
          {(!numerique || sansCritere) && (
            <div>
              <span className="block text-[11px] uppercase tracking-wide text-muted mb-1.5 font-medium">{numerique ? "Aucun critère chiffré : résultat observé" : "Résultat observé"}</span>
              <div className="grid grid-cols-2 gap-2">
                {(["CONFORME", "NON_CONFORME"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setQualitatif(r)}
                    aria-pressed={qualitatif === r}
                    className={cn(
                      "h-11 rounded-[8px] border text-[13.5px] font-medium transition-colors",
                      qualitatif === r ? (r === "CONFORME" ? "bg-success text-white border-success" : "bg-danger text-white border-danger") : "bg-surface border-line-strong hover:bg-surface-2",
                    )}
                  >
                    {r === "CONFORME" ? "Conforme" : "Non conforme"}
                  </button>
                ))}
              </div>
            </div>
          )}
          {instruments.length > 0 && (
            <Field label="Instrument utilisé">
              <select className={inputClass} value={instrument} onChange={(e) => setInstrument(Number(e.target.value))}>
                <option value={0}>Aucun</option>
                {instruments.map((i) => (
                  <option key={i.id} value={i.id} disabled={i.etalonnage_valide === false}>
                    {i.code} · {i.designation}
                    {i.etalonnage_valide === false ? " (étalonnage dépassé)" : ""}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Réf. échantillon">
              <input className={inputClass} value={echantillon} onChange={(e) => setEchantillon(e.target.value)} />
            </Field>
            <Field label="Commentaire">
              <input className={inputClass} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
            </Field>
          </div>
          {can("JOINDRE_PIECE_QUALITE") && (
            <Field label="Photo / bulletin d’analyse">
              <input type="file" accept="image/*,application/pdf" className="block w-full text-[12.5px]" onChange={(e) => setFichier(e.target.files?.[0] ?? null)} />
            </Field>
          )}
        </DrawerSection>
      )}

      {(controle.pieces_jointes?.length ?? 0) > 0 && (
        <DrawerSection title="Pièces jointes">
          <ul className="space-y-1">
            {controle.pieces_jointes?.map((p) => (
              <li key={p.id}>
                <PieceJointeLien piece={p} />
              </li>
            ))}
          </ul>
        </DrawerSection>
      )}

      {controle.statut === "NON_CONFORME" && can("REPRISE_CONTROLE") && (
        <DrawerSection title="Reprise" hint="Nouveau contrôle / contre-analyse : indispensable pour libérer après une NC bloquante.">
          <Button variant="secondary" disabled={busy} onClick={() => void run(() => actions.repriseControle(controle.id))}>
            <RotateCcw size={14} /> Ouvrir un contrôle de reprise
          </Button>
        </DrawerSection>
      )}

      {ouvert && can("ANNULER_CONTROLE") && (
        <DrawerSection title="Annuler le contrôle">
          <div className="flex gap-2">
            <input className={inputClass} placeholder="Motif (obligatoire)" value={motifAnnulation} onChange={(e) => setMotifAnnulation(e.target.value)} />
            <Button variant="danger" disabled={!motifAnnulation.trim() || busy} onClick={() => void run(() => actions.annulerControle(controle.id, motifAnnulation.trim()))}>
              <Ban size={14} /> Annuler
            </Button>
          </div>
        </DrawerSection>
      )}
    </Drawer>
  );
}

/** Clôture d’une non-conformité : décision et action corrective (Qualité). */
export function ClotureNcDrawer({ nc, onClose }: { nc: NonConformite; onClose: () => void }) {
  const { dispatch } = useStore();
  const [decision, setDecision] = useState<DecisionNC | "">("");
  const [action, setAction] = useState(nc.action_corrective ?? "");
  const [busy, setBusy] = useState(false);

  async function cloturer() {
    setBusy(true);
    const ok = await dispatch({
      type: "EXEC",
      run: () => actions.cloturerNC(nc.id, decision, action.trim()),
      refresh: ["nonConformites", "controlesRealises", "lots", "lotsMatieres"],
    });
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={`Clôturer ${nc.numero}`}
      subtitle={nc.description}
      icon={<Beaker size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!decision || !action.trim() || busy} onClick={() => void cloturer()}>
            {busy ? "Clôture…" : "Clôturer la NC"}
          </Button>
        </>
      }
    >
      {nc.bloquante && (
        <div className="rounded-[8px] border border-warning/30 bg-warning-soft px-3 py-2.5 flex items-start gap-2 text-[12.5px]">
          <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
          <p>NC bloquante : une libération n’est acceptée que si un contrôle de reprise conforme a été enregistré.</p>
        </div>
      )}
      <DrawerSection title="Décision">
        <div className="grid gap-2">
          {(Object.keys(DECISION_NC_LABEL) as DecisionNC[]).map((d) => (
            <label key={d} className={cn("flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[13px] cursor-pointer", decision === d ? "border-primary bg-primary-soft/50" : "border-line")}>
              <input type="radio" name="decision" checked={decision === d} onChange={() => setDecision(d)} />
              {DECISION_NC_LABEL[d]}
            </label>
          ))}
        </div>
      </DrawerSection>
      <DrawerSection title="Action corrective (obligatoire)">
        <textarea className={cn(inputClass, "h-24 py-2")} value={action} onChange={(e) => setAction(e.target.value)} />
      </DrawerSection>
    </Drawer>
  );
}
