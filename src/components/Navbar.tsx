import React, { useState } from 'react';
import { Beer, X, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <Link to="/bares" className="text-white/80 hover:text-nightlife-600 transition-colors">Bares</Link>
          <Link to="/eventos" className="text-white/80 hover:text-nightlife-600 transition-colors">Eventos</Link>
          <Link to="/admin" className="text-white/80 hover:text-nightlife-600 transition-colors">Admin</Link>
        </nav>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-white"
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
              Bares
            </Link>
            <Link 
              to="/eventos" 
              className="text-white/80 hover:text-nightlife-600 transition-colors py-3 border-b border-white/10"
              onClick={toggleMobileMenu}
            >
              Eventos
            </Link>
            <Link 
              to="/admin" 
              className="text-white/80 hover:text-nightlife-600 transition-colors py-3"
              onClick={toggleMobileMenu}
            >
              Admin
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
