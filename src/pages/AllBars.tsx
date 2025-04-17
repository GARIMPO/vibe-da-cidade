import React, { useState, useMemo, useEffect } from 'react';
import { useBars } from '@/hooks/use-supabase-data';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Star, MapPin, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useSearchParams } from 'react-router-dom';

// Função para embaralhar um array (algoritmo Fisher-Yates)
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const AllBars: React.FC = () => {
  const { data: bars, isLoading } = useBars();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<string>('random');
  
  // Obter parâmetro de busca da URL quando a página carrega
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
    }
  }, [searchParams]);

  // Atualizar a URL quando o termo de busca mudar
  const updateSearchParams = (term: string) => {
    if (term) {
      searchParams.set('search', term);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  // Handler para o formulário de busca (não mais necessário, mas mantido por segurança)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Handler para atualizar o termo de busca em tempo real
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = e.target.value;
    setSearchTerm(newTerm);
    updateSearchParams(newTerm);
  };

  // Handler para limpar os filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setSortOrder('random');
    setSearchParams(new URLSearchParams());
  };
  
  // Filtrar e ordenar bares
  const filteredAndSortedBars = useMemo(() => {
    if (!bars) return [];
    
    // Aplicar filtros
    let result = bars.filter(bar => {
      return searchTerm === '' || 
        bar.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        bar.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        bar.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bar.tags && bar.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    });
    
    // Aplicar ordenação
    if (sortOrder === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOrder === 'rating-desc') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortOrder === 'rating-asc') {
      result.sort((a, b) => a.rating - b.rating);
    } else if (sortOrder === 'random') {
      // Ordenação aleatória
      result = shuffleArray(result);
    }
    
    return result;
  }, [bars, searchTerm, sortOrder]);

  // Status da busca
  const hasResults = filteredAndSortedBars.length > 0;
  const hasAppliedFilters = searchTerm !== '';
  
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      
      <main className="flex-grow px-4 py-8">
        <div className="container mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            {searchTerm ? `Buscando por "${searchTerm}"` : "Todos os Bares"}
          </h1>
          
          {/* Barra de busca e filtros */}
          <div className="mb-8 bg-nightlife-900/50 rounded-lg p-4 border border-nightlife-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Buscar bares..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10 bg-nightlife-950 border-nightlife-700"
                  />
                  {searchTerm && (
                    <button 
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        updateSearchParams('');
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  )}
                </form>
              </div>
              
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="bg-nightlife-950 border-nightlife-700">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent className="bg-nightlife-900 border-nightlife-700 text-white">
                  <SelectItem value="random">Aleatório</SelectItem>
                  <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                  <SelectItem value="rating-desc">Avaliação (Maior-Menor)</SelectItem>
                  <SelectItem value="rating-asc">Avaliação (Menor-Maior)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Exibir filtros ativos */}
            {hasAppliedFilters && (
              <div className="flex flex-wrap gap-2 items-center mt-3">
                <span className="text-sm text-white/70">Filtros ativos:</span>
                {searchTerm && (
                  <Badge variant="outline" className="bg-nightlife-800 text-white gap-1 px-2">
                    Busca: {searchTerm}
                    <button 
                      onClick={() => {
                        setSearchTerm('');
                        updateSearchParams('');
                      }} 
                      className="ml-1 hover:text-white/70"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-auto text-xs h-7 border-nightlife-700"
                  onClick={handleClearFilters}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, index) => (
                <div key={index} className="glass-card rounded-xl overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-5">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-8 w-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : hasResults ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedBars.map((bar) => (
                <Card key={bar.id} className="bg-black/40 backdrop-blur-sm border-white/10 overflow-hidden card-hover">
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={bar.image} 
                      alt={bar.name} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-xl font-bold text-white mb-2">{bar.name}</h3>
                    
                    <div className="flex items-center gap-1 mb-1 text-white/70">
                      <Star className="w-4 h-4 text-nightlife-400" />
                      <span className="text-sm">{bar.rating.toFixed(1)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 mb-3 text-white/70">
                      <MapPin className="w-4 h-4 text-nightlife-400" />
                      <span className="text-sm">{bar.location}</span>
                    </div>
                    
                    <p className="text-white/80 text-sm mb-4 line-clamp-3">{bar.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {bar.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-nightlife-800/50 text-white">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <button className="w-full mt-2 py-2 bg-nightlife-600 hover:bg-nightlife-700 text-white rounded-lg transition-colors text-sm font-medium">
                      Ver Detalhes
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <h3 className="text-xl font-semibold mb-2">Nenhum bar encontrado</h3>
              <p className="text-white/70 mb-6">Nenhum bar corresponde aos filtros aplicados.</p>
              <Button 
                variant="outline" 
                onClick={handleClearFilters} 
                className="border-nightlife-600 hover:bg-nightlife-600/20"
              >
                Ver todos os bares
              </Button>
            </div>
          )}
          
          {hasResults && (
            <div className="mt-6 text-center text-white/70">
              <p>Exibindo {filteredAndSortedBars.length} {filteredAndSortedBars.length === 1 ? 'bar' : 'bares'}</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AllBars; 