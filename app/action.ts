"use client"
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { auth, db } from "@/lib/firebase";
// import { doc, setDoc } from "firebase/firestore";


import { db } from "@/lib/firebase"; // ton instance Firestore initialisée
import { Invoice, InvoiceLine } from "@/type";
import { randomBytes } from "crypto";
import { collection, query, where, getDocs, doc, setDoc, getDoc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";



// export async function addUser(email = "", password = "", name = "") {
//     try{
//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//       await setDoc(doc(db, "users", userCredential.user.uid), {
//         name,
//         email,
//       });
//     } catch(error){
//         console.error("Error adding user:", error);
//     }
// }


export const generateUniqueId = async (): Promise<string> => {
  let uniqueId = "";
  let isUnique = false;

  while (!isUnique) {
    uniqueId = randomBytes(3).toString("hex"); // 6 caractères hex

    // Vérifie si un document avec cet ID existe dans la collection invoices
    const docRef = doc(db, "invoices", uniqueId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      isUnique = true;
    }
  }

  return uniqueId;
};

export async function createEmptyInvoice(email: string, name: string) {
  try {
    // 1. Trouver l'utilisateur par email dans la collection "users"
    const usersRef = collection(db, "users");
    const q = query(usersRef, 
        where("email", "==", email)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error("Utilisateur non trouvé");
      return;
    }

    // On récupère le premier utilisateur trouvé (email unique normalement)
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    // 2. Générer un ID unique pour la facture
    const invoiceId =  await generateUniqueId() as string;

    // 3. Créer la facture dans la collection "invoices"
    const invoiceRef = doc(db, "invoices", invoiceId);
    await setDoc(invoiceRef, {
      id: invoiceId,
      name: name,
      userId: userId,
      status : 1 , 
      issuerName: "",
      issuerAddress: "",
      clientName: "",
      clientAddress: "",
      invoiceDate: "",
      dueDate: "",
      vatActive: false,
      vatRate: 20,
      signature: "",
    });

    console.log("Facture créée avec succès :", invoiceId);
    return invoiceId;
  } catch (error) {
    console.error("Erreur création facture:", error);
  }
}

export async function getInvoiceLines(invoiceId: string): Promise<InvoiceLine[]> {
  const linesRef = collection(db, "invoices", invoiceId, "lines");
  const linesSnapshot = await getDocs(linesRef);

  if (linesSnapshot.empty) {
    return [];
  }

  // On cast chaque doc.data() en InvoiceLine sans l'id, puis on ajoute id manuellement
  return linesSnapshot.docs.map(doc => {
    const data = doc.data() as Omit<InvoiceLine, "id">;

    // Optionnel : tu peux vérifier que data contient bien les propriétés nécessaires
    return {
      id: doc.id,
      description: data.description ?? "",
      quantity: data.quantity ?? 0,
      unitPrice: data.unitPrice ?? 0,
      invoiceId: invoiceId, // facultatif selon ton interface
    };
  });
}

export async function getInvoicesByEmail(email: string): Promise<Invoice[]> {
  if (!email) return [];

  try {
    // 1. Trouver l’utilisateur
    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where("email", "==", email));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      console.error("Utilisateur non trouvé");
      return [];
    }

    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;

    // 2. Récupérer factures
    const invoicesRef = collection(db, "invoices");
    const invoicesQuery = query(invoicesRef, where("userId", "==", userId));
    const invoicesSnapshot = await getDocs(invoicesQuery);

    const today = new Date();
    const invoices: Invoice[] = [];

    for (const invoiceDoc of invoicesSnapshot.docs) {
      const invoiceData = invoiceDoc.data();

      // Convertir dueDate en string ISO ou null
      const dueDateRaw = invoiceData.dueDate ? new Date(invoiceData.dueDate) : null;
      const dueDateStr = dueDateRaw ? dueDateRaw.toISOString() : "";

      // Convertir invoiceDate en string ISO ou ""
      const invoiceDateRaw = invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : null;
      const invoiceDateStr = invoiceDateRaw ? invoiceDateRaw.toISOString() : "";

      // Mise à jour statut si en retard et statut = 2
      if (dueDateRaw && dueDateRaw < today && invoiceData.status === 2) {
        await updateDoc(doc(db, "invoices", invoiceDoc.id), { status: 5 });
        invoiceData.status = 5;
      }

      // Récupérer lignes (InvoiceLine[])
      const lines: InvoiceLine[] = await getInvoiceLines(invoiceDoc.id);

      // Construire l'objet Invoice complet avec fallback si besoin
      const invoice: Invoice = {
        id: invoiceDoc.id,
        name: invoiceData.name ?? "",
        issuerName: invoiceData.issuerName ?? "",
        issuerAddress: invoiceData.issuerAddress ?? "",
        clientName: invoiceData.clientName ?? "",
        clientAddress: invoiceData.clientAddress ?? "",
        invoiceDate: invoiceDateStr,
        dueDate: dueDateStr,
        vatActive: invoiceData.vatActive ?? false,
        vatRate: invoiceData.vatRate ?? 0,
        status: invoiceData.status ?? 1,
        userId: invoiceData.userId ?? userId,
        lines: lines || [],
        signature: invoiceData.signature ?? undefined,
      };

      invoices.push(invoice);
    }

    return invoices;
  } catch (error) {
    console.error("Erreur getInvoicesByEmail:", error);
    return [];
  }
}

