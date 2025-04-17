import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import BarList from '@/components/BarList';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import GradientText from '@/components/GradientText';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      <main className="flex-grow">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="mt-12">
            <GradientText
              colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
              animationSpeed={3}
              showBorder={false}
              className="text-4xl font-bold text-center"
            >
              Bem-vindo ao Vibe da Cidade
            </GradientText>
          </div>
          <p className="text-xl text-center">Descubra os melhores Bares e Restaurantes da cidade</p>
        </div>
        <BarList />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
