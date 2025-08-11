"use client";

import React, { useEffect, useRef } from "react";
import SignaturePad from "signature_pad";

interface SignatureProps {
  value?: string; // image base64 si déjà existante
  onChange: (dataUrl: string) => void;
}

const MySignaturePad: React.FC<SignatureProps> = ({ value, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sigPadRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const pad = new SignaturePad(canvasRef.current, {
        penColor: "black",
        backgroundColor: "white",
      });
      sigPadRef.current = pad;

      pad.addEventListener("endStroke", () => {
        const data = pad.toDataURL("image/png", 0.5); // compression à 50%
        onChange(data);
      });

      // Si une signature existe déjà, la charger
      if (value) {
        const img = new Image();
        img.src = value;
        img.onload = () => {
          const ctx = canvasRef.current!.getContext("2d");
          ctx?.drawImage(img, 0, 0);
        };
      }
    }
  }, [value]);

  const clear = () => {
    sigPadRef.current?.clear();
    onChange("");
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={320}
        height={200}
        className="border border-gray-400 border-dashed rounded-xl"
      />
      <p>ca ne focntionne pas pour le moment </p>
    </div>
  );
};

export default MySignaturePad;
