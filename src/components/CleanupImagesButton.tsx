import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cleanupUnusedImages } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

/**
 * Componente de botão para limpar imagens não utilizadas no armazenamento.
 * Este componente pode ser adicionado em qualquer lugar do painel de administração.
 */
const CleanupImagesButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCleanupImages = async () => {
    try {
      setIsLoading(true);
      
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
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCleanupImages}
      disabled={isLoading}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isLoading ? 'Limpando...' : 'Limpar Imagens Não Utilizadas'}
    </Button>
  );
};

export default CleanupImagesButton; 