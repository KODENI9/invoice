export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  invoiceId?: string; // optionnel car dans sous-collection invoice/{id}/lines
}

export interface Invoice {
  id: string;
  name: string;
  issuerName: string;
  issuerAddress: string;
  clientName: string;
  clientAddress: string;
  invoiceDate: string; // ISO string ou autre format
  dueDate: string;
  vatActive: boolean;
  vatRate: number;
  status: number;
  userId: string;
  lines: InvoiceLine[];
  signature?: string; // ✅ Ajout pour la signature (base64 PNG)
}

export interface Totals {
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
}

