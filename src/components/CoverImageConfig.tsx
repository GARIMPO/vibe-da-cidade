import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Check, Save, Image, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const CoverImageConfig: React.FC = () => {
  const { toast } = useToast();
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Buscar a URL atual da imagem de capa
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
          console.error('Erro ao buscar configuração:', error);
          return;
        }
          
        if (data && data.value) {
          setCoverImageUrl(data.value);
          setPreviewVisible(true);
        }
      } catch (error) {
        console.error('Erro ao buscar configuração de capa:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCoverImage();
  }, []);

  // Salvar a nova URL da imagem de capa
  const saveCoverImage = async () => {
    if (!coverImageUrl.trim()) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida para a imagem de capa.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    console.log("Iniciando salvamento da URL da capa:", coverImageUrl);
    
    // Configurar um timeout de segurança para resetar o estado após 10 segundos
    const safetyTimeout = setTimeout(() => {
      if (isSaving) {
        console.log("Timeout de segurança acionado - resetando estado de salvamento");
        setIsSaving(false);
        toast({
          title: "Aviso",
          description: "A operação está demorando mais que o esperado. Verifique o console para mais detalhes.",
          variant: "destructive"
        });
      }
    }, 10000);
    
    try {
      // Verificar se a configuração já existe
      console.log("Verificando se a configuração já existe...");
      const { data: existingConfig, error: checkError } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'cover_image')
        .maybeSingle();
        
      if (checkError) {
        console.error('Erro ao verificar configuração existente:', checkError);
        throw checkError;
      }
      
      console.log("Resultado da verificação:", existingConfig ? "Configuração encontrada" : "Configuração não encontrada");
      
      let result;
      
      if (existingConfig) {
        // Atualizar configuração existente
        console.log("Atualizando configuração existente...");
        result = await supabase
          .from('site_settings')
          .update({ value: coverImageUrl })
          .eq('key', 'cover_image');
      } else {
        // Criar nova configuração
        console.log("Criando nova configuração...");
        result = await supabase
          .from('site_settings')
          .insert([{ 
            key: 'cover_image', 
            value: coverImageUrl,
            description: 'URL da imagem de capa exibida na página inicial'
          }]);
      }
      
      console.log("Resultado da operação:", result);
      
      if (result.error) {
        console.error('Erro na operação do Supabase:', result.error);
        throw result.error;
      }
      
      console.log("Salvamento concluído com sucesso!");
      toast({
        title: "Configuração salva",
        description: "A imagem de capa foi atualizada com sucesso.",
        variant: "default"
      });
      setIsOpen(true); // Abrir o acordeão após salvar com sucesso
    } catch (error: any) {
      console.error('Erro ao salvar configuração de capa:', error);
      toast({
        title: "Erro",
        description: `Não foi possível salvar a configuração: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive"
      });
    } finally {
      clearTimeout(safetyTimeout);
      setIsSaving(false);
      console.log("Estado de salvamento resetado");
    }
  };

  // Verificar a URL da imagem
  const checkImageUrl = () => {
    if (!coverImageUrl.trim()) return;
    setPreviewVisible(true);
    setIsOpen(true); // Abrir o acordeão ao visualizar
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-white/70 mb-2 block">URL da Imagem de Capa</label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="bg-nightlife-950 border-white/20 flex-1"
            disabled={isLoading || isSaving}
          />
          <Button 
            type="button" 
            variant="outline" 
            className="border-white/20"
            onClick={checkImageUrl}
            disabled={!coverImageUrl.trim() || isLoading || isSaving}
          >
            <Image className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
        </div>
        <p className="text-xs text-white/50 mt-1">
          Insira a URL de uma imagem para ser usada como capa na página inicial.
          Recomendação: utilize imagens de alta qualidade em formato paisagem (1920x1080 ou maior).
        </p>
      </div>
      
      {previewVisible && coverImageUrl && (
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="border border-white/10 rounded-lg overflow-hidden"
        >
          <div className="flex justify-between items-center p-1 px-2 bg-nightlife-800">
            <p className="text-xs text-white/70">Pré-visualização</p>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                {isOpen ? (
                  <ChevronUp className="h-3 w-3 text-white/70" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-white/70" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="flex items-center justify-center bg-nightlife-950/70 p-1">
              <img 
                src={coverImageUrl} 
                alt="Pré-visualização" 
                className="max-w-full max-h-[180px] object-contain"
                onError={() => {
                  toast({
                    title: "Erro na imagem",
                    description: "Não foi possível carregar a imagem. Verifique a URL e tente novamente.",
                    variant: "destructive"
                  });
                }}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
      
      <div className="flex justify-end mt-4">
        <Button 
          type="button" 
          className="bg-nightlife-600 hover:bg-nightlife-700"
          onClick={saveCoverImage}
          disabled={isLoading || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configuração
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CoverImageConfig; 