import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger, 
  DialogClose 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Youtube } from 'lucide-react';

interface Banner {
  id: number;
  image_url: string;
  text: string;
  link_url: string;
  active: boolean;
}

const BannerCarousel: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  // Efeito para pausar vídeos quando o modal é fechado
  useEffect(() => {
    if (!open) {
      // Quando o modal é fechado, pausa qualquer vídeo do YouTube
      const ytIframes = document.querySelectorAll('iframe[src*="youtube.com"]');
      ytIframes.forEach(iframe => {
        const src = (iframe as HTMLIFrameElement).src;
        (iframe as HTMLIFrameElement).src = '';
        setTimeout(() => {
          (iframe as HTMLIFrameElement).src = src;
        }, 10);
      });
    }
  }, [open]);

  // Buscar banners ativos
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('promotional_banners')
          .select('*')
          .eq('active', true)
          .order('id');
          
        if (error) throw error;
        
        // Mostrar todos os banners ativos, sem filtrar por conteúdo
        const validBanners = data || [];
        
        setBanners(validBanners);
      } catch (error) {
        console.error('Erro ao buscar banners:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBanners();
  }, []);

  // Navegar para o próximo banner
  const nextBanner = () => {
    setCurrentIndex(prevIndex => 
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Navegar para o banner anterior
  const prevBanner = () => {
    setCurrentIndex(prevIndex => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  // Abrir link do banner em nova aba
  const openBannerLink = () => {
    const currentBanner = banners[currentIndex];
    if (currentBanner?.link_url) {
      window.open(currentBanner.link_url, '_blank');
    }
  };

  // Verificar se há banners para exibir
  if (loading || banners.length === 0) {
    return null;
  }

  // Função para verificar se a URL é do YouTube e extrair o ID do vídeo
  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    // Verifica se é uma URL do YouTube
    const youtubeDomains = [
      'youtube.com', 
      'www.youtube.com', 
      'youtu.be', 
      'www.youtu.be',
      'm.youtube.com'
    ];
    
    try {
      const urlObj = new URL(url);
      if (!youtubeDomains.includes(urlObj.hostname)) {
        return null;
      }
      
      // Extrai o ID do vídeo
      if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.substring(1);
      }
      
      const params = new URLSearchParams(urlObj.search);
      return params.get('v');
    } catch (error) {
      // Se não for uma URL válida
      return null;
    }
  };

  const currentBanner = banners[currentIndex];
  const youtubeVideoId = currentBanner ? getYoutubeVideoId(currentBanner.image_url) : null;
  const isYoutubeVideo = !!youtubeVideoId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="mt-12 text-white/90 font-semibold text-lg px-6 py-2 rounded-lg highlight-button animate-pulse-slow relative overflow-hidden">
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-nightlife-600 to-nightlife-900 opacity-50"></span>
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span className="animate-bounce-slow inline-block">⭐</span>
            VER DESTAQUES
            <span className="animate-bounce-slow inline-block" style={{ animationDelay: '0.5s' }}>⭐</span>
          </span>
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] p-0 bg-black/95 border-white/10 text-white">
        <div className="relative w-full">
          {/* Botão de fechar */}
          <DialogClose className="absolute top-2 right-2 z-20 p-1 bg-black/70 rounded-full hover:bg-black/90 transition-colors">
            <X className="h-5 w-5 text-white/90" />
          </DialogClose>

          {/* Conteúdo: Vídeo do YouTube ou Imagem */}
          <div className="w-full h-[350px] relative overflow-hidden">
            {isYoutubeVideo ? (
              // Vídeo do YouTube (iframe)
              <div className="w-full h-full flex items-center justify-center bg-black">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0&showinfo=0&autoplay=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            ) : currentBanner.image_url ? (
              // Imagem
              <img 
                src={currentBanner.image_url} 
                alt={currentBanner.text || 'Banner promocional'}
                className="w-full h-full object-contain"
              />
            ) : (
              // Fallback se não houver imagem
              <div className="w-full h-full flex items-center justify-center bg-nightlife-950">
                <p className="text-white/70 text-center px-4">Informação promocional</p>
              </div>
            )}
            
            {/* Navegação do carrossel - agora sempre visível */}
            <div className="absolute inset-y-0 left-0 flex items-center z-10">
              <button 
                onClick={prevBanner}
                className="p-1 mx-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="h-6 w-6 text-white/90" />
              </button>
            </div>
            
            <div className="absolute inset-y-0 right-0 flex items-center z-10">
              <button 
                onClick={nextBanner}
                className="p-1 mx-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="h-6 w-6 text-white/90" />
              </button>
            </div>
            
            {/* Indicadores - na parte inferior */}
            {banners.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === currentIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Texto - abaixo da imagem/vídeo */}
          <div className="p-5 text-white bg-gradient-to-b from-black to-gray-900 border-t border-white/10">
            {isYoutubeVideo && (
              <div className="mb-2 inline-flex items-center gap-1 px-2 py-1 bg-red-600/20 rounded-md text-xs">
                <Youtube className="h-3 w-3" />
                <span>Conteúdo de vídeo</span>
              </div>
            )}
            {currentBanner.text ? (
              <div 
                className="text-white font-medium text-lg hover:text-nightlife-400 transition-colors cursor-pointer"
                onClick={openBannerLink}
                dangerouslySetInnerHTML={{ __html: currentBanner.text }}
              />
            ) : (
              <div className="text-white/70">
                Banner promocional
              </div>
            )}
            
            {currentBanner.link_url && (
              <div className="mt-2 text-sm text-nightlife-400 hover:text-nightlife-300 cursor-pointer" onClick={openBannerLink}>
                Clique para ver mais
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BannerCarousel; 