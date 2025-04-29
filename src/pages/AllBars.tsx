import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useBars } from '@/hooks/use-supabase-data';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Star, MapPin, X, Map } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useSearchParams } from 'react-router-dom';
import BarCard from '@/components/BarCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/lib/supabase';

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
  const isMobile = useIsMobile();
  const { data: bars, isLoading } = useBars();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<string>('random');
  const [mapsUrl, setMapsUrl] = useState<string>('https://www.google.com/maps/search/bares+e+restaurantes');
  const barCardsRef = useRef<Record<string, any>>({});
  
  // Buscar URL personalizada do Google Maps
  useEffect(() => {
    const fetchMapsUrl = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'maps_link')
          .single();
          
        if (data && data.value) {
          setMapsUrl(data.value);
        }
      } catch (error) {
        console.error('Erro ao buscar link do Google Maps:', error);
      }
    };
    
    fetchMapsUrl();
  }, []);

  // Obter parâmetro de busca da URL quando a página carrega
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
    }
    
    // Verificar se há um parâmetro 'bar' na URL
    // O BarList vai lidar com a abertura do modal
    const barId = searchParams.get('bar');
    if (barId) {
      console.log("AllBars: Detectado parâmetro 'bar' na URL:", barId);
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
    
    // Garantir que cada bar tenha um ID válido
    return result.map(bar => ({
      ...bar,
      id: String(bar.id) // Garantir que o ID seja uma string
    }));
  }, [bars, searchTerm, sortOrder]);

  // Status da busca
  const hasResults = filteredAndSortedBars.length > 0;
  const hasAppliedFilters = searchTerm !== '';
  
  // Checar pela presença de um ID na URL para abrir o modal correspondente
  useEffect(() => {
    const barId = searchParams.get('bar');
    if (barId) {
      console.log("Tentando abrir modal para bar com ID:", barId);
      
      // Pequeno atraso para garantir que os refs estejam registrados
      setTimeout(() => {
        const availableIds = Object.keys(barCardsRef.current);
        console.log("Referencias disponíveis:", availableIds);
        
        // Verificar se existe uma referência para este ID
        if (barCardsRef.current[barId]) {
          console.log("Abrindo modal para bar:", barId);
          barCardsRef.current[barId].openDetails();
        } else {
          console.warn("Ref não encontrada para bar ID:", barId);
        }
      }, 1000);
    }
  }, [searchParams, filteredAndSortedBars]);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      
      <main className="flex-grow px-2 sm:px-3 py-8">
        <div className="container mx-auto max-w-[1400px]">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center">
            {searchTerm ? `Buscando por "${searchTerm}"` : "Bares e Restaurantes"}
          </h1>
          
          {/* Link para Google Maps */}
          <div className="flex justify-center mb-8">
            <a 
              href={mapsUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Map className="h-4 w-4" />
              Descobrir por perto
            </a>
          </div>
          
          {/* Barra de busca e filtros */}
          <div className="mb-8 bg-nightlife-900/50 rounded-lg p-4 border border-nightlife-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Buscar bares e restaurantes..."
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
            <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-6 sm:gap-8 px-1`}>
              {Array(6).fill(0).map((_, index) => (
                <div key={index} className="glass-card rounded-xl overflow-hidden">
                  <Skeleton className="h-52 w-full" />
                  <div className="p-6">
                    <Skeleton className="h-7 w-3/4 mb-3" />
                    <Skeleton className="h-5 w-1/2 mb-4" />
                    <Skeleton className="h-5 w-full mb-3" />
                    <Skeleton className="h-5 w-full mb-3" />
                    <Skeleton className="h-9 w-full mt-5" />
                  </div>
                </div>
              ))}
            </div>
          ) : hasResults ? (
            <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-6 sm:gap-8 px-1`}>
              {filteredAndSortedBars.map((bar) => (
                <BarCard 
                  key={bar.id}
                  id={String(bar.id)}
                  name={bar.name}
                  location={bar.location}
                  description={bar.description}
                  rating={bar.rating}
                  image={bar.image}
                  additional_images={bar.additional_images}
                  events={bar.events}
                  tags={bar.tags}
                  hours={bar.hours}
                  maps_url={bar.maps_url}
                  phone={bar.phone}
                  instagram={bar.instagram}
                  facebook={bar.facebook}
                  discount_code={bar.discount_code}
                  discount_description={bar.discount_description}
                  ref={(ref) => {
                    if (ref) {
                      barCardsRef.current[String(bar.id)] = ref;
                      console.log(`Ref registrado para bar ${bar.name} com ID ${bar.id}`);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <h3 className="text-xl font-semibold mb-2">Nenhum resultado encontrado</h3>
              <p className="text-white/70 mb-6">Nenhum bar ou restaurante corresponde aos filtros aplicados.</p>
              <Button 
                variant="outline" 
                onClick={handleClearFilters} 
                className="border-nightlife-600 hover:bg-nightlife-600/20"
              >
                Ver todos os bares e restaurantes
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AllBars; 