import React, { useMemo } from 'react';
import BarCard from './BarCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBars } from '@/hooks/use-supabase-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

// Função para embaralhar um array (algoritmo Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Os dados mockados ainda são mantidos como fallback
const mockBarData = [
  {
    id: 1,
    name: "Boteco do Blues",
    location: "Centro, Rua Augusta, 123",
    description: "Um bar aconchegante com música ao vivo todas as noites e a melhor seleção de cervejas artesanais da cidade.",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80",
    events: [
      { name: "Noite de Blues & Jazz", date: "Sexta, 20:00" },
      { name: "Open Mic Night", date: "Sábado, 21:00" }
    ],
    tags: ["Música ao Vivo", "Cerveja Artesanal", "Petiscos"],
    hours: "Segunda a Quinta: 18:00 - 00:00\nSexta e Sábado: 18:00 - 02:00\nDomingo: 16:00 - 22:00",
    phone: "(11) 9999-9999",
    instagram: "@botecodoblues",
    facebook: "facebook.com/botecodoblues",
    maps_url: "https://maps.google.com/?q=Centro,+Rua+Augusta,+123"
  },
  {
    id: 2,
    name: "Rooftop Lounge",
    location: "Pinheiros, Av. Faria Lima, 500",
    description: "Bar com vista panorâmica da cidade, coquetéis exclusivos e um ambiente sofisticado para aproveitar o pôr do sol.",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1769&q=80",
    events: [
      { name: "Sunset DJ Session", date: "Quinta, 18:00" },
      { name: "Cocktail Masterclass", date: "Domingo, 16:00" }
    ],
    tags: ["Rooftop", "Coquetéis", "Pôr do Sol"],
    hours: "Terça a Quinta: 17:00 - 00:00\nSexta e Sábado: 17:00 - 03:00\nDomingo: 16:00 - 22:00",
    phone: "(11) 9999-9999",
    instagram: "@rooftop_lounge",
    facebook: "facebook.com/rooftoplounge",
    maps_url: "https://maps.google.com/?q=Pinheiros,+Av.+Faria+Lima,+500"
  },
  {
    id: 3,
    name: "Pub Irlandês",
    location: "Vila Madalena, Rua Aspicuelta, 333",
    description: "Autêntico pub irlandês com uma grande variedade de cervejas importadas e transmissão de jogos de futebol.",
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1571024057263-b0e0b4b1dd2c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80",
    events: [
      { name: "Premier League Night", date: "Sábado, 16:00" },
      { name: "Quiz Night", date: "Quarta, 20:00" }
    ],
    tags: ["Esportes", "Cervejas Importadas", "Jogos"]
  },
  {
    id: 4,
    name: "Vinyl Bar",
    location: "Vila Mariana, Rua Vergueiro, 1000",
    description: "Bar com temática retrô, onde você pode escolher os discos de vinil para tocar enquanto desfruta de drinques inspirados nos anos 70 e 80.",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=829&q=80",
    events: [
      { name: "Vinil Night: Rock Clássico", date: "Sexta, 21:00" },
      { name: "Disco & Funk Party", date: "Sábado, 22:00" }
    ],
    tags: ["Retrô", "Vinil", "Drinks Temáticos"]
  },
  {
    id: 5,
    name: "Gastro Pub",
    location: "Itaim Bibi, Rua João Cachoeira, 240",
    description: "Combinação perfeita de gastronomia elaborada e cerveja artesanal com ambiente descontraído e moderno.",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80",
    events: [
      { name: "Harmonização de Cervejas", date: "Domingo, 18:00" },
      { name: "Chef's Table", date: "Terça, 20:00" }
    ],
    tags: ["Gastronomia", "Cerveja Artesanal", "Gourmet"]
  },
  {
    id: 6,
    name: "Samba & Cachaça",
    location: "Barra Funda, Rua Barra Funda, 432",
    description: "Bar tradicional com roda de samba ao vivo e especializado em cachaças artesanais de todo o Brasil.",
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1438557068880-c5f474830377?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    events: [
      { name: "Roda de Samba", date: "Sexta e Sábado, 20:00" },
      { name: "Degustação de Cachaças", date: "Quinta, 19:00" }
    ],
    tags: ["Samba", "Cachaça", "Brasileiro"]
  }
];

// Interface para os dados do bar
interface Bar {
  id: number;
  name: string;
  location: string;
  description: string;
  rating: number;
  image: string;
  additional_images?: string[];
  events: { name: string; date: string }[];
  tags: string[];
  hours?: string;
  maps_url?: string;
  phone?: string;
  instagram?: string;
  facebook?: string;
}

interface BarListProps {
  searchTerm?: string;
}

const BarList: React.FC<BarListProps> = ({ searchTerm = '' }) => {
  const isMobile = useIsMobile();
  
  // Buscar dados do Supabase
  const { data: bars, isLoading, error } = useBars();

  // Filtrar bares com base no termo de busca e manter apenas 6 deles
  const barData = useMemo(() => {
    if (!bars) return [];
    
    // Se houver um termo de busca, filtrar os bares
    let filtered = bars;
    if (searchTerm.trim()) {
      filtered = bars.filter(bar => 
        bar.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        bar.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        bar.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bar.tags && bar.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }
    
    // Se não houver resultados de busca mas houver um termo, mostrar mensagem vazia
    if (filtered.length === 0 && searchTerm.trim()) {
      return [];
    }
    
    // Se não houver um termo de busca ou o termo não retornou resultados suficientes, mostrar aleatoriamente
    return searchTerm.trim() 
      ? filtered.slice(0, 6) 
      : shuffleArray(filtered).slice(0, 6);
  }, [bars, searchTerm]);

  return (
    <section id="featured" className="py-16 px-2 sm:px-3">
      <div className="container mx-auto max-w-[1400px]">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">
            {searchTerm ? `Resultados para "${searchTerm}"` : "Em Destaque"}
          </h2>
          {searchTerm && barData.length === 0 && (
            <p className="text-white/70">Nenhum bar ou restaurante encontrado com esse termo. Tente outra busca.</p>
          )}
        </div>
        
        {isLoading ? (
          // Mostrar esqueletos durante o carregamento
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
        ) : (
          <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-6 sm:gap-8 px-1`}>
            {barData.map((bar) => (
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
        )}
        
        <div className="mt-14 text-center">
          <Link 
            to={searchTerm ? `/bares?search=${encodeURIComponent(searchTerm)}` : "/bares"} 
            className="px-10 py-3 bg-transparent border border-nightlife-500 hover:bg-nightlife-500/10 text-white rounded-full font-medium transition-colors inline-block"
          >
            {searchTerm ? "Ver Todos os Resultados" : "Ver Todos os Bares e Restaurantes"}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BarList;
