import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, Save, Trash, RefreshCw, Image as ImageIcon, Youtube } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface BannerItem {
  id: number;
  image_url: string;
  text: string;
  link_url: string;
  active: boolean;
}

const PromotionalBanners: React.FC = () => {
  const { user } = useAuth();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null]);
  const [previews, setPreviews] = useState<string[]>(Array(5).fill(''));
  const [uploadProgress, setUploadProgress] = useState<number[]>(Array(5).fill(0));
  
  // Buscar banners existentes
  useEffect(() => {
    const fetchBanners = async () => {
      if (!user) return;
      
      try {
        console.log('Buscando banners... User:', user);
        const { data, error } = await supabase
          .from('promotional_banners')
          .select('*')
          .order('id');
          
        console.log('Resultado da busca:', { data, error });
        
        // Mesmo se houver erro, continuamos com banners vazios
        // Isso é útil caso a tabela ainda não exista no banco
        
        // Inicializar com dados existentes ou banners vazios
        const existingBanners = data || [];
        const initialBanners: BannerItem[] = Array(5).fill(null).map((_, index) => {
          const existing = existingBanners.find(b => b.id === index + 1);
          return existing || {
            id: index + 1,
            image_url: '',
            text: '',
            link_url: '',
            active: false
          };
        });
        
        setBanners(initialBanners);
        
        // Inicializar previews com imagens existentes
        const newPreviews = [...previews];
        initialBanners.forEach((banner, index) => {
          if (banner.image_url) {
            newPreviews[index] = banner.image_url;
          }
        });
        setPreviews(newPreviews);
      } catch (error) {
        console.error('Erro ao buscar banners:', error);
        // Criar banners vazios em caso de erro
        const initialBanners: BannerItem[] = Array(5).fill(null).map((_, index) => ({
          id: index + 1,
          image_url: '',
          text: '',
          link_url: '',
          active: false
        }));
        
        setBanners(initialBanners);
        
        toast({
          title: "Aviso",
          description: "Iniciando com banners vazios. As alterações serão salvas quando você clicar em Salvar.",
          variant: "default"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchBanners();
  }, [user]);
  
  // Verificar se uma URL é do YouTube
  const isYoutubeUrl = (url: string): boolean => {
    return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/.test(url);
  };
  
  // Manipular upload de imagem
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Verificar tamanho e tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Por favor, use imagens nos formatos JPG, PNG, GIF ou AVIF.",
        variant: "destructive"
      });
      return;
    }
    
    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const newPreviews = [...previews];
      newPreviews[index] = e.target?.result as string;
      setPreviews(newPreviews);
    };
    reader.readAsDataURL(file);
    
    try {
      setUploadProgress(prev => {
        const newProgress = [...prev];
        newProgress[index] = 1; // Iniciar progresso
        return newProgress;
      });
      
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${index + 1}-${Date.now()}.${fileExt}`;
      
      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('banner-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      // Atualizar manualmente a barra de progresso após o upload
      setUploadProgress(prev => {
        const newProgress = [...prev];
        newProgress[index] = 100;
        return newProgress;
      });
      
      // Pequena pausa para exibir 100% antes de resetar
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = [...prev];
          newProgress[index] = 0;
          return newProgress;
        });
      }, 500);
      
      if (error) throw error;
      
      // Obter URL pública da imagem
      const { data: publicUrlData } = supabase.storage
        .from('banner-images')
        .getPublicUrl(data.path);
        
      // Atualizar estado dos banners
      const newBanners = [...banners];
      newBanners[index].image_url = publicUrlData.publicUrl;
      setBanners(newBanners);
      
      toast({
        title: "Imagem enviada",
        description: "A imagem foi enviada com sucesso."
      });
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar a imagem.",
        variant: "destructive"
      });
    } finally {
      // Se ocorrer um erro, garantimos que o progresso seja reiniciado
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = [...prev];
          newProgress[index] = 0;
          return newProgress;
        });
      }, 500);
    }
  };
  
  // Atualizar campo de texto ou link do banner
  const updateBannerField = (index: number, field: 'text' | 'link_url' | 'active' | 'image_url', value: string | boolean) => {
    const newBanners = [...banners];
    newBanners[index] = { ...newBanners[index], [field]: value };
    setBanners(newBanners);
  };
  
  // Remover imagem
  const removeBannerImage = async (index: number) => {
    try {
      const banner = banners[index];
      if (!banner.image_url) return;
      
      // Extrair o nome do arquivo da URL
      const fileName = banner.image_url.split('/').pop();
      if (!fileName) return;
      
      // Remover do Storage
      const { error } = await supabase.storage
        .from('banner-images')
        .remove([fileName]);
        
      if (error) throw error;
      
      // Atualizar estado
      const newBanners = [...banners];
      newBanners[index].image_url = '';
      setBanners(newBanners);
      
      // Limpar preview
      const newPreviews = [...previews];
      newPreviews[index] = '';
      setPreviews(newPreviews);
      
      toast({
        title: "Imagem removida",
        description: "A imagem foi removida com sucesso."
      });
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a imagem.",
        variant: "destructive"
      });
    }
  };
  
  // Salvar todos os banners
  const saveBanners = async () => {
    try {
      setSaving(true);
      
      // Primeiro, verificar se a tabela existe
      try {
        // Tentar executar o SQL para criar a tabela se não existir
        await supabase.rpc('create_promotional_banners_if_not_exists');
      } catch (error) {
        console.log('Tabela pode já existir ou não foi possível criar:', error);
        // Continuar mesmo se houver erro aqui
      }
      
      // Para cada banner, insere ou atualiza no banco
      for (const banner of banners) {
        const { error } = await supabase
          .from('promotional_banners')
          .upsert(banner, { onConflict: 'id' });
          
        if (error) {
          console.error('Erro ao salvar banner:', error);
          // Se for um erro relacionado à não existência da tabela, informamos ao usuário
          if (error.code === '42P01') { // tabela não existe
            throw new Error('A tabela de banners precisa ser criada pelo administrador do banco de dados.');
          }
          throw error;
        }
      }
      
      toast({
        title: "Banners salvos",
        description: "Alterações salvas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao salvar banners:', error);
      toast({
        title: "Erro",
        description: typeof error === 'object' && error !== null && 'message' in error 
          ? (error as Error).message 
          : "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Verificar se o usuário é super_admin
  if (user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex flex-col bg-black text-white">
        <div className="container mx-auto px-4 py-8 flex-grow">
          <div className="flex items-center mb-6">
            <Link to="/admin">
              <Button variant="outline" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Admin
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Banners Promocionais</h1>
          </div>
          
          <Card className="bg-gray-800/50 border-white/10">
            <CardContent className="pt-6">
              <p className="text-center text-white/70">
                Você não tem permissão para acessar esta página.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-black text-white">
        <div className="container mx-auto px-4 py-8 flex-grow">
          <div className="flex items-center mb-6">
            <Link to="/admin">
              <Button variant="outline" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Admin
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Banners Promocionais</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(5).fill(0).map((_, i) => (
              <Card key={i} className="bg-gray-800/50 border-white/10">
                <CardHeader>
                  <Skeleton className="h-6 w-1/2 bg-gray-700" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-40 w-full bg-gray-700" />
                    <Skeleton className="h-5 w-full bg-gray-700" />
                    <Skeleton className="h-5 w-full bg-gray-700" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link to="/admin">
              <Button variant="outline" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Admin
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Banners Promocionais</h1>
          </div>
          
          <Button 
            onClick={saveBanners} 
            className="bg-nightlife-600 hover:bg-nightlife-700"
            disabled={saving}
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner, index) => (
            <Card key={banner.id} className={`${isYoutubeUrl(banner.image_url) ? 'bg-gray-900/80 border-red-900/30' : 'bg-gray-800/50 border-white/10'} ${banner.active ? 'ring-1 ring-nightlife-400/50' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    {isYoutubeUrl(banner.image_url) ? (
                      <>
                        <Youtube className="h-5 w-5 text-red-500" />
                        Vídeo {index + 1}
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-5 w-5 text-nightlife-400" />
                        Banner {index + 1}
                      </>
                    )}
                  </CardTitle>
                  
                  {banner.active ? (
                    <div className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      Ativo
                    </div>
                  ) : (
                    <div className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded-full">
                      Inativo
                    </div>
                  )}
                </div>
                <CardDescription className="text-white/70">
                  {isYoutubeUrl(banner.image_url) ? 
                    'Reproduz vídeo do YouTube' : 
                    'Dimensões recomendadas: 350x350 pixels'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Área de imagem */}
                  <div className="relative">
                    <div className="space-y-2 mb-3">
                      <Label htmlFor={`image-url-${index}`} className="text-white/80 flex items-center justify-between">
                        <span>URL da imagem ou vídeo:</span>
                        <span className="text-xs text-white/50"></span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`image-url-${index}`}
                          placeholder="https://..."
                          className="bg-gray-900/50 border-gray-600/30 flex-1"
                          value={banner.image_url}
                          onChange={(e) => updateBannerField(index, 'image_url', e.target.value)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap border-white/10"
                          onClick={() => {
                            // Verifica se é uma URL do YouTube
                            const isYoutubeUrl = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/.test(banner.image_url);
                            if (isYoutubeUrl) {
                              toast({
                                title: "URL do YouTube detectada",
                                description: "O vídeo será exibido no lugar da imagem",
                                variant: "default"
                              });
                            } else {
                              toast({
                                title: "URL de imagem",
                                description: "Certifique-se de que a URL aponta para uma imagem válida",
                                variant: "default"
                              });
                            }
                          }}
                        >
                          Verificar URL
                        </Button>
                      </div>
                    </div>

                    <div className="w-full h-[200px] bg-gray-900/50 rounded-lg overflow-hidden border border-gray-600/30 flex items-center justify-center">
                      {previews[index] ? (
                        <img
                          src={previews[index]}
                          alt={`Banner ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      ) : banner.image_url && /youtube\.com|youtu\.be/.test(banner.image_url) ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-black">
                          <Youtube className="h-8 w-8 text-red-600 mb-2" />
                          <p className="text-white/70 text-sm">Vídeo do YouTube será exibido</p>
                          <p className="text-white/50 text-xs mt-1 max-w-[80%] truncate">{banner.image_url}</p>
                        </div>
                      ) : (
                        <div className="text-center text-white/50">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                          <p>Nenhuma imagem</p>
                        </div>
                      )}
                      
                      {uploadProgress[index] > 0 && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <div className="w-full max-w-[80%]">
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-nightlife-400 transition-all duration-300" 
                                style={{ width: `${uploadProgress[index]}%` }}
                              ></div>
                            </div>
                            <p className="text-center mt-2 text-sm text-white/80">
                              Enviando... {uploadProgress[index]}%
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg, image/png, image/gif, image/avif"
                        onChange={(e) => handleFileChange(e, index)}
                        ref={(el) => (fileInputRefs.current[index] = el)}
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-white/10 hover:bg-gray-700/50"
                        onClick={() => fileInputRefs.current[index]?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Enviar imagem
                      </Button>
                      
                      {(previews[index] || (banner.image_url && !isYoutubeUrl(banner.image_url))) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/10 hover:bg-red-900/20"
                          onClick={() => removeBannerImage(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Campos de texto e link */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`text-${index}`} className="text-white/80">
                        Texto do banner:
                      </Label>
                      <Textarea
                        id={`text-${index}`}
                        placeholder="Descreva o banner..."
                        className="bg-gray-900/50 border-gray-600/30"
                        value={banner.text}
                        onChange={(e) => updateBannerField(index, 'text', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`link-${index}`} className="text-white/80 flex items-center justify-between">
                        <span>Link do banner:</span>
                        <span className="text-xs text-white/50">(URL para onde o usuário será direcionado ao clicar)</span>
                      </Label>
                      <Input
                        id={`link-${index}`}
                        placeholder="https://..."
                        className="bg-gray-900/50 border-gray-600/30"
                        value={banner.link_url}
                        onChange={(e) => updateBannerField(index, 'link_url', e.target.value)}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`active-${index}`}
                        checked={banner.active}
                        onChange={(e) => updateBannerField(index, 'active', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Label htmlFor={`active-${index}`} className="text-white/80">
                        Ativar banner
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionalBanners; 