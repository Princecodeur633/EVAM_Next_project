"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { DrawerSection } from "@/components/Drawer";
import { BadgeVersion } from "@/components/eau";
import { RefCrud } from "@/components/RefCrud";
import { Button, DataTable, Field, PageHeader, inputClass } from "@/components/ui";
import { api, detail, endpoints } from "@/lib/api";
import {
  BLOC_EAU_LABEL,
  CATEGORIE_CHARGE_LABEL,
  FAMILLE_CHARGE_LABEL,
  FORMULE_FAMILLE,
  PERIODE_EAU_LABEL,
  moisCourant,
  moisSuivant,
  optionsDe,
  versionsEnVigueur,
} from "@/lib/eau";
import { useStore } from "@/lib/store";
import type { CategorieChargeEau, ElementCoutEau, FamilleChargeEau, PeriodeEau } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Éléments de coût de l'eau : une ligne de charge rattachée à une étape (donc au bloc Forage ou
 * Traitement). Ses valeurs vivent dans des versions datées : une modification ne touche jamais
 * les mois passés.
 */
export default function ElementsCoutEauPage() {
  const { state, can } = useStore();
  const writable = can("PARAM_EAU");
  const enVigueur = versionsEnVigueur(state.versionsElementsCoutEau, (v) => v.element);
  const valeur = (e: ElementCoutEau) => [...enVigueur].find((v) => v.element === e.id);
  // Étapes du coût de l'eau : captage (forage) et étapes amont (traitement).
  const etapes = state.etapesStandard.filter((e) => e.phase === "AMONT" && e.actif);

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader eyebrow="Coût de l’eau" title="Éléments de coût" description="Électricité, amortissements, consommables, analyses… La famille fixe le mode de calcul et ne change plus après création." />
      <RefCrud<ElementCoutEau>
        titre="Éléments de coût de l’eau"
        items={[...state.elementsCoutEau].sort((a, b) => a.ordre - b.ordre || a.id - b.id)}
        endpoint={endpoints.elementsCoutEau}
        refresh={["elementsCoutEau"]}
        writable={writable}
        rechercheDans={(e) => [e.libelle, e.etape_libelle, e.equipement_code]}
        libelleItem={(e) => e.libelle}
        supprimable={(e) => !state.versionsElementsCoutEau.some((v) => v.element === e.id)}
        vide="Aucun élément de coût."
        valeursInitiales={{ usine: state.usines[0]?.id ?? 0, libelle: "", etape: 0, equipement: 0, famille: "COURANTE", categorie: "ELECTRICITE", unite: "", a_indiquer: "", ordre: 0, attendue_chaque_mois: false }}
        colonnes={[
          {
            cle: "l",
            label: "Élément",
            rendu: (e) => (
              <span className="inline-flex flex-col">
                <span>{e.libelle}</span>
                <span className="text-[11.5px] text-muted">
                  {e.bloc ? BLOC_EAU_LABEL[e.bloc].split(" (")[0] : "—"} · {e.etape_libelle}
                  {e.equipement_code ? ` · ${e.equipement_code}` : ""}
                </span>
              </span>
            ),
          },
          {
            cle: "f",
            label: "Famille",
            rendu: (e) => (
              <span className="inline-flex flex-col">
                <span>{FAMILLE_CHARGE_LABEL[e.famille]}</span>
                {e.attendue_chaque_mois && <span className="text-[11.5px] text-warning">Attendue chaque mois</span>}
              </span>
            ),
          },
          { cle: "c", label: "Catégorie", rendu: (e) => CATEGORIE_CHARGE_LABEL[e.categorie] },
          {
            cle: "v",
            label: "Valeurs en vigueur",
            rendu: (e) => {
              const v = valeur(e);
              if (e.famille === "AU_BESOIN") return <span className="text-muted">Jamais prévue</span>;
              if (!v) return <span className="text-warning">Non chiffré (compté 0)</span>;
              if (v.retire) return <span className="text-muted">Retiré depuis {v.mois_application}</span>;
              return (
                <span className="num text-[12px]">
                  {v.quantite} {e.unite} × {v.prix_unitaire}
                  {v.duree_vie_mois ? ` ÷ ${v.duree_vie_mois} mois` : ` × ${v.frequence} / ${v.periode ? PERIODE_EAU_LABEL[v.periode].split(" (")[0].toLowerCase() : "?"}`} · depuis {v.mois_application}
                </span>
              );
            },
          },
        ]}
        champs={[
          { cle: "usine", label: "Site eau", type: "select", requis: true, creationSeulement: true, options: state.usines.map((u) => ({ value: u.id, label: u.nom })) },
          { cle: "libelle", label: "Élément de coût", requis: true, pleineLargeur: true },
          { cle: "etape", label: "Étape", type: "select", requis: true, aide: "Captage = Forage ; autres étapes amont = Traitement.", options: etapes.map((e) => ({ value: e.id, label: e.libelle })) },
          {
            cle: "equipement",
            label: "Équipement (facultatif)",
            type: "select",
            options: state.equipements.map((e) => ({ value: e.id, label: `${e.code} · ${e.designation}` })),
          },
          {
            cle: "famille",
            label: "Famille",
            type: "select",
            requis: true,
            creationSeulement: true,
            aide: "Courante, préventive : quantité × prix × fréquence ; étalée : quantité × prix ÷ durée de vie ; au besoin : jamais prévue.",
            options: optionsDe<FamilleChargeEau>(FAMILLE_CHARGE_LABEL),
          },
          { cle: "categorie", label: "Catégorie", type: "select", requis: true, options: optionsDe<CategorieChargeEau>(CATEGORIE_CHARGE_LABEL) },
          { cle: "unite", label: "Unité de la quantité", placeholder: "kW, kg, L, unité, lot, analyse, kit…" },
          { cle: "ordre", label: "Ordre d’affichage", type: "number" },
          {
            cle: "attendue_chaque_mois",
            label: "Charge attendue chaque mois (à imputer ou à valider « sans imputation » avant la clôture)",
            type: "checkbox",
            pleineLargeur: true,
            visible: (f) => f.famille === "COURANTE" || f.famille === "PREVENTIVE",
          },
          { cle: "a_indiquer", label: "Ce qu’il faut indiquer", pleineLargeur: true, placeholder: "Ex : puissance (kW) ; prix du kWh ; heures de marche par période" },
        ]}
        actionsDrawer={(e) => <Versions element={e} writable={writable} />}
      />
    </div>
  );
}

/** Versions datées d'un élément et ajout d'une nouvelle version. */
function Versions({ element, writable }: { element: ElementCoutEau; writable: boolean }) {
  const { state, dispatch } = useStore();
  const versions = state.versionsElementsCoutEau.filter((v) => v.element === element.id).sort((a, b) => b.mois_application.localeCompare(a.mois_application));
  const enVigueur = versionsEnVigueur(versions, (v) => v.element);
  const premiere = versions.length === 0;
  const [mois, setMois] = useState(premiere ? moisCourant() : moisSuivant(moisCourant()));
  const [retire, setRetire] = useState(false);
  const [quantite, setQuantite] = useState("");
  const [prix, setPrix] = useState("");
  const [frequence, setFrequence] = useState("");
  const [periode, setPeriode] = useState<PeriodeEau | "">("MOIS");
  const [duree, setDuree] = useState("");
  const [motif, setMotif] = useState("");
  const [busy, setBusy] = useState(false);
  const etalee = element.famille === "ETALEE";
  const auBesoin = element.famille === "AU_BESOIN";

  async function ajouter() {
    setBusy(true);
    const corps = retire || auBesoin
      ? { element: element.id, mois_application: mois, retire, motif }
      : {
          element: element.id,
          mois_application: mois,
          retire: false,
          quantite: Number(quantite),
          prix_unitaire: Number(prix),
          frequence: etalee ? null : Number(frequence),
          periode: etalee ? "" : periode,
          duree_vie_mois: etalee ? Number(duree) : null,
          motif,
        };
    const ok = await dispatch({ type: "EXEC", run: () => api.post(endpoints.versionsElementsCoutEau, corps), refresh: ["versionsElementsCoutEau"] });
    setBusy(false);
    if (ok) {
      setQuantite("");
      setPrix("");
      setFrequence("");
      setDuree("");
      setMotif("");
    }
  }

  const complet = retire || auBesoin || (quantite && prix && (etalee ? duree : frequence && periode));
  return (
    <>
      <DrawerSection title="Versions" hint={FORMULE_FAMILLE[element.famille]}>
        <DataTable
          emptyText="Aucune valeur : l’élément est compté 0."
          columns={[
            { key: "m", label: "À partir de" },
            { key: "v", label: "Valeurs" },
            { key: "s", label: "" },
          ]}
          rows={versions.map((v) => ({
            m: v.mois_application,
            v: v.retire ? (
              "Retiré"
            ) : auBesoin ? (
              "—"
            ) : (
              <span className="num text-[12px]">
                {v.quantite} × {v.prix_unitaire}
                {v.duree_vie_mois ? ` ÷ ${v.duree_vie_mois} mois` : ` × ${v.frequence} / ${v.periode}`}
                {v.motif ? <span className="block text-muted">{v.motif}</span> : null}
              </span>
            ),
            s: (
              <span className="inline-flex items-center gap-2">
                <BadgeVersion enVigueur={enVigueur.has(v)} figee={v.figee} avenir={v.mois_application > moisCourant()} />
                {writable && !v.figee && (
                  <button
                    className="text-danger"
                    aria-label="Supprimer la version"
                    onClick={() => void dispatch({ type: "EXEC", run: () => api.del(detail(endpoints.versionsElementsCoutEau, v.id)), refresh: ["versionsElementsCoutEau"] })}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </span>
            ),
          }))}
        />
      </DrawerSection>
      {writable && (
        <DrawerSection
          title="Nouvelle version"
          hint={premiere ? "Paramétrage initial : il peut porter sur un mois passé." : `Une modification s’applique au plus tôt en ${moisSuivant(moisCourant())}.`}
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="S’applique à partir de">
              <input type="month" className={inputClass} value={mois} onChange={(e) => setMois(e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 text-[13px] sm:mt-6">
              <input type="checkbox" checked={retire} onChange={(e) => setRetire(e.target.checked)} /> Retiré à partir de ce mois
            </label>
            {!retire && !auBesoin && (
              <>
                <Field label={`Quantité${element.unite ? ` (${element.unite})` : ""}`}>
                  <input type="number" step="any" className={cn(inputClass, "num text-right")} value={quantite} onChange={(e) => setQuantite(e.target.value)} />
                </Field>
                <Field label="Prix unitaire HT (FCFA)">
                  <input type="number" step="any" className={cn(inputClass, "num text-right")} value={prix} onChange={(e) => setPrix(e.target.value)} />
                </Field>
                {etalee ? (
                  <Field label="Durée de vie (mois)">
                    <input type="number" className={cn(inputClass, "num text-right")} value={duree} onChange={(e) => setDuree(e.target.value)} />
                  </Field>
                ) : (
                  <>
                    <Field label="Fréquence (nombre par période)">
                      <input type="number" step="any" className={cn(inputClass, "num text-right")} value={frequence} onChange={(e) => setFrequence(e.target.value)} />
                    </Field>
                    <Field label="Période">
                      <select className={inputClass} value={periode} onChange={(e) => setPeriode(e.target.value as PeriodeEau)}>
                        {optionsDe<PeriodeEau>(PERIODE_EAU_LABEL).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </>
                )}
              </>
            )}
            <div className="sm:col-span-2">
              <Field label="Motif de la modification">
                <input className={inputClass} value={motif} onChange={(e) => setMotif(e.target.value)} />
              </Field>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button disabled={busy || !mois || !complet} onClick={() => void ajouter()}>
              Ajouter la version
            </Button>
          </div>
        </DrawerSection>
      )}
    </>
  );
}
