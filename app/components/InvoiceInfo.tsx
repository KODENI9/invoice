"use client";

import { Invoice } from "@/type";
import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

interface Props {
  invoice: Invoice;
  setInvoice: (invoice: Invoice) => void;
}

const InvoiceInfo: React.FC<Props> = ({ invoice, setInvoice }) => {
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string
  ) => {
    setInvoice({ ...invoice, [field]: e.target.value });
  };

  const sigCanvas = useRef<SignatureCanvas>(null);

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setInvoice({ ...invoice, signature: "" });
  };

  console.log(invoice);

  return (
    <div className="flex flex-col h-fit bg-base-200 p-5 rounded-xl mb-4 md:mb-0">
      <div className="space-y-4">
        <h2 className="badge badge-accent">Émetteur</h2>
        <input
          type="text"
          value={invoice?.issuerName}
          placeholder="Nom de l'entreprise émettrice"
          className="input input-bordered w-full resize-none"
          required
          onChange={(e) => handleInputChange(e, "issuerName")}
        />

        <textarea
          value={invoice?.issuerAddress}
          placeholder="Adresse de l'entreprise émettrice"
          className="textarea textarea-bordered w-full resize-none h-40"
          required
          onChange={(e) => handleInputChange(e, "issuerAddress")}
        />

        <h2 className="badge badge-accent">Client</h2>
        <input
          type="text"
          value={invoice?.clientName}
          placeholder="Nom de l'entreprise cliente"
          className="input input-bordered w-full resize-none"
          required
          onChange={(e) => handleInputChange(e, "clientName")}
        />

        <textarea
          value={invoice?.clientAddress}
          placeholder="Adresse de l'entreprise cliente"
          className="textarea textarea-bordered w-full resize-none h-40"
          required
          onChange={(e) => handleInputChange(e, "clientAddress")}
        />

        <h2 className="badge badge-accent">Date de la Facture</h2>
        <input
          type="date"
          value={invoice?.invoiceDate}
          className="input input-bordered w-full resize-none"
          required
          onChange={(e) => handleInputChange(e, "invoiceDate")}
        />

        <h2 className="badge badge-accent">Date déchéance</h2>
        <input
          type="date"
          value={invoice?.dueDate}
          className="input input-bordered w-full resize-none"
          required
          onChange={(e) => handleInputChange(e, "dueDate")}
        />

        {/* Signature */}
        <h2 className="badge badge-accent">Signature</h2>
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          onEnd={() => {
            if (sigCanvas.current) {
              const dataURL = sigCanvas.current
                .getTrimmedCanvas()
                .toDataURL("image/png", 0.5); // compression pour Firestore
              setInvoice({ ...invoice, signature: dataURL });
            }
          }}
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
