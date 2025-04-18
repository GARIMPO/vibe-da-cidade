import React, { useState, useEffect } from 'react';
import { Beer, X, Menu, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário está logado
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    };
    
    checkAuth();
    
    // Setup listener for auth changes
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setIsLoggedIn(true);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
      }
    });
    
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  return (
    <header className="w-full py-4 px-4 md:px-8 sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link to="/">
            <Beer className="h-8 w-8 text-nightlife-500" />
          </Link>
          <Link to="/" className="text-xl font-bold text-white">Vibe da Cidade</Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-white/80 hover:text-nightlife-600 transition-colors">Início</Link>
          <Link to="/bares" className="text-white/80 hover:text-nightlife-600 transition-colors">Bares e Restaurantes</Link>
          <Link to="/admin" className="text-white/80 hover:text-nightlife-600 transition-colors">Entrar</Link>
          
          {/* Status de Login (bolinha verde) */}
          {isLoggedIn && (
            <div className="flex items-center gap-1 ml-1">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
            </div>
          )}
          
          {/* Botão de Logout (apenas quando logado) */}
          {isLoggedIn && (
            <Button 
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="bg-transparent border-white/20 hover:bg-nightlife-800 flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </Button>
          )}
        </nav>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-3">
          {/* Status de Login Mobile (bolinha verde) */}
          {isLoggedIn && (
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
            </div>
          )}
          
          <button 
            className="text-white"
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-black/95 border-b border-white/10 backdrop-blur-md z-40 animate-in slide-in-from-top duration-300">
          <nav className="container mx-auto py-4 px-4 flex flex-col">
            <Link 
              to="/" 
              className="text-white/80 hover:text-nightlife-600 transition-colors py-3 border-b border-white/10"
              onClick={toggleMobileMenu}
            >
              Início
            </Link>
            <Link 
              to="/bares" 
              className="text-white/80 hover:text-nightlife-600 transition-colors py-3 border-b border-white/10"
              onClick={toggleMobileMenu}
            >
              Bares e Restaurantes
            </Link>
            <Link 
              to="/admin" 
              className="text-white/80 hover:text-nightlife-600 transition-colors py-3 border-b border-white/10"
              onClick={toggleMobileMenu}
            >
              Entrar
            </Link>
            
            {/* Botão de Logout no menu mobile (apenas quando logado) */}
            {isLoggedIn && (
              <button
                onClick={() => {
                  handleLogout();
                  toggleMobileMenu();
                }}
                className="text-white/80 hover:text-nightlife-600 transition-colors py-3 flex items-center gap-2 text-left"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
