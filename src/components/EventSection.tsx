import React, { useMemo } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEvents } from '@/hooks/use-supabase-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';

// Eventos mockados como fallback
const mockEvents = [
  {
    id: 1,
    title: "Festival de Cervejas Artesanais",
    date: "27-28 Abril, 2025",
    time: "12:00 - 22:00",
    location: "Parque Villa-Lobos",
    image: "https://images.unsplash.com/photo-1513309914637-65c20a5962e1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    description: "O maior festival de cervejas artesanais da cidade com mais de 50 cervejarias, food trucks e shows ao vivo."
  },
  {
    id: 2,
    title: "Noite de Coquetelaria",
    date: "15 Abril, 2025",
    time: "19:00 - 23:00",
    location: "Rooftop Lounge",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    description: "Aprenda a fazer coquetéis clássicos e modernos com os melhores bartenders da cidade."
  },
  {
    id: 3,
    title: "Jazz na Praça",
    date: "22 Abril, 2025",
    time: "18:00 - 22:00",
    location: "Praça do Pôr do Sol",
    image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    description: "Uma noite de jazz ao ar livre com bandas locais e food trucks com diversas opções gastronômicas."
  }
];

// Interface para os dados de evento
interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
  description: string;
}

// Função para embaralhar um array (algoritmo Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const EventSection: React.FC = () => {
  const isMobile = useIsMobile();
  const { data: events, isLoading, error } = useEvents();
  
  // Randomizar mock data quando usado como fallback
  const randomizedMockData = useMemo(() => shuffleArray(mockEvents), []);
  
  // Usar dados mockados se houver erro ou enquanto carrega
  const eventData = events && events.length > 0 ? events : randomizedMockData;
  
  // Limitar a 3 eventos na página principal
  const displayedEvents = eventData.slice(0, 3);

  return (
    <section id="events" className="py-16 px-4 bg-gradient-to-b from-nightlife-950 to-black">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Próximos Eventos
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Fique por dentro dos melhores eventos da cidade e não perca nenhuma oportunidade de se divertir
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, index) => (
              <div key={index} className="glass-card rounded-xl overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-5">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-8 w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayedEvents.map((event) => (
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
        )}
        
        <div className="mt-12 text-center">
          <Link to="/eventos" className="px-8 py-3 bg-transparent border border-nightlife-500 hover:bg-nightlife-500/10 text-white rounded-full font-medium transition-colors inline-block">
            Ver Todos os Eventos
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EventSection;
