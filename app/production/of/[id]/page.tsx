"use client";

import { useParams } from "next/navigation";
import { OfBadge } from "@/components/badges";
import { Button, Guard, OF_STEPS, PageHeader, Panel, StatusStepper } from "@/components/ui";
import { nextOfStatut, useStore } from "@/lib/store";
import { formatDateTime, formatQty, num } from "@/lib/utils";
import { ETAPE_LABEL, MOTIF_PERTE_LABEL, STATUT_LOT_LABEL, STATUT_OF_LABEL, TYPE_SORTIE_LABEL } from "@/lib/labels";

export default function OfDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, articleName, can, userName } = useStore();
  const ofId = Number(id);
  const of = state.ofList.find((o) => o.id === ofId);
  if (!of) return <p className="text-[13px] text-muted">Ordre de fabrication introuvable.</p>;

  const besoins = state.besoinsMatieres.filter((b) => b.ordre_fabrication === of.id);
  const sorties = state.sortiesMatieres.filter((s) => s.ordre_fabrication === of.id);
  const etapes = state.etapes.filter((e) => e.ordre_fabrication === of.id);
  const pertes = state.pertes.filter((p) => p.ordre_fabrication === of.id);
  const lots = state.lots.filter((l) => l.ordre_fabrication === of.id);
  const next = nextOfStatut(of.statut);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Ordre de fabrication"
        title={of.numero}
        status={<OfBadge status={of.statut} />}
        description={`${articleName(of.article)} · ${formatQty(num(of.quantite_a_produire), 2)}`}
        actions={
          can("AVANCER_OF") && next ? (
            <Button onClick={() => void dispatch({ type: "AVANCER_OF", id: of.id })}>
              Avancer → {STATUT_OF_LABEL[next]}
            </Button>
          ) : null
        }
      />
      <StatusStepper steps={OF_STEPS} current={of.statut} />
      {of.statut === "TERMINE" && (
        <Guard variant="warn" title="Production terminée — lot pas encore libéré">
          Le stock vendable n’existe qu’après le contrôle qualité, puis la libération du lot.
        </Guard>
      )}
      <div className="grid lg:grid-cols-3 gap-4">
        <Panel className="p-4 space-y-2">
          <h2 className="text-[13px] font-semibold">Synthèse</h2>
          <Row k="Article" v={articleName(of.article)} />
          <Row k="Responsable" v={userName(of.responsable)} />
          <Row k="Lancement" v={of.date_lancement ? formatDateTime(of.date_lancement) : "—"} />
          <Row k="Fin" v={of.date_fin ? formatDateTime(of.date_fin) : "—"} />
          <Row k="Agents" v={of.agents_affectes.length ? of.agents_affectes.map((id) => userName(id)).join(", ") : "Aucun"} />
        </Panel>
        <Panel className="p-4 lg:col-span-2">
          <h2 className="text-[13px] font-semibold mb-2">Besoins matières</h2>
          {besoins.length === 0 ? (
            <p className="text-[13px] text-muted">Aucun besoin — l’OF n’est pas encore lancé ou fiche technique manquante.</p>
          ) : (
            <ul className="text-[13px] space-y-1">
              {besoins.map((b) => (
                <li key={b.id}>{articleName(b.matiere)} · théorique {formatQty(num(b.quantite_theorique), 3)}</li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <Panel className="p-4">
        <h2 className="text-[13px] font-semibold mb-2">Sorties matières</h2>
        {sorties.length === 0 ? <p className="text-[13px] text-muted">Aucune sortie.</p> : sorties.map((s) => (
          <p key={s.id} className="text-[13px]">{articleName(s.matiere)} · {formatQty(num(s.quantite_sortie), 3)} · {TYPE_SORTIE_LABEL[s.type_sortie] ?? s.type_sortie}</p>
        ))}
      </Panel>
      <Panel className="p-4">
        <h2 className="text-[13px] font-semibold mb-2">Étapes</h2>
        {etapes.length === 0 ? <p className="text-[13px] text-muted">Aucune étape saisie.</p> : etapes.map((e) => (
          <p key={e.id} className="text-[13px]">{ETAPE_LABEL[e.etape]} · {e.quantite_produite ?? "—"}</p>
        ))}
      </Panel>
      <Panel className="p-4">
        <h2 className="text-[13px] font-semibold mb-2">Pertes · Lots</h2>
        {pertes.map((p) => (
          <p key={p.id} className="text-[13px]">{MOTIF_PERTE_LABEL[p.motif]} · {formatQty(num(p.quantite_perte), 2)}</p>
        ))}
        {lots.map((l) => (
          <p key={l.id} className="text-[13px]">{l.numero_lot} · {STATUT_LOT_LABEL[l.statut] ?? l.statut}</p>
        ))}
      </Panel>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <p className="flex justify-between gap-3 text-[13px]">
      <span className="text-muted shrink-0">{k}</span>
      <span className="text-right min-w-0 break-words">{v}</span>
    </p>
  );
}
