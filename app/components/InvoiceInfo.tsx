"use client";

import { db } from "@/lib/firebase";
import { Invoice } from "@/type";
import { doc, updateDoc } from "firebase/firestore";
import React, { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";

type Props = {
  invoice: Invoice;
  setInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
};

const InvoiceInfo: React.FC<Props> = ({ invoice }) => {
  const [localInvoice, setLocalInvoice] = useState<Invoice>(invoice);
  const sigCanvas = useRef<SignatureCanvas>(null);

  // Sync initial seulement
  useEffect(() => {
    setLocalInvoice(invoice);
  }, [invoice.id]);

  const updateField = (field: keyof Invoice, value: any) => {
    // Rendu instantané
    setLocalInvoice(prev => ({ ...prev, [field]: value }));

    // Sauvegarde Firestore (asynchrone)
    const docRef = doc(db, "invoices", invoice.id);
    updateDoc(docRef, { [field]: value }).catch(console.error);
  };

  const saveSignature = () => {
    if (sigCanvas.current) {
      const dataURL = sigCanvas.current
        .getTrimmedCanvas()
        .toDataURL("image/png", 0.4); // compression

      updateField("signature", dataURL);
    }
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
    updateField("signature", "");
  };

  return (
    <div className="flex flex-col h-fit bg-base-200 p-5 rounded-xl mb-4">
      <div className="space-y-4">
        <h2 className="badge badge-accent">Émetteur</h2>
        <input
          type="text"
          value={localInvoice.issuerName}
          placeholder="Nom de l'entreprise émettrice"
          className="input input-bordered w-full"
          onChange={e => updateField("issuerName", e.target.value)}
        />

        <textarea
          value={localInvoice.issuerAddress}
          placeholder="Adresse de l'entreprise émettrice"
          className="textarea textarea-bordered w-full h-40"
          onChange={e => updateField("issuerAddress", e.target.value)}
        />

        <h2 className="badge badge-accent">Client</h2>
        <input
          type="text"
          value={localInvoice.clientName}
          placeholder="Nom de l'entreprise cliente"
          className="input input-bordered w-full"
          onChange={e => updateField("clientName", e.target.value)}
        />

        <textarea
          value={localInvoice.clientAddress}
          placeholder="Adresse de l'entreprise cliente"
          className="textarea textarea-bordered w-full h-40"
          onChange={e => updateField("clientAddress", e.target.value)}
        />

        <h2 className="badge badge-accent">Date de la Facture</h2>
        <input
          type="date"
          value={localInvoice.invoiceDate}
          className="input input-bordered w-full"
          onChange={e => updateField("invoiceDate", e.target.value)}
        />

        <h2 className="badge badge-accent">Date d échéance</h2>
        <input
          type="date"
          value={localInvoice.dueDate}
          className="input input-bordered w-full"
          onChange={e => updateField("dueDate", e.target.value)}
        />

        {/* Signature */}
        <h2 className="badge badge-accent">Signature</h2>
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          onEnd={saveSignature}
          canvasProps={{
            width: 320,
            height: 200,
            className: "border border-gray-400 rounded",
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
