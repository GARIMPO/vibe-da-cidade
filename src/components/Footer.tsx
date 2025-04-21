import React from 'react';
import { Beer, Instagram, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black border-t border-white/10 py-12 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Beer className="h-8 w-8 text-nightlife-500" />
              <span className="text-xl font-bold text-white">Vibe da Cidade</span>
            </div>
            <p className="text-white/60 text-sm">
              Descubra os melhores bares e eventos da cidade e aproveite cada movimento.
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/garimpodeofertas_top?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" className="text-white/60 hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                <Instagram size={20} />
              </a>
              <a href="https://wa.me/5535998135712" className="text-white/60 hover:text-white transition-colors" target="_blank" rel="noopener noreferrer" title="WhatsApp: +55 35 9813-5712">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="lucide lucide-whatsapp"
                >
                  <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                  <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                  <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                  <path d="M12 17a5 5 0 0 1-5-5" />
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Explorar</h3>
            <ul className="space-y-2">
              <li><a href="#featured" className="text-white/60 hover:text-white transition-colors text-sm">Bares</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Contato</h3>
            <ul className="space-y-2">
              <li><a href="https://wa.me/5535998135712" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors text-sm">Quero anunciar</a></li>
              <li><a href="/privacidade" className="text-white/60 hover:text-white transition-colors text-sm">Política de Privacidade</a></li>
              <li><a href="/termos" className="text-white/60 hover:text-white transition-colors text-sm">Termos de Uso</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-white/10 text-center">
          <p className="text-white/40 text-sm">
            © 2025 Garimpo de Ofertas. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
