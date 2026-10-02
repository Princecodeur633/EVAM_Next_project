"use client";

import { useState } from "react";
import { ArrowLeftRight, Plus } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, FilterSelect, SearchInput, matchSearch } from "@/components/Filters";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { TYPE_MVT_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { TypeMouvement } from "@/lib/types";
import { cn, formatDateTime, formatQty, num } from "@/lib/utils";

const MVT_TONE: Record<TypeMouvement, "success" | "danger" | "info" | "warning" | "teal"> = {
  ENTREE: "success",
  SORTIE: "danger",
  TRANSFERT: "info",
  AJUSTEMENT: "warning",
  RETOUR: "teal",
};
/** Seuls ces mouvements se saisissent à la main : les autres naissent des documents (réception, sortie, livraison…). */
const MANUELS: TypeMouvement[] = ["AJUSTEMENT", "TRANSFERT"];

export default function MouvementsPage() {
  const { state, articleName, can, userName } = useStore();
  const [q, setQ] = useState("");
  const [fType, setFType] = useState("");
  const [fDepot, setFDepot] = useState("");
  const [saisie, setSaisie] = useState(false);
  const depotName = (id: number) => state.depots.find((d) => d.id === id)?.nom ?? `#${id}`;

  const rows = [...state.mouvements]
    .filter((m) => (!fType || m.type_mouvement === fType) && (!fDepot || String(m.depot) === fDepot))
    .filter((m) => matchSearch(q, m.numero, articleName(m.article), m.motif, m.document_origine))
    .sort((a, b) => new Date(b.date_mouvement).getTime() - new Date(a.date_mouvement).getTime());

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Stocks"
        title="Mouvements de stock"
        description="Chaque mouvement a une origine. À la main, seuls l’ajustement et le transfert sont possibles, toujours avec un motif."
        actions={
          can("CREATE_MVT") ? (
            <Button onClick={() => setSaisie(true)}>
              <Plus size={15} /> Mouvement manuel
            </Button>
          ) : null
        }
      />
      <Panel className="overflow-hidden">
        <FilterBar shown={rows.length} total={state.mouvements.length} active={!!q || !!fType || !!fDepot} onReset={() => { setQ(""); setFType(""); setFDepot(""); }}>
          <SearchInput value={q} onChange={setQ} placeholder="N°, article, motif, document…" />
          <FilterSelect label="Type" allLabel="Tous les types" value={fType} onChange={setFType} options={(Object.keys(TYPE_MVT_LABEL) as TypeMouvement[]).map((k) => ({ value: k, label: TYPE_MVT_LABEL[k] }))} />
          <FilterSelect label="Dépôt" allLabel="Tous les dépôts" value={fDepot} onChange={setFDepot} options={state.depots.map((d) => ({ value: String(d.id), label: d.nom }))} />
        </FilterBar>
        <DataTable
          emptyText="Aucun mouvement pour ces filtres."
          columns={[
            { key: "n", label: "N°" },
            { key: "t", label: "Type" },
            { key: "a", label: "Article" },
            { key: "d", label: "Dépôt" },
            { key: "q", label: "Quantité", className: "text-right" },
            { key: "o", label: "Origine / motif" },
            { key: "u", label: "Saisi par" },
            { key: "at", label: "Date" },
          ]}
          rows={rows.map((m) => ({
            n: <span className="num">{m.numero}</span>,
            t: <StatusBadge tone={MVT_TONE[m.type_mouvement]}>{TYPE_MVT_LABEL[m.type_mouvement]}</StatusBadge>,
            a: articleName(m.article),
            d: depotName(m.depot),
            q: <span className="num">{formatQty(num(m.quantite), 2)}</span>,
            o: <span className="text-muted">{m.document_origine || m.motif || "—"}</span>,
            u: userName(m.utilisateur),
            at: formatDateTime(m.date_mouvement),
          }))}
        />
      </Panel>
      {saisie && <MouvementDrawer onClose={() => setSaisie(false)} />}
    </div>
  );
}

function MouvementDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [type, setType] = useState<TypeMouvement>("AJUSTEMENT");
  const [article, setArticle] = useState(0);
  const [depot, setDepot] = useState(state.depotId ?? 0);
  const [qty, setQty] = useState("");
  const [motif, setMotif] = useState("");
  const [saving, setSaving] = useState(false);
  const valide = article && depot && Number(qty) !== 0 && qty !== "" && motif.trim() && (type === "AJUSTEMENT" || Number(qty) > 0);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_MVT", article, depot, type_mouvement: type, quantite: Number(qty), motif: motif.trim() });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Mouvement manuel"
      subtitle="Ajustement ou transfert, avec motif obligatoire."
      icon={<ArrowLeftRight size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!valide || saving} onClick={() => void submit()}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Type">
        <div className="grid grid-cols-2 gap-2">
          {MANUELS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setType(k)}
              aria-pressed={type === k}
              className={cn("h-10 rounded-[8px] border text-[13px] font-medium transition-colors", type === k ? "bg-primary text-white border-primary" : "border-line-strong bg-surface hover:bg-surface-2")}
            >
              {TYPE_MVT_LABEL[k]}
            </button>
          ))}
        </div>
        <p className="text-[11.5px] text-muted">
          {type === "AJUSTEMENT" ? "Quantité positive pour ajouter, négative pour retirer (écart constaté)." : "Quantité déplacée depuis le dépôt choisi."}
        </p>
      </DrawerSection>
      <DrawerSection title="Mouvement">
        <Field label="Article">
          <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
            <option value={0}>Choisir…</option>
            {state.articles.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.designation}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dépôt">
            <select className={inputClass} value={depot} onChange={(e) => setDepot(Number(e.target.value))}>
              <option value={0}>Choisir…</option>
              {state.depots.filter((d) => d.actif).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nom}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantité">
            <input type="number" step="any" className={cn(inputClass, "num text-right")} value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
        </div>
        <Field label="Motif (obligatoire)">
          <input className={inputClass} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Casse constatée, rangement…" />
        </Field>
      </DrawerSection>
    </Drawer>
  );
}
