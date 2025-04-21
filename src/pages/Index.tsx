import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import BarList from '@/components/BarList';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import GradientText from '@/components/GradientText';
import { supabase } from '@/lib/supabase';

const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80';

const Index: React.FC = () => {
  const [coverImage, setCoverImage] = useState<string>(DEFAULT_COVER_IMAGE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Buscar a URL da imagem de capa das configurações do site
  useEffect(() => {
    const fetchCoverImage = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'cover_image')
          .single();
          
        if (data?.value) {
          setCoverImage(data.value);
        }
      } catch (error) {
        console.error('Erro ao buscar imagem de capa:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCoverImage();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      <main className="flex-grow">
        <div className="relative h-[80vh] flex items-center justify-center">
          {/* Imagem de fundo com overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0" 
            style={{ 
              backgroundImage: `url(${coverImage})`,
              backgroundPosition: 'center 30%'
            }}
          >
            {/* Overlay gradiente para garantir legibilidade do texto */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black z-0"></div>
          </div>
          
          {/* Conteúdo */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-6 px-4 text-center">
            <div>
              <GradientText
                colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
                animationSpeed={3}
                showBorder={false}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-center"
              >
                Bem-vindo ao Vibe da Cidade
              </GradientText>
            </div>
            <p className="text-xl md:text-2xl text-center text-white max-w-2xl">
              Descubra os melhores Bares e Restaurantes da cidade
            </p>
            
            <div className="mt-8">
              <Link to="/bares">
                <GradientText
                  colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
                  animationSpeed={3}
                  showBorder={true}
                  className="px-8 py-4 text-lg md:text-xl font-bold rounded-full tracking-wider hover:scale-105 transition-transform duration-300"
                >
                  BUSCAR AGORA
                </GradientText>
              </Link>
            </div>
          </div>
        </div>
        
        <BarList />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
