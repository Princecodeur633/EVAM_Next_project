"use client";

import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { DrawerSection } from "@/components/Drawer";
import { RefCrud } from "@/components/RefCrud";
import { Button, PageHeader, StatusBadge } from "@/components/ui";
import { api, endpoints } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { Client, Prospect } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

/** Statuts proposés ; le backend accepte un texte libre (50 caractères), « Nouveau » par défaut. */
const STATUTS = ["Nouveau", "Contacté", "Intéressé", "Converti en client", "Perdu"];
const TONE: Record<string, "neutral" | "info" | "warning" | "success" | "danger"> = {
  Nouveau: "neutral",
  Contacté: "info",
  Intéressé: "warning",
  "Converti en client": "success",
  Perdu: "danger",
};

/**
 * Prospects du Commercial : clients potentiels suivis avant leur première commande. Un prospect
 * intéressé devient client en un clic (la fiche client s'ouvre pour compléter encours et délai).
 */
export default function ProspectsPage() {
  const { state, can, dispatch } = useStore();
  const router = useRouter();
  const writable = can("GERER_PROSPECTS");

  async function convertir(p: Prospect, fermer: () => void) {
    let cree: Client | null = null;
    const ok = await dispatch({
      type: "EXEC",
      run: async () => {
        cree = await api.post<Client>(endpoints.clients, { nom: p.nom, type_client: "SOCIETE", telephone: p.contact });
        await api.patch(`${endpoints.prospects}${p.id}/`, { statut: "Converti en client" });
      },
      refresh: ["clients", "prospects"],
    });
    if (ok && cree) {
      fermer();
      router.push(`/parametrage/clients/${(cree as Client).id}`);
    }
  }

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Vente"
        title="Prospects"
        description="Clients potentiels : suivez le contact jusqu’à la première commande, puis créez la fiche client depuis le prospect."
      />
      <RefCrud
        titre="Prospects"
        items={[...state.prospects].sort((a, b) => b.date_creation.localeCompare(a.date_creation))}
        endpoint={endpoints.prospects}
        refresh={["prospects"]}
        writable={writable}
        rechercheDans={(p) => [p.nom, p.contact, p.statut]}
        libelleItem={(p) => p.nom}
        supprimable={(p) => p.statut !== "Converti en client"}
        valeursInitiales={{ nom: "", contact: "", statut: "Nouveau" }}
        champs={[
          { cle: "nom", label: "Nom / raison sociale", requis: true },
          { cle: "contact", label: "Contact", placeholder: "Nom, téléphone ou e-mail" },
          { cle: "statut", label: "Statut", type: "select", options: STATUTS.map((s) => ({ value: s, label: s })) },
        ]}
        colonnes={[
          { cle: "n", label: "Prospect", rendu: (p) => <span className="font-medium">{p.nom}</span> },
          { cle: "c", label: "Contact", rendu: (p) => p.contact || "—" },
          { cle: "s", label: "Statut", rendu: (p) => <StatusBadge tone={TONE[p.statut] ?? "neutral"}>{p.statut}</StatusBadge> },
          { cle: "d", label: "Créé le", rendu: (p) => formatDateTime(p.date_creation) },
        ]}
        actionsDrawer={(p, fermer) =>
          writable && p.statut !== "Converti en client" ? (
            <DrawerSection title="Conversion" hint="Crée la fiche client (type Société) avec ce nom et ce contact, puis l’ouvre pour compléter l’encours et le délai de paiement.">
              <Button onClick={() => void convertir(p, fermer)}>
                <UserPlus size={14} /> Créer le client
              </Button>
            </DrawerSection>
          ) : null
        }
      />
    </div>
  );
}
