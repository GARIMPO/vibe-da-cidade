import React, { useState, useRef, useEffect, Fragment } from 'react';
import { supabase, uploadImage, deleteImage, cleanupUnusedImages } from '@/lib/supabase';
import { useBars, useEvents } from '@/hooks/use-supabase-data';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Upload, Image as ImageIcon, X, User as UserIcon, UserPlus, Lock, UserX, Check, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Navbar from '@/components/Navbar';
import CoverImageConfig from '@/components/CoverImageConfig';
import MapsLinkConfig from '@/components/MapsLinkConfig';
import { useQuery } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ShareRegistrationLink from '@/components/ShareRegistrationLink';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

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
    phone?: string;
  }[];
  tags: string[] | string;
  maps_url?: string;
  phone?: string;
  instagram?: string;
  facebook?: string;
  hours?: string;
  user_id?: string;
  discount_code?: string;
  discount_description?: string;
  eventName1?: string;
  eventDate1?: string;
  eventYoutubeUrl1?: string;
  eventPhone1?: string;
  eventName2?: string;
  eventDate2?: string;
  eventYoutubeUrl2?: string;
  eventPhone2?: string;
  eventName3?: string;
  eventDate3?: string;
  eventYoutubeUrl3?: string;
  eventPhone3?: string;
  eventName4?: string;
  eventDate4?: string;
  eventYoutubeUrl4?: string;
  eventPhone4?: string;
}

// Interface para usuários do sistema
interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  role: UserRole;
  approved: boolean;
  created_at?: string;
}

// Tipos de role de usuário
type UserRole = 'super_admin' | 'client' | 'user';

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
const parseHoursText = (hoursText?: string): {[key: string]: {open: string, close: string, closed?: boolean}} => {
  const defaultHours = {
    'seg': { open: '18:00', close: '00:00', closed: false },
    'ter': { open: '18:00', close: '00:00', closed: false },
    'qua': { open: '18:00', close: '00:00', closed: false },
    'qui': { open: '18:00', close: '00:00', closed: false },
    'sex': { open: '18:00', close: '02:00', closed: false },
    'sab': { open: '18:00', close: '02:00', closed: false },
    'dom': { open: '16:00', close: '22:00', closed: false }
  };
  
  if (!hoursText) return defaultHours;
  
  const result = {...defaultHours};
  const lines = hoursText.split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Verificar se contém "FECHADO" explícito no texto
    if (line.toLowerCase().includes('fechado')) {
      // Separar o dia (formato típico: "Segunda: FECHADO")
      const parts = line.split(':');
      if (parts.length < 1) continue;
      
      const dayText = parts[0].toLowerCase().trim();
      
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
      
      if (dayKey) {
        result[dayKey].closed = true;
      }
      continue;
    }
    
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
          close: `${closeHour.padStart(2, '0')}:${closeMin}`,
          closed: false
        };
      }
    }
  }
  
  return result;
};

// Define types for hours data
interface DayHour {
  open: string;
  close: string;
  closed: boolean;
}

interface HoursData {
  seg: DayHour;
  ter: DayHour;
  qua: DayHour;
  qui: DayHour;
  sex: DayHour;
  sab: DayHour;
  dom: DayHour;
}

// Função para formatar os valores de horas para o formato esperado pelo isBarOpen
const formatHoursForSave = (hoursData: HoursData): string => {
  const dayNames: Record<keyof HoursData, string> = {
    'seg': 'Segunda',
    'ter': 'Terça',
    'qua': 'Quarta',
    'qui': 'Quinta',
    'sex': 'Sexta',
    'sab': 'Sábado',
    'dom': 'Domingo'
  };
  
  const lines = [];
  
  for (const dayKey of Object.keys(dayNames) as Array<keyof HoursData>) {
    const dayData = hoursData[dayKey];
    if (dayData) {
      if (dayData.closed) {
        lines.push(`${dayNames[dayKey]}: FECHADO`);
      } else if (dayData.open && dayData.close) {
        lines.push(`${dayNames[dayKey]}: ${dayData.open} - ${dayData.close}`);
      }
    }
  }
  
  return lines.join('\n');
};

// Classe auxiliar para simular envio de formulários de maneira programática
class DirectSubmitController {
  // Método estático para simular o envio de um formulário pelo ID
  static submitForm(formId: string): boolean {
    const form = document.getElementById(formId) as HTMLFormElement;
    if (form) {
      // Criar e disparar um evento de envio de formulário
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      return true;
    }
    return false;
  }
}

// Hook para buscar usuários no Supabase
function useUsers() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      if (!user || user.role !== 'super_admin') {
        return null;
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'super_admin') // Filtrar para não incluir super_admin
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as User[];
    },
    enabled: !!user && user.role === 'super_admin',
  });
}

