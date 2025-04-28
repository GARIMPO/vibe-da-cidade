import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const SplashCursorConfig: React.FC = () => {
  const [isSplashCursorEnabled, setIsSplashCursorEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Fetch current splash cursor settings
  useEffect(() => {
    const fetchSplashCursorSetting = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'splash_cursor_enabled')
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao buscar configuração do splash cursor:', error);
          return;
        }
        
        if (data?.value) {
          setIsSplashCursorEnabled(data.value === 'true');
        }
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSplashCursorSetting();
  }, []);

  // Save splash cursor setting
  const saveSplashCursorSetting = async () => {
    setIsLoading(true);
    try {
      // Check if setting already exists
      const { data: existingConfig, error: fetchError } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'splash_cursor_enabled')
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      let result;
      
      if (existingConfig) {
        // Update existing setting
        result = await supabase
          .from('site_settings')
          .update({ value: isSplashCursorEnabled.toString() })
          .eq('key', 'splash_cursor_enabled');
      } else {
        // Create new setting
        result = await supabase
          .from('site_settings')
          .insert([{ 
            key: 'splash_cursor_enabled', 
            value: isSplashCursorEnabled.toString(),
            description: 'Controla se o efeito de splash cursor está ativado na página inicial'
          }]);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast({
        title: "Configuração salva",
        description: `O efeito de splash cursor foi ${isSplashCursorEnabled ? 'ativado' : 'desativado'} com sucesso`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between space-x-4">
          <div className="space-y-1">
            <Label htmlFor="splash-cursor-toggle" className="text-sm font-medium">
              Efeito de Cursor com Splash
            </Label>
            <p className="text-sm text-muted-foreground">
              Ativa ou desativa o efeito de cursor com splash na página inicial
            </p>
          </div>
          <Switch
            id="splash-cursor-toggle"
            checked={isSplashCursorEnabled}
            onCheckedChange={setIsSplashCursorEnabled}
            disabled={isLoading}
          />
        </div>
      </div>
      
      <Button
        onClick={saveSplashCursorSetting}
        disabled={isLoading}
        className="w-full bg-nightlife-600 hover:bg-nightlife-700"
      >
        {isLoading ? "Salvando..." : "Salvar Configuração"}
      </Button>
    </div>
  );
};

export default SplashCursorConfig; 