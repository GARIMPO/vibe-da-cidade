import React, { useState, useMemo } from 'react';
import { useBars } from '@/hooks/use-supabase-data';
import BarCard from '@/components/BarCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

const AllBars: React.FC = () => {
  const { data: bars, isLoading } = useBars();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('name-asc');
  
  // Extrair todas as tags únicas dos bares
  const allTags = useMemo(() => {
    if (!bars) return [];
    
    const tagsSet = new Set<string>();
    bars.forEach(bar => {
      bar.tags.forEach(tag => tagsSet.add(tag));
    });
    
    return Array.from(tagsSet).sort();
  }, [bars]);
  
  // Filtrar e ordenar bares
  const filteredAndSortedBars = useMemo(() => {
    if (!bars) return [];
    
    // Aplicar filtros
    let result = bars.filter(bar => {
      const matchesSearch = searchTerm === '' || 
        bar.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        bar.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        bar.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTag = filterTag === '' || bar.tags.includes(filterTag);
      
      return matchesSearch && matchesTag;
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
    }
    
    return result;
  }, [bars, searchTerm, filterTag, sortOrder]);

  // Status da busca
  const hasResults = filteredAndSortedBars.length > 0;
  const hasAppliedFilters = searchTerm !== '' || filterTag !== '';
  
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      
      <main className="flex-grow px-4 py-8">
        <div className="container mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            Todos os Bares
          </h1>
          
          {/* Barra de busca e filtros */}
          <div className="mb-8 bg-nightlife-900/50 rounded-lg p-4 border border-nightlife-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar bares..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-nightlife-950 border-nightlife-700"
                />
              </div>
              
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="bg-nightlife-950 border-nightlife-700">
                  <SelectValue placeholder="Filtrar por tag" />
                </SelectTrigger>
                <SelectContent className="bg-nightlife-900 border-nightlife-700 text-white">
                  <SelectItem value="">Todas as tags</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="bg-nightlife-950 border-nightlife-700">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent className="bg-nightlife-900 border-nightlife-700 text-white">
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
                    <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-white/70">×</button>
                  </Badge>
                )}
                {filterTag && (
                  <Badge variant="outline" className="bg-nightlife-800 text-white gap-1 px-2">
                    Tag: {filterTag}
                    <button onClick={() => setFilterTag('')} className="ml-1 hover:text-white/70">×</button>
                  </Badge>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-auto text-xs h-7 border-nightlife-700"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterTag('');
                    setSortOrder('name-asc');
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedBars.map((bar) => (
                <BarCard 
                  key={bar.id} 
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
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <h3 className="text-xl font-semibold mb-2">Nenhum bar encontrado</h3>
              <p className="text-white/70 mb-6">Nenhum bar corresponde aos filtros aplicados.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterTag('');
                }} 
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