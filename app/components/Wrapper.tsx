"use client"; // important pour utiliser des hooks dans App Router
import React from 'react'
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from './Navbar';
import "../globals.css"; // Assurez-vous que le fichier CSS est importé ici
import Loading from './Loading';
type WrapperProps = {
    children : React.ReactNode;
}
const Wrapper = ({children}:WrapperProps) => {
      const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) return <Loading/>;
  return (
    <div>
        <Navbar/>
    <div className= 'px-5 md:px-[10%] mt-8 mb-10'>
        {children}
    </div>
    </div>
  )
}

export default Wrapper