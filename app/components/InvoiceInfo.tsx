"use client";

import { db } from "@/lib/firebase";
import { Invoice } from "@/type";
import { doc, updateDoc } from "firebase/firestore";
import React from "react";
import MySignaturePad from "./SignaturePad";

interface Props {
  invoice: Invoice | null;
  setInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
}

const InvoiceInfo: React.FC<Props> = ({ invoice, setInvoice }) => {
  const handleInputChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof Invoice
  ) => {
    if (!invoice) return;

    const value = e.target.value;

    // Rendu instantané
    setInvoice((prev) => (prev ? { ...prev, [field]: value } : prev));

    // Sauvegarde Firestore
    const docRef = doc(db, "invoices", invoice.id);
    await updateDoc(docRef, { [field]: value });
  };

  const clearSignature = async () => {
    if (!invoice) return;

    setInvoice((prev) => (prev ? { ...prev, signature: "" } : prev));

    const docRef = doc(db, "invoices", invoice.id);
    await updateDoc(docRef, { signature: "" });
  };

  if (!invoice) return null;

  return (
    <div className="flex flex-col h-fit bg-base-200 p-5 rounded-xl mb-4 md:mb-0">
      <div className="space-y-4">
        <h2 className="badge badge-accent">Émetteur</h2>
        <input
          type="text"
          value={invoice.issuerName}
          placeholder="Nom de l'entreprise émettrice"
          className="input input-bordered w-full"
          onChange={(e) => handleInputChange(e, "issuerName")}
        />

        <textarea
          value={invoice.issuerAddress}
          placeholder="Adresse de l'entreprise émettrice"
          className="textarea textarea-bordered w-full h-40"
          onChange={(e) => handleInputChange(e, "issuerAddress")}
        />

        <h2 className="badge badge-accent">Client</h2>
        <input
          type="text"
          value={invoice.clientName}
          placeholder="Nom de l'entreprise cliente"
          className="input input-bordered w-full"
          onChange={(e) => handleInputChange(e, "clientName")}
        />

        <textarea
          value={invoice.clientAddress}
          placeholder="Adresse de l'entreprise cliente"
          className="textarea textarea-bordered w-full h-40"
          onChange={(e) => handleInputChange(e, "clientAddress")}
        />

        <h2 className="badge badge-accent">Date de la Facture</h2>
        <input
          type="date"
          value={invoice.invoiceDate}
          className="input input-bordered w-full"
          onChange={(e) => handleInputChange(e, "invoiceDate")}
        />

        <h2 className="badge badge-accent">Date déchéance</h2>
        <input
          type="date"
          value={invoice.dueDate}
          className="input input-bordered w-full"
          onChange={(e) => handleInputChange(e, "dueDate")}
        />

        <h2 className="badge badge-accent">Signature</h2>
        <MySignaturePad
          value={invoice.signature}
          onChange={async (dataUrl) => {
            setInvoice((prev) =>
              prev ? { ...prev, signature: dataUrl } : prev
            );
            const docRef = doc(db, "invoices", invoice.id);
            await updateDoc(docRef, { signature: dataUrl });
          }}
        />

        <div className="flex gap-2 mt-2">
          <button className="btn btn-sm btn-accent" onClick={clearSignature}>
            Effacer
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceInfo;
