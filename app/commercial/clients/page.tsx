"use client";

import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function ClientsOpsPage() {
  const { state } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Commercial" title="Clients" description="Le type client (comptant / à terme) détermine les moyens d'encaissement autorisés en caisse." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">Code</th>
              <th className="text-left px-3 py-2">Nom</th>
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-left px-3 py-2">Encaissement</th>
            </tr>
          </thead>
          <tbody>
            {state.customers.map((c) => (
              <tr key={c.id} className="border-b border-line">
                <td className="px-3 py-2 num">{c.code}</td>
                <td className="px-3 py-2">{c.name}</td>
                <td className="px-3 py-2">
                  <StatusBadge tone={c.type === "comptant" ? "teal" : "info"}>{c.type}</StatusBadge>
                </td>
                <td className="px-3 py-2">{c.paymentMethods.join(" · ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
