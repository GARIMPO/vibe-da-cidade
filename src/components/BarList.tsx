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

// Dados mockados como fallback
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
  const { data: bars = [], isLoading, error } = useBars();
  
  // Usar dados mockados se não houver dados do Supabase
  const displayBars = useMemo(() => {
    const barsToDisplay = bars.length > 0 ? bars : mockBarData;
    return shuffleArray(barsToDisplay);
  }, [bars]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-nightlife-900 rounded-lg overflow-hidden shadow-lg">
              <Skeleton className="h-48 w-full" />
              <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Erro ao carregar bares:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayBars.map((bar) => (
          <BarCard key={bar.id} {...bar} />
        ))}
      </div>
    </div>
  );
};

export default BarList;
