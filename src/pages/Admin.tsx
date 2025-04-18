import React, { useState, useRef, useEffect } from 'react';
import { supabase, uploadImage } from '@/lib/supabase';
import { useBars, useEvents } from '@/hooks/use-supabase-data';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Upload, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Navbar from '@/components/Navbar';
import CoverImageConfig from '@/components/CoverImageConfig';
import MapsLinkConfig from '@/components/MapsLinkConfig';

// Interface para os dados do bar
interface Bar {
  id: number;
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
  }[];
  tags: string[];
  maps_url?: string;
  phone?: string;
  instagram?: string;
  facebook?: string;
  hours?: string;
  user_id?: string;
}

// Interface para os dados de evento
interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image: string;
  youtube_url?: string;
  bar_id?: number | null;
}

// Função para obter o dia e hora atual em Brasília
const getCurrentDayHour = (): string => {
  const now = new Date();
  // Ajustar para o fuso horário de Brasília (UTC-3)
  const brasiliaTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000) - (3 * 60 * 60 * 1000));
  
  const dayOfWeek = brasiliaTime.getDay();
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  
  const hours = brasiliaTime.getHours().toString().padStart(2, '0');
  const minutes = brasiliaTime.getMinutes().toString().padStart(2, '0');
  
  return `${days[dayOfWeek]}, ${hours}:${minutes}`;
};

// Função para extrair o ID do vídeo do YouTube de uma URL
const getYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  // Regex para extrair o ID do vídeo do YouTube de diferentes formatos de URL
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
};

// Função para validar uma URL do YouTube
const isValidYoutubeUrl = (url: string): boolean => {
  return !!getYoutubeVideoId(url);
};

// Função para analisar o texto de horas e extrair valores para a interface
const parseHoursText = (hoursText?: string): {[key: string]: {open: string, close: string}} => {
  const defaultHours = {
    'seg': { open: '18:00', close: '00:00' },
    'ter': { open: '18:00', close: '00:00' },
    'qua': { open: '18:00', close: '00:00' },
    'qui': { open: '18:00', close: '00:00' },
    'sex': { open: '18:00', close: '02:00' },
    'sab': { open: '18:00', close: '02:00' },
    'dom': { open: '16:00', close: '22:00' }
  };
  
  if (!hoursText) return defaultHours;
  
  const result = {...defaultHours};
  const lines = hoursText.split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Separar o dia e o horário (formato típico: "Segunda: 18:00 - 00:00")
    const parts = line.split(':');
    if (parts.length < 2) continue;
    
    const dayText = parts[0].toLowerCase().trim();
    // Juntar o resto para lidar com casos onde há múltiplos ":" no horário
    const timeText = parts.slice(1).join(':').trim();
    
    // Identificar o dia da semana
    let dayKey = '';
    if (dayText.includes('segunda')) {
      dayKey = 'seg';
    } else if (dayText.includes('terça') || dayText.includes('terca')) {
      dayKey = 'ter';
    } else if (dayText.includes('quarta')) {
      dayKey = 'qua';
    } else if (dayText.includes('quinta')) {
      dayKey = 'qui';
    } else if (dayText.includes('sexta')) {
      dayKey = 'sex';
    } else if (dayText.includes('sábado') || dayText.includes('sabado')) {
      dayKey = 'sab';
    } else if (dayText.includes('domingo')) {
      dayKey = 'dom';
    }
    
    if (dayKey && timeText) {
      // Extrair horários de abertura e fechamento
      const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const [, openHour, openMin, closeHour, closeMin] = timeMatch;
        result[dayKey] = {
          open: `${openHour.padStart(2, '0')}:${openMin}`,
          close: `${closeHour.padStart(2, '0')}:${closeMin}`
        };
      }
    }
  }
  
  return result;
};

// Função para formatar os valores de horas para o formato esperado pelo isBarOpen
const formatHoursForSave = (hoursData: {[key: string]: {open: string, close: string}}): string => {
  const dayNames = {
    'seg': 'Segunda',
    'ter': 'Terça',
    'qua': 'Quarta',
    'qui': 'Quinta',
    'sex': 'Sexta',
    'sab': 'Sábado',
    'dom': 'Domingo'
  };
  
  const lines = [];
  
  for (const dayKey of Object.keys(hoursData)) {
    if (hoursData[dayKey] && hoursData[dayKey].open && hoursData[dayKey].close) {
      lines.push(`${dayNames[dayKey as keyof typeof dayNames]}: ${hoursData[dayKey].open} - ${hoursData[dayKey].close}`);
    }
  }
  
  return lines.join('\n');
};

