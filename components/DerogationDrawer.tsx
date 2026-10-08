"use client";

import { useState } from "react";
import { BadgePercent } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { Button, inputClass } from "@/components/ui";
import { cn, formatDa, num } from "@/lib/utils";

/** Dérogation au tarif imposé (client sous contrat) : nouveau prix et motif, autorisés par la Direction ou la DAF. */
export function DerogationDrawer({
  ligne,
  libelle,
  onClose,
  onSave,
}: {
  ligne: { prix_unitaire: string; prix_tarif?: string | null; motif_derogation?: string };
  libelle: string;
  onClose: () => void;
  onSave: (prix: number, motif: string) => Promise<boolean>;
}) {
  const [prix, setPrix] = useState(String(num(ligne.prix_unitaire)));
  const [motif, setMotif] = useState(ligne.motif_derogation ?? "");
  const [busy, setBusy] = useState(false);
  return (
    <Drawer
      open
      onClose={onClose}
      title="Dérogation de prix"
      subtitle={libelle}
      icon={<BadgePercent size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            disabled={!(Number(prix) > 0) || !motif.trim() || busy}
            onClick={async () => {
              setBusy(true);
              const ok = await onSave(Number(prix), motif.trim());
              setBusy(false);
              if (ok) onClose();
            }}
          >
            {busy ? "Enregistrement…" : "Autoriser ce prix"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Prix" hint="Le tarif est imposé ; une dérogation n’est possible que pour un client sous contrat, avec un motif. Elle est tracée.">
        <p className="text-[12.5px] text-muted">
          Tarif en vigueur : <span className="num font-medium text-ink">{ligne.prix_tarif != null ? formatDa(num(ligne.prix_tarif)) : "—"}</span>
        </p>
        <label className="block">
          <span className="block text-[11px] uppercase tracking-wide text-muted mb-1.5 font-medium">Prix unitaire accordé (FCFA)</span>
          <input type="number" min="0" step="any" className={cn(inputClass, "num text-right")} value={prix} onChange={(e) => setPrix(e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-[11px] uppercase tracking-wide text-muted mb-1.5 font-medium">Motif (obligatoire)</span>
          <textarea className={cn(inputClass, "h-20 py-2")} value={motif} onChange={(e) => setMotif(e.target.value)} />
        </label>
      </DrawerSection>
    </Drawer>
  );
}
