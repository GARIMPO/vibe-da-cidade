import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookieConsent: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Verificar se o usuário já deu consentimento anteriormente
    const hasConsent = localStorage.getItem('cookieConsent');
    
    // Se não houver consentimento, mostrar o banner após um pequeno delay
    if (!hasConsent) {
      const timer = setTimeout(() => {
        setShow(true);
      }, 1000); // 1 segundo de delay para não mostrar imediatamente ao carregar a página
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Função para aceitar cookies
  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShow(false);
  };

  // Função para rejeitar cookies
  const rejectCookies = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setShow(false);
    
    // Aqui você poderia adicionar lógica para desativar certos cookies/rastreamento
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/90 backdrop-blur-md border-t border-white/10 animate-in slide-in-from-bottom duration-300 shadow-lg">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-nightlife-800 p-2 rounded-full">
              <Cookie className="h-5 w-5 text-nightlife-400" />
            </div>
            <div className="text-white text-sm">
              <p className="mb-1 font-medium">Política de Cookies</p>
              <p className="text-white/70 text-xs md:max-w-3xl">
                Utilizamos cookies para melhorar sua experiência em nosso site. 
                Eles são necessários para o funcionamento adequado do site.
                Você pode optar por "Rejeitar".
                <Link to="/privacidade" className="text-nightlife-400 hover:underline ml-1">
                  Política de Privacidade.
                </Link>
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 self-end md:self-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={rejectCookies}
              className="bg-transparent border-white/20 hover:bg-nightlife-800"
            >
              Rejeitar
            </Button>
            <Button 
              size="sm" 
              onClick={acceptCookies}
              className="bg-nightlife-600 hover:bg-nightlife-700"
            >
              Aceitar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent; 