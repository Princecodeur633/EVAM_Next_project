"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, FileDown, FileSpreadsheet, Plus } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, FilterSelect, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { ControleBadge, SaisieControleDrawer } from "@/components/qualite";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { KpiCard } from "@/components/charts";
import { actions, api, endpoints } from "@/lib/api";
import { DECLENCHEUR_LABEL, FAMILLE_PARAMETRE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { ControleRealise, FamilleParametre } from "@/lib/types";
import { cn, formatDateTime, formatQty, num } from "@/lib/utils";

type Vue = "A_FAIRE" | "RETARD" | "LABO" | "REALISES" | "TOUS";

/** Contrôles générés selon le plan (démarrage d’OF, périodiques, chaque lot, réception) et contrôles ponctuels. */
export default function ControlesPage() {
  const { state, can, role } = useStore();
  const [vue, setVue] = useState<Vue>("A_FAIRE");
  const [q, setQ] = useState("");
  const [origine, setOrigine] = useState("");
  const [famille, setFamille] = useState("");
  const [ouvert, setOuvert] = useState<ControleRealise | null>(null);
  const [ponctuel, setPonctuel] = useState(false);
  const tous = state.controlesRealises;
  const point = (id: number) => state.planControle.find((p) => p.id === id);
  const enAttente = (c: ControleRealise) => c.statut === "A_REALISER" || c.statut === "EN_ATTENTE_VALIDATION";

  const lignes = useMemo(
    () =>
      tous
        .filter((c) =>
          vue === "A_FAIRE"
            ? c.statut === "A_REALISER"
            : vue === "RETARD"
              ? !!c.en_retard
              : vue === "LABO"
                ? c.statut === "EN_ATTENTE_VALIDATION"
                : vue === "REALISES"
                  ? !enAttente(c)
                  : true,
        )
        .filter((c) => !origine || (origine === "RECEPTION" ? c.lot_matiere != null : c.ordre_fabrication != null || c.lot != null))
        .filter((c) => !famille || state.parametresQualite.find((p) => p.id === point(c.point)?.parametre)?.famille === famille)
        .filter((c) => matchSearch(q, c.numero, c.controle, c.parametre, c.of_numero, c.lot_numero, c.lot_matiere_numero, c.reference_echantillon))
        .sort((a, b) => Number(!!b.en_retard) - Number(!!a.en_retard) || Number(!!b.bloquant) - Number(!!a.bloquant) || (b.date_prevue ?? "").localeCompare(a.date_prevue ?? "")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tous, vue, origine, famille, q, state.planControle, state.parametresQualite],
  );

  const aFaire = tous.filter((c) => c.statut === "A_REALISER").length;
  const retard = tous.filter((c) => c.en_retard).length;
  const retardBloquant = tous.filter((c) => c.en_retard && c.bloquant).length;
  const labo = tous.filter((c) => c.statut === "EN_ATTENTE_VALIDATION").length;
  const familles = [...new Set(state.parametresQualite.map((p) => p.famille))].map((f) => ({ value: f, label: FAMILLE_PARAMETRE_LABEL[f as FamilleParametre] }));

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Qualité"
        title={role === "MAGASINIER" ? "Contrôles de réception" : "Contrôles"}
        description="Générés automatiquement selon le plan de contrôle : au démarrage de l’OF, périodiquement, à chaque lot, après un changement de série et à la réception des lots matières. La conformité est calculée à partir des critères ; un résultat non conforme ouvre une non-conformité."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void actions.exporterControles("xlsx").catch(() => {})}>
              <FileSpreadsheet size={15} /> Excel
            </Button>
            <Button variant="secondary" onClick={() => void actions.exporterControles("pdf").catch(() => {})}>
              <FileDown size={15} /> PDF
            </Button>
            {can("CREER_CONTROLE_PONCTUEL") && (
              <Button onClick={() => setPonctuel(true)}>
                <Plus size={15} /> Contrôle ponctuel
              </Button>
            )}
          </div>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="À réaliser" value={aFaire} tone={aFaire ? "warning" : "success"} />
        <KpiCard label="En retard" value={retard} hint={retardBloquant ? `${retardBloquant} bloquant(s)` : undefined} tone={retard ? "danger" : "success"} />
        <KpiCard label="Au laboratoire" value={labo} tone="teal" />
        <KpiCard label="Réalisés" value={tous.filter((c) => c.statut === "CONFORME" || c.statut === "NON_CONFORME").length} />
      </div>
      <Panel className="overflow-hidden">
        <FilterBar
          shown={lignes.length}
          total={tous.length}
          active={!!q || !!origine || !!famille || vue !== "A_FAIRE"}
          onReset={() => {
            setQ("");
            setOrigine("");
            setFamille("");
            setVue("A_FAIRE");
          }}
        >
          <SearchInput value={q} onChange={setQ} placeholder="N°, contrôle, OF, lot, échantillon…" />
          <Segmented
            label="Vue"
            value={vue}
            onChange={setVue}
            options={[
              { value: "A_FAIRE", label: "À réaliser", count: aFaire },
              { value: "RETARD", label: "En retard", count: retard },
              { value: "LABO", label: "Laboratoire", count: labo },
              { value: "REALISES", label: "Réalisés" },
              { value: "TOUS", label: "Tous" },
            ]}
          />
          <FilterSelect
            label="Origine"
            allLabel="Production et réception"
            value={origine}
            onChange={setOrigine}
            options={[
              { value: "PRODUCTION", label: "Production (OF, lots)" },
              { value: "RECEPTION", label: "Réception (lots matières)" },
            ]}
          />
          {familles.length > 0 && <FilterSelect label="Famille" allLabel="Toutes familles" value={famille} onChange={setFamille} options={familles} />}
        </FilterBar>
        <DataTable
          emptyText={tous.length ? "Aucun contrôle pour ces filtres." : "Aucun contrôle : ils sont générés au lancement des OF et à la réception des lots matières."}
          columns={[
            { key: "n", label: "N°" },
            { key: "c", label: "Contrôle" },
            { key: "o", label: "Rattaché à" },
            { key: "cr", label: "Critère" },
            { key: "v", label: "Résultat", className: "text-right" },
            { key: "p", label: "Prévu" },
            { key: "s", label: "Statut" },
          ]}
          rows={lignes.map((c) => ({
            _id: c.id,
            n: <span className="num font-medium">{c.numero}</span>,
            c: (
              <span className="inline-flex flex-col">
                <span className="font-medium">{c.controle}</span>
                <span className="text-[11.5px] text-muted">
                  {c.parametre}
                  {c.bloquant && <span className="text-danger"> · bloquant</span>}
                  {c.est_reprise && " · reprise"}
                </span>
              </span>
            ),
            o: c.of_numero ? `OF ${c.of_numero}${c.lot_numero ? ` · lot ${c.lot_numero}` : ""}` : c.lot_matiere_numero ? `Lot matière ${c.lot_matiere_numero}` : c.lot_numero ? `Lot ${c.lot_numero}` : "—",
            cr: c.critere ? `${c.critere}${c.unite ? ` ${c.unite}` : ""}` : "—",
            v:
              c.valeur != null ? (
                <span className={cn("num", c.conforme === false && "text-danger font-semibold")}>
                  {formatQty(num(c.valeur), 3)} {c.unite}
                </span>
              ) : c.resultat_qualitatif ? (
                <span className={cn(c.resultat_qualitatif === "NON_CONFORME" && "text-danger font-semibold")}>{c.resultat_qualitatif === "CONFORME" ? "Conforme" : "Non conforme"}</span>
              ) : (
                "—"
              ),
            p: c.date_prevue ? <span className={cn(c.en_retard && "text-danger font-medium")}>{formatDateTime(c.date_prevue)}</span> : "—",
            s: <ControleBadge controle={c} />,
          }))}
          onRowClick={(row) => setOuvert(tous.find((c) => c.id === row._id) ?? null)}
        />
      </Panel>
      {ouvert && <SaisieControleDrawer controle={ouvert} onClose={() => setOuvert(null)} />}
      {ponctuel && <ControlePonctuelDrawer onClose={() => setPonctuel(false)} />}
    </div>
  );
}

