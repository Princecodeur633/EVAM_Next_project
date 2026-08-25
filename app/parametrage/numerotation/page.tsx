"use client";

import { FormEvent, useState } from "react";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function NumerotationPage() {
  const { state, dispatch, can } = useStore();
  const s = state.settings;
  const edit = can("UPDATE_SETTINGS");
  const [ofPrefix, setOf] = useState(s.ofPrefix);
  const [faPrefix, setFa] = useState(s.faPrefix);
  const [blPrefix, setBl] = useState(s.blPrefix);
  const [daPrefix, setDa] = useState(s.daPrefix);
  const [cfPrefix, setCf] = useState(s.cfPrefix);

  function onSave(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "UPDATE_SETTINGS", patch: { ofPrefix, faPrefix, blPrefix, daPrefix, cfPrefix } });
  }

  return (
    <div className="max-w-lg space-y-4">
      <PageHeader eyebrow="Paramétrage" title="Numérotation & préfixes" description="Compteurs non réutilisables. Traçabilité OF / FA / BL / DA / CF." />
      <form onSubmit={onSave}>
        <Panel className="p-4 space-y-3">
          <Field label="Préfixe OF">
            <input className={inputClass} value={ofPrefix} onChange={(e) => setOf(e.target.value)} readOnly={!edit} />
          </Field>
          <Field label="Préfixe facture">
            <input className={inputClass} value={faPrefix} onChange={(e) => setFa(e.target.value)} readOnly={!edit} />
          </Field>
          <Field label="Préfixe BL">
            <input className={inputClass} value={blPrefix} onChange={(e) => setBl(e.target.value)} readOnly={!edit} />
          </Field>
          <Field label="Préfixe DA">
            <input className={inputClass} value={daPrefix} onChange={(e) => setDa(e.target.value)} readOnly={!edit} />
          </Field>
          <Field label="Préfixe CF">
            <input className={inputClass} value={cfPrefix} onChange={(e) => setCf(e.target.value)} readOnly={!edit} />
          </Field>
        </Panel>
        {edit && (
          <Button type="submit" className="mt-3">
            Enregistrer les préfixes
          </Button>
        )}
      </form>
      <Panel>
        <table className="w-full text-[13px]">
          <tbody>
            <Row k="Prochain OF" v={`${s.ofPrefix}${String(s.counters.of + 1).padStart(5, "0")}`} />
            <Row k="Prochaine facture" v={`${s.faPrefix}${String(s.counters.fa + 1).padStart(5, "0")}`} />
            <Row k="Prochain BL" v={`${s.blPrefix}${String(s.counters.bl + 1).padStart(5, "0")}`} />
            <Row k="Prochaine DA" v={`${s.daPrefix}${String(s.counters.da + 1).padStart(5, "0")}`} />
            <Row k="Prochaine CF" v={`${s.cfPrefix}${String(s.counters.cf + 1).padStart(5, "0")}`} />
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-b border-line">
      <td className="px-4 py-2 text-muted">{k}</td>
      <td className="px-4 py-2 num font-medium">{v}</td>
    </tr>
  );
}
