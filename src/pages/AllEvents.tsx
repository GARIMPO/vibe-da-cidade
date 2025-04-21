import React, { useState, useMemo } from 'react';
import { useEvents } from '@/hooks/use-supabase-data';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Calendar, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const AllEvents: React.FC = () => {
  const { data: events, isLoading } = useEvents();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<string>('date-asc');
  
  // Filtrar e ordenar eventos
  const filteredAndSortedEvents = useMemo(() => {
    if (!events) return [];
    
    // Aplicar filtros
    let result = events.filter(event => {
      return searchTerm === '' || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        event.location.toLowerCase().includes(searchTerm.toLowerCase());
    });
    
    // Aplicar ordenação
    if (sortOrder === 'title-asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === 'title-desc') {
      result.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortOrder === 'date-asc') {
      result.sort((a, b) => a.date.localeCompare(b.date));
    } else if (sortOrder === 'date-desc') {
      result.sort((a, b) => b.date.localeCompare(a.date));
    }
    
    return result;
  }, [events, searchTerm, sortOrder]);

  // Status da busca
  const hasResults = filteredAndSortedEvents.length > 0;
  const hasAppliedFilters = searchTerm !== '';
  
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      
      <main className="flex-grow px-4 py-8">
        <div className="container mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            Todos os Eventos
          </h1>
          
          {/* Barra de busca e filtros */}
          <div className="mb-8 bg-nightlife-900/50 rounded-lg p-4 border border-nightlife-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-nightlife-950 border-nightlife-700"
                />
              </div>
              
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="bg-nightlife-950 border-nightlife-700">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent className="bg-nightlife-900 border-nightlife-700 text-white">
                  <SelectItem value="date-asc">Data (Mais Próximos)</SelectItem>
                  <SelectItem value="date-desc">Data (Mais Distantes)</SelectItem>
                  <SelectItem value="title-asc">Título (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Título (Z-A)</SelectItem>
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-auto text-xs h-7 border-nightlife-700"
                  onClick={() => {
                    setSearchTerm('');
                    setSortOrder('date-asc');
                  }}
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
              {filteredAndSortedEvents.map((event) => (
                <Card key={event.id} className="bg-black/40 backdrop-blur-sm border-white/10 overflow-hidden card-hover">
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={event.image} 
                      alt={event.title} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                    
                    <div className="flex items-center gap-1 mb-1 text-white/70">
                      <Calendar className="w-4 h-4 text-nightlife-400" />
                      <span className="text-sm">{event.date}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 mb-1 text-white/70">
                      <Clock className="w-4 h-4 text-nightlife-400" />
                      <span className="text-sm">{event.time}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 mb-3 text-white/70">
                      <MapPin className="w-4 h-4 text-nightlife-400" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                    
                    <p className="text-white/80 text-sm mb-4 line-clamp-3">{event.description}</p>
                    
                    <button className="w-full mt-2 py-2 bg-nightlife-600 hover:bg-nightlife-700 text-white rounded-lg transition-colors text-sm font-medium">
                      Ver Detalhes
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <h3 className="text-xl font-semibold mb-2">Nenhum evento encontrado</h3>
              <p className="text-white/70 mb-6">Nenhum evento corresponde aos filtros aplicados.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                }} 
                className="border-nightlife-600 hover:bg-nightlife-600/20"
              >
                Ver todos os eventos
              </Button>
            </div>
          )}
          
          {hasResults && (
            <div className="mt-6 text-center text-white/70">
              <p>Exibindo {filteredAndSortedEvents.length} {filteredAndSortedEvents.length === 1 ? 'evento' : 'eventos'}</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AllEvents; 