export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  try {
    // 1. Récupération du document facture
    const invoiceRef = doc(db, "invoices", invoiceId);
    const invoiceSnap = await getDoc(invoiceRef);

    if (!invoiceSnap.exists()) {
      throw new Error("Facture non trouvée.");
      
    }

    const invoiceData = invoiceSnap.data();

    // 2. Récupération des lignes
    let lines: InvoiceLine[] = [];

    if (invoiceData.lines && Array.isArray(invoiceData.lines)) {
      // Cas : lignes directement dans le document
      lines = invoiceData.lines as InvoiceLine[];
    } else {
      // Cas : lignes stockées dans une sous-collection
      const linesRef = collection(db, "invoices", invoiceId, "lines");
      const linesSnap = await getDocs(linesRef);
      lines = linesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as InvoiceLine[];
    }

    // 3. Retourner l'objet complet
    return {
      id: invoiceSnap.id,
      ...invoiceData,
      lines,
    } as Invoice;

  } catch (error) {
    console.error("Erreur getInvoiceById :", error);
    return null;
  }
}

export async function updateInvoice(invoice: Invoice) {
  try {
    // 1️⃣ Vérifier que la facture existe
    const invoiceRef = doc(db, "invoices", invoice.id);
    const invoiceSnap = await getDoc(invoiceRef);

    if (!invoiceSnap.exists()) {
      throw new Error(`Facture avec l'ID ${invoice.id} introuvable.`);
    }

    // 2️⃣ Mettre à jour les infos de la facture
    await updateDoc(invoiceRef, {
      issuerName: invoice.issuerName,
      issuerAddress: invoice.issuerAddress,
      clientName: invoice.clientName,
      clientAddress: invoice.clientAddress,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      vatActive: invoice.vatActive,
      vatRate: invoice.vatRate,
      status: invoice.status,
      signature : invoice.signature || "",
    });

    // 3️⃣ Récupérer les lignes existantes (typées)
    const linesRef = collection(db, "invoices", invoice.id, "lines");
    const existingLinesSnap = await getDocs(linesRef);

    const existingLines: InvoiceLine[] = existingLinesSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<InvoiceLine, "id">),
    }));

    // 4️⃣ Supprimer les lignes qui ne sont plus présentes
    const linesToDelete = existingLines.filter(
      (existingLine) => !invoice.lines.some((line) => line.id === existingLine.id)
    );

    for (const line of linesToDelete) {
      await deleteDoc(doc(db, "invoices", invoice.id, "lines", line.id));
    }

    // 5️⃣ Ajouter ou mettre à jour les lignes
    for (const line of invoice.lines) {
      const existingLine = existingLines.find((l) => l.id === line.id);

      if (existingLine) {
        const hasChanged =
          line.description !== existingLine.description ||
          line.quantity !== existingLine.quantity ||
          line.unitPrice !== existingLine.unitPrice;

        if (hasChanged) {
          await updateDoc(doc(db, "invoices", invoice.id, "lines", line.id), {
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          });
        }
      } else {
        await addDoc(collection(db, "invoices", invoice.id, "lines"), {
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        });
      }
    }
  } catch (error) {
    console.error("Erreur updateInvoice :", error);
  }
}

export async function deleteInvoice(invoiceId: string) {
  try {
    // 1️⃣ Supprimer toutes les lignes de la facture
    const linesRef = collection(db, "invoices", invoiceId, "lines");
    const linesSnap = await getDocs(linesRef);

    for (const lineDoc of linesSnap.docs) {
      await deleteDoc(doc(db, "invoices", invoiceId, "lines", lineDoc.id));
    }

    // 2️⃣ Supprimer la facture elle-même
    await deleteDoc(doc(db, "invoices", invoiceId));

    console.log(`Facture ${invoiceId} supprimée avec succès.`);
  } catch (error) {
    console.error("Erreur lors de la suppression de la facture :", error);
  }
}