import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-t-4 border-nightlife-400 rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-white/70 text-lg">Carregando...</p>
    </div>
  );
};

export default LoadingScreen; 