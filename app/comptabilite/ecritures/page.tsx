"use client";

import { DataTable, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa, formatDate, num } from "@/lib/utils";

export default function EcrituresPage() {
  const { state } = useStore();
  const ecritures = [...state.ecrituresComptables].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Comptabilité"
        title="Écritures"
        description="Générées automatiquement par les documents (facture, encaissement, décaissement, avoir, réception) — jamais saisies ni modifiées. Une erreur se corrige en annulant le document, qui contre-passe l'écriture."
      />
      <Panel>
        <DataTable
          columns={[
            { key: "n", label: "N°" },
            { key: "j", label: "Journal" },
            { key: "d", label: "Date" },
            { key: "p", label: "Pièce" },
            { key: "l", label: "Libellé" },
            { key: "deb", label: "Débit" },
            { key: "cred", label: "Crédit" },
            { key: "ex", label: "Exportée" },
          ]}
          rows={ecritures.map((e) => ({
            n: e.numero,
            j: e.journal_libelle,
            d: formatDate(e.date),
            p: e.piece,
            l: e.libelle,
            deb: formatDa(e.lignes.reduce((a, l) => a + num(l.debit), 0)),
            cred: formatDa(e.lignes.reduce((a, l) => a + num(l.credit), 0)),
            ex: e.exportee_le ? "Oui" : "Non",
          }))}
        />
      </Panel>
    </div>
  );
}
