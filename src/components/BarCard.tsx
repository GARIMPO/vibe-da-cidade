import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Beer, MapPin, Music, Calendar, Star, X, Phone, Clock, Globe, Instagram, Facebook, ArrowLeft, Tag, Youtube, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface BarCardProps {
  name: string;
  location: string;
  description: string;
  rating: number;
  image: string;
  additional_images?: string[];
  events: {
    name: string;
    date: string;
    youtube_url?: string;
    phone?: string;
  }[];
  tags: string[];
  hours?: string;
  maps_url?: string;
  phone?: string;
  instagram?: string;
  facebook?: string;
  id: string;
  discount_code?: string;
  discount_description?: string;
}

// Função para truncar descrições para exibição no card
const truncateDescription = (description: string): string => {
  const lines = description.split('\n');
  if (lines.length > 2) {
    return lines.slice(0, 2).join('\n') + '\n...';
  }
  return description;
};

// Função para verificar se o bar está aberto com base no horário atual
const isBarOpen = (hoursText?: string): boolean => {
  if (!hoursText) {
    console.log('Nenhum horário configurado para este bar');
    return false;
  }
  
  // Configurar para fuso horário do Brasil (Brasília)
  const now = new Date();
  
  // Obter o dia da semana e hora local para fins de log
  const localDayOfWeek = now.getDay();
  const localHours = now.getHours();
  const localMinutes = now.getMinutes();
  console.log(`Horário local: ${localHours}:${localMinutes}, dia da semana: ${localDayOfWeek}`);
  
  // Obter o dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
  const dayOfWeek = now.getDay();
  // Obter as horas e minutos atuais
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  
  console.log(`Horário atual: ${currentHours}:${currentMinutes}, dia da semana: ${dayOfWeek}`);
  
  // Converter para minutos desde a meia-noite para facilitar a comparação
  const currentTimeInMinutes = currentHours * 60 + currentMinutes;
  
  // Mapear dias da semana em português para facilitar a correspondência
  const diasSemana = [
    ['domingo', 'dom'],
    ['segunda', 'seg', 'segunda-feira'],
    ['terça', 'ter', 'terca', 'terça-feira', 'terca-feira'],
    ['quarta', 'qua', 'quarta-feira'],
    ['quinta', 'qui', 'quinta-feira'],
    ['sexta', 'sex', 'sexta-feira'],
    ['sabado', 'sábado', 'sab', 'sáb']
  ];
  
  // Obter o dia atual em português
  const diaAtual = diasSemana[dayOfWeek];
  const nomeDiaAtual = dayOfWeek === 0 ? 'Domingo' : 
                       dayOfWeek === 1 ? 'Segunda' : 
                       dayOfWeek === 2 ? 'Terça' : 
                       dayOfWeek === 3 ? 'Quarta' : 
                       dayOfWeek === 4 ? 'Quinta' : 
                       dayOfWeek === 5 ? 'Sexta' : 'Sábado';
  
  console.log(`Dia atual: ${nomeDiaAtual} (${diaAtual.join(', ')})`);
  console.log(`Horários configurados: \n${hoursText}`);
  
  // Dividir as linhas do horário
  const hoursLines = hoursText.split('\n');
  
  for (const line of hoursLines) {
    // Ignorar linhas vazias
    if (!line.trim()) continue;
    
    // Separar o dia e o horário (formato típico: "Segunda: 18:00 - 00:00")
    const parts = line.split(':');
    if (parts.length < 2) continue;
    
    const daysText = parts[0].toLowerCase().trim();
    // Juntar o resto para lidar com casos onde há múltiplos ":" no horário
    const timeText = parts.slice(1).join(':').trim();
    
    console.log(`Verificando linha: "${line}"`);
    console.log(`Dia do texto: "${daysText}", formato de hora: "${timeText}"`);
    
    // Verificar se o dia atual está incluído
    let isDayMatched = false;
    
    // Verificar dias individuais
    for (const dia of diaAtual) {
      if (daysText.includes(dia)) {
        isDayMatched = true;
        console.log(`Dia correspondente encontrado: "${dia}" em "${daysText}"`);
        break;
      }
    }
    
    // Verificar intervalos (ex: "Segunda a Sexta")
    if (!isDayMatched && daysText.includes(' a ')) {
      const [startDay, endDay] = daysText.split(' a ').map(d => d.trim().toLowerCase());
      console.log(`Verificando intervalo: "${startDay}" a "${endDay}"`);
      
      // Encontrar os índices dos dias de início e fim
      let startIdx = -1, endIdx = -1;
      
      for (let i = 0; i < diasSemana.length; i++) {
        for (const alias of diasSemana[i]) {
          if (startDay.includes(alias)) startIdx = i;
          if (endDay.includes(alias)) endIdx = i;
        }
      }
      
      console.log(`Índices encontrados: início=${startIdx}, fim=${endIdx}`);
      
      // Se encontrou ambos os dias e o dia atual está no intervalo
      if (startIdx >= 0 && endIdx >= 0) {
        // Ajustar para casos onde o intervalo cruza o domingo (ex: "Sexta a Domingo")
        if (startIdx > endIdx) {
          isDayMatched = (dayOfWeek >= startIdx || dayOfWeek <= endIdx);
        } else {
          isDayMatched = (dayOfWeek >= startIdx && dayOfWeek <= endIdx);
        }
        console.log(`Dia atual ${dayOfWeek} está no intervalo ${startIdx}-${endIdx}? ${isDayMatched}`);
      }
    }
    
    // Verificar combinações de dias separados por e (ex: "Sexta e Sábado")
    if (!isDayMatched && daysText.includes(' e ')) {
      const daysList = daysText.split(' e ').map(d => d.trim().toLowerCase());
      console.log(`Verificando dias combinados: ${daysList.join(' e ')}`);
      
      for (const day of daysList) {
        let found = false;
        for (const dia of diaAtual) {
          if (day.includes(dia)) {
            isDayMatched = true;
            found = true;
            console.log(`Dia correspondente encontrado na combinação: "${dia}" em "${day}"`);
            break;
          }
        }
        if (found) break;
      }
    }
    
    // Se o dia corresponde, verificar o horário
    if (isDayMatched) {
      console.log(`Dia atual corresponde a "${daysText}", verificando horário: "${timeText}"`);
      
      // Extrair horários de abertura e fechamento
      const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
      if (!timeMatch) {
        console.log(`Formato de horário inválido: "${timeText}"`);
        continue;
      }
      
      const [, openHourStr, openMinStr, closeHourStr, closeMinStr] = timeMatch;
      
      let openHour = parseInt(openHourStr, 10);
      const openMin = parseInt(openMinStr, 10);
      let closeHour = parseInt(closeHourStr, 10);
      const closeMin = parseInt(closeMinStr, 10);
      
      console.log(`Horário de abertura: ${openHour}:${openMin}, fechamento: ${closeHour}:${closeMin}`);
      
      // Converter para minutos desde a meia-noite
      const openTimeInMinutes = openHour * 60 + openMin;
      
      // Ajustar para horários após a meia-noite
      let closeTimeInMinutes = closeHour * 60 + closeMin;
      if (closeHour < openHour) {
        closeTimeInMinutes += 24 * 60; // Adicionar 24 horas se o fechamento for após a meia-noite
        console.log(`Fechamento após meia-noite, ajustando para ${closeTimeInMinutes} minutos`);
      }
      
      console.log(`Horário atual: ${currentTimeInMinutes} minutos, horário de abertura: ${openTimeInMinutes} minutos, fechamento: ${closeTimeInMinutes} minutos`);
      
      // Verificar se o horário atual está dentro do período de funcionamento
      const isOpenByTime = (
        (currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes) ||
        // Para horários que passam da meia-noite, precisamos verificar se é após a meia-noite
        (closeTimeInMinutes > 24 * 60 && currentTimeInMinutes < (closeTimeInMinutes - 24 * 60) && currentHours < openHour)
      );
      
      console.log(`Bar está aberto com base no horário? ${isOpenByTime}`);
      
      if (isOpenByTime) {
        return true;
      }
    } else {
      console.log(`Dia atual não corresponde a "${daysText}", pulando`);
    }
  }
  
  console.log('Nenhum horário compatível encontrado, bar fechado');
  return false;
};

