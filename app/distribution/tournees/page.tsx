"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default function TourneesPage() {
  const { state, dispatch, can, userName } = useStore();
  const [chauffeur, setChauffeur] = useState(state.chauffeurs[0]?.id ?? 0);
  const [vehicule, setVehicule] = useState(state.vehicules[0]?.id ?? 0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [immat, setImmat] = useState("");
  const [typeVh, setTypeVh] = useState("");
  const [userId, setUserId] = useState(0);
  const [permis, setPermis] = useState("");

  const agents = state.utilisateurs.filter((u) => u.profil === "CHAUFFEUR" && u.actif);
  const chNom = (id: number) => {
    const ch = state.chauffeurs.find((c) => c.id === id);
    if (!ch) return "—";
    const nom = userName(ch.utilisateur);
    if (nom !== "—" && !nom.startsWith("#")) return nom;
    return ch.permis_numero ? `Permis ${ch.permis_numero}` : `Chauffeur #${ch.id}`;
  };
  const vh = (id: number) => state.vehicules.find((v) => v.id === id)?.immatriculation ?? `#${id}`;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Distribution" title="Tournées" description="Enregistrez d’abord véhicules et chauffeurs, puis créez la tournée. Chaque chauffeur ne voit que les siennes." />
      {can("CREATE_VEHICULE") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <h2 className="col-span-full text-[13px] font-semibold">Véhicule</h2>
          <Field label="Immatriculation">
            <input className={inputClass} value={immat} onChange={(e) => setImmat(e.target.value)} />
          </Field>
          <Field label="Type (optionnel)">
            <input className={inputClass} value={typeVh} onChange={(e) => setTypeVh(e.target.value)} />
          </Field>
          <Button disabled={!immat.trim()} onClick={() => void dispatch({ type: "CREATE_VEHICULE", immatriculation: immat.trim(), type_vehicule: typeVh })}>
            Ajouter le véhicule
          </Button>
        </Panel>
      )}
      {can("CREATE_CHAUFFEUR") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <h2 className="col-span-full text-[13px] font-semibold">Chauffeur</h2>
          {agents.length > 0 ? (
            <Field label="Utilisateur">
              <select className={inputClass} value={userId} onChange={(e) => setUserId(Number(e.target.value))}>
                <option value={0}>—</option>
                {agents.map((u) => (
                  <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.username})</option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Identifiant utilisateur">
              <input type="number" className={inputClass} value={userId || ""} onChange={(e) => setUserId(Number(e.target.value))} />
            </Field>
          )}
          <Field label="N° de permis">
            <input className={inputClass} value={permis} onChange={(e) => setPermis(e.target.value)} />
          </Field>
          <Button disabled={!userId} onClick={() => void dispatch({ type: "CREATE_CHAUFFEUR", utilisateur: userId, permis_numero: permis })}>
            Ajouter le chauffeur
          </Button>
        </Panel>
      )}
      {can("CREATE_TOURNEE") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <Field label="Chauffeur">
            <select className={inputClass} value={chauffeur} onChange={(e) => setChauffeur(Number(e.target.value))}>
              {state.chauffeurs.map((c) => <option key={c.id} value={c.id}>{chNom(c.id)}</option>)}
            </select>
          </Field>
          <Field label="Véhicule">
            <select className={inputClass} value={vehicule} onChange={(e) => setVehicule(Number(e.target.value))}>
              {state.vehicules.map((v) => <option key={v.id} value={v.id}>{v.immatriculation}</option>)}
            </select>
          </Field>
          <Field label="Date"><input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Button disabled={!chauffeur || !vehicule} onClick={() => void dispatch({ type: "CREATE_TOURNEE", chauffeur, vehicule, date_tournee: date })}>Créer</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "n", label: "N°" }, { key: "c", label: "Chauffeur" }, { key: "v", label: "Véhicule" }, { key: "d", label: "Date" }]}
          rows={state.tournees.map((t) => ({ n: t.numero, c: chNom(t.chauffeur), v: vh(t.vehicule), d: formatDate(t.date_tournee) }))}
        />
      </Panel>
    </div>
  );
}