const Admin: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: bars } = useBars();
  const { data: events } = useEvents();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventFileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRefs = useRef<Array<HTMLInputElement | null>>([null, null, null]);

  const [activeTab, setActiveTab] = useState('bars');
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentBarId, setCurrentBarId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<(string | null)[]>([null, null, null]);
  
  // Estado para horários estruturados
  const [hoursData, setHoursData] = useState<{[key: string]: {open: string, close: string}}>({
    'seg': { open: '18:00', close: '00:00' },
    'ter': { open: '18:00', close: '00:00' },
    'qua': { open: '18:00', close: '00:00' },
    'qui': { open: '18:00', close: '00:00' },
    'sex': { open: '18:00', close: '02:00' },
    'sab': { open: '18:00', close: '02:00' },
    'dom': { open: '16:00', close: '22:00' }
  });
  
  // Estado para novo bar
  const [newBar, setNewBar] = useState({
    id: 0, // para edição
    name: '',
    location: '',
    maps_url: '',
    description: '',
    rating: 4.5,
    image: '',
    additional_images: [] as string[],
    tags: '',
    eventName1: '',
    eventDate1: '',
    eventYoutubeUrl1: '',
    eventName2: '',
    eventDate2: '',
    eventYoutubeUrl2: '',
    eventName3: '',
    eventDate3: '',
    eventYoutubeUrl3: '',
    eventName4: '',
    eventDate4: '',
    eventYoutubeUrl4: '',
    phone: '',
    instagram: '',
    facebook: '',
    hours: ''
  });

  // Estado para novo evento
  const [newEvent, setNewEvent] = useState<Event>({
    id: '',
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    image: '',
    youtube_url: '',
    bar_id: null
  });

  // Filtrar bares para usuários comuns (apenas seus próprios bares)
  const filteredBars = isSuperAdmin 
    ? bars 
    : bars?.filter(bar => bar.user_id === user?.id);

  // Atualizar campos do novo bar
  const handleBarChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewBar({ ...newBar, [e.target.name]: e.target.value });
  };

  // Atualizar campos do novo evento
  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
  };

  // Gerenciar alterações nos horários
  const handleHoursChange = (dayKey: string, field: 'open' | 'close', value: string) => {
    setHoursData(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value
      }
    }));
    
    // Atualizar o campo hours do newBar
    const formattedHours = formatHoursForSave({
      ...hoursData,
      [dayKey]: {
        ...hoursData[dayKey],
        [field]: value
      }
    });
    setNewBar(prev => ({ ...prev, hours: formattedHours }));
  };
  
  // Obter o valor de hora para um campo específico
  const getHoursValue = (dayKey: string, field: 'open' | 'close'): string => {
    return hoursData[dayKey]?.[field] || '';
  };

  // Função para fazer upload de imagem para o Supabase Storage
  const handleImageUpload = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      console.log("Iniciando upload de imagem:", file.name, file.type, file.size);
      
      // Mostrar progresso inicial
      setUploadProgress(10);
      
      // Fazer upload usando a função centralizada
      const bucketName = activeTab === 'bars' ? 'bar-images' : 'event-images';
      console.log(`Usando bucket: ${bucketName}`);
      const imageUrl = await uploadImage(file, bucketName);
      
      setUploadProgress(100);
      console.log("Upload concluído com sucesso, URL:", imageUrl);
      
      return imageUrl;
    } catch (error) {
      console.error("Erro detalhado ao fazer upload da imagem:", error);
      
      let errorMessage = "Não foi possível fazer o upload da imagem. Tente novamente.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro no upload",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Função para fazer upload de imagem para o Supabase Storage
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEventImage: boolean = false, additionalImageIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Exibir preview da imagem selecionada
    const reader = new FileReader();
    reader.onload = (event) => {
      if (isEventImage) {
        setEventImagePreview(event.target?.result as string);
      } else if (additionalImageIndex !== undefined) {
        setAdditionalImagePreviews(prev => {
          const newPreviews = [...prev];
          newPreviews[additionalImageIndex] = event.target?.result as string;
          return newPreviews;
        });
      } else {
        setImagePreview(event.target?.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Iniciar upload de imagem
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Iniciar upload de imagem para evento
  const handleEventUploadClick = () => {
    eventFileInputRef.current?.click();
  };

  // Iniciar upload de imagem adicional
  const handleAdditionalUploadClick = (index: number) => {
    additionalFileInputRefs.current[index]?.click();
  };

  // Adicionar ou atualizar bar
  const addOrUpdateBar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!newBar.name.trim() || !newBar.description.trim() || !newBar.location.trim()) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive"
        });
        return;
      }
      
      // Verificar limite de tags (máximo 4)
      const tagsArray = newBar.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      if (tagsArray.length > 4) {
        toast({
          title: "Limite de tags",
          description: "Você pode adicionar no máximo 4 tags para um bar.",
          variant: "destructive"
        });
        return;
      }
      
      // Verificar limite de bar para usuários comuns (não super_admin)
      if (!isEditMode && !isSuperAdmin) {
        // Verificar se o usuário já tem um bar cadastrado
        const { data: userBars, error: userBarsError } = await supabase
          .from('bars')
          .select('id')
          .eq('user_id', user?.id);
          
        if (userBarsError) {
          console.error("Erro ao verificar bares do usuário:", userBarsError);
          throw userBarsError;
        }
        
        if (userBars && userBars.length >= 1) {
          toast({
            title: "Limite de bares",
            description: "Usuários comuns podem adicionar apenas um bar. Edite o bar existente ou contate um administrador.",
            variant: "destructive"
          });
          return;
        }
      }
      
      let imageUrl = newBar.image;
      
      // Se houver um arquivo selecionado, fazer upload
      if (fileInputRef.current?.files?.length) {
        const uploadedUrl = await handleImageUpload(fileInputRef.current.files[0]);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      // Upload de imagens adicionais
      let additionalImages = [...newBar.additional_images];
      
      for (let i = 0; i < 3; i++) {
        if (additionalFileInputRefs.current[i]?.files?.length) {
          const uploadedUrl = await handleImageUpload(additionalFileInputRefs.current[i]!.files[0]);
          if (uploadedUrl) {
            // Se já existe uma imagem nessa posição, substitui; caso contrário, adiciona
            if (i < additionalImages.length) {
              additionalImages[i] = uploadedUrl;
            } else {
              additionalImages.push(uploadedUrl);
            }
          }
        }
      }
      
      // Preparar os dados para salvar
      const barData: any = {
        name: newBar.name,
        location: newBar.location,
        maps_url: newBar.maps_url,
        description: newBar.description,
        rating: parseFloat(newBar.rating.toString()),
        image: imageUrl || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b',
        additional_images: additionalImages,
        tags: newBar.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0).slice(0, 4),
        events: [
          { name: newBar.eventName1, date: newBar.eventDate1, youtube_url: newBar.eventYoutubeUrl1 },
          { name: newBar.eventName2, date: newBar.eventDate2, youtube_url: newBar.eventYoutubeUrl2 },
          { name: newBar.eventName3, date: newBar.eventDate3, youtube_url: newBar.eventYoutubeUrl3 },
          { name: newBar.eventName4, date: newBar.eventDate4, youtube_url: newBar.eventYoutubeUrl4 }
        ].filter(event => event.name && event.date),
        phone: newBar.phone,
        instagram: newBar.instagram,
        facebook: newBar.facebook,
        hours: formatHoursForSave(hoursData)
      };
      
      // Adicionar user_id ao criar novo bar (não ao editar)
      if (!isEditMode && user) {
        barData.user_id = user.id;
      }
      
      console.log('Enviando dados do bar:', barData);
      
      let result;
      
      if (isEditMode && currentBarId) {
        // Atualizar bar existente
        result = await supabase
          .from('bars')
          .update(barData)
          .eq('id', currentBarId)
          .select();
          
        if (result.error) throw result.error;
        
        toast({
          title: "Bar atualizado",
          description: `${barData.name} foi atualizado com sucesso.`
        });
        
      } else {
        // Inserir novo bar
        result = await supabase
          .from('bars')
          .insert(barData)
          .select();
          
        if (result.error) throw result.error;
        
        toast({
          title: "Bar adicionado",
          description: `${barData.name} foi adicionado com sucesso.`
        });
      }
      
      // Limpar o formulário e atualizar a lista
      setNewBar({
        id: 0,
        name: '',
        location: '',
        maps_url: '',
        description: '',
        rating: 4.5,
        image: '',
        additional_images: [],
        tags: '',
        eventName1: '',
        eventDate1: '',
        eventYoutubeUrl1: '',
        eventName2: '',
        eventDate2: '',
        eventYoutubeUrl2: '',
        eventName3: '',
        eventDate3: '',
        eventYoutubeUrl3: '',
        eventName4: '',
        eventDate4: '',
        eventYoutubeUrl4: '',
        phone: '',
        instagram: '',
        facebook: '',
        hours: ''
      });
      
      // Limpar previews de imagem
      setImagePreview(null);
      setAdditionalImagePreviews([null, null, null]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      additionalFileInputRefs.current.forEach(ref => {
        if (ref) ref.value = '';
      });
      
      // Atualizar a lista de bares
      queryClient.invalidateQueries({ queryKey: ['bars'] });
      queryClient.refetchQueries({ queryKey: ['bars'] });
      setIsEditMode(false);
      setCurrentBarId(null);
      
      // Aguardar um pouco e fazer uma segunda tentativa de atualizar a lista
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['bars'] });
        queryClient.refetchQueries({ queryKey: ['bars'] });
      }, 1000);
      
    } catch (error) {
      console.error("Erro ao salvar bar:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o bar. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Adicionar novo evento
  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let imageUrl = newEvent.image;
      
      // Se houver um arquivo selecionado, fazer upload
      if (eventFileInputRef.current?.files?.length) {
        const uploadedUrl = await handleImageUpload(eventFileInputRef.current.files[0]);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      const eventData = {
        ...newEvent,
        image: imageUrl || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b',
        youtube_url: newEvent.youtube_url
      };
      
      console.log('Enviando dados do evento:', eventData);
      
      // Inserir no Supabase
      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select();
        
      if (error) {
        throw error;
      }
      
      // Limpar o formulário e atualizar a lista
      setNewEvent({
        id: '',
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        image: '',
        youtube_url: '',
        bar_id: null
      });
      
      // Limpar previews de imagem
      setEventImagePreview(null);
      if (eventFileInputRef.current) eventFileInputRef.current.value = '';
      
      // Atualizar a lista de eventos
      queryClient.invalidateQueries({ queryKey: ['events'] });
      
      toast({
        title: "Evento adicionado",
        description: `${newEvent.title} foi adicionado com sucesso.`
      });
      
    } catch (error) {
      console.error("Erro ao adicionar evento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o evento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Iniciar edição de bar
  const startEditBar = (bar: Bar) => {
    // Preencher formulário com dados do bar selecionado
    setNewBar({
      id: bar.id,
      name: bar.name,
      location: bar.location,
      maps_url: bar.maps_url || '',
      description: bar.description,
      rating: bar.rating,
      image: bar.image,
      additional_images: bar.additional_images || [],
      tags: bar.tags.join(', '),
      eventName1: bar.events[0]?.name || '',
      eventDate1: bar.events[0]?.date || '',
      eventYoutubeUrl1: bar.events[0]?.youtube_url || '',
      eventName2: bar.events[1]?.name || '',
      eventDate2: bar.events[1]?.date || '',
      eventYoutubeUrl2: bar.events[1]?.youtube_url || '',
      eventName3: bar.events[2]?.name || '',
      eventDate3: bar.events[2]?.date || '',
      eventYoutubeUrl3: bar.events[2]?.youtube_url || '',
      eventName4: bar.events[3]?.name || '',
      eventDate4: bar.events[3]?.date || '',
      eventYoutubeUrl4: bar.events[3]?.youtube_url || '',
      phone: bar.phone || '',
      instagram: bar.instagram || '',
      facebook: bar.facebook || '',
      hours: bar.hours || ''
    });
    setIsEditMode(true);
    setCurrentBarId(bar.id);
    window.scrollTo(0, 0);
  };

  // Cancelar edição
  const cancelEdit = () => {
    setNewBar({
      id: 0,
      name: '',
      location: '',
      maps_url: '',
      description: '',
      rating: 4.5,
      image: '',
      additional_images: [],
      tags: '',
      eventName1: '',
      eventDate1: '',
      eventYoutubeUrl1: '',
      eventName2: '',
      eventDate2: '',
      eventYoutubeUrl2: '',
      eventName3: '',
      eventDate3: '',
      eventYoutubeUrl3: '',
      eventName4: '',
      eventDate4: '',
      eventYoutubeUrl4: '',
      phone: '',
      instagram: '',
      facebook: '',
      hours: ''
    });
    setIsEditMode(false);
    setCurrentBarId(null);
  };

  // Iniciar exclusão de bar
  const startDeleteBar = (barId: number) => {
    setCurrentBarId(barId);
    setDeleteDialogOpen(true);
  };

  // Confirmar exclusão de bar
  const confirmDeleteBar = async () => {
    if (!currentBarId) return;
    
    try {
      const { error } = await supabase
        .from('bars')
        .delete()
        .eq('id', currentBarId);
        
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['bars'] });
      
      toast({
        title: "Bar excluído",
        description: "O bar foi removido com sucesso."
      });
      
    } catch (error) {
      console.error("Erro ao excluir bar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o bar. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setCurrentBarId(null);
    }
  };

  // Atualizar hoursData quando newBar.hours mudar (para edição de bar)
  useEffect(() => {
    if (newBar.hours) {
      const parsedHours = parseHoursText(newBar.hours);
      setHoursData(parsedHours);
    }
  }, [newBar.hours]);

  // Iniciar edição de evento
  const startEditEvent = (event: Event) => {
    setNewEvent({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      image: event.image,
      youtube_url: event.youtube_url || '',
      bar_id: event.bar_id
    });
    setEventImagePreview(event.image);
    setIsEditMode(true);
    window.scrollTo(0, 0);
  };

  // Cancelar edição de evento
  const cancelEditEvent = () => {
    setNewEvent({
      id: '',
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      image: '',
      youtube_url: '',
      bar_id: null
    });
    setEventImagePreview(null);
    if (eventFileInputRef.current) eventFileInputRef.current.value = '';
    setIsEditMode(false);
  };

  // Excluir evento
  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
        
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['events'] });
      
      toast({
        title: "Evento excluído",
        description: "O evento foi excluído com sucesso."
      });
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o evento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para remover uma imagem adicional
  const removeAdditionalImage = (index: number) => {
    // Criar uma cópia da lista de imagens adicionais
    const updatedImages = [...newBar.additional_images];
    // Remover a imagem do índice especificado
    updatedImages.splice(index, 1);
    // Atualizar o estado
    setNewBar({
      ...newBar,
      additional_images: updatedImages
    });
    // Limpar o preview
    setAdditionalImagePreviews(prev => {
      const newPreviews = [...prev];
      newPreviews[index] = null;
      return newPreviews;
    });
    // Limpar o input de arquivo
    if (additionalFileInputRefs.current[index]) {
      additionalFileInputRefs.current[index]!.value = '';
    }
    
    toast({
      title: "Imagem removida",
      description: `A imagem ${index + 1} foi removida com sucesso.`
    });
  };

  // Função para remover a imagem principal
  const removeMainImage = () => {
    setNewBar({
      ...newBar,
      image: ''
    });
    setImagePreview(null);
    
    // Limpar o input de arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    toast({
      title: "Imagem removida",
      description: "A imagem principal foi removida com sucesso."
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Painel de Administração</h1>
        
        <div className="space-y-6">
          {/* Card de configuração da página inicial (apenas super admin) */}
          {isSuperAdmin && (
            <Card className="bg-nightlife-900 border-white/10">
              <CardHeader>
                <CardTitle>Configuração da Página Inicial</CardTitle>
                <CardDescription>
                  Altere a imagem de capa exibida na página inicial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CoverImageConfig />
              </CardContent>
            </Card>
          )}
          
          {/* Card de configuração do link do Google Maps (apenas super admin) */}
          {isSuperAdmin && (
            <Card className="bg-nightlife-900 border-white/10">
              <CardHeader>
                <CardTitle>Link Maps personalizado Google</CardTitle>
                <CardDescription>
                  Configure o link personalizado do Google Maps que será exibido na página de bares
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MapsLinkConfig />
              </CardContent>
            </Card>
          )}
          
          {/* Card de adição/edição de bar */}
            <Card className="bg-nightlife-900 border-white/10">
              <CardHeader>
                <CardTitle>{isEditMode ? 'Editar Bar' : 'Adicionar Novo Bar'}</CardTitle>
                <CardDescription>
                  {isEditMode 
                    ? 'Atualize as informações do bar selecionado.' 
                    : 'Preencha os campos abaixo para adicionar um novo bar ao site.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-nightlife-800/50 p-3 rounded-md mb-4 text-white/70 text-sm">
                  <strong className="text-white">Informações sobre eventos:</strong>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>Você pode cadastrar até 4 eventos para cada bar</li>
                    <li>Apenas os 2 primeiros serão exibidos no card da página principal</li>
                    <li>Todos os eventos serão exibidos na página de detalhes</li>
                    <li>Links de vídeos do YouTube serão exibidos apenas na página de detalhes</li>
                    <li>Os vídeos serão exibidos como miniaturas clicáveis que abrirão em um player</li>
                  </ul>
                </div>
              <form onSubmit={addOrUpdateBar} className="space-y-4 max-w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-white/70 mb-1 block">Nome do Bar</label>
                      <Input
                        name="name"
                        placeholder="Nome do bar"
                        value={newBar.name}
                        onChange={handleBarChange}
                        required
                        className="bg-nightlife-950 border-white/20"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/70 mb-1 block">Localização</label>
                      <Input
                        name="location"
                        placeholder="Bairro, Endereço"
                        value={newBar.location}
                        onChange={handleBarChange}
                        required
                        className="bg-nightlife-950 border-white/20"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Link Google Maps</label>
                    <Input
                      name="maps_url"
                      placeholder="https://maps.google.com/..."
                      value={newBar.maps_url}
                      onChange={handleBarChange}
                      className="bg-nightlife-950 border-white/20"
                    />
                    <p className="text-xs text-white/50 mt-1">Cole o link do Google Maps para este local</p>
                  </div>
                  
                  <div className="border border-white/10 p-4 rounded-md mb-4">
                    <h3 className="text-sm font-medium mb-3">Informações de Contato</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-white/70 mb-1 block">Telefone</label>
                        <Input
                          name="phone"
                          placeholder="(11) 9999-9999"
                          value={newBar.phone}
                          onChange={handleBarChange}
                          className="bg-nightlife-950 border-white/20"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-white/70 mb-1 block">Instagram</label>
                        <Input
                          name="instagram"
                          placeholder="@instagram"
                          value={newBar.instagram}
                          onChange={handleBarChange}
                          className="bg-nightlife-950 border-white/20"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-white/70 mb-1 block">Facebook</label>
                        <Input
                          name="facebook"
                          placeholder="facebook.com/pagina"
                          value={newBar.facebook}
                          onChange={handleBarChange}
                          className="bg-nightlife-950 border-white/20"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Horário de Funcionamento</label>
                    <div className="border border-white/10 rounded-lg p-4 bg-nightlife-950/50 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <h4 className="text-sm font-medium">Dias e Horários</h4>
                      </div>
                      
                      {/* Segunda */}
                      <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <label className={`text-sm ${getCurrentDayHour().includes('Segunda') ? 'text-blue-400 font-medium' : ''} sm:w-24`}>Segunda-feira</label>
                        <div className="flex gap-2 items-center mx-auto sm:mx-0">
                            <Input 
                              type="time"
                              placeholder="Abertura"
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Segunda') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('seg', 'open', e.target.value)}
                              value={getHoursValue('seg', 'open')}
                            />
                            <span className="text-white/50">-</span>
                            <Input 
                              type="time"
                              placeholder="Fechamento" 
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Segunda') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('seg', 'close', e.target.value)}
                              value={getHoursValue('seg', 'close')}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Terça */}
                      <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <label className={`text-sm ${getCurrentDayHour().includes('Terça') ? 'text-blue-400 font-medium' : ''} sm:w-24`}>Terça-feira</label>
                        <div className="flex gap-2 items-center mx-auto sm:mx-0">
                            <Input 
                              type="time"
                              placeholder="Abertura"
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Terça') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('ter', 'open', e.target.value)}
                              value={getHoursValue('ter', 'open')}
                            />
                            <span className="text-white/50">-</span>
                            <Input 
                              type="time"
                              placeholder="Fechamento" 
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Terça') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('ter', 'close', e.target.value)}
                              value={getHoursValue('ter', 'close')}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Quarta */}
                      <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <label className={`text-sm ${getCurrentDayHour().includes('Quarta') ? 'text-blue-400 font-medium' : ''} sm:w-24`}>Quarta-feira</label>
                        <div className="flex gap-2 items-center mx-auto sm:mx-0">
                            <Input 
                              type="time"
                              placeholder="Abertura"
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Quarta') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('qua', 'open', e.target.value)}
                              value={getHoursValue('qua', 'open')}
                            />
                            <span className="text-white/50">-</span>
                            <Input 
                              type="time"
                              placeholder="Fechamento" 
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Quarta') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('qua', 'close', e.target.value)}
                              value={getHoursValue('qua', 'close')}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Quinta */}
                      <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <label className={`text-sm ${getCurrentDayHour().includes('Quinta') ? 'text-blue-400 font-medium' : ''} sm:w-24`}>Quinta-feira</label>
                        <div className="flex gap-2 items-center mx-auto sm:mx-0">
                            <Input 
                              type="time"
                              placeholder="Abertura"
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Quinta') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('qui', 'open', e.target.value)}
                              value={getHoursValue('qui', 'open')}
                            />
                            <span className="text-white/50">-</span>
                            <Input 
                              type="time"
                              placeholder="Fechamento" 
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Quinta') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('qui', 'close', e.target.value)}
                              value={getHoursValue('qui', 'close')}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Sexta */}
                      <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <label className={`text-sm ${getCurrentDayHour().includes('Sexta') ? 'text-blue-400 font-medium' : ''} sm:w-24`}>Sexta-feira</label>
                        <div className="flex gap-2 items-center mx-auto sm:mx-0">
                            <Input 
                              type="time"
                              placeholder="Abertura"
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Sexta') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('sex', 'open', e.target.value)}
                              value={getHoursValue('sex', 'open')}
                            />
                            <span className="text-white/50">-</span>
                            <Input 
                              type="time"
                              placeholder="Fechamento" 
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Sexta') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('sex', 'close', e.target.value)}
                              value={getHoursValue('sex', 'close')}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Sábado */}
                      <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <label className={`text-sm ${getCurrentDayHour().includes('Sábado') ? 'text-blue-400 font-medium' : ''} sm:w-24`}>Sábado</label>
                        <div className="flex gap-2 items-center mx-auto sm:mx-0">
                            <Input 
                              type="time"
                              placeholder="Abertura"
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Sábado') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('sab', 'open', e.target.value)}
                              value={getHoursValue('sab', 'open')}
                            />
                            <span className="text-white/50">-</span>
                            <Input 
                              type="time"
                              placeholder="Fechamento" 
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Sábado') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('sab', 'close', e.target.value)}
                              value={getHoursValue('sab', 'close')}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Domingo */}
                      <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <label className={`text-sm ${getCurrentDayHour().includes('Domingo') ? 'text-blue-400 font-medium' : ''} sm:w-24`}>Domingo</label>
                        <div className="flex gap-2 items-center mx-auto sm:mx-0">
                            <Input 
                              type="time"
                              placeholder="Abertura"
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Domingo') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('dom', 'open', e.target.value)}
                              value={getHoursValue('dom', 'open')}
                            />
                            <span className="text-white/50">-</span>
                            <Input 
                              type="time"
                              placeholder="Fechamento" 
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Domingo') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('dom', 'close', e.target.value)}
                              value={getHoursValue('dom', 'close')}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex justify-between items-center">
                        <p className="text-xs text-white/50">
                          Os horários são utilizados para mostrar status de "Aberto" ou "Fechado" nos cards.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Descrição</label>
                    <Textarea
                      name="description"
                      placeholder="Descrição do bar"
                      value={newBar.description}
                      onChange={handleBarChange}
                      required
                      className="bg-nightlife-950 border-white/20 h-[72px] resize-none"
                    />
                    <p className="text-xs text-white/50 mt-1">
                      A descrição será limitada a 3 linhas no card principal. Texto completo visível apenas na visualização detalhada.
                    </p>
                  </div>
                  
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-white/70 mb-1 block">Imagem Principal</label>
                      <div className="flex flex-col gap-3">
                        <div>
                          {/* Botão para upload de imagem */}
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="border-white/20 w-full"
                            onClick={handleUploadClick}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Selecionar Imagem Principal
                          </Button>
                        </div>
                        
                        {/* Input oculto para seleção de arquivo */}
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                        
                        {/* Preview da imagem */}
                        {(imagePreview || newBar.image) && (
                        <div className="mt-2 relative w-full h-40 sm:h-48 bg-nightlife-800 rounded-md overflow-hidden group">
                            <img 
                              src={imagePreview || newBar.image} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                            />
                          <button
                            type="button"
                            onClick={removeMainImage}
                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remover imagem"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-white/70 mb-1 block">Avaliação (1-5)</label>
                      <Input
                        name="rating"
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={newBar.rating}
                        onChange={handleBarChange}
                        required
                        className="bg-nightlife-950 border-white/20"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Imagens Adicionais (até 3)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex flex-col gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="border-white/20 w-full"
                            onClick={() => handleAdditionalUploadClick(index)}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Imagem {index + 1}
                          </Button>
                          
                          <input
                            type="file"
                            ref={el => additionalFileInputRefs.current[index] = el}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, false, index)}
                          />
                          
                          {/* Preview da imagem adicional */}
                          {(additionalImagePreviews[index] || (newBar.additional_images && newBar.additional_images[index])) && (
                          <div className="relative w-full h-32 bg-nightlife-800 rounded-md overflow-hidden group">
                              <img 
                                src={additionalImagePreviews[index] || newBar.additional_images[index]} 
                                alt={`Preview ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                            <button
                              type="button"
                              onClick={() => removeAdditionalImage(index)}
                              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remover imagem"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-white/50 mt-1">Adicione até 3 imagens que serão exibidas na visualização detalhada</p>
                  </div>
                  
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Tags (separadas por vírgula)</label>
                    <Input
                      name="tags"
                      placeholder="rock, happy hour, samba..."
                      value={newBar.tags}
                      onChange={handleBarChange}
                      required
                      className="bg-nightlife-950 border-white/20"
                    />
                    <p className="text-xs text-white/50 mt-1">
                      Máximo de 4 tags que ajudam na busca e filtragem dos bares
                    </p>
                  </div>
                  </div>
                  
                {/* Eventos */}
                  <div className="border border-white/10 p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-4">Eventos</h3>
                  
                  <div className="space-y-6">
                    {/* Evento 1 */}
                    <div className="space-y-3 pb-4 border-b border-white/10">
                      <h4 className="text-sm text-white/70">Evento 1</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-white/70 mb-1 block">Nome do Evento</label>
                        <Input
                          name="eventName1"
                            placeholder="Ex: Noite de Jazz"
                          value={newBar.eventName1}
                          onChange={handleBarChange}
                          className="bg-nightlife-950 border-white/20"
                        />
                        </div>
                        <div>
                          <label className="text-xs text-white/70 mb-1 block">Data</label>
                        <Input
                          name="eventDate1"
                            placeholder="Ex: Toda quinta, 20h"
                          value={newBar.eventDate1}
                          onChange={handleBarChange}
                          className="bg-nightlife-950 border-white/20"
                        />
                      </div>
                      </div>
                      <div>
                        <label className="text-xs text-white/70 mb-1 block">Link do YouTube (opcional)</label>
                        <Input
                          name="eventYoutubeUrl1"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={newBar.eventYoutubeUrl1}
                          onChange={handleBarChange}
                          className="bg-nightlife-950 border-white/20"
                        />
                        {isValidYoutubeUrl(newBar.eventYoutubeUrl1) && (
                          <div className="flex items-center mt-1">
                            <img 
                              src={`https://img.youtube.com/vi/${getYoutubeVideoId(newBar.eventYoutubeUrl1)}/default.jpg`} 
                              alt="Miniatura do vídeo"
                              className="w-16 h-12 object-cover rounded mr-2"
                            />
                            <span className="text-xs text-green-400">URL válida ✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Evento 2 */}
                    <div className="space-y-3 pb-4 border-b border-white/10">
                      <h4 className="text-sm text-white/70">Evento 2</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-white/70 mb-1 block">Nome do Evento</label>
                        <Input
                          name="eventName2"
                            placeholder="Ex: Tributo Rock"
                          value={newBar.eventName2}
                          onChange={handleBarChange}
                          className="bg-nightlife-950 border-white/20"
                        />
                        </div>
                        <div>
                          <label className="text-xs text-white/70 mb-1 block">Data</label>
                        <Input
                          name="eventDate2"
                            placeholder="Ex: Sextas, 21h"
                          value={newBar.eventDate2}
                          onChange={handleBarChange}
                          className="bg-nightlife-950 border-white/20"
                        />
                      </div>
                      </div>
                      <div>
                        <label className="text-xs text-white/70 mb-1 block">Link do YouTube (opcional)</label>
                        <Input
                          name="eventYoutubeUrl2"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={newBar.eventYoutubeUrl2}
                          onChange={handleBarChange}
                          className="bg-nightlife-950 border-white/20"
                        />
                        {isValidYoutubeUrl(newBar.eventYoutubeUrl2) && (
                          <div className="flex items-center mt-1">
                            <img 
                              src={`https://img.youtube.com/vi/${getYoutubeVideoId(newBar.eventYoutubeUrl2)}/default.jpg`} 
                              alt="Miniatura do vídeo"
                              className="w-16 h-12 object-cover rounded mr-2"
                            />
                            <span className="text-xs text-green-400">URL válida ✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Evento 3 */}
                    <div className="space-y-3 pb-4 border-b border-white/10">
                      <h4 className="text-sm text-white/70">Evento 3</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-white/70 mb-1 block">Nome do Evento</label>
                        <Input
                          name="eventName3"
                            placeholder="Ex: Samba ao Vivo"
                          value={newBar.eventName3}
                          onChange={handleBarChange}
                          className="bg-nightlife-950 border-white/20"
                        />
                        </div>
                        <div>
                          <label className="text-xs text-white/70 mb-1 block">Data</label>
                        <Input
                          name="eventDate3"
                            placeholder="Ex: Sábados, 20h"
                          value={newBar.eventDate3}
                          onChange={handleBarChange}
                          className="bg-nightlife-950 border-white/20"
                        />
                      </div>
                      </div>
                      <div>
                        <label className="text-xs text-white/70 mb-1 block">Link do YouTube (opcional)</label>
                        <Input
                          name="eventYoutubeUrl3"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={newBar.eventYoutubeUrl3}
                          onChange={handleBarChange}
                          className="bg-nightlife-950 border-white/20"
                        />
                        {isValidYoutubeUrl(newBar.eventYoutubeUrl3) && (
                          <div className="flex items-center mt-1">
                            <img 
                              src={`https://img.youtube.com/vi/${getYoutubeVideoId(newBar.eventYoutubeUrl3)}/default.jpg`} 
                              alt="Miniatura do vídeo"
                              className="w-16 h-12 object-cover rounded mr-2"
                            />
                            <span className="text-xs text-green-400">URL válida ✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Evento 4 */}
                    <div className="space-y-3">
                      <h4 className="text-sm text-white/70">Evento 4</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-white/70 mb-1 block">Nome do Evento</label>
                        <Input
                          name="eventName4"
                            placeholder="Ex: Karaokê"
                          value={newBar.eventName4}
                          onChange={handleBarChange}
                          className="bg-nightlife-950 border-white/20"
                        />
                        </div>
                        <div>
                          <label className="text-xs text-white/70 mb-1 block">Data</label>
                        <Input
                          name="eventDate4"
                            placeholder="Ex: Domingos, 19h"
                          value={newBar.eventDate4}
                          onChange={handleBarChange}
                          className="bg-nightlife-950 border-white/20"
                        />
                      </div>
                      </div>
                      <div>
                        <label className="text-xs text-white/70 mb-1 block">Link do YouTube (opcional)</label>
                        <Input
                          name="eventYoutubeUrl4"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={newBar.eventYoutubeUrl4}
                          onChange={handleBarChange}
                          className="bg-nightlife-950 border-white/20"
                        />
                        {isValidYoutubeUrl(newBar.eventYoutubeUrl4) && (
                          <div className="flex items-center mt-1">
                            <img 
                              src={`https://img.youtube.com/vi/${getYoutubeVideoId(newBar.eventYoutubeUrl4)}/default.jpg`} 
                              alt="Miniatura do vídeo"
                              className="w-16 h-12 object-cover rounded mr-2"
                            />
                            <span className="text-xs text-green-400">URL válida ✓</span>
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {isEditMode && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1 border-white/20"
                        onClick={cancelEdit}
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      className="flex-1 bg-nightlife-600 hover:bg-nightlife-700"
                      disabled={isUploading}
                    >
                      {isUploading ? 'Enviando...' : isEditMode ? 'Salvar Alterações' : 'Adicionar Bar'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">
                {isSuperAdmin 
                  ? `Bares Cadastrados (${filteredBars?.length || 0})` 
                  : "Meu Bar"}
              </h2>
              <div className="space-y-4">
                {filteredBars?.map((bar) => (
                  <Card key={bar.id} className="bg-nightlife-900 border-white/10">
                    <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                          <img src={bar.image} alt={bar.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-medium">{bar.name}</h3>
                          <p className="text-sm text-white/60">
                            {bar.maps_url ? (
                              <a 
                                href={bar.maps_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:underline inline-flex items-center"
                              >
                                {bar.location}
                                <ArrowLeft className="h-3 w-3 ml-1 rotate-[135deg]" />
                              </a>
                            ) : (
                              bar.location
                            )}
                          </p>
                          {bar.phone && <p className="text-xs text-white/50">{bar.phone}</p>}
                          <p className="text-sm text-white/60">{bar.rating.toFixed(1)} ⭐ • {bar.tags.join(', ')}</p>
                          
                          {bar.hours && <details className="text-xs text-white/50 mt-1">
                            <summary className="cursor-pointer hover:text-white/70">Ver horário de funcionamento</summary>
                            <div className="mt-1 p-2 bg-nightlife-800 rounded text-white/60">
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {bar.hours.split('\n').map((line, index) => {
                                  const parts = line.split(':');
                                  if (parts.length < 2) return null;
                                  
                                  const day = parts[0].trim();
                                  const time = parts.slice(1).join(':').trim();
                                  
                                  // Adiciona classe especial para destacar o dia atual
                                  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
                                  const isToday = day.toLowerCase().includes(today);
                                  
                                  return (
                                    <div key={index} className={`flex flex-col p-1 rounded ${isToday ? 'bg-nightlife-700/50' : ''}`}>
                                      <span className={`font-medium ${isToday ? 'text-white' : ''}`}>{day}</span>
                                      <span>{time}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </details>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-white/20"
                          onClick={() => startEditBar(bar)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => startDeleteBar(bar.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Mostrar mensagem se não houver bares */}
                {filteredBars?.length === 0 && (
                  <div className="text-center p-8 bg-nightlife-900 border border-white/10 rounded-md">
                    <h3 className="text-lg font-medium mb-2">
                      {isSuperAdmin 
                        ? "Nenhum bar cadastrado" 
                        : "Você ainda não tem um bar cadastrado"}
                    </h3>
                    <p className="text-sm text-white/60">
                      {isSuperAdmin 
                        ? "Adicione um novo bar utilizando o formulário acima" 
                        : "Utilize o formulário acima para cadastrar seu bar"}
                    </p>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-nightlife-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Tem certeza que deseja excluir este bar? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/20 hover:bg-white/10 text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white" 
              onClick={confirmDeleteBar}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin; 