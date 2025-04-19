import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Image, ChevronDown } from 'lucide-react';
import * as Accordion from '@radix-ui/react-accordion';

const CoverImageConfig: React.FC = () => {
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(false);
  const [isUrlValid, setIsUrlValid] = useState<boolean>(false);
  const [accordionValue, setAccordionValue] = useState<string>('');
  const { toast } = useToast();

  // Buscar URL atual da imagem de capa
  useEffect(() => {
    const fetchCoverImage = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'cover_image')
          .single();
          
        if (error) {
          console.error('Erro ao buscar imagem de capa:', error);
          return;
        }
        
        if (data?.value) {
          setCoverImageUrl(data.value);
          setIsUrlValid(true);
          setIsPreviewVisible(true);
          setAccordionValue('preview');
        }
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCoverImage();
  }, []);

  // Salvar a URL da imagem de capa
  const saveCoverImage = async () => {
    if (!isUrlValid) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL de imagem válida",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Verificar se a configuração já existe
      const { data: existingConfig, error: fetchError } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'cover_image')
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      let result;
      
      if (existingConfig) {
        // Atualizar configuração existente
        result = await supabase
          .from('site_settings')
          .update({ value: coverImageUrl })
          .eq('key', 'cover_image');
      } else {
        // Criar nova configuração
        result = await supabase
          .from('site_settings')
          .insert([{ 
            key: 'cover_image', 
            value: coverImageUrl,
            description: 'URL da imagem de capa exibida na página inicial'
          }]);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast({
        title: "Configuração salva",
        description: "A imagem de capa foi atualizada com sucesso",
        variant: "default"
      });
      
      // Resetar o estado após sucesso
      setIsLoading(false);
      setIsUrlValid(true);
      
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração. Tente novamente.",
        variant: "destructive"
      });
      setIsLoading(false);
      setIsUrlValid(false);
    }
  };
  
  // Verificar se a URL fornecida é uma imagem válida
  const checkImageUrl = () => {
    if (!coverImageUrl) {
      setIsPreviewVisible(false);
      setIsUrlValid(false);
      setAccordionValue('');
      return;
    }
    
    // Verificar se a URL parece ser uma imagem
    const isImageUrl = /\.(jpg|jpeg|png|webp|avif|gif)($|\?)/i.test(coverImageUrl);
    
    if (!isImageUrl) {
      toast({
        title: "URL inválida",
        description: "A URL não parece ser uma imagem válida",
        variant: "destructive"
      });
      setIsPreviewVisible(false);
      setIsUrlValid(false);
      setAccordionValue('');
      return;
    }
    
    setIsPreviewVisible(true);
    setIsUrlValid(true);
    setAccordionValue('preview');
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col space-y-2">
        <label htmlFor="cover-image-url" className="text-sm font-medium">
          URL da Imagem de Capa
        </label>
        <div className="flex gap-2">
          <Input
            id="cover-image-url"
            type="text"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://exemplo.com/imagem.jpg"
            className="bg-nightlife-950 border-white/20"
            disabled={isLoading}
          />
          <Button 
            onClick={checkImageUrl} 
            variant="secondary"
            disabled={isLoading || !coverImageUrl}
            size="sm"
          >
            <Image className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Insira a URL de uma imagem para ser usada como capa na página inicial
        </p>
      </div>
      
      {isPreviewVisible && (
        <Accordion.Root 
          type="single" 
          collapsible 
          className="w-full"
          value={accordionValue}
          onValueChange={setAccordionValue}
        >
          <Accordion.Item value="preview" className="border rounded-md overflow-hidden">
            <Accordion.Header className="flex">
              <Accordion.Trigger className="flex flex-1 items-center justify-between py-2 px-4 text-sm font-medium bg-muted hover:bg-muted/80 transition-colors">
                <span>Preview da Imagem</span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <div className="p-4">
                <div className="w-full max-w-[300px] mx-auto aspect-video overflow-hidden bg-muted relative rounded-md">
                  <img 
                    src={coverImageUrl} 
                    alt="Preview da imagem de capa" 
                    className="w-full h-full object-cover"
                    onError={() => {
                      setIsPreviewVisible(false);
                      setIsUrlValid(false);
                      setAccordionValue('');
                      toast({
                        title: "Erro ao carregar imagem",
                        description: "Não foi possível carregar a imagem. Verifique se a URL está correta.",
                        variant: "destructive"
                      });
                    }}
                  />
                </div>
              </div>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      )}
      
      <Button
        onClick={saveCoverImage}
        disabled={isLoading || !isUrlValid}
        className="w-full bg-nightlife-600 hover:bg-nightlife-700"
      >
        {isLoading ? "Salvando..." : "Salvar Configuração"}
      </Button>
    </div>
  );
};

export default CoverImageConfig; 