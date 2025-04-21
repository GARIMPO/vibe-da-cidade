import React from 'react';
import { Beer, Instagram, Facebook, MessageSquare } from 'lucide-react';

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
              Descubra os melhores bares e eventos da cidade para aproveitar sua vida noturna ao máximo.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <MessageSquare size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Explorar</h3>
            <ul className="space-y-2">
              <li><a href="#featured" className="text-white/60 hover:text-white transition-colors text-sm">Bares</a></li>
              <li><a href="#events" className="text-white/60 hover:text-white transition-colors text-sm">Eventos da Semana</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Contato</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Sobre Nós</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Anuncie seu Bar</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Política de Privacidade</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Termos de Uso</a></li>
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
