import React from 'react';
import AuthForm from '@/components/AuthForm';
import Navbar from '@/components/Navbar';

const Login: React.FC = () => {
  return (
    <div 
      className="min-h-screen bg-no-repeat bg-cover bg-center relative"
      style={{ 
        backgroundImage: 'url(https://img.freepik.com/fotos-gratis/luzes-da-cidade-turva_23-2148139079.jpg?semt=ais_hybrid&w=740)' 
      }}
    >
      {/* Camada de sobreposição escura para melhorar a legibilidade */}
      <div className="absolute inset-0 bg-black/70"></div>
      
      <div className="relative z-10">
        <Navbar />
        <div className="container mx-auto py-16 px-4">
          <div className="max-w-md mx-auto backdrop-blur-sm bg-black/40 rounded-lg p-8 border border-white/10">
            <h1 className="text-3xl font-bold text-center mb-8 text-white">Login</h1>
            <AuthForm mode="login" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 