/** Contrôle ajouté à la main (Qualité / Production) : un point du plan rattaché à un OF, un lot ou un lot matière. */
function ControlePonctuelDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch, articleName } = useStore();
  const points = state.planControle.filter((p) => p.statut === "ACTIF");
  const [point, setPoint] = useState(0);
  const [cible, setCible] = useState<"OF" | "LOT" | "LOT_MATIERE">("OF");
  const [of, setOf] = useState(0);
  const [lot, setLot] = useState(0);
  const [lotMatiere, setLotMatiere] = useState(0);
  const [saving, setSaving] = useState(false);
  const choisi = points.find((p) => p.id === point);
  const reception = choisi?.declencheur === "RECEPTION";
  const ofs = state.ofList.filter((o) => o.statut !== "CLOTURE" && o.statut !== "ANNULE");
  const valide = !!point && (reception ? !!lotMatiere : cible === "OF" ? !!of : !!lot);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({
      type: "EXEC",
      run: () =>
        api.post(endpoints.controlesRealises, {
          point,
          ordre_fabrication: !reception && cible === "OF" ? of : null,
          lot: !reception && cible === "LOT" ? lot : null,
          lot_matiere: reception ? lotMatiere : null,
        }),
      refresh: ["controlesRealises"],
    });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Contrôle ponctuel"
      subtitle="Ajouté à la main, en plus des contrôles générés par le plan."
      icon={<ClipboardCheck size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!valide || saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer le contrôle"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Contrôle du plan">
        <Field label="Point de contrôle (actif)">
          <select className={inputClass} value={point} onChange={(e) => setPoint(Number(e.target.value))} autoFocus>
            <option value={0}>Choisir…</option>
            {points.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.designation}
              </option>
            ))}
          </select>
        </Field>
        {choisi && (
          <p className="text-[12px] text-muted">
            {choisi.parametre_libelle} · {DECLENCHEUR_LABEL[choisi.declencheur]}
            {choisi.bloquant && <StatusBadge tone="danger">Bloquant</StatusBadge>}
          </p>
        )}
      </DrawerSection>
      {choisi && (
        <DrawerSection title="Rattachement">
          {reception ? (
            <Field label="Lot matière">
              <select className={inputClass} value={lotMatiere} onChange={(e) => setLotMatiere(Number(e.target.value))}>
                <option value={0}>Choisir…</option>
                {state.lotsMatieres
                  .filter((l) => !choisi.article || l.article === choisi.article)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.numero} · {articleName(l.article)}
                    </option>
                  ))}
              </select>
            </Field>
          ) : (
            <>
              <Segmented
                label="Rattaché à"
                value={cible}
                onChange={(v) => setCible(v as "OF" | "LOT")}
                options={[
                  { value: "OF", label: "Un OF" },
                  { value: "LOT", label: "Un lot de produit fini" },
                ]}
              />
              {cible === "OF" ? (
                <Field label="OF">
                  <select className={inputClass} value={of} onChange={(e) => setOf(Number(e.target.value))}>
                    <option value={0}>Choisir…</option>
                    {ofs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.numero} · {articleName(o.article)}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <Field label="Lot">
                  <select className={inputClass} value={lot} onChange={(e) => setLot(Number(e.target.value))}>
                    <option value={0}>Choisir…</option>
                    {state.lots.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.numero_lot} · {articleName(l.article)}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </>
          )}
        </DrawerSection>
      )}
    </Drawer>
  );
}