const BarCard = forwardRef<{openDetails: () => void}, BarCardProps>(({
  name,
  location,
  description,
  rating,
  image,
  additional_images = [],
  events,
  tags,
  hours,
  maps_url,
  phone,
  instagram,
  facebook,
  id,
  discount_code,
  discount_description
}, ref) => {
  const isMobile = useIsMobile();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(image);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Log para debug - mostrar o ID do bar atual
  console.log(`BarCard ID: ${id}, Tipo: ${typeof id}`);
  
  // Função para incrementar o contador de visualizações
  const incrementViewCount = async () => {
    try {
      // Verificar se já existe um registro para este bar
      const { data: existingData } = await supabase
        .from('bar_views')
        .select('*')
        .eq('bar_id', id)
        .single();
      
      if (existingData) {
        // Atualizar o contador existente
        await supabase
          .from('bar_views')
          .update({ 
            view_count: existingData.view_count + 1,
            last_viewed: new Date().toISOString()
          })
          .eq('bar_id', id);
      } else {
        // Criar um novo registro
        await supabase
          .from('bar_views')
          .insert({ 
            bar_id: id,
            view_count: 1,
            last_viewed: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Erro ao incrementar contador de visualizações:', error);
    }
  };
  
  // Função para abrir o modal de detalhes
  const openDetails = () => {
    setIsDetailsOpen(true);
    incrementViewCount(); // Incrementar o contador quando o modal é aberto
  };
  
  // Expor a função openDetails para o ref
  useImperativeHandle(ref, () => ({
    openDetails
  }));

  // Atualizar o horário atual a cada minuto
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    
    // Atualizar imediatamente
    updateTime();
    
    // Atualizar a cada minuto
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Reset current image when closing the dialog
  useEffect(() => {
    if (!isDetailsOpen) {
      setCurrentImage(image);
      setVideoModalOpen(false);
      setCurrentVideoUrl(null);
    }
  }, [isDetailsOpen, image]);
  
  // Função para extrair o ID do vídeo do YouTube
  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    // Regex para extrair o ID do vídeo do YouTube de diferentes formatos de URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  // Função para reproduzir um vídeo
  const playVideo = (url: string) => {
    setCurrentVideoUrl(url);
    setVideoModalOpen(true);
  };
  
  // Verificar se o bar está aberto quando o componente é montado e 
  // atualizar o status a cada 15 segundos para maior precisão
  useEffect(() => {
    // Função para verificar e atualizar o status
    const checkOpenStatus = () => {
      const isBarCurrentlyOpen = isBarOpen(hours);
      setIsOpen(isBarCurrentlyOpen);
      
      // Console log para debug
      console.log(`Verificando status do bar ${name}: ${isBarCurrentlyOpen ? 'Aberto' : 'Fechado'}`);
      console.log(`Horário atual: ${new Date().toLocaleTimeString('pt-BR')}`);
      console.log(`Horários configurados: ${hours}`);
    };
    
    // Verificar imediatamente quando o componente montar ou hours mudar
    checkOpenStatus();
    
    // Configurar o intervalo para verificar a cada 15 segundos
    const interval = setInterval(checkOpenStatus, 15000);
    
    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(interval);
  }, [hours, name]);
  
  // Handle image change
  const handleImageChange = (newImage: string) => {
    setCurrentImage(newImage);
  };
  
  return (
    <>
    <div className={`glass-card rounded-xl overflow-hidden card-hover ${isMobile ? 'w-full' : ''}`}>
      <div className={`${isMobile ? 'flex flex-col md:flex-row' : ''}`}>
        <div className={`${isMobile ? 'w-full md:w-full h-52' : 'h-52'} relative overflow-hidden`}>
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          />
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-md flex items-center gap-1.5">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-medium text-sm">{rating.toFixed(1)}</span>
          </div>
        </div>
        
        <div className={`p-6 ${isMobile ? 'w-full' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-white">{name}</h3>
              {hours && (
                <div className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${isOpen ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/30'}`}></div>
                  <span className={`text-sm font-medium ${isOpen ? 'text-green-400' : 'text-red-400'}`}>
                    {isOpen ? 'Aberto agora' : 'Fechado'}
                  </span>
                </div>
              )}
            </div>
          <div className="flex items-center gap-1.5 mb-3 text-white/70">
            <MapPin className="w-4 h-4" />
            <span className="text-base">{location}</span>
          </div>
          
          <p className="text-gray-400 text-base line-clamp-3 mb-4">
            {truncateDescription(description)}
          </p>
          
          <div className="mb-5 mt-5 flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge 
                key={index}
                variant="outline" 
                className="bg-nightlife-950/50 text-white/90 border-nightlife-700/50 text-sm px-3 py-0.5"
              >
                {tag}
              </Badge>
            ))}
          </div>
          
          {events.length > 0 && (
            <div className="border-t border-white/10 pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-medium text-white/90 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-nightlife-400" />
                  Próximos Eventos
                </h4>
                {events.some(event => event.phone) && (
                  <a 
                    href={`https://wa.me/${events.find(event => event.phone)?.phone?.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 text-sm"
                  >
                    (Fazer reserva)
                  </a>
                )}
              </div>
              <ul className="space-y-3">
                {events.slice(0, 2).map((event, index) => (
                  <li key={index} className="flex items-center gap-2.5">
                    <Music className="w-5 h-5 text-nightlife-400" />
                    <div>
                      <p className="text-white text-base font-medium">{event.name}</p>
                      <p className="text-white/60 text-sm">{event.date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
            <button 
              onClick={openDetails}
              className="w-full mt-5 py-2.5 bg-nightlife-600 hover:bg-nightlife-700 text-white rounded-lg transition-colors text-base font-medium"
            >
            Ver Detalhes
          </button>
        </div>
      </div>
    </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] bg-black/95 border-white/10 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {name}
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-base font-medium">{rating.toFixed(1)}</span>
                </div>
              </DialogTitle>
              {hours && (
                <div className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${isOpen ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/30'}`}></div>
                  <span className={`text-sm font-medium ${isOpen ? 'text-green-400' : 'text-red-400'}`}>
                    {isOpen ? 'Aberto agora' : 'Fechado'}
                  </span>
                </div>
              )}
            </div>
            <DialogDescription className="text-white/70">
              <div className="space-y-3">
                {maps_url ? (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-nightlife-400 mt-0.5" />
                    <a 
                      href={maps_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:underline flex items-center"
                    >
                      {location}
                      <ArrowLeft className="h-3 w-3 ml-1 rotate-[135deg]" />
                    </a>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-nightlife-400 mt-0.5" />
                    <span>{location}</span>
                  </div>
                )}

                {/* Adicionar opção de compartilhar */}
                <div className="flex items-center gap-2 mt-2">
                  <Share2 className="w-4 h-4 text-nightlife-400" />
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/?bar=${id}`;
                      const message = `Procurando um lugar bacana, venha para *${name}*, confira nesse link ${url}`;
                      
                      // Tentar abrir o WhatsApp Web
                      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="text-white/70 hover:text-white transition-colors text-sm"
                  >
                    Compartilhar
                  </button>
                </div>

                {/* Botão Ver eventos - só aparece se houver eventos */}
                {events.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="w-4 h-4 text-nightlife-400" />
                    <button
                      onClick={() => {
                        // Encontrar o elemento de eventos e rolar até ele
                        const eventsSection = document.getElementById(`events-${id}`);
                        if (eventsSection) {
                          eventsSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="text-white/70 hover:text-white transition-colors text-sm"
                    >
                      Ver eventos
                    </button>
                  </div>
                )}

                {/* Exibir cupom de desconto se existir */}
                {(discount_code || discount_description) && (
                  <div className="mt-4 mb-4 p-4 bg-green-600/20 border border-green-500/30 rounded-lg">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <span className="text-green-400 font-medium whitespace-nowrap">Código do cupom:</span>
                          {discount_code && (
                            <div className="text-white/80 text-sm">{discount_code}</div>
                          )}
                        </div>
                        {discount_description && (
                          <div className="flex flex-col gap-2 w-full sm:w-auto">
                            <div className="flex items-center gap-2">
                              <span className="text-green-400 font-medium whitespace-nowrap">Desconto em:</span>
                              <div className="text-white/80 text-sm font-bold">{discount_description}</div>
                            </div>
                            <div className="text-white/90 text-sm italic">
                              Apresentando este cupom você terá desconto
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <div className="overflow-hidden rounded-lg h-[300px] w-[300px] mx-auto mb-4 border-2 border-nightlife-800 shadow-lg shadow-nightlife-900/50">
              <img 
                src={currentImage} 
                alt={name} 
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
              />
            </div>

            {additional_images && additional_images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                <div 
                  className={`overflow-hidden rounded-md h-[50px] w-[50px] cursor-pointer border-2 ${currentImage === image ? 'border-nightlife-500' : 'border-transparent'} transition-all hover:scale-105`}
                  onClick={() => handleImageChange(image)}
                >
                  <img src={image} alt={`${name} principal`} className="w-full h-full object-cover" />
                </div>
                {additional_images.map((imgUrl, idx) => (
                  <div 
                    key={idx}
                    className={`overflow-hidden rounded-md h-[50px] w-[50px] cursor-pointer border-2 ${currentImage === imgUrl ? 'border-nightlife-500' : 'border-transparent'} transition-all hover:scale-105`}
                    onClick={() => handleImageChange(imgUrl)}
                  >
                    <img src={imgUrl} alt={`${name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            
            {tags.length > 0 && (
              <div className="mb-4 border-y border-nightlife-800/50 py-4">
                <h3 className="text-base font-semibold mb-2 text-center text-white/80 flex items-center justify-center gap-1">
                  <Tag className="w-4 h-4 text-nightlife-400" />
                  Categorias
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {tags.map((tag, index) => (
                    <Badge 
                      key={index}
                      variant="outline" 
                      className="bg-nightlife-950/50 text-white/90 border-nightlife-700/50 px-3 py-1 hover:bg-nightlife-800/50 transition-colors"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-base font-semibold mb-1">Sobre</h3>
              <p className="text-white/80 text-sm">{description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="border border-white/10 rounded-lg p-2">
                <h4 className="flex items-center gap-1 font-medium mb-1 text-sm">
                  <Clock className="w-3 h-3 text-nightlife-400" />
                  Horário de Funcionamento
                  <span className="ml-auto text-xs text-white/60">
                    {new Date().toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      hour12: false 
                    })}
                  </span>
                </h4>
                {hours ? (
                  <ul className="space-y-0.5 text-white/70 text-xs">
                    {hours.split('\n').map((line, idx) => {
                      // Verificar se esta linha corresponde ao dia atual
                      const now = new Date();
                      const dayOfWeek = now.getDay();
                      const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
                      const isCurrentDay = line.toLowerCase().includes(dayNames[dayOfWeek]);
                      
                      // Em vez de aplicar a classe na linha inteira, vamos formatar apenas a palavra "FECHADO"
                      let formattedLine = line;
                      if (line.toUpperCase().includes('FECHADO')) {
                        formattedLine = line.replace(/FECHADO/i, '<span class="text-red-500">FECHADO</span>');
                      }
                      
                      return line.trim() && (
                        <li key={idx} className={isCurrentDay ? 'text-white font-medium' : ''}>
                          {isCurrentDay && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-1 animate-pulse"></span>}
                          <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
                          {isCurrentDay && isOpen && <span className="ml-1 text-green-400 text-xs">(Aberto agora)</span>}
                          {isCurrentDay && !isOpen && <span className="ml-1 text-red-400 text-xs">(Fechado agora)</span>}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <ul className="space-y-0.5 text-white/70 text-xs">
                    <li>Segunda a Quinta: 18:00 - 00:00</li>
                    <li>Sexta e Sábado: 18:00 - 02:00</li>
                    <li>Domingo: 16:00 - 22:00</li>
                  </ul>
                )}
              </div>

              <div className="border border-white/10 rounded-lg p-2">
                <h4 className="flex items-center gap-1 font-medium mb-1 text-sm">
                  <Phone className="w-3 h-3 text-nightlife-400" />
                  Contato
                </h4>
                <div className="bg-nightlife-900/50 p-4 rounded-lg border border-white/10 relative">
                  <div className="space-y-2">
                    {phone && (
                      <div className="flex items-center gap-2 text-white/80">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${phone}`} className="hover:text-nightlife-500 transition-colors">
                          {phone}
                        </a>
                      </div>
                    )}
                    {instagram && (
                      <div className="flex items-center gap-2 text-white/80">
                        <Instagram className="h-4 w-4" />
                        <a 
                          href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-nightlife-500 transition-colors"
                        >
                          Instagram
                        </a>
                      </div>
                    )}
                    {facebook && (
                      <div className="flex items-center gap-2 text-white/80">
                        <Facebook className="h-4 w-4" />
                        <a 
                          href={facebook} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-nightlife-500 transition-colors"
                        >
                          Facebook
                        </a>
                      </div>
                    )}
                  </div>
                  {instagram && (
                    <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
                      <a 
                        href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1 hover:text-nightlife-500 transition-colors group"
                      >
                        <div className="relative">
                          <Instagram className="h-8 w-8 group-hover:scale-110 group-hover:text-pink-500 transition-all duration-300 animate-pulse-slow" />
                          <span className="absolute inset-0 bg-pink-500/30 blur-md rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-300"></span>
                        </div>
                        <span className="text-sm group-hover:text-pink-500 transition-colors">Seguir</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {events.length > 0 && (
              <div id={`events-${id}`} className="mb-4">
                <h3 className="text-base font-semibold mb-2 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-nightlife-400" />
                  Próximos Eventos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {events.map((event, index) => (
                    <div key={index} className="border border-white/10 rounded-lg p-2">
                      <h4 className="font-medium text-sm text-white">{event.name}</h4>
                      <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-nightlife-400" />
                        {event.date}
                      </p>
                      {event.phone && (
                        <a 
                          href={`https://wa.me/${event.phone.replace(/\D/g, '')}?text=Olá%20gostaria%20de%20fazer%20reserva%20para%20-%20${encodeURIComponent(event.name)}%20(${encodeURIComponent(event.date)})`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300 text-xs flex items-center gap-1 mt-1"
                        >
                          <Phone className="w-3 h-3" />
                          Fazer reserva
                        </a>
                      )}
                      {event.youtube_url && (
                        <div 
                          className="mt-2 relative cursor-pointer rounded overflow-hidden group"
                          onClick={() => playVideo(event.youtube_url as string)}
                        >
                          <div className="aspect-video bg-nightlife-900/80 rounded overflow-hidden">
                            {getYoutubeVideoId(event.youtube_url) && (
                              <img 
                                src={`https://img.youtube.com/vi/${getYoutubeVideoId(event.youtube_url)}/mqdefault.jpg`} 
                                alt={`Vídeo: ${event.name}`}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                              />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Youtube className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-nightlife-400 mt-0.5" />
                <span className="text-white/70">{location}</span>
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 mt-3">
              <p className="text-white/70 text-xs">Feito por Garimpo de Ofertas</p>
              <button 
                onClick={() => setIsDetailsOpen(false)}
                className="px-3 py-1.5 bg-nightlife-600 hover:bg-nightlife-700 text-white rounded-md transition-colors text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de vídeo do YouTube */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="sm:max-w-[800px] bg-black/95 border-white/10 text-white p-1 sm:p-2">
          <div className="relative pt-[56.25%] w-full">
            {currentVideoUrl && getYoutubeVideoId(currentVideoUrl) && (
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-sm"
                src={`https://www.youtube.com/embed/${getYoutubeVideoId(currentVideoUrl)}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>
          <div className="flex justify-end mt-2">
            <button 
              onClick={() => setVideoModalOpen(false)}
              className="px-3 py-1.5 bg-nightlife-600 hover:bg-nightlife-700 text-white rounded-md transition-colors text-xs"
            >
              Fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default BarCard;
