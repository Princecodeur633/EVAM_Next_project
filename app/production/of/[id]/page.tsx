"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { OfBadge } from "@/components/badges";
import { Button, Guard, OF_STEPS, PageHeader, Panel, StatusStepper } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa, formatQty } from "@/lib/utils";

export default function OfDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, productName, materialName, role } = useStore();
  const of = state.ofList.find((o) => o.id === decodeURIComponent(id));
  if (!of) return <p>OF introuvable</p>;

  const product = state.products.find((p) => p.id === of.productId);
  const sheet = state.sheets.find((s) => s.productId === of.productId && s.status === "active");
  const req = state.materialRequests.find((r) => r.ofId === of.id);
  const ofLosses = state.losses.filter((l) => l.ofId === of.id);
  const stepperId = of.status === "bloque" ? "fin_production" : of.status === "controle_qualite" ? "controle_qualite" : of.status;

  const canEnd = role === "responsable_production" || role === "administrateur";
  const canQuality = role === "controleur_qualite" || role === "administrateur";
  const canTrack = role === "agent_production" || role === "responsable_production" || role === "administrateur";

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Ordre de fabrication"
        title={of.id}
        status={<OfBadge status={of.status} />}
        description={`${productName(of.productId)} · prévu ${formatQty(of.qtyPlanned)} ${product?.unit ?? ""}`}
        actions={
          <>
            {of.status === "planifie" && canTrack && (
              <Button onClick={() => dispatch({ type: "START_OF", ofId: of.id })}>Démarrer la production</Button>
            )}
            {of.status === "en_production" && canEnd && (
              <Button onClick={() => dispatch({ type: "END_PRODUCTION", ofId: of.id })}>Valider fin de production</Button>
            )}
            {(of.status === "fin_production" || of.status === "controle_qualite") && canQuality && (
              <>
                <Button variant="danger" onClick={() => dispatch({ type: "QUALITY_BLOCK", ofId: of.id, notes: "Non-conformité saisie en maquette" })}>
                  Bloquer le lot
                </Button>
                <Button variant="success" onClick={() => dispatch({ type: "QUALITY_CLOSE", ofId: of.id })}>
                  Clôture qualité — entrer en stock
                </Button>
              </>
            )}
          </>
        }
      />

      <StatusStepper steps={OF_STEPS} current={of.status === "bloque" ? "fin_production" : stepperId} />

      {of.status === "fin_production" && (
        <Guard variant="warn" title="Fin de production validée — stock PF non alimenté">
          Seule la clôture du contrôleur qualité fait entrer le lot en stock vendable. Un OF « terminé » n'est pas un OF « vendable ».
        </Guard>
      )}
      {of.status === "bloque" && (
        <Guard variant="block" title="Lot non conforme — aucune entrée stock PF">
          {of.qualityNotes || "Blocage qualité."} Le lot peut être dirigé vers la quarantaine.
        </Guard>
      )}
      {of.status === "cloture" && (
        <Guard variant="ok" title="Clôturé qualité — lot disponible à la vente">
          Lot <span className="num font-medium">{of.lot}</span> entré en dépôt Produits finis. CMUP figé à la clôture.
        </Guard>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel className="p-4 space-y-2">
          <h2 className="text-[13px] font-semibold">Synthèse</h2>
          <Row k="Produit" v={productName(of.productId)} />
          <Row k="Lot" v={of.lot ?? "Attribué à la clôture"} />
          <Row k="Réel saisi" v={String(of.qtyReal)} />
          <Row k="Rendement" v={of.yieldActual ? `${of.yieldActual.toFixed(1)} %` : "—"} />
          <Row k="Coût OF" v={of.cost ? formatDa(of.cost) : "Calculé à la clôture"} />
          <Row k="Volume eau" v={of.waterVolumeM3 != null ? `${of.waterVolumeM3} m³` : "—"} />
        </Panel>
        <Panel className="p-4 lg:col-span-2">
          <div className="flex justify-between mb-2">
            <h2 className="text-[13px] font-semibold">Besoins matières (fiche technique v{sheet?.version})</h2>
            <Link href="/production/demandes-matieres" className="text-[12px] text-primary">Demandes magasin</Link>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase text-muted">
                <th className="text-left py-1 font-medium">Article</th>
                <th className="text-right py-1 font-medium">Besoin</th>
              </tr>
            </thead>
            <tbody>
              {req?.lines.map((l) => (
                <tr key={l.materialId} className="border-t border-line">
                  <td className="py-1.5">{materialName(l.materialId)}</td>
                  <td className="py-1.5 text-right num">{formatQty(l.qty, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {req && <p className="text-[12px] text-muted mt-2">Demande magasin : {req.status}</p>}
        </Panel>
      </div>

      <Panel className="p-4">
        <h2 className="text-[13px] font-semibold mb-2">Pertes / rebuts</h2>
        {ofLosses.length === 0 ? (
          <p className="text-muted text-[13px]">Aucune perte saisie.</p>
        ) : (
          ofLosses.map((l) => (
            <p key={l.id} className="text-[13px]">
              {state.lossCauses.find((c) => c.id === l.causeId)?.label} — {l.qty} u
            </p>
          ))
        )}
      </Panel>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-[13px] gap-4">
      <span className="text-muted">{k}</span>
      <span className="num">{v}</span>
    </div>
  );
}
