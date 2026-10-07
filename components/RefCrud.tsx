"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, SearchInput, matchSearch } from "@/components/Filters";
import { Button, DataTable, Field, Panel, inputClass } from "@/components/ui";
import { api, detail, type CatalogKey } from "@/lib/api";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Valeur = string | number | boolean | number[] | null;
export type FormRef = Record<string, Valeur>;

/** Un champ du formulaire de création / modification. */
export type ChampRef = {
  cle: string;
  label: string;
  type?: "text" | "number" | "select" | "checkbox" | "multi" | "textarea" | "date";
  options?: { value: string | number; label: string }[];
  requis?: boolean;
  aide?: string;
  placeholder?: string;
  /** Saisi à la création seulement (ex. usine d’une ligne, code d’une étape). */
  creationSeulement?: boolean;
  /** Affiché selon les autres valeurs du formulaire. */
  visible?: (form: FormRef) => boolean;
  pleineLargeur?: boolean;
};

export type ColonneRef<T> = { cle: string; label: string; rendu: (x: T) => ReactNode; className?: string };

/**
 * Référentiel générique : tableau filtrable + tiroir de création / modification envoyé tel quel
 * à l’API (POST / PATCH). Les règles métier restent au backend : son message d’erreur s’affiche
 * dans la bannière commune.
 */
export function RefCrud<T extends { id: number }>({
  titre,
  description,
  items,
  colonnes,
  champs,
  endpoint,
  refresh,
  writable,
  rechercheDans,
  valeursInitiales,
  supprimable,
  actionsDrawer,
  libelleItem,
  vide = "Aucun élément.",
  enTete,
}: {
  titre: string;
  description?: string;
  items: T[];
  colonnes: ColonneRef<T>[];
  champs: ChampRef[];
  endpoint: string;
  refresh: CatalogKey[];
  writable: boolean;
  rechercheDans: (x: T) => unknown[];
  valeursInitiales: FormRef;
  supprimable?: (x: T) => boolean;
  /** Actions métier dans le tiroir d’un élément existant (valider, activer…). */
  actionsDrawer?: (x: T, fermer: () => void) => ReactNode;
  libelleItem: (x: T) => string;
  vide?: string;
  enTete?: ReactNode;
}) {
  const { dispatch } = useStore();
  const [q, setQ] = useState("");
  const [ouvert, setOuvert] = useState<T | "nouveau" | null>(null);
  const filtres = useMemo(() => items.filter((x) => matchSearch(q, ...rechercheDans(x))), [items, q, rechercheDans]);

  return (
    <Panel className="overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[13.5px] font-semibold">{titre}</h2>
          {description && <p className="text-[12px] text-muted mt-0.5">{description}</p>}
        </div>
        {writable && (
          <Button className="h-8 px-3 text-[12.5px]" onClick={() => setOuvert("nouveau")}>
            <Plus size={14} /> Ajouter
          </Button>
        )}
      </div>
      {enTete}
      {items.length > 6 && (
        <FilterBar shown={filtres.length} total={items.length} active={!!q} onReset={() => setQ("")}>
          <SearchInput value={q} onChange={setQ} placeholder="Rechercher…" />
        </FilterBar>
      )}
      <DataTable
        emptyText={items.length ? "Aucun résultat pour cette recherche." : vide}
        columns={colonnes.map((c) => ({ key: c.cle, label: c.label, className: c.className }))}
        rows={filtres.map((x) => ({ ...Object.fromEntries(colonnes.map((c) => [c.cle, c.rendu(x)])), _id: x.id }))}
        onRowClick={(row) => setOuvert(items.find((x) => x.id === row._id) ?? null)}
      />
      {ouvert && (
        <RefDrawer
          item={ouvert === "nouveau" ? null : ouvert}
          titre={ouvert === "nouveau" ? `Nouveau · ${titre}` : libelleItem(ouvert)}
          champs={champs}
          endpoint={endpoint}
          writable={writable}
          valeursInitiales={valeursInitiales}
          onClose={() => setOuvert(null)}
          onSave={async (corps, id) => {
            const ok = await dispatch({
              type: "EXEC",
              run: () => (id ? api.patch(detail(endpoint, id), corps) : api.post(endpoint, corps)),
              refresh,
            });
            if (ok) setOuvert(null);
          }}
          onDelete={
            ouvert !== "nouveau" && writable && supprimable?.(ouvert)
              ? async () => {
                  const ok = await dispatch({ type: "EXEC", run: () => api.del(detail(endpoint, ouvert.id)), refresh });
                  if (ok) setOuvert(null);
                }
              : undefined
          }
          actions={ouvert !== "nouveau" && actionsDrawer ? actionsDrawer(ouvert, () => setOuvert(null)) : undefined}
        />
      )}
    </Panel>
  );
}

