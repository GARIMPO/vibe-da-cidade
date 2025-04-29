import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, MapPin } from 'lucide-react';

const MapsLinkConfig: React.FC = () => {
  const { toast } = useToast();
  const [mapsUrl, setMapsUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Buscar a URL atual do link do maps
  useEffect(() => {
    const fetchMapsLink = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'maps_link')
          .single();
          
        if (error) {
          console.error('Erro ao buscar configuração do maps:', error);
          return;
        }
          
        if (data && data.value) {
          setMapsUrl(data.value);
        }
      } catch (error) {
        console.error('Erro ao buscar configuração do maps:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMapsLink();
  }, []);

  // Salvar a nova URL do maps
  const saveMapsLink = async () => {
    if (!mapsUrl.trim()) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida para o Google Maps.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    console.log("Iniciando salvamento da URL do maps:", mapsUrl);
    
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
      console.log("Verificando se a configuração do maps já existe...");
      const { data: existingConfig, error: checkError } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'maps_link')
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
          .update({ value: mapsUrl })
          .eq('key', 'maps_link');
      } else {
        // Criar nova configuração
        console.log("Criando nova configuração...");
        result = await supabase
          .from('site_settings')
          .insert([{ 
            key: 'maps_link', 
            value: mapsUrl,
            description: 'URL personalizada do Google Maps para descobrir locais próximos'
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
        description: "O link do Google Maps foi atualizado com sucesso.",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Erro ao salvar configuração do maps:', error);
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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm text-white/70 mb-2 block">URL do Google Maps</label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://www.google.com/maps/search/bares+e+restaurantes"
              className="bg-nightlife-950 border-white/20 flex-1"
              disabled={isLoading || isSaving}
            />
          </div>
          <p className="text-xs text-white/50 mt-1">
            Insira a URL do Google Maps que será usada no botão "Descobrir por perto" na página de bares.
            Recomendação: crie um link para buscar bares e restaurantes em sua cidade.
          </p>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="button" 
          className="bg-nightlife-600 hover:bg-nightlife-700"
          onClick={saveMapsLink}
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

export default MapsLinkConfig; 