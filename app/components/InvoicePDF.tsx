import { Invoice, Totals } from "@/type";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { ArrowDownFromLine, Layers } from "lucide-react";
import Image from "next/image";
import React, { useRef } from "react";

interface FacturePDFProps {
  invoice: Invoice;
  totals: Totals;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  return date.toLocaleDateString("fr-FR", options);
}

const InvoicePDF: React.FC<FacturePDFProps> = ({ invoice, totals }) => {
  const factureRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    const element = factureRef.current;
    if (!element) return;

    try {
      // Clone du contenu
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.position = "fixed";
      clone.style.top = "0";
      clone.style.left = "0";
      clone.style.width = "210mm"; // largeur A4
      clone.style.background = "#fff";
      clone.style.zIndex = "-1";
      clone.style.visibility = "visible";
      clone.style.opacity = "1";

      document.body.appendChild(clone);

      // Capture
      const canvas = await html2canvas(clone, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      if (!imgData || imgData.length < 100) {
        throw new Error("Image capturée vide ou invalide.");
      }

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`facture-${invoice.name}.pdf`);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999,
      });
    } catch (error) {
      console.error("Erreur lors de la génération du PDF :", error);
    }
  };

  return (
    <div className="mt-4 hidden lg:block">
      <div className="border-base-300 border-2 border-dashed rounded-xl p-5">
        <button
          onClick={handleDownloadPdf}
          className="btn btn-sm btn-accent mb4"
        >
          Facture PDF
          <ArrowDownFromLine className="w-4" />
        </button>

        <div className="p-8" ref={factureRef}>
          <div className="flex justify-between items-center text-sm">
            <div className="flex flex-col">
              <div>
                <div className="flex items-center">
                  <div className="bg-accent-content text-accent  rounded-full p-2">
                    <Layers className="h-6 w-6" />
                  </div>
                  <span className="ml-3 font-bold text-2xl italic">
                    In<span className="text-accent">Voice</span>
                  </span>
                </div>
              </div>
              <h1 className="text-7xl font-bold uppercase">Facture</h1>
            </div>
            <div className="text-right uppercase">
              <p className="badge badge-ghost ">Facture ° {invoice.id}</p>
              <p className="my-2">
                <strong>Date </strong>
                {formatDate(invoice.invoiceDate)}
              </p>
              <p>
                <strong>Date d'échéance </strong>
                {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>

          <div className="my-6 flex justify-between">
            <div>
              <p className="badge badge-ghost mb-2">Émetteur</p>
              <p className="text-sm font-bold italic">{invoice.issuerName}</p>
              <p className="text-sm text-gray-500 w-52 break-words">
                {invoice.issuerAddress}
              </p>
            </div>
            <div className="text-right">
              <p className="badge badge-ghost mb-2">Client</p>
              <p className="text-sm font-bold italic">{invoice.clientName}</p>
              <p className="text-sm text-gray-500 w-52 break-words">
                {invoice.clientAddress}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th></th>
                  <th>Description</th>
                  <th>Quantité</th>
                  <th>Prix Unitaire</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((ligne, index) => (
                  <tr key={index + 1}>
                    <td>{index + 1}</td>
                    <td>{ligne.description}</td>
                    <td>{ligne.quantity}</td>
                    <td>{ligne.unitPrice.toFixed(2)} €</td>
                    <td>{(ligne.quantity * ligne.unitPrice).toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-2 text-md">
            <div className="flex justify-between">
              <div className="font-bold">Total Hors Taxes</div>
              <div>{totals.totalHT.toFixed(2)} €</div>
            </div>

            {invoice.vatActive && (
              <div className="flex justify-between">
                <div className="font-bold">TVA {invoice.vatRate} %</div>
                <div>{totals.totalVAT.toFixed(2)} €</div>
              </div>
            )}

            <div className="flex justify-between">
              <div className="font-bold">Total Toutes Taxes Comprises</div>
              <div className="badge badge-accent">
                {totals.totalTTC.toFixed(2)} €
              </div>
            </div>

            {invoice.signature && (
              <div className="mt-8 flex justify-end">
                <div>
                  <p className="text-sm font-bold italic">
                    Par {invoice.issuerName}
                  </p>
                  <Image
                    src={invoice.signature}
                    alt="Signature"
                    className="w-48" // plus de border ni rounded
                    width={100}
                    height={100}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePDF;
