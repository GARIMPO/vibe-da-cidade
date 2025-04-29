import React, { useState, useEffect, lazy, Suspense, memo } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import GradientText from '@/components/GradientText';
import { supabase } from '@/lib/supabase';
import { useInView } from 'react-intersection-observer';
import BannerCarousel from '@/components/BannerCarousel';
import SplashCursor from '@/components/SplashCursor';
import SplashCursorControl from '@/components/SplashCursorControl';

// Lazy loading do componente de bares que é pesado
const LazyBarList = lazy(() => import('@/components/BarList'));

// Componente com animação fade-in quando entra na viewport
const FadeInSection = memo(({ children }: { children: React.ReactNode }) => {
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
});

// Componente de imagem de capa com pré-carregamento
const CoverImage = memo(({ imageUrl }: { imageUrl: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Se não tiver URL de imagem, não tenta carregar
  if (!imageUrl) {
    return null;
  }

  useEffect(() => {
    // Usar uma variável para rastrear se o componente ainda está montado
    let isMounted = true;
    
    const img = new Image();
    
    // Definir um timeout para evitar esperar indefinidamente
    const timeoutId = setTimeout(() => {
      if (isMounted) setIsLoaded(true);
    }, 3000);
    
    img.onload = () => {
      if (isMounted) {
        clearTimeout(timeoutId);
        setIsLoaded(true);
      }
    };
    
    img.src = imageUrl;
    
    // Limpar efeitos quando o componente for desmontado
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [imageUrl]);

  return (
    <div 
      className="absolute inset-0 bg-cover bg-center bg-black bg-no-repeat z-0 transition-opacity duration-500" 
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
  const [coverImage, setCoverImage] = useState<string>('');
  const [isImageLoading, setIsImageLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSplashCursorEnabled, setIsSplashCursorEnabled] = useState<boolean>(false);
  const [isAdminEnabled, setIsAdminEnabled] = useState<boolean>(false); // Estado para verificar se o admin habilitou o recurso
  const [userEnabled, setUserEnabled] = useState<boolean>(true); // Estado para o controle do usuário
  const [cursorIntensity, setCursorIntensity] = useState<number>(3); // Intensidade inicial média (1-10)
  
  const [barListRef, barListInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  
  // Adicionar useEffect para logs do estado do SplashCursor
  useEffect(() => {
    console.log('Estado do SplashCursor alterado:', isSplashCursorEnabled && userEnabled);
  }, [isSplashCursorEnabled, userEnabled]);
  
  // Buscar a URL da imagem de capa e configurações do site
  useEffect(() => {
    let isMounted = true;
    
    // Carregar preferências do usuário do localStorage primeiro,
    // para evitar esperar pela chamada da API
    const loadUserPreferences = () => {
      // Carregar preferência do usuário do localStorage
      const savedUserPreference = localStorage.getItem('userSplashCursorEnabled');
      if (savedUserPreference !== null) {
        setUserEnabled(savedUserPreference === 'true');
      }
      
      // Carregar intensidade do localStorage
      const savedIntensity = localStorage.getItem('userSplashCursorIntensity');
      if (savedIntensity !== null) {
        setCursorIntensity(parseInt(savedIntensity, 10));
      } else {
        // Se não houver valor salvo, começar com intensidade média
        setCursorIntensity(3);
      }
    };
    
    // Carregar dados do usuário imediatamente
    loadUserPreferences();
    
    // Buscar configurações do servidor em paralelo
    const fetchSettings = async () => {
      try {
        setIsImageLoading(true);
        
        // Usar Promise.all para buscar dados em paralelo
        const [coverImageResponse, splashCursorResponse] = await Promise.all([
          // Fetch cover image
          supabase.from('site_settings').select('value').eq('key', 'cover_image').single(),
          // Fetch splash cursor setting
          supabase.from('site_settings').select('value').eq('key', 'splash_cursor_enabled').single()
        ]);
          
        if (coverImageResponse.data?.value && isMounted) {
          setCoverImage(coverImageResponse.data.value);
        } else {
          // Não definir imagem de fallback, simplesmente mantém como string vazia
          console.log('Nenhuma imagem de capa encontrada');
        }
        
        if (splashCursorResponse.data?.value && isMounted) {
          console.log('Configuração do SplashCursor:', splashCursorResponse.data.value);
          const isEnabled = splashCursorResponse.data.value === 'true';
          setIsSplashCursorEnabled(isEnabled);
          setIsAdminEnabled(isEnabled); // Armazenar a configuração do admin
        } else {
          console.log('Configuração do SplashCursor não encontrada ou vazia');
          setIsSplashCursorEnabled(false);
          setIsAdminEnabled(false);
        }
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        setIsSplashCursorEnabled(false);
        setIsAdminEnabled(false);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsImageLoading(false);
        }
      }
    };
    
    fetchSettings();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Toggle estado do efeito pelo usuário
  const handleToggleSplashCursor = () => {
    const newValue = !userEnabled;
    setUserEnabled(newValue);
    
    // Forçar uma pequena mudança na intensidade para reiniciar o efeito, e depois voltar
    if (newValue) {
      // Se está reativando o efeito, forçar uma atualização dos parâmetros
      // para garantir que o efeito seja recriado
      setTimeout(() => {
        const tempIntensity = cursorIntensity + 0.01;
        setCursorIntensity(tempIntensity);
        
        // Após um pequeno delay, voltar ao valor original
        setTimeout(() => {
          setCursorIntensity(cursorIntensity);
        }, 50);
      }, 10);
    }
    
    // Salvar preferência do usuário no localStorage
    localStorage.setItem('userSplashCursorEnabled', newValue.toString());
  };
  
  // Alterar intensidade do efeito
  const handleIntensityChange = (value: number) => {
    setCursorIntensity(value);
    // Salvar preferência de intensidade no localStorage
    localStorage.setItem('userSplashCursorIntensity', value.toString());
  };
  
  // Calcular os parâmetros do SplashCursor baseados na intensidade
  const getDynamicCursorParams = () => {
    // Escalar os parâmetros baseados na intensidade (1-10)
    // Usar curvas não lineares para melhor percepção da intensidade
    const intensityFactor = Math.pow(cursorIntensity / 5, 1.5); // Exponencial para diferenciar melhor os valores baixos
    
    return {
      SPLAT_RADIUS: 0.15 * intensityFactor + 0.05, // Mínimo de 0.05 mesmo na intensidade mais baixa
      DENSITY_DISSIPATION: 4.0 / intensityFactor, // Menor valor = efeito mais persistente
      SPLAT_FORCE: 4000 * intensityFactor,
      COLOR_UPDATE_SPEED: 8 * intensityFactor,
      // Desabilitar completamente os splats automáticos
      DISABLE_AUTO_SPLATS: true
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Exibir o SplashCursor apenas se habilitado pelo admin E pelo usuário */}
      {isAdminEnabled && userEnabled && (
        <SplashCursor 
          key={`splash-cursor-${userEnabled}-${cursorIntensity}`} 
          {...getDynamicCursorParams()} 
        />
      )}
      
      {/* Mostrar controles apenas se o recurso estiver habilitado pelo admin */}
      {isAdminEnabled && (
        <SplashCursorControl 
          isEnabled={userEnabled} 
          onToggle={handleToggleSplashCursor}
          intensity={cursorIntensity}
          onIntensityChange={handleIntensityChange}
        />
      )}
      
      <Navbar />
      <main className="flex-grow">
        <div className="relative h-[80vh] flex items-center justify-center">
          {/* Imagem de fundo com pré-carregamento */}
          {!isImageLoading && coverImage && <CoverImage imageUrl={coverImage} />}
          
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
        
        {/* Carregar BarList apenas quando estiver próximo da viewport e após carregar a página principal */}
        <div ref={barListRef} className="w-full">
          {barListInView && !isLoading && (
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
