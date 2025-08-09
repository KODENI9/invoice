"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function UserButton() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as { name: string; email: string });
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!user) return null; // pas connecté, rien à afficher

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost normal-case">
        {user.name}
      </label>
      <ul
        tabIndex={0}
        className="menu dropdown-content p-2 shadow bg-base-100 rounded-box w-52"
      >
        <li className="font-bold">{user.name}</li>
        <li className="text-sm opacity-70">{user.email}</li>
        <div className="divider my-1"></div>
        <li>
          <button onClick={handleLogout} className="text-error">
            Se déconnecter
          </button>
        </li>
      </ul>
    </div>
  );
}
