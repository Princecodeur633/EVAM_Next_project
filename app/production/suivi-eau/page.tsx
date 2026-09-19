"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatQty, num } from "@/lib/utils";

function pct(perte: number, base: number) {
  if (!base) return null;
  return Math.round((perte / base) * 10000) / 100;
}

export default function SuiviEauPage() {
  const { state, dispatch, ofNumero, articleName, can } = useStore();
  const ofsEau = state.ofList.filter((o) => {
    const article = state.articles.find((a) => a.id === o.article);
    const famille = state.famillesArticle.find((f) => f.id === article?.famille);
    return famille?.nom.toLowerCase().includes("eau") ?? false;
  });
  const ofOptions = ofsEau.length > 0 ? ofsEau : state.ofList;
  const [ofId, setOfId] = useState(ofOptions[0]?.id ?? 0);
  const [volumeCapte, setVolumeCapte] = useState(0);
  const [volumeTraitementEnvoye, setVolumeTraitementEnvoye] = useState(0);
  const [volumeTraitementObtenu, setVolumeTraitementObtenu] = useState(0);
  const [volumeEmbouteillage, setVolumeEmbouteillage] = useState(0);
  const [bouteillesProduites, setBouteillesProduites] = useState(0);
  const [bouteillesConformes, setBouteillesConformes] = useState(0);
  const [bouteillesRejetees, setBouteillesRejetees] = useState(0);
  const [packs, setPacks] = useState(0);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Atelier eau"
        title="Suivi eau"
        description="Volumes captage → traitement → embouteillage et bouteilles produites, pour un OF de la ligne eau."
      />
      {can("CREATE_SUIVI_EAU") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <Field label="OF (ligne eau)">
            <select className={inputClass} value={ofId} onChange={(e) => setOfId(Number(e.target.value))}>
              {ofOptions.map((o) => <option key={o.id} value={o.id}>{o.numero} · {articleName(o.article)}</option>)}
            </select>
          </Field>
          <Field label="Volume capté (L)">
            <input type="number" className={inputClass} value={volumeCapte} onChange={(e) => setVolumeCapte(Number(e.target.value))} />
          </Field>
          <Field label="Volume envoyé traitement (L)">
            <input type="number" className={inputClass} value={volumeTraitementEnvoye} onChange={(e) => setVolumeTraitementEnvoye(Number(e.target.value))} />
          </Field>
          <Field label="Volume obtenu après traitement (L)">
            <input type="number" className={inputClass} value={volumeTraitementObtenu} onChange={(e) => setVolumeTraitementObtenu(Number(e.target.value))} />
          </Field>
          <Field label="Volume envoyé embouteillage (L)">
            <input type="number" className={inputClass} value={volumeEmbouteillage} onChange={(e) => setVolumeEmbouteillage(Number(e.target.value))} />
          </Field>
          <Field label="Bouteilles produites">
            <input type="number" className={inputClass} value={bouteillesProduites} onChange={(e) => setBouteillesProduites(Number(e.target.value))} />
          </Field>
          <Field label="Bouteilles conformes">
            <input type="number" className={inputClass} value={bouteillesConformes} onChange={(e) => setBouteillesConformes(Number(e.target.value))} />
          </Field>
          <Field label="Bouteilles rejetées">
            <input type="number" className={inputClass} value={bouteillesRejetees} onChange={(e) => setBouteillesRejetees(Number(e.target.value))} />
          </Field>
          <Field label="Nombre de packs">
            <input type="number" className={inputClass} value={packs} onChange={(e) => setPacks(Number(e.target.value))} />
          </Field>
          <Button
            disabled={!ofId || volumeCapte <= 0 || volumeTraitementObtenu <= 0 || volumeEmbouteillage <= 0 || bouteillesProduites <= 0}
            onClick={() =>
              void dispatch({
                type: "CREATE_SUIVI_EAU",
                ordre_fabrication: ofId,
                volume_capte_l: volumeCapte,
                volume_envoye_traitement_l: volumeTraitementEnvoye || undefined,
                volume_obtenu_traitement_l: volumeTraitementObtenu,
                volume_envoye_embouteillage_l: volumeEmbouteillage,
                bouteilles_produites: bouteillesProduites,
                bouteilles_conformes: bouteillesConformes,
                bouteilles_rejetees: bouteillesRejetees || undefined,
                nombre_packs: packs || undefined,
              })
            }
          >
            Enregistrer
          </Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[
            { key: "of", label: "OF" },
            { key: "capte", label: "Capté (L)" },
            { key: "obtenu", label: "Obtenu traitement (L)" },
            { key: "embout", label: "Envoyé embout. (L)" },
            { key: "pertesCT", label: "Perte captage→traitement" },
            { key: "pertesTE", label: "Perte traitement→embout." },
            { key: "bouteilles", label: "Bouteilles produites" },
            { key: "tauxRejet", label: "Taux de rejet" },
          ]}
          rows={state.suivisEau.map((s) => {
            const capte = num(s.volume_capte_l);
            const obtenu = num(s.volume_obtenu_traitement_l);
            const envoyeEmb = num(s.volume_envoye_embouteillage_l);
            const perteCT = capte - obtenu;
            const perteTE = obtenu - envoyeEmb;
            const tauxRejet = pct(s.bouteilles_rejetees, s.bouteilles_produites);
            return {
              of: ofNumero(s.ordre_fabrication),
              capte: formatQty(capte, 1),
              obtenu: formatQty(obtenu, 1),
              embout: formatQty(envoyeEmb, 1),
              pertesCT: `${formatQty(perteCT, 1)} (${pct(perteCT, capte) ?? "—"} %)`,
              pertesTE: `${formatQty(perteTE, 1)} (${pct(perteTE, obtenu) ?? "—"} %)`,
              bouteilles: s.bouteilles_produites,
              tauxRejet: tauxRejet != null ? `${tauxRejet} %` : "—",
            };
          })}
        />
      </Panel>
    </div>
  );
}