function RefDrawer<T extends { id: number }>({
  item,
  titre,
  champs,
  writable,
  valeursInitiales,
  onClose,
  onSave,
  onDelete,
  actions,
}: {
  item: T | null;
  titre: string;
  champs: ChampRef[];
  endpoint: string;
  writable: boolean;
  valeursInitiales: FormRef;
  onClose: () => void;
  onSave: (corps: FormRef, id?: number) => Promise<void>;
  onDelete?: () => Promise<void>;
  actions?: ReactNode;
}) {
  const [form, setForm] = useState<FormRef>(() => {
    if (!item) return { ...valeursInitiales };
    const rec = item as unknown as Record<string, Valeur>;
    return Object.fromEntries(champs.map((c) => [c.cle, rec[c.cle] ?? valeursInitiales[c.cle] ?? null]));
  });
  const [saving, setSaving] = useState(false);
  const set = (cle: string, v: Valeur) => setForm((f) => ({ ...f, [cle]: v }));
  const visibles = champs.filter((c) => !c.visible || c.visible(form));
  const manquant = visibles.some((c) => c.requis && (form[c.cle] === "" || form[c.cle] == null || (c.type === "select" && form[c.cle] === 0)));

  async function enregistrer() {
    setSaving(true);
    // Les champs « création seulement » ne sont pas renvoyés en modification ; les listes vides deviennent null.
    const corps: FormRef = {};
    for (const c of visibles) {
      if (item && c.creationSeulement) continue;
      let v = form[c.cle];
      if (c.type === "select" && (v === 0 || v === "")) v = typeof valeursInitiales[c.cle] === "string" ? "" : null;
      if (c.type === "number" && v === "") v = null;
      if (c.type === "date" && v === "") v = null;
      corps[c.cle] = v;
    }
    await onSave(corps, item?.id);
    setSaving(false);
  }

  const champ = (c: ChampRef) => {
    const verrou = !writable || (!!item && !!c.creationSeulement);
    const v = form[c.cle];
    if (c.type === "checkbox") {
      return (
        <label key={c.cle} className={cn("flex items-center gap-2 text-[13px]", c.pleineLargeur && "sm:col-span-2")}>
          <input type="checkbox" disabled={verrou} checked={!!v} onChange={(e) => set(c.cle, e.target.checked)} />
          {c.label}
        </label>
      );
    }
    let saisie: ReactNode;
    if (c.type === "select") {
      saisie = (
        <select className={inputClass} disabled={verrou} value={v == null ? "" : String(v)} onChange={(e) => set(c.cle, typeof c.options?.[0]?.value === "number" ? Number(e.target.value) || 0 : e.target.value)}>
          <option value="">{c.requis ? "Choisir…" : "—"}</option>
          {c.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    } else if (c.type === "multi") {
      const liste = Array.isArray(v) ? v : [];
      saisie = (
        <div className="max-h-40 overflow-y-auto rounded-[7px] border border-line-strong bg-surface p-2 grid gap-1">
          {(c.options ?? []).length === 0 && <span className="text-[12px] text-muted">Aucun choix disponible.</span>}
          {c.options?.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-[12.5px]">
              <input
                type="checkbox"
                disabled={verrou}
                checked={liste.includes(Number(o.value))}
                onChange={(e) => set(c.cle, e.target.checked ? [...liste, Number(o.value)] : liste.filter((x) => x !== Number(o.value)))}
              />
              <span className="truncate">{o.label}</span>
            </label>
          ))}
        </div>
      );
    } else if (c.type === "textarea") {
      saisie = <textarea className={cn(inputClass, "h-20 py-2")} disabled={verrou} value={v == null ? "" : String(v)} onChange={(e) => set(c.cle, e.target.value)} />;
    } else {
      saisie = (
        <input
          className={cn(inputClass, c.type === "number" && "num text-right")}
          type={c.type === "number" ? "number" : c.type === "date" ? "date" : "text"}
          step={c.type === "number" ? "any" : undefined}
          disabled={verrou}
          placeholder={c.placeholder}
          value={v == null ? "" : String(v)}
          onChange={(e) => set(c.cle, e.target.value)}
        />
      );
    }
    return (
      <div key={c.cle} className={cn(c.pleineLargeur || c.type === "multi" || c.type === "textarea" ? "sm:col-span-2" : "")}>
        <Field label={`${c.label}${c.requis ? " *" : ""}`}>{saisie}</Field>
        {c.aide && <p className="text-[11.5px] text-muted mt-1">{c.aide}</p>}
      </div>
    );
  };

  return (
    <Drawer
      open
      width="lg"
      onClose={onClose}
      title={titre}
      footer={
        writable ? (
          <>
            {onDelete && (
              <Button variant="ghost" className="mr-auto text-danger" onClick={() => void onDelete()}>
                <Trash2 size={14} /> Supprimer
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
            <Button disabled={manquant || saving} onClick={() => void enregistrer()}>
              {item ? <Pencil size={14} /> : <Plus size={14} />} {saving ? "Enregistrement…" : item ? "Enregistrer" : "Créer"}
            </Button>
          </>
        ) : undefined
      }
    >
      <DrawerSection title="Informations">
        <div className="grid sm:grid-cols-2 gap-3">{visibles.map(champ)}</div>
      </DrawerSection>
      {actions}
    </Drawer>
  );
}
