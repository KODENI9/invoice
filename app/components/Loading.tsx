// components/Loading.tsx
import React from "react";

const Loading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200">
      <span className="loading loading-spinner loading-lg text-accent"></span>
      <p className="mt-4 text-lg font-semibold text-accent">Chargement...</p>
    </div>
  );
};

export default Loading;
