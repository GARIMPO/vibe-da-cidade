import React, { useState, useEffect, lazy, Suspense, memo } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import GradientText from '@/components/GradientText';
import { supabase } from '@/lib/supabase';
import { useInView } from 'react-intersection-observer';
import BannerCarousel from '@/components/BannerCarousel';

// Lazy loading do componente de bares que é pesado
const LazyBarList = lazy(() => import('@/components/BarList'));

const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80';

// Componente com animação fade-in quando entra na viewport
const FadeInSection = ({ children }: { children: React.ReactNode }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '0px 0px 100px 0px'
  });

  return (
    <div
      ref={ref}
      className={`transition-opacity duration-1000 ease-in-out ${
        inView ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  );
};

// Componente de imagem de capa com pré-carregamento
const CoverImage = memo(({ imageUrl }: { imageUrl: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => setIsLoaded(true);
  }, [imageUrl]);

  return (
    <div 
      className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 transition-opacity duration-500" 
      style={{ 
        backgroundImage: `url(${imageUrl})`,
        backgroundPosition: 'center 30%',
        opacity: isLoaded ? 1 : 0
      }}
    >
      {/* Overlay gradiente para garantir legibilidade do texto */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black z-0"></div>
    </div>
  );
});

const Index: React.FC = () => {
  const [coverImage, setCoverImage] = useState<string>(DEFAULT_COVER_IMAGE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [barListRef, barListInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  
  // Buscar a URL da imagem de capa das configurações do site
  useEffect(() => {
    let isMounted = true;
    const fetchCoverImage = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'cover_image')
          .single();
          
        if (data?.value && isMounted) {
          setCoverImage(data.value);
        }
      } catch (error) {
        console.error('Erro ao buscar imagem de capa:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchCoverImage();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      <main className="flex-grow">
        <div className="relative h-[80vh] flex items-center justify-center">
          {/* Imagem de fundo com pré-carregamento */}
          <CoverImage imageUrl={coverImage} />
          
          {/* Conteúdo */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-6 px-4 text-center">
            <FadeInSection>
              <div>
                <GradientText
                  colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
                  animationSpeed={3}
                  showBorder={false}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-center"
                >
                  <span className="md:inline">Bem-vindo ao</span>{" "}
                  <span className="block md:inline">Vibe da Cidade</span>
                </GradientText>
              </div>
              <p className="text-xl md:text-2xl text-center text-white max-w-2xl mt-6 mx-auto">
                Descubra os melhores Bares e Restaurantes da cidade
              </p>
              
              <div className="mt-8 flex flex-col items-center">
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
                
                <div className="mt-4"></div>
                
                {/* Componente de Carrossel de Banners Promocionais */}
                <BannerCarousel />
              </div>
            </FadeInSection>
          </div>
        </div>
        
        {/* Carregar BarList apenas quando estiver próximo da viewport */}
        <div ref={barListRef} className="w-full">
          {barListInView && (
            <Suspense fallback={
              <div className="w-full py-20 flex justify-center items-center">
                <div className="w-12 h-12 border-t-4 border-nightlife-400 rounded-full animate-spin"></div>
              </div>
            }>
              <LazyBarList />
            </Suspense>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default memo(Index);
