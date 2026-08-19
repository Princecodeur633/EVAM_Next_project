"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const TABS = ["Composition", "Emballages", "Process", "Rendement", "Contrôles qualité"] as const;

export default function FtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, productName, materialName } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Composition");
  const s = state.sheets.find((x) => x.id === id);
  if (!s) return <p>Fiche introuvable</p>;

  return (
    <div>
      <PageHeader
        eyebrow="Fiche technique"
        title={productName(s.productId)}
        status={<StatusBadge tone="success">v{s.version} {s.status}</StatusBadge>}
        description="Document maître du calcul des besoins OF et des contrôles qualité."
      />
      <div className="flex gap-0 border-b border-line mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-[13px] border-b-2 -mb-px",
              tab === t ? "border-primary text-ink font-medium" : "border-transparent text-muted",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <Panel className="p-4">
        {tab === "Composition" && (
          <Lines rows={s.composition.map((l) => [materialName(l.materialId), String(l.qty)])} />
        )}
        {tab === "Emballages" && <Lines rows={s.packaging.map((l) => [materialName(l.materialId), String(l.qty)])} />}
        {tab === "Process" && (
          <ol className="space-y-2 text-[13px]">
            {s.process.map((p, i) => (
              <li key={i}>
                <span className="font-medium">{p.step}</span> · {p.durationMin} min — {p.instruction}
              </li>
            ))}
          </ol>
        )}
        {tab === "Rendement" && (
          <p className="text-[13px]">
            Attendu {s.yieldExpected} % · tolérance ± {s.yieldTolerance} %. Les écarts apparaissent à la clôture OF.
          </p>
        )}
        {tab === "Contrôles qualité" && (
          <table className="w-full text-[13px]">
            <tbody>
              {s.qualityChecks.map((c) => (
                <tr key={c.name} className="border-b border-line">
                  <td className="py-2">{c.name}</td>
                  <td className="py-2 num">
                    {c.min ?? "—"} – {c.max ?? "—"} {c.unit}
                  </td>
                  <td className="py-2">{c.required ? "Obligatoire" : "Informatif"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

function Lines({ rows }: { rows: string[][] }) {
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="text-[11px] uppercase text-muted">
          <th className="text-left py-1">Article</th>
          <th className="text-right py-1">Qté / unité PF</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r[0]} className="border-t border-line">
            <td className="py-1.5">{r[0]}</td>
            <td className="py-1.5 text-right num">{r[1]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