// Define the readFileAsDataURL function
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const Admin: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: bars } = useBars();
  const { data: events } = useEvents();
  const { data: users } = useUsers();
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
  
  // Estados para gerenciamento de usuários
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({
    email: '',
    name: '',
    phone: '',
    role: 'user',
    approved: false
  });
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [userManagementExpanded, setUserManagementExpanded] = useState(false);
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{userId: string, status: boolean} | null>(null);
  
  // Estado para horários estruturados
  const [hoursData, setHoursData] = useState<HoursData>({
    seg: { open: '', close: '', closed: false },
    ter: { open: '', close: '', closed: false },
    qua: { open: '', close: '', closed: false },
    qui: { open: '', close: '', closed: false },
    sex: { open: '', close: '', closed: false },
    sab: { open: '', close: '', closed: false },
    dom: { open: '', close: '', closed: false },
  });
  
  // Estado para novo bar
  const [newBar, setNewBar] = useState<Bar>({
    id: 0,
    name: '',
    location: '',
    description: '',
    rating: 4.5,
    image: '',
    additional_images: [],
    events: [],
    tags: [],
    eventName1: '',
    eventDate1: '',
    eventYoutubeUrl1: '',
    eventPhone1: '',
    eventName2: '',
    eventDate2: '',
    eventYoutubeUrl2: '',
    eventPhone2: '',
    eventName3: '',
    eventDate3: '',
    eventYoutubeUrl3: '',
    eventPhone3: '',
    eventName4: '',
    eventDate4: '',
    eventYoutubeUrl4: '',
    eventPhone4: '',
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

  // Adicionar novo estado para rastrear se o usuário navegou para fora da página
  const [leftAndReturned, setLeftAndReturned] = useState(false);

  // Adicionar um estado para controlar quando mostrar a mensagem pós-reload
  const [showSaveReminder, setShowSaveReminder] = useState(false);

  // Adicionar novo estado para rastrear as imagens
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<(File | null)[]>([null, null, null]);

  // Adicionar um efeito para verificar se a página foi recarregada devido ao aviso
  useEffect(() => {
    // Verificar se existe um flag no sessionStorage indicando que a página foi recarregada após aviso
    const needsToSave = sessionStorage.getItem('needsToSave');
    if (needsToSave === 'true') {
      // Mostrar o lembrete para salvar
      setShowSaveReminder(true);
      // Limpar o flag
      sessionStorage.removeItem('needsToSave');
      
      // Mostrar toast com mensagem e botão de salvamento
      toast({
        title: "Página atualizada",
        description: "Agora você pode continuar editando e salvar seu projeto",
        variant: "default",
        action: (
          <Button 
            onClick={() => DirectSubmitController.submitForm('add-bar-form')}
            variant="default"
            className="bg-nightlife-600 hover:bg-nightlife-700 text-white"
          >
            Salvar Agora
          </Button>
        ),
        duration: 10000, // 10 segundos para dar tempo de ler e usar o botão
      });
    }
  }, []);

  // Adicionar um evento para detectar quando o usuário volta à página
  useEffect(() => {
    // Função para detectar quando a página fica visível (usuário retorna)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Se estava escondida e agora está visível, o usuário voltou para a página
        setLeftAndReturned(true);
        console.log('Usuário voltou para a página. Sugerindo recarregar antes de salvar.');
      }
    };

    // Registrar o evento
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Limpar o evento ao desmontar
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Atualizar campos do novo bar
  const handleBarChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewBar(prev => ({
      ...prev,
      [name]: value
    }));
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

  // Manipular a mudança no checkbox de bar fechado para um dia específico
  const handleBarClosedChange = (dayKey: keyof HoursData, closed: boolean) => {
    // Criar uma nova cópia atualizada do estado para usar tanto na atualização do estado quanto na formatação
    const updatedHoursData = {
      ...hoursData,
      [dayKey]: {
        ...hoursData[dayKey],
        closed
      }
    };
    
    // Atualizar o estado com a nova cópia
    setHoursData(updatedHoursData);
    
    // Usar a mesma cópia para formatar e atualizar as horas
    const formattedHours = formatHoursForSave(updatedHoursData);
    setNewBar(prev => ({ ...prev, hours: formattedHours }));
  };
  
  // Obter o valor de hora para um campo específico
  const getHoursValue = (dayKey: keyof HoursData, field: 'open' | 'close'): string => {
    return hoursData[dayKey]?.[field] || '';
  };

  // Verificar se um bar está marcado como fechado em um determinado dia
  const isBarClosed = (dayKey: keyof HoursData): boolean => {
    return Boolean(hoursData[dayKey]?.closed);
  };

  // Função para fazer upload de imagem para o Supabase Storage
  const handleImageUpload = async (file: File, existingUrl?: string): Promise<string | null> => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      console.log("Iniciando upload de imagem:", file.name, file.type, file.size);
      
      // Mostrar progresso inicial
      setUploadProgress(10);
      
      // Fazer upload usando a função centralizada, passando a URL existente para substituição
      const bucketName = activeTab === 'bars' ? 'bar-images' : 'event-images';
      console.log(`Usando bucket: ${bucketName}`);
      const imageUrl = await uploadImage(file, bucketName, existingUrl);
      
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

  // Update the handleFileChange function to store file data
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEventImage: boolean = false, additionalImageIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const dataUrl = await readFileAsDataURL(file);
    
      if (isEventImage) {
      setEventImageFile(file); // Adicionar esta linha para salvar o arquivo
      setEventImagePreview(URL.createObjectURL(file));
      sessionStorage.setItem('eventImageDataUrl', dataUrl);
      } else if (additionalImageIndex !== undefined) {
      // Save the file for the additional image
      const newAdditionalFiles = [...additionalImageFiles];
      newAdditionalFiles[additionalImageIndex] = file;
      setAdditionalImageFiles(newAdditionalFiles);
      
      // Update the preview
      const objectUrl = URL.createObjectURL(file);
        setAdditionalImagePreviews(prev => {
          const newPreviews = [...prev];
        newPreviews[additionalImageIndex] = objectUrl;
          return newPreviews;
        });
      
      // Store the data URL in sessionStorage
      const additionalImageDataUrls = JSON.parse(sessionStorage.getItem('additionalImageDataUrls') || '[]');
      additionalImageDataUrls[additionalImageIndex] = dataUrl;
      sessionStorage.setItem('additionalImageDataUrls', JSON.stringify(additionalImageDataUrls));
      } else {
      // Save the main image file
      setMainImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      // Store the data URL in sessionStorage
      sessionStorage.setItem('mainImageDataUrl', dataUrl);
    }
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

  // Modificar a função reloadPage para adicionar o flag antes de recarregar
  const reloadPage = () => {
    // Definir um flag no sessionStorage para indicar que a página está sendo recarregada após um aviso
    sessionStorage.setItem('needsToSave', 'true');
    window.location.reload();
  };

  // Função para mostrar a notificação de atualização
  const showReloadNotification = () => {
    toast({
      title: "Atenção",
      description: "Atenção você navegou para outra página e retornou, agora você precisa atualizar esta página e salvar as alterações feitas.",
      variant: "destructive",
      action: (
        <Button 
          onClick={reloadPage} 
          variant="outline"
          className="border-white/20"
        >
          Atualizar Página
        </Button>
      ),
      // A notificação não vai fechar automaticamente
      duration: Infinity,
    });
  };

  // Adicionar ou atualizar bar
  const addOrUpdateBar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se o usuário navegou para fora e voltou, mostrar a notificação
    if (leftAndReturned) {
      showReloadNotification();
      // Opcional: resetar o estado para permitir tentar novamente
      setLeftAndReturned(false);
      return;
    }
    
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
      let processedTags: string[] = [];
      
      if (typeof newBar.tags === 'string') {
        // Se for string, dividir por vírgulas
        processedTags = (newBar.tags as string).split(',').map(tag => tag.trim()).filter(tag => tag.length > 0).slice(0, 4);
      } else if (Array.isArray(newBar.tags)) {
        // Se for array, apenas limitar a 4
        processedTags = newBar.tags.slice(0, 4);
      }
      
      if (processedTags.length > 4) {
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
            description: "Você só pode adicionar apenas um estabelecimento, edite o existente ou contate o administrador.",
            variant: "destructive"
          });
          return;
        }
      }
      
      let imageUrl = newBar.image;
      
      // Se houver um arquivo selecionado, fazer upload
      if (mainImageFile) {
        // Passar a URL existente para substituição se estiver em modo de edição
        const existingUrl = isEditMode ? newBar.image : undefined;
        console.log("Substituindo imagem existente:", existingUrl);
        
        const uploadedUrl = await handleImageUpload(mainImageFile, existingUrl);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      // Upload de imagens adicionais
      let additionalImages = Array.isArray(newBar.additional_images) ? [...newBar.additional_images] : [];
      
      for (let i = 0; i < 3; i++) {
        if (additionalImageFiles[i]) {
          // Passar a URL existente para substituição se estiver em modo de edição
          const existingUrl = isEditMode && i < additionalImages.length ? additionalImages[i] : undefined;
          console.log(`Substituindo imagem adicional ${i}:`, existingUrl);
          
          const uploadedUrl = await handleImageUpload(additionalImageFiles[i]!, existingUrl);
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
      const barData = {
        name: newBar.name,
        location: newBar.location,
        description: newBar.description,
        rating: newBar.rating,
        image: imageUrl || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b',
        additional_images: additionalImages,
        tags: processedTags,
        events: [
          { name: newBar.eventName1 || '', date: newBar.eventDate1 || '', youtube_url: newBar.eventYoutubeUrl1, phone: newBar.eventPhone1 },
          { name: newBar.eventName2 || '', date: newBar.eventDate2 || '', youtube_url: newBar.eventYoutubeUrl2, phone: newBar.eventPhone2 },
          { name: newBar.eventName3 || '', date: newBar.eventDate3 || '', youtube_url: newBar.eventYoutubeUrl3, phone: newBar.eventPhone3 },
          { name: newBar.eventName4 || '', date: newBar.eventDate4 || '', youtube_url: newBar.eventYoutubeUrl4, phone: newBar.eventPhone4 }
        ].filter(event => event.name && event.date),
        maps_url: newBar.maps_url,
        phone: newBar.phone,
        instagram: newBar.instagram,
        facebook: newBar.facebook,
        hours: formatHoursForSave(hoursData),
        discount_code: newBar.discount_code,
        discount_description: newBar.discount_description,
        user_id: user?.id
      };
      
      // Adicionar user_id ao criar novo bar (não ao editar)
      if (!isEditMode && user) {
        barData.user_id = user.id;
      }
      
      console.log('Enviando dados do bar:', barData);
      
      try {
      let result;
      
      if (isEditMode && currentBarId) {
        // Atualizar bar existente
        result = await supabase
          .from('bars')
          .update(barData)
          .eq('id', currentBarId)
          .select();
          
          if (result.error) {
            console.error("Erro ao atualizar bar:", result.error);
            throw result.error;
          }
        
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
          
          if (result.error) {
            console.error("Erro ao inserir bar:", result.error);
            throw result.error;
          }
        
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
        description: '',
          rating: 4.5, // Avaliação padrão 4.5
        image: '',
        additional_images: [],
          events: [],
          tags: [],
          maps_url: '',
        eventName1: '',
        eventDate1: '',
        eventYoutubeUrl1: '',
          eventPhone1: '',
        eventName2: '',
        eventDate2: '',
        eventYoutubeUrl2: '',
          eventPhone2: '',
        eventName3: '',
        eventDate3: '',
        eventYoutubeUrl3: '',
          eventPhone3: '',
        eventName4: '',
        eventDate4: '',
        eventYoutubeUrl4: '',
          eventPhone4: '',
        phone: '',
        instagram: '',
        facebook: '',
        hours: '',
        discount_code: '',
        discount_description: ''
      });
        
        // Limpar o localStorage após salvamento bem-sucedido
        localStorage.removeItem('newBar');
        localStorage.removeItem('isEditMode');
        localStorage.removeItem('currentBarId');
        localStorage.removeItem('imagePreview');
        localStorage.removeItem('additionalImagePreviews');
      
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
      } catch (supabaseError) {
        console.error("Erro do Supabase:", supabaseError);
        toast({
          title: "Erro ao salvar",
          description: "Ocorreu um erro ao salvar o bar no banco de dados. Por favor, tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao salvar bar:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar os dados. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
    
    // Clear the sessionStorage only after successful submission
    sessionStorage.removeItem('imagePreview');
    sessionStorage.removeItem('eventImagePreview');
    sessionStorage.removeItem('additionalImagePreviews');
    sessionStorage.removeItem('currentBarData');
    sessionStorage.removeItem('imageStateSaved');
  };

  // Adicionar novo evento
  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se o usuário navegou para fora e voltou, mostrar a notificação
    if (leftAndReturned) {
      showReloadNotification();
      // Opcional: resetar o estado para permitir tentar novamente
      setLeftAndReturned(false);
      return;
    }
    
    try {
      let imageUrl = newEvent.image || '';
      
      if (eventImageFile) {
        // Passar a URL existente para substituição se estiver editando um evento existente
        const existingUrl = newEvent.id ? newEvent.image : undefined;
        console.log("Substituindo imagem do evento:", existingUrl);
        
        const uploadedUrl = await handleImageUpload(eventImageFile, existingUrl);
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
      setEventImageFile(null);
      if (eventFileInputRef.current) eventFileInputRef.current.value = '';
      
      // Atualizar a lista de eventos
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.refetchQueries({ queryKey: ['events'] });
      
      // Aguardar um pouco e fazer uma segunda tentativa de atualizar a lista
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.refetchQueries({ queryKey: ['events'] });
      }, 1000);
      
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
    setNewBar({
      id: bar.id,
      name: bar.name,
      location: bar.location,
      description: bar.description,
      rating: bar.rating,
      image: bar.image,
      additional_images: bar.additional_images || [],
      tags: bar.tags,
      maps_url: bar.maps_url || '',
      phone: bar.phone || '',
      instagram: bar.instagram || '',
      facebook: bar.facebook || '',
      hours: bar.hours || '',
      discount_code: bar.discount_code || '',
      discount_description: bar.discount_description || '',
      events: bar.events || [],
      eventName1: bar.events[0]?.name || '',
      eventDate1: bar.events[0]?.date || '',
      eventYoutubeUrl1: bar.events[0]?.youtube_url || '',
      eventPhone1: bar.events[0]?.phone || '',
      eventName2: bar.events[1]?.name || '',
      eventDate2: bar.events[1]?.date || '',
      eventYoutubeUrl2: bar.events[1]?.youtube_url || '',
      eventPhone2: bar.events[1]?.phone || '',
      eventName3: bar.events[2]?.name || '',
      eventDate3: bar.events[2]?.date || '',
      eventYoutubeUrl3: bar.events[2]?.youtube_url || '',
      eventPhone3: bar.events[2]?.phone || '',
      eventName4: bar.events[3]?.name || '',
      eventDate4: bar.events[3]?.date || '',
      eventYoutubeUrl4: bar.events[3]?.youtube_url || '',
      eventPhone4: bar.events[3]?.phone || ''
    });
    setCurrentBarId(bar.id);
    setIsEditMode(true);
  };

  // Cancelar edição
  const cancelEdit = () => {
    setNewBar({
      id: 0,
      name: '',
      location: '',
      description: '',
      rating: 4.5,
      image: '',
      additional_images: [],
      events: [],
      tags: [],
      maps_url: '',
      eventName1: '',
      eventDate1: '',
      eventYoutubeUrl1: '',
      eventPhone1: '',
      eventName2: '',
      eventDate2: '',
      eventYoutubeUrl2: '',
      eventPhone2: '',
      eventName3: '',
      eventDate3: '',
      eventYoutubeUrl3: '',
      eventPhone3: '',
      eventName4: '',
      eventDate4: '',
      eventYoutubeUrl4: '',
      eventPhone4: '',
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
      console.log("Iniciando exclusão do bar ID:", currentBarId);
      setDeleteDialogOpen(false); // Fechar o diálogo imediatamente
      
      toast({
        title: "Processando exclusão",
        description: "Excluindo o bar e seus dados relacionados...",
      });
      
      // Primeira etapa: Limpar dependências para evitar problemas de chave estrangeira
      
      // 1. Excluir todas as estatísticas do bar
      await supabase
        .from('bar_views')
        .delete()
        .eq('bar_id', currentBarId)
        .then(({ error }) => {
          if (error) console.warn("Aviso ao excluir estatísticas:", error.message);
        });
      
      // 2. Excluir todos os eventos relacionados ao bar
      await supabase
        .from('events')
        .delete()
        .eq('bar_id', currentBarId)
        .then(({ error }) => {
          if (error) console.warn("Aviso ao excluir eventos:", error.message);
        });
        
      // Aguardar um momento para ter certeza que todas as exclusões de dependências foram processadas
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Segunda etapa: Obter dados do bar para limpar imagens
      const { data: barData } = await supabase
        .from('bars')
        .select('*')
        .eq('id', currentBarId)
        .single();
        
      // Terceira etapa: Excluir o bar
      const { error: deleteError } = await supabase
        .from('bars')
        .delete()
        .eq('id', currentBarId);
      
      if (deleteError) {
        console.error("Erro ao excluir bar:", deleteError);
        
        // Se falhar, tentar com uma abordagem alternativa usando rpc (function no Supabase)
        const { error: rpcError } = await supabase.rpc('force_delete_bar', { target_id: currentBarId });
        
        if (rpcError) {
          throw new Error(`Não foi possível excluir o bar: ${deleteError.message}`);
        }
      }
      
      // Quarta etapa: Limpar recursos (imagens) após a exclusão do bar
      if (barData) {
        // Excluir a imagem principal do storage
        if (barData.image) {
          await deleteImage(barData.image).catch(err => {
            console.warn("Aviso ao excluir imagem principal:", err.message);
          });
        }
        
        // Excluir imagens adicionais do storage
        if (barData.additional_images && barData.additional_images.length > 0) {
          for (const imgUrl of barData.additional_images) {
            if (imgUrl) {
              await deleteImage(imgUrl).catch(err => {
                console.warn("Aviso ao excluir imagem adicional:", err.message);
              });
            }
          }
        }
      }
      
      // Invalidar as consultas para forçar recarregamento dos dados
      queryClient.invalidateQueries({ queryKey: ['bars'] });
      
      toast({
        title: "Bar excluído",
        description: "O bar e seus dados relacionados foram removidos com sucesso.",
      });
      
      // Forçar atualização da interface
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error("Erro ao excluir bar:", error);
      toast({
        title: "Erro na exclusão",
        description: error instanceof Error ? error.message : "Falha ao excluir o bar. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setCurrentBarId(null);
    }
  };

  // Atualizar hoursData quando newBar.hours mudar (para edição de bar)
  useEffect(() => {
    if (newBar.hours) {
      const parsedHours = parseHoursText(newBar.hours);
      setHoursData(prev => ({
        seg: { 
          open: parsedHours.seg?.open || prev.seg.open, 
          close: parsedHours.seg?.close || prev.seg.close, 
          closed: parsedHours.seg?.closed || false 
        },
        ter: { 
          open: parsedHours.ter?.open || prev.ter.open, 
          close: parsedHours.ter?.close || prev.ter.close, 
          closed: parsedHours.ter?.closed || false 
        },
        qua: { 
          open: parsedHours.qua?.open || prev.qua.open, 
          close: parsedHours.qua?.close || prev.qua.close, 
          closed: parsedHours.qua?.closed || false 
        },
        qui: { 
          open: parsedHours.qui?.open || prev.qui.open, 
          close: parsedHours.qui?.close || prev.qui.close, 
          closed: parsedHours.qui?.closed || false 
        },
        sex: { 
          open: parsedHours.sex?.open || prev.sex.open, 
          close: parsedHours.sex?.close || prev.sex.close, 
          closed: parsedHours.sex?.closed || false 
        },
        sab: { 
          open: parsedHours.sab?.open || prev.sab.open, 
          close: parsedHours.sab?.close || prev.sab.close, 
          closed: parsedHours.sab?.closed || false 
        },
        dom: { 
          open: parsedHours.dom?.open || prev.dom.open, 
          close: parsedHours.dom?.close || prev.dom.close, 
          closed: parsedHours.dom?.closed || false 
        },
      }));
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
    setEventImageFile(null); // Ensure this line is present
    setEventImagePreview('');
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
    setIsEditMode(false);
  };

  // Excluir evento
  const deleteEvent = async (eventId: string) => {
    try {
      // Primeiro, obter o evento para conseguir a URL da imagem
      const { data: eventData, error: fetchError } = await supabase
        .from('events')
        .select('image')
        .eq('id', eventId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Excluir a imagem do storage
      if (eventData?.image) {
        await deleteImage(eventData.image).catch(err => {
          console.error("Erro ao excluir imagem do evento:", err);
          // Não interromper o processo de exclusão do evento se a imagem falhar
        });
      }
      
      // Agora excluir o evento
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
    // Se estiver em modo de edição e a imagem adicional existir, excluir do storage
    if (isEditMode && newBar.additional_images && newBar.additional_images[index]) {
      // Excluir a imagem do Supabase Storage
      deleteImage(newBar.additional_images[index])
        .then(success => {
          if (success) {
            toast({
              title: "Imagem excluída",
              description: "A imagem foi removida do servidor com sucesso."
            });
          } else {
            toast({
              title: "Aviso",
              description: "A imagem foi removida do formulário, mas pode continuar no servidor.",
              variant: "destructive"
            });
          }
        })
        .catch(error => {
          console.error("Erro ao excluir imagem adicional do servidor:", error);
          toast({
            title: "Erro",
            description: "Ocorreu um erro ao tentar excluir a imagem do servidor.",
            variant: "destructive"
          });
        });
    }
    
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
    const newPreviews = [...additionalImagePreviews];
      newPreviews[index] = null;
    setAdditionalImagePreviews(newPreviews);
    
    // Limpar o arquivo
    const newAdditionalFiles = [...additionalImageFiles];
    newAdditionalFiles[index] = null;
    setAdditionalImageFiles(newAdditionalFiles);
    
    // Limpar o input de arquivo
    if (additionalFileInputRefs.current[index]) {
      additionalFileInputRefs.current[index]!.value = '';
    }
    
    // Atualizar previews armazenados
    try {
      sessionStorage.setItem('additionalImagePreviews', JSON.stringify(newPreviews));
    } catch (error) {
      console.error('Erro ao atualizar previews no sessionStorage:', error);
    }
    
    toast({
      title: "Imagem removida",
      description: `A imagem adicional foi removida com sucesso.`
    });
  };

  // Função para remover a imagem principal
  const removeMainImage = () => {
    // Se estiver em modo de edição e tiver uma URL de imagem, excluir do storage
    if (isEditMode && newBar.image) {
      // Excluir a imagem do Supabase Storage
      deleteImage(newBar.image)
        .then(success => {
          if (success) {
            toast({
              title: "Imagem excluída",
              description: "A imagem foi removida do servidor com sucesso."
            });
          } else {
            toast({
              title: "Aviso",
              description: "A imagem foi removida do formulário, mas pode continuar no servidor.",
              variant: "destructive"
            });
          }
        })
        .catch(error => {
          console.error("Erro ao excluir imagem do servidor:", error);
          toast({
            title: "Erro",
            description: "Ocorreu um erro ao tentar excluir a imagem do servidor.",
            variant: "destructive"
          });
        });
    }
    
    setNewBar({
      ...newBar,
      image: ''
    });
    setImagePreview(null);
    setMainImageFile(null);
    
    // Limpar o input de arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Remover preview armazenado
    sessionStorage.removeItem('imagePreview');
    
    toast({
      title: "Imagem removida",
      description: "A imagem principal foi removida com sucesso."
    });
  };

  // Função para remover a imagem do evento
  const removeEventImage = () => {
    // Se estiver editando um evento e houver uma imagem, excluir do storage
    if (newEvent.id && newEvent.image) {
      // Excluir a imagem do Supabase Storage
      deleteImage(newEvent.image)
        .then(success => {
          if (success) {
            toast({
              title: "Imagem excluída",
              description: "A imagem do evento foi removida do servidor com sucesso."
            });
          } else {
            toast({
              title: "Aviso",
              description: "A imagem foi removida do formulário, mas pode continuar no servidor.",
              variant: "destructive"
            });
          }
        })
        .catch(error => {
          console.error("Erro ao excluir imagem do evento do servidor:", error);
          toast({
            title: "Erro",
            description: "Ocorreu um erro ao tentar excluir a imagem do servidor.",
            variant: "destructive"
          });
        });
    }
    
    setNewEvent({
      ...newEvent,
      image: ''
    });
    setEventImagePreview(null);
    setEventImageFile(null);
    
    // Limpar o input de arquivo
    if (eventFileInputRef.current) {
      eventFileInputRef.current.value = '';
    }
    
    // Remover preview armazenado
    sessionStorage.removeItem('eventImagePreview');
    
    toast({
      title: "Imagem removida",
      description: "A imagem do evento foi removida com sucesso."
    });
  };

  // Função para lidar especificamente com mudanças no campo phone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    console.log(`Mudança no telefone: ${value}`);
    setNewBar(prev => ({
      ...prev,
      phone: value
    }));
  };

  // Corrigir a função handleTagsChange para manter o valor como está no input
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Armazenar o valor como string no estado
    setNewBar(prev => ({
      ...prev,
      tags: value
    }));
  };

  const handleRatingChange = (value: number) => {
    setNewBar(prev => ({
      ...prev,
      rating: value
    }));
  };

  // Efeito para carregar dados do localStorage com uma abordagem mais robusta
  useEffect(() => {
    // Load saved state from local storage on component mount
    try {
      const savedBar = localStorage.getItem('newBar');
      const savedEvent = localStorage.getItem('newEvent');
      const savedHoursData = localStorage.getItem('hoursData');
      const savedIsEditMode = localStorage.getItem('isEditMode');
      const savedCurrentBarId = localStorage.getItem('currentBarId');
      const savedImagePreview = localStorage.getItem('imagePreview');
      const savedEventImagePreview = localStorage.getItem('eventImagePreview');
      const savedAdditionalImagePreviews = localStorage.getItem('additionalImagePreviews');

      console.log('Loaded from localStorage:', { 
        savedBar, 
        savedEvent, 
        savedHoursData, 
        savedIsEditMode,
        savedCurrentBarId,
        savedImagePreview,
        savedEventImagePreview,
        savedAdditionalImagePreviews
      });

      if (savedBar) {
        const parsedBar = JSON.parse(savedBar);
        // Garantir que phone e outras propriedades existam
        if (parsedBar) {
          setNewBar({
            ...parsedBar,
            phone: parsedBar.phone || '',
            // Garantir que rating seja 4.5 se não existir
            rating: parsedBar.rating ?? 4.5
          });
        }
      }
      
      if (savedEvent) setNewEvent(JSON.parse(savedEvent));
      if (savedHoursData) setHoursData(JSON.parse(savedHoursData));
      if (savedIsEditMode) setIsEditMode(JSON.parse(savedIsEditMode));
      if (savedCurrentBarId) setCurrentBarId(JSON.parse(savedCurrentBarId));
      if (savedImagePreview) setImagePreview(JSON.parse(savedImagePreview));
      if (savedEventImagePreview) setEventImagePreview(JSON.parse(savedEventImagePreview));
      if (savedAdditionalImagePreviews) setAdditionalImagePreviews(JSON.parse(savedAdditionalImagePreviews));
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
      // Em caso de erro, limpar localStorage para evitar problemas futuros
      localStorage.removeItem('newBar');
      localStorage.removeItem('newEvent');
      localStorage.removeItem('hoursData');
      localStorage.removeItem('isEditMode');
      localStorage.removeItem('currentBarId');
      localStorage.removeItem('imagePreview');
      localStorage.removeItem('eventImagePreview');
      localStorage.removeItem('additionalImagePreviews');
    }
  }, []);

  // Efeito para salvar dados no localStorage quando mudam
  useEffect(() => {
    // Save state to local storage whenever it changes
    try {
      console.log('Saving to localStorage:', { 
        newBar, 
        newEvent, 
        hoursData, 
        isEditMode, 
        currentBarId,
        imagePreview,
        eventImagePreview,
        additionalImagePreviews
      });
      
      localStorage.setItem('newBar', JSON.stringify(newBar));
      localStorage.setItem('newEvent', JSON.stringify(newEvent));
      localStorage.setItem('hoursData', JSON.stringify(hoursData));
      localStorage.setItem('isEditMode', JSON.stringify(isEditMode));
      localStorage.setItem('currentBarId', JSON.stringify(currentBarId));
      localStorage.setItem('imagePreview', JSON.stringify(imagePreview));
      localStorage.setItem('eventImagePreview', JSON.stringify(eventImagePreview));
      localStorage.setItem('additionalImagePreviews', JSON.stringify(additionalImagePreviews));
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error);
    }
  }, [
    newBar, 
    newEvent, 
    hoursData, 
    isEditMode, 
    currentBarId, 
    imagePreview, 
    eventImagePreview, 
    additionalImagePreviews
  ]);

  // Efeito para salvar os estados das imagens quando o usuário sair da página
  useEffect(() => {
    // Função para serializar e salvar imagens no sessionStorage quando o usuário sair da página
    const handleBeforeUnload = () => {
      try {
        // Save image previews in sessionStorage
        if (imagePreview) {
          sessionStorage.setItem('imagePreview', imagePreview);
        }
        if (eventImagePreview) {
          sessionStorage.setItem('eventImagePreview', eventImagePreview);
        }
        
        // Save additional image previews
        sessionStorage.setItem('additionalImagePreviews', JSON.stringify(additionalImagePreviews));
        
        // Also save the current bar data to ensure it's not lost
        sessionStorage.setItem('currentBarData', JSON.stringify(newBar));
        
        // Track that we've saved the state before unload
        sessionStorage.setItem('imageStateSaved', 'true');
      } catch (error) {
        console.error('Erro ao salvar previews de imagem no sessionStorage:', error);
      }
    };

    // Registrar evento para detectar quando o usuário está prestes a sair da página
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Limpar o evento ao desmontar
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [imagePreview, eventImagePreview, additionalImagePreviews, newBar]);

  // Efeito para recuperar os estados das imagens quando o usuário voltar à página
  useEffect(() => {
    // Verificar se existe um flag indicando que o usuário navegou para fora e voltou
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if user has navigated away and back
        const imageStateSaved = sessionStorage.getItem('imageStateSaved');
        
        if (imageStateSaved === 'true') {
          try {
            const savedImagePreview = sessionStorage.getItem('imagePreview');
            const savedEventImagePreview = sessionStorage.getItem('eventImagePreview');
            const savedAdditionalImagePreviews = sessionStorage.getItem('additionalImagePreviews');
            const savedBarData = sessionStorage.getItem('currentBarData');
            
            // Restore image previews
            if (savedImagePreview) {
              setImagePreview(savedImagePreview);
            }
            if (savedEventImagePreview) {
              setEventImagePreview(savedEventImagePreview);
            }
            if (savedAdditionalImagePreviews) {
              setAdditionalImagePreviews(JSON.parse(savedAdditionalImagePreviews));
            }
            
            // Restore bar data if available
            if (savedBarData) {
              const parsedBarData = JSON.parse(savedBarData);
              // Only update if we have valid data
              if (parsedBarData && parsedBarData.name) {
                setNewBar(parsedBarData);
              }
            }
            
            // Reconstruct File objects from data URLs
            const mainImageDataUrl = sessionStorage.getItem('mainImageDataUrl');
            if (mainImageDataUrl) {
              const file = reconstructFileFromDataUrl(mainImageDataUrl, 'main-image.jpg');
              if (file) {
                setMainImageFile(file);
              }
            }
            
            const eventImageDataUrl = sessionStorage.getItem('eventImageDataUrl');
            if (eventImageDataUrl) {
              const file = reconstructFileFromDataUrl(eventImageDataUrl, 'event-image.jpg');
              // We don't store event image file in state, so just update the input if needed
              if (file && eventFileInputRef.current) {
                // Cannot directly set File to input element, but will be uploaded on form submit
              }
            }
            
            // Reconstruct additional image files
            const additionalImageDataUrls = JSON.parse(sessionStorage.getItem('additionalImageDataUrls') || '[]');
            if (additionalImageDataUrls && additionalImageDataUrls.length > 0) {
              const newFiles: (File | null)[] = [...additionalImageFiles];
              
              additionalImageDataUrls.forEach((dataUrl: string, index: number) => {
                if (dataUrl) {
                  const file = reconstructFileFromDataUrl(dataUrl, `additional-image-${index}.jpg`);
                  if (file) {
                    newFiles[index] = file;
                  }
                }
              });
              
              setAdditionalImageFiles(newFiles);
            }
          } catch (error) {
            console.error('Erro ao recuperar estado de imagens do sessionStorage:', error);
          }
        }
      }
    };
    
    // Registrar o evento de mudança de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Executar uma vez para verificar se há dados ao montar o componente
    handleVisibilityChange();
    
    // Limpar o evento ao desmontar
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Limpar o formulário e o estado
  const clearBarForm = () => {
    setNewBar({
      id: 0,
      name: '',
      location: '',
      description: '',
      rating: 0,
      image: '',
      additional_images: [],
      tags: '',
      maps_url: '',
      phone: '',
      instagram: '',
      facebook: '',
      hours: '',
      discount_code: '',
      discount_description: '',
      events: [],
      eventName1: '',
      eventDate1: '',
      eventYoutubeUrl1: '',
      eventPhone1: '',
      eventName2: '',
      eventDate2: '',
      eventYoutubeUrl2: '',
      eventPhone2: '',
      eventName3: '',
      eventDate3: '',
      eventYoutubeUrl3: '',
      eventPhone3: '',
      eventName4: '',
      eventDate4: '',
      eventYoutubeUrl4: '',
      eventPhone4: ''
    });
    
    // Limpar previews de imagem
    setImagePreview(null);
    setAdditionalImagePreviews([null, null, null]);
    
    // Limpar arquivos de imagem
    setMainImageFile(null);
    setAdditionalImageFiles([null, null, null]);
    
    // Limpar inputs de arquivo
    if (fileInputRef.current) fileInputRef.current.value = '';
    additionalFileInputRefs.current.forEach(ref => {
      if (ref) ref.value = '';
    });
    
    // Clear all related sessionStorage
    sessionStorage.removeItem('imagePreview');
    sessionStorage.removeItem('eventImagePreview');
    sessionStorage.removeItem('additionalImagePreviews');
    sessionStorage.removeItem('currentBarData');
    sessionStorage.removeItem('imageStateSaved');
    sessionStorage.removeItem('mainImageDataUrl');
    sessionStorage.removeItem('eventImageDataUrl');
    sessionStorage.removeItem('additionalImageDataUrls');
  };

  // Add a function to reconstruct File objects from data URLs
  const reconstructFileFromDataUrl = (dataUrl: string, fileName: string = 'image.jpg', fileType: string = 'image/jpeg'): File | null => {
    try {
      // Extract the base64 data from the Data URL
      const base64String = dataUrl.split(',')[1];
      if (!base64String) return null;
      
      // Convert base64 to binary
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create Blob and then File from binary data
      const blob = new Blob([bytes], { type: fileType });
      return new File([blob], fileName, { type: fileType });
    } catch (error) {
      console.error('Error reconstructing file from data URL:', error);
      return null;
    }
  };

  // Funções para gerenciamento de usuários
  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!newUser.email || !newUser.name) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha o email e nome do usuário.",
          variant: "destructive"
        });
        return;
      }
      
      // Gerando uma senha temporária
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Criar usuário na autenticação
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: tempPassword,
        email_confirm: true
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Garantir que não seja possível criar um super_admin
        const userRole = newUser.role === 'super_admin' ? 'client' : newUser.role || 'user';
        
        // Criar perfil do usuário
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: newUser.email,
            name: newUser.name,
            phone: newUser.phone || null,
            role: userRole,
            approved: newUser.approved || false
          });
          
        if (profileError) throw profileError;
        
        toast({
          title: "Usuário criado",
          description: `Usuário ${newUser.email} criado com sucesso. Senha temporária: ${tempPassword}`,
          variant: "default"
        });
        
        // Limpar formulário e fechar diálogo
        setNewUser({
          email: '',
          name: '',
          phone: '',
          role: 'user',
          approved: false
        });
        setUserDialogOpen(false);
        
        // Recarregar lista de usuários
        queryClient.invalidateQueries({ queryKey: ['users'] });
      }
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro ao criar o usuário",
        variant: "destructive"
      });
    }
  };
  
  const updateUserStatus = async (userId: string, approved: boolean) => {
    try {
      // Buscar informações do usuário para incluir na mensagem
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', userId)
        .single();
        
      if (userError) throw userError;
      
      // Atualizar o status
      const { error } = await supabase
        .from('users')
        .update({ approved })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Mostrar mensagem com nome do usuário
      toast({
        title: approved ? "Usuário aprovado" : "Usuário bloqueado",
        description: approved 
          ? `O usuário ${userData.name} (${userData.email}) agora tem acesso ao sistema` 
          : `O acesso do usuário ${userData.name} (${userData.email}) foi bloqueado`,
        variant: "default"
      });
      
      // Recarregar lista de usuários
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      console.error('Erro ao atualizar status do usuário:', error);
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Ocorreu um erro ao atualizar o status do usuário",
        variant: "destructive"
      });
    }
  };
  
  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      // Garantir que não seja possível promover para super_admin
      if (role === 'super_admin') {
        toast({
          title: "Operação não permitida",
          description: "Não é possível promover usuários para Super Admin através desta interface.",
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);
        
      if (error) throw error;
      
      toast({
        title: "Função atualizada",
        description: `A função do usuário foi alterada para ${role}`,
        variant: "default"
      });
      
      // Recarregar lista de usuários
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      console.error('Erro ao atualizar função do usuário:', error);
      toast({
        title: "Erro ao atualizar função",
        description: error.message || "Ocorreu um erro ao atualizar a função do usuário",
        variant: "destructive"
      });
    }
  };
  
  const startDeleteUser = (userId: string) => {
    setCurrentUserId(userId);
    setDeleteUserDialogOpen(true);
  };
  
  const confirmDeleteUser = async () => {
    if (!currentUserId) return;
    
    try {
      // Primeiro, buscar o usuário para obter o email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', currentUserId)
        .single();
        
      if (userError) throw userError;
      
      // Excluir o usuário da tabela users
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', currentUserId);
        
      if (deleteError) throw deleteError;
      
      // Excluir o usuário da autenticação do Supabase
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(currentUserId);
      
      if (authDeleteError) throw authDeleteError;
      
      toast({
        title: "Usuário excluído",
        description: `O usuário ${userData.email} foi excluído com sucesso.`,
        variant: "default"
      });
      
      // Limpar estado e fechar diálogo
      setCurrentUserId(null);
      setDeleteUserDialogOpen(false);
      
      // Recarregar lista de usuários
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Ocorreu um erro ao excluir o usuário",
        variant: "destructive"
      });
    }
  };
  
  const startResetPassword = (email: string) => {
    setResetPasswordEmail(email);
    setResetPasswordDialogOpen(true);
  };
  
  const confirmResetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetPasswordEmail);
      
      if (error) throw error;
      
      toast({
        title: "Email de redefinição enviado",
        description: `Um email para redefinição de senha foi enviado para ${resetPasswordEmail}`,
        variant: "default"
      });
      
      // Fechar diálogo
      setResetPasswordDialogOpen(false);
      setResetPasswordEmail('');
    } catch (error: any) {
      console.error('Erro ao enviar email de redefinição:', error);
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Ocorreu um erro ao enviar o email de redefinição",
        variant: "destructive"
      });
    }
  };

  const startStatusChange = (userId: string, newStatus: boolean) => {
    setPendingStatusChange({ userId, status: newStatus });
    setStatusChangeDialogOpen(true);
  };
  
  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    
    await updateUserStatus(pendingStatusChange.userId, pendingStatusChange.status);
    
    // Limpar estado e fechar diálogo
    setPendingStatusChange(null);
    setStatusChangeDialogOpen(false);
  };

  // Função para limpar imagens não utilizadas
  const handleCleanupUnusedImages = async () => {
    try {
      setIsUploading(true);
      
      // Limpar imagens não utilizadas dos bares
      const barImagesResult = await cleanupUnusedImages('bar-images');
      
      // Limpar imagens não utilizadas dos eventos
      const eventImagesResult = await cleanupUnusedImages('event-images');
      
      if (barImagesResult || eventImagesResult) {
        toast({
          title: "Limpeza concluída",
          description: "As imagens não utilizadas foram removidas com sucesso."
        });
      } else {
        toast({
          title: "Aviso",
          description: "Ocorreu um erro durante a limpeza de algumas imagens.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao limpar imagens:", error);
      toast({
        title: "Erro",
        description: "Não foi possível limpar as imagens não utilizadas.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-8">Painel de Administração</h1>
        
        {/* Link para estatísticas de visualização */}
        <div className="mb-8">
          <Link to="/bar-stats" className="inline-flex items-center gap-2 text-nightlife-400 hover:text-nightlife-300 transition-colors">
            <Eye className="h-5 w-5" />
            <span>Ver Estatísticas de Visualização</span>
          </Link>
        </div>
        
        {/* Componente para compartilhar link de cadastro (apenas para super_admin) */}
        {isSuperAdmin && (
          <div className="mb-8">
            <ShareRegistrationLink />
          </div>
        )}
        
        <div className="space-y-6">
          {/* Card de gerenciamento de usuários (apenas super admin) */}
          {isSuperAdmin && (
            <Card className="bg-nightlife-900 border-white/10">
              <CardHeader className="cursor-pointer" onClick={() => setUserManagementExpanded(!userManagementExpanded)}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Gerenciamento de Usuários Regulares
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    {userManagementExpanded ? 'Recolher' : 'Expandir'}
                  </Button>
                </div>
                <CardDescription>
                  Gerencie usuários regulares e proprietários. Administradores não são exibidos nesta lista.
                </CardDescription>
              </CardHeader>
              
              <Collapsible open={userManagementExpanded} onOpenChange={setUserManagementExpanded}>
                <CollapsibleContent>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Usuários ({users?.length || 0})</h3>
                      <Button 
                        size="sm"
                        onClick={() => setUserDialogOpen(true)}
                        className="bg-nightlife-600 hover:bg-nightlife-700"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Novo Usuário
                      </Button>
                    </div>
                    
                    <div className="overflow-auto max-h-[600px]">
                      <div className="space-y-2">
                        {users?.map(user => (
                          <div key={user.id} className="p-3 bg-nightlife-800/70 rounded-md">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{user.name}</h4>
                                <p className="text-sm text-white/70">{user.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    user.role === 'super_admin' 
                                      ? 'bg-purple-600/30 text-purple-400' 
                                      : user.role === 'client' 
                                        ? 'bg-blue-600/30 text-blue-400'
                                        : 'bg-green-600/30 text-green-400'
                                  }`}>
                                    {user.role === 'super_admin' 
                                      ? 'Super Admin' 
                                      : user.role === 'client' 
                                        ? 'Proprietário' 
                                        : 'Usuário'}
                                  </span>
                                  
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    user.approved
                                      ? 'bg-emerald-600/30 text-emerald-400'
                                      : 'bg-rose-600/30 text-rose-400'
                                  }`}>
                                    {user.approved ? 'Aprovado' : 'Bloqueado'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => startStatusChange(user.id, !user.approved)}
                                  title={user.approved ? "Bloquear usuário" : "Aprovar usuário"}
                                >
                                  {user.approved ? <UserX className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => startResetPassword(user.email)}
                                  title="Resetar senha"
                                >
                                  <Lock className="h-4 w-4" />
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => startDeleteUser(user.id)}
                                  className="text-red-500 hover:text-red-400"
                                  title="Excluir usuário"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {users?.length === 0 && (
                          <div className="py-4 text-center text-white/50">
                            Nenhum usuário encontrado
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}
          
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
            <Card id="edit-bar-card" className="bg-nightlife-900 border-white/10">
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
              <form id="add-bar-form" onSubmit={addOrUpdateBar} className="space-y-4 max-w-full">
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
                          value={newBar.phone || ''}
                          onChange={handlePhoneChange}
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
                        <div className="flex flex-row justify-between sm:justify-start items-center w-full">
                          <div className="whitespace-nowrap text-sm min-w-[120px]">
                            <label className={`${getCurrentDayHour().includes('Segunda') ? 'text-blue-400 font-medium' : ''}`}>
                              Segunda-feira
                            </label>
                          </div>
                          <div className="flex items-center gap-1 ml-auto sm:ml-8">
                            <Checkbox 
                              id="seg-closed"
                              checked={isBarClosed('seg')}
                              onCheckedChange={(checked) => handleBarClosedChange('seg', checked === true)}
                              className="border-white/30 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                            />
                            <label htmlFor="seg-closed" className="text-xs text-white/70 cursor-pointer">Fechado</label>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center mx-auto sm:mx-0">
                            <Input 
                              type="time"
                              placeholder="Abertura"
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Segunda') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('seg', 'open', e.target.value)}
                              value={getHoursValue('seg', 'open')}
                              disabled={isBarClosed('seg')}
                            />
                            <span className="text-white/50">-</span>
                            <Input 
                              type="time"
                              placeholder="Fechamento" 
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Segunda') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('seg', 'close', e.target.value)}
                              value={getHoursValue('seg', 'close')}
                              disabled={isBarClosed('seg')}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Terça */}
                      <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex flex-row justify-between sm:justify-start items-center w-full">
                          <div className="whitespace-nowrap text-sm min-w-[120px]">
                            <label className={`${getCurrentDayHour().includes('Terça') ? 'text-blue-400 font-medium' : ''}`}>
                              Terça-feira
                            </label>
                          </div>
                          <div className="flex items-center gap-1 ml-auto sm:ml-8">
                            <Checkbox 
                              id="ter-closed"
                              checked={isBarClosed('ter')}
                              onCheckedChange={(checked) => handleBarClosedChange('ter', checked === true)}
                              className="border-white/30 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                            />
                            <label htmlFor="ter-closed" className="text-xs text-white/70 cursor-pointer">Fechado</label>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center mx-auto sm:mx-0">
                            <Input 
                              type="time"
                              placeholder="Abertura"
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Terça') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('ter', 'open', e.target.value)}
                              value={getHoursValue('ter', 'open')}
                              disabled={isBarClosed('ter')}
                            />
                            <span className="text-white/50">-</span>
                            <Input 
                              type="time"
                              placeholder="Fechamento" 
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Terça') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('ter', 'close', e.target.value)}
                              value={getHoursValue('ter', 'close')}
                              disabled={isBarClosed('ter')}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Quarta */}
                      <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex flex-row justify-between sm:justify-start items-center w-full">
                          <div className="whitespace-nowrap text-sm min-w-[120px]">
                            <label className={`${getCurrentDayHour().includes('Quarta') ? 'text-blue-400 font-medium' : ''}`}>
                              Quarta-feira
                            </label>
                          </div>
                          <div className="flex items-center gap-1 ml-auto sm:ml-8">
                            <Checkbox 
                              id="qua-closed"
                              checked={isBarClosed('qua')}
                              onCheckedChange={(checked) => handleBarClosedChange('qua', checked === true)}
                              className="border-white/30 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                            />
                            <label htmlFor="qua-closed" className="text-xs text-white/70 cursor-pointer">Fechado</label>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center mx-auto sm:mx-0">
                            <Input 
                              type="time"
                              placeholder="Abertura"
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Quarta') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('qua', 'open', e.target.value)}
                              value={getHoursValue('qua', 'open')}
                              disabled={isBarClosed('qua')}
                            />
                            <span className="text-white/50">-</span>
                            <Input 
                              type="time"
                              placeholder="Fechamento" 
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Quarta') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('qua', 'close', e.target.value)}
                              value={getHoursValue('qua', 'close')}
                              disabled={isBarClosed('qua')}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Quinta */}
                      <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex flex-row justify-between sm:justify-start items-center w-full">
                          <div className="whitespace-nowrap text-sm min-w-[120px]">
                            <label className={`${getCurrentDayHour().includes('Quinta') ? 'text-blue-400 font-medium' : ''}`}>
                              Quinta-feira
                            </label>
                          </div>
                          <div className="flex items-center gap-1 ml-auto sm:ml-8">
                            <Checkbox 
                              id="qui-closed"
                              checked={isBarClosed('qui')}
                              onCheckedChange={(checked) => handleBarClosedChange('qui', checked === true)}
                              className="border-white/30 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                            />
                            <label htmlFor="qui-closed" className="text-xs text-white/70 cursor-pointer">Fechado</label>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center mx-auto sm:mx-0">
                            <Input 
                              type="time"
                              placeholder="Abertura"
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Quinta') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('qui', 'open', e.target.value)}
                              value={getHoursValue('qui', 'open')}
                              disabled={isBarClosed('qui')}
                            />
                            <span className="text-white/50">-</span>
                            <Input 
                              type="time"
                              placeholder="Fechamento" 
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Quinta') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('qui', 'close', e.target.value)}
                              value={getHoursValue('qui', 'close')}
                              disabled={isBarClosed('qui')}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Sexta */}
                      <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex flex-row justify-between sm:justify-start items-center w-full">
                          <div className="whitespace-nowrap text-sm min-w-[120px]">
                            <label className={`${getCurrentDayHour().includes('Sexta') ? 'text-blue-400 font-medium' : ''}`}>
                              Sexta-feira
                            </label>
                          </div>
                          <div className="flex items-center gap-1 ml-auto sm:ml-8">
                            <Checkbox 
                              id="sex-closed"
                              checked={isBarClosed('sex')}
                              onCheckedChange={(checked) => handleBarClosedChange('sex', checked === true)}
                              className="border-white/30 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                            />
                            <label htmlFor="sex-closed" className="text-xs text-white/70 cursor-pointer">Fechado</label>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center mx-auto sm:mx-0">
                            <Input 
                              type="time"
                              placeholder="Abertura"
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Sexta') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('sex', 'open', e.target.value)}
                              value={getHoursValue('sex', 'open')}
                              disabled={isBarClosed('sex')}
                            />
                            <span className="text-white/50">-</span>
                            <Input 
                              type="time"
                              placeholder="Fechamento" 
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Sexta') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('sex', 'close', e.target.value)}
                              value={getHoursValue('sex', 'close')}
                              disabled={isBarClosed('sex')}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Sábado */}
                      <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex flex-row justify-between sm:justify-start items-center w-full">
                          <div className="whitespace-nowrap text-sm min-w-[120px]">
                            <label className={`${getCurrentDayHour().includes('Sábado') ? 'text-blue-400 font-medium' : ''}`}>
                              Sábado
                            </label>
                          </div>
                          <div className="flex items-center gap-1 ml-auto sm:ml-8">
                            <Checkbox 
                              id="sab-closed"
                              checked={isBarClosed('sab')}
                              onCheckedChange={(checked) => handleBarClosedChange('sab', checked === true)}
                              className="border-white/30 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                            />
                            <label htmlFor="sab-closed" className="text-xs text-white/70 cursor-pointer">Fechado</label>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center mx-auto sm:mx-0">
                            <Input 
                              type="time"
                              placeholder="Abertura"
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Sábado') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('sab', 'open', e.target.value)}
                              value={getHoursValue('sab', 'open')}
                              disabled={isBarClosed('sab')}
                            />
                            <span className="text-white/50">-</span>
                            <Input 
                              type="time"
                              placeholder="Fechamento" 
                              className={`w-28 bg-nightlife-950 border-white/20 ${getCurrentDayHour().includes('Sábado') ? 'border-blue-500/50' : ''}`}
                              onChange={(e) => handleHoursChange('sab', 'close', e.target.value)}
                              value={getHoursValue('sab', 'close')}
                              disabled={isBarClosed('sab')}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Domingo */}
                      <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex flex-row justify-between sm:justify-start items-center w-full">
                          <div className="whitespace-nowrap text-sm min-w-[120px]">
                            <label className={`${getCurrentDayHour().includes('Domingo') ? 'text-blue-400 font-medium' : ''}`}>
                              Domingo
                            </label>
                          </div>
                          <div className="flex items-center gap-1 ml-auto sm:ml-8">
                            <Checkbox 
                              id="dom-closed"
                              checked={isBarClosed('dom')}
                              onCheckedChange={(checked) => handleBarClosedChange('dom', checked === true)}
                              className="border-white/30 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                            />
                            <label htmlFor="dom-closed" className="text-xs text-white/70 cursor-pointer">Fechado</label>
                          </div>
                        </div>
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
                        id="rating"
                        name="rating"
                        min="0"
                        max="5"
                        step="0.1"
                        value={newBar.rating}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewBar(prev => ({
                            ...prev,
                            rating: parseFloat(value)
                          }));
                        }}
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
                      value={typeof newBar.tags === 'string' ? newBar.tags : Array.isArray(newBar.tags) ? newBar.tags.join(', ') : ''}
                      placeholder="Separe as tags por vírgula (máximo 4)"
                      onChange={handleTagsChange}
                      className="bg-nightlife-950 border-white/20"
                    />
                    <p className="text-xs text-white/50 mt-1">
                      Máximo de 4 tags que ajudam na busca e filtragem dos bares
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-white/70 mb-1 block">
                        Código do Cupom <span className="text-white/50 text-xs">(opcional)</span>
                      </label>
                      <Input
                        name="discount_code"
                        value={newBar.discount_code || ''}
                        placeholder="Ex: VIBE123"
                        onChange={handleBarChange}
                        className="bg-nightlife-950 border-white/20"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-white/70 mb-1 block">
                        Descrição do Desconto <span className="text-white/50 text-xs">(opcional)</span>
                      </label>
                      <Input
                        name="discount_description"
                        value={newBar.discount_description || ''}
                        placeholder="Ex: Chopp 7% desconto"
                        onChange={handleBarChange}
                        className="bg-nightlife-950 border-white/20"
                      />
                    </div>
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
                      <div>
                        <label className="text-xs text-white/70 mb-1 block">Número para reservas (opcional)</label>
                        <Input
                          type="text"
                          value={newBar.eventPhone1 || ''}
                          onChange={(e) => setNewBar(prev => ({...prev, eventPhone1: e.target.value}))}
                          placeholder="Ex: +559 9999-9999"
                          className="bg-nightlife-950 border-white/20"
                        />
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
                      <div>
                        <label className="text-xs text-white/70 mb-1 block">Número para reservas (opcional)</label>
                        <Input
                          type="text"
                          value={newBar.eventPhone2 || ''}
                          onChange={(e) => setNewBar(prev => ({...prev, eventPhone2: e.target.value}))}
                          placeholder="Ex: +559 9999-9999"
                          className="bg-nightlife-950 border-white/20"
                        />
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
                      <div>
                        <label className="text-xs text-white/70 mb-1 block">Número para reservas (opcional)</label>
                        <Input
                          type="text"
                          value={newBar.eventPhone3 || ''}
                          onChange={(e) => setNewBar(prev => ({...prev, eventPhone3: e.target.value}))}
                          placeholder="Ex: +559 9999-9999"
                          className="bg-nightlife-950 border-white/20"
                        />
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
                      <div>
                        <label className="text-xs text-white/70 mb-1 block">Número para reservas (opcional)</label>
                        <Input
                          type="text"
                          value={newBar.eventPhone4 || ''}
                          onChange={(e) => setNewBar(prev => ({...prev, eventPhone4: e.target.value}))}
                          placeholder="Ex: +559 9999-9999"
                          className="bg-nightlife-950 border-white/20"
                        />
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
                          id={`delete-bar-${bar.id}`}
                          variant="destructive" 
                          size="sm"
                          onClick={() => startDeleteBar(bar.id)}
                          className="bg-red-600 hover:bg-red-700"
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
      
      {/* Diálogo de exclusão de bar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-nightlife-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este bar? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-nightlife-800 border-white/10 hover:bg-nightlife-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBar} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Diálogo de criação de usuário */}
      <AlertDialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <AlertDialogContent className="bg-nightlife-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Novo Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Preencha os campos abaixo para criar um novo usuário
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <form onSubmit={addUser} className="space-y-4 py-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm text-white/70 mb-1 block">Email*</label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="email@exemplo.com"
                  required
                  className="bg-nightlife-950 border-white/20"
                />
              </div>
              
              <div>
                <label className="text-sm text-white/70 mb-1 block">Nome*</label>
                <Input
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Nome completo"
                  required
                  className="bg-nightlife-950 border-white/20"
                />
              </div>
              
              <div>
                <label className="text-sm text-white/70 mb-1 block">Telefone</label>
                <Input
                  value={newUser.phone || ''}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="(11) 9999-9999"
                  className="bg-nightlife-950 border-white/20"
                />
              </div>
              
              <div>
                <label className="text-sm text-white/70 mb-1 block">Função</label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({...newUser, role: value as UserRole})}
                >
                  <SelectTrigger className="bg-nightlife-950 border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-nightlife-950 border-white/20">
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="client">Proprietário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm text-white/70">Usuário aprovado</label>
                <Switch 
                  checked={newUser.approved || false} 
                  onCheckedChange={(checked) => setNewUser({...newUser, approved: checked})}
                  className={(newUser.approved || false) ? "data-[state=checked]:bg-emerald-600" : "data-[state=unchecked]:bg-rose-600"}
                />
              </div>
            </div>
          
            <AlertDialogFooter>
              <AlertDialogCancel type="button" className="bg-nightlife-800 border-white/10 hover:bg-nightlife-700">
                Cancelar
              </AlertDialogCancel>
              <Button type="submit" className="bg-nightlife-600 hover:bg-nightlife-700">
                Criar Usuário
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Diálogo de exclusão de usuário */}
      <AlertDialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
        <AlertDialogContent className="bg-nightlife-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-nightlife-800 border-white/10 hover:bg-nightlife-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Diálogo para redefinição de senha */}
      <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <AlertDialogContent className="bg-nightlife-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Redefinir Senha</AlertDialogTitle>
            <AlertDialogDescription>
              Enviar email para redefinição de senha para:
              <div className="mt-2 font-medium">{resetPasswordEmail}</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-nightlife-800 border-white/10 hover:bg-nightlife-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetPassword} className="bg-blue-600 hover:bg-blue-700">Enviar Email</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para alteração de status */}
      <AlertDialog open={statusChangeDialogOpen} onOpenChange={setStatusChangeDialogOpen}>
        <AlertDialogContent className="bg-nightlife-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de status</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatusChange && (
                <div className="mt-2">
                  <p>Você está {pendingStatusChange.status ? "aprovando" : "bloqueando"} o acesso do usuário.</p>
                  <p className="mt-2">
                    {pendingStatusChange.status 
                      ? "Ao aprovar, o usuário poderá acessar o sistema com suas credenciais." 
                      : "Ao bloquear, o usuário não poderá mais fazer login até que seja aprovado novamente."}
                  </p>
                  <div className="mt-4 py-2 px-3 bg-nightlife-950 rounded-md border border-white/10">
                    <p className="text-sm font-semibold">
                      Status mudará para: 
                      <span className={pendingStatusChange.status 
                        ? "ml-2 text-emerald-400" 
                        : "ml-2 text-rose-400"
                      }>
                        {pendingStatusChange.status ? "Aprovado" : "Bloqueado"}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-nightlife-800 border-white/10 hover:bg-nightlife-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmStatusChange} 
              className={`${pendingStatusChange?.status ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin; 