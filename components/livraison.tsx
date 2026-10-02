"use client";

import { useState } from "react";
import { AlertTriangle, PenLine } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { Button, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { BonLivraison } from "@/lib/types";
import { cn, formatQty, num } from "@/lib/utils";

/** Signalement d’un problème de livraison : motif obligatoire. */
export function SignalerDrawer({ blId, numero, onClose }: { blId: number; numero: string; onClose: () => void }) {
  const { dispatch } = useStore();
  const [motif, setMotif] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "SIGNALER_PROBLEME_BL", id: blId, motif: motif.trim() });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Signaler un problème"
      subtitle={numero}
      icon={<AlertTriangle size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="danger" className="h-11 px-5" disabled={!motif.trim() || saving} onClick={() => void submit()}>
            {saving ? "Envoi…" : "Signaler"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Motif (obligatoire)">
        <div className="flex flex-wrap gap-1.5">
          {["Client absent", "Adresse introuvable", "Refus du client", "Colis endommagé", "Quantité incorrecte"].map((m) => (
            <button key={m} type="button" onClick={() => setMotif(m)} className={cn("h-9 px-3 rounded-full border text-[12.5px]", motif === m ? "bg-danger text-white border-danger" : "border-line-strong bg-surface hover:bg-surface-2")}>
              {m}
            </button>
          ))}
        </div>
        <textarea className={cn(inputClass, "h-28 py-2 resize-none text-[15px]")} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Décrivez le problème…" />
      </DrawerSection>
    </Drawer>
  );
}

/** Remise au client : le client signe le bon, la confirmation finale reste au responsable. */
export function RemiseDrawer({ bl, onClose }: { bl: BonLivraison; onClose: () => void }) {
  const { dispatch } = useStore();
  const [signe, setSigne] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "LIVRER_BL", id: bl.id });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Marquer remis"
      subtitle={`${bl.numero}${bl.client_nom ? ` · ${bl.client_nom}` : ""}`}
      icon={<PenLine size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="success" className="h-11 px-5" disabled={!signe || saving} onClick={() => void submit()}>
            {saving ? "Enregistrement…" : "Valider la remise"}
          </Button>
        </>
      }
    >
      {bl.articles && bl.articles.length > 0 && (
        <DrawerSection title="Articles remis">
          <ul className="rounded-[9px] border border-line divide-y divide-line">
            {bl.articles.map((a) => (
              <li key={a.code} className="px-3 py-2.5 flex justify-between gap-3 text-[14px]">
                <span className="min-w-0 truncate">{a.designation}</span>
                <span className="num font-semibold shrink-0">× {formatQty(num(a.quantite), 0)}</span>
              </li>
            ))}
          </ul>
        </DrawerSection>
      )}
      <DrawerSection title="Signature">
        <label className={cn("flex items-start gap-3 rounded-[10px] border p-4 cursor-pointer", signe ? "border-success/40 bg-success-soft/60" : "border-line-strong")}>
          <input type="checkbox" className="h-5 w-5 mt-0.5 accent-[var(--success)]" checked={signe} onChange={(e) => setSigne(e.target.checked)} />
          <span className="text-[14px] leading-snug">
            Le client a vérifié la marchandise et <span className="font-semibold">signé le bon de livraison</span>.
          </span>
        </label>
        <p className="text-[12px] text-muted">La livraison sera confirmée ensuite par le responsable distribution.</p>
      </DrawerSection>
    </Drawer>
  );
}
