import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { STATUT_FACTURE_LABEL, TYPE_COMMANDE_LABEL } from "./labels";
import type { Client, Commande, Facture, LigneFacture } from "./types";
import { formatDa, formatDate, formatQty, num } from "./utils";

/**
 * Génère le PDF d'une facture côté navigateur (aucun appel réseau) et
 * déclenche son téléchargement. Reprend uniquement des montants déjà
 * calculés par le backend (LigneFacture, Facture) : rien n'est recalculé ici,
 * pour ne jamais afficher un total différent de celui vu à l'écran.
 */
export function telechargerFacturePdf(params: {
  facture: Facture;
  client: Client;
  commande: Commande;
  lignes: LigneFacture[];
  articleName: (id: number) => string;
}) {
  const { facture, client, commande, lignes, articleName } = params;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marge = 14;
  let y = 18;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("EVAM", marge, y);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Facture", 210 - marge, y, { align: "right" });

  y += 6;
  doc.setDrawColor(210);
  doc.line(marge, y, 210 - marge, y);
  y += 8;

  doc.setFontSize(10);
  const ligneInfo = (label: string, valeur: string, x: number) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, x, y);
    doc.setFont("helvetica", "normal");
    doc.text(valeur, x + 32, y);
  };
  ligneInfo("N° facture :", facture.numero, marge);
  ligneInfo("N° commande :", commande.numero, 110);
  y += 6;
  ligneInfo("Émise le :", formatDate(facture.date_emission), marge);
  ligneInfo("Type :", TYPE_COMMANDE_LABEL[commande.type_commande] ?? commande.type_commande, 110);
  y += 6;
  ligneInfo("Échéance :", facture.date_echeance ? formatDate(facture.date_echeance) : "Comptant", marge);
  ligneInfo("Statut :", STATUT_FACTURE_LABEL[facture.statut] ?? facture.statut, 110);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Client", marge, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(`${client.code} · ${client.nom}`, marge, y);
  y += 5;
  if (client.adresse) {
    doc.text(client.adresse, marge, y);
    y += 5;
  }
  if (client.telephone) {
    doc.text(client.telephone, marge, y);
    y += 5;
  }
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: marge, right: marge },
    head: [["Article", "Qté", "P.U. HT", "TVA", "Montant TVA", "Total TTC"]],
    body: lignes.map((l) => [
      articleName(l.article),
      formatQty(num(l.quantite), 2),
      formatDa(num(l.prix_unitaire_ht)),
      `${num(l.taux_tva_applique)} %`,
      formatDa(num(l.montant_tva)),
      formatDa(num(l.montant_ttc)),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY ?? y + 10;
  let ty = finalY + 8;
  const total = (label: string, valeur: string, gras = false) => {
    doc.setFont("helvetica", gras ? "bold" : "normal");
    doc.setFontSize(gras ? 11 : 10);
    doc.text(label, 140, ty);
    doc.text(valeur, 210 - marge, ty, { align: "right" });
    ty += 6;
  };
  total("Montant HT", formatDa(num(facture.montant_ht_total)));
  total("Taxes (TVA + accise + centimes)", formatDa(num(facture.montant_taxes_total)));
  total("Total TTC", formatDa(num(facture.montant_total)), true);

  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(
    "Document généré depuis EVAM — les montants et taxes proviennent du calcul fiscal effectué par le serveur.",
    marge,
    287,
  );

  doc.save(`Facture_${facture.numero}.pdf`);
}
