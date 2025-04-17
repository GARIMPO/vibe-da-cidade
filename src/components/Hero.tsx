import React from 'react';
import { Beer, Music } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-nightlife-700/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-nightlife-900/20 rounded-full filter blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Beer className="h-12 w-12 text-nightlife-500 mr-2" />
            <Music className="h-12 w-12 text-nightlife-500" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white text-glow">
            Vibe da Cidade
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8">
            Descubra os melhores bares e eventos para animar suas noites
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#featured" 
              className="px-8 py-3 bg-nightlife-600 hover:bg-nightlife-700 text-white rounded-full font-medium transition-colors text-center"
            >
              Explorar Bares
            </a>
            <a 
              href="#events" 
              className="px-8 py-3 bg-transparent border border-nightlife-500 hover:bg-nightlife-500/10 text-white rounded-full font-medium transition-colors text-center"
            >
              Ver Eventos da Semana
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
