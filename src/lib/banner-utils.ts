import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

// URL que deve ser removida do sistema
export const URL_REMOVIDA = "https://youtu.be/zu_bY1q3oDc";

// Interface para os banners
export interface Banner {
  id: number;
  image_url: string;
  text: string;
  link_url: string;
  active: boolean;
}

/**
 * Verifica se uma URL é do YouTube
 */
export const isYoutubeUrl = (url: string): boolean => {
  return url ? /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/.test(url) : false;
};

/**
 * Extrai o ID de um vídeo do YouTube a partir da URL
 */
export const getYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    
    // URL do formato youtu.be (curta)
    if (urlObj.hostname.includes('youtu.be')) {
      return urlObj.pathname.substring(1);
    }
    
    // URL do formato youtube.com (normal)
    if (urlObj.hostname.includes('youtube.com')) {
      return new URLSearchParams(urlObj.search).get('v');
    }
    
    return null;
  } catch (error) {
    // Se não for uma URL válida
    return null;
  }
};

/**
 * Verifica se uma URL é a que deve ser removida
 */
export const isUrlRemovida = (url: string): boolean => {
  return url === URL_REMOVIDA;
};

/**
 * Remove a URL específica de todos os banners no banco de dados
 * Retorna o número de banners afetados
 */
export const removerUrlDoBancoDeDados = async (): Promise<number> => {
  try {
    // Procurar todos os banners que possuem a URL específica
    const { data: bannersComUrlRemovida } = await supabase
      .from('promotional_banners')
      .select('id, image_url')
      .eq('image_url', URL_REMOVIDA);
      
    if (!bannersComUrlRemovida || bannersComUrlRemovida.length === 0) {
      return 0;
    }
    
    console.log(`Encontrados ${bannersComUrlRemovida.length} banners com a URL a ser removida.`);
    
    // Para cada banner encontrado, atualizar a image_url para vazio
    for (const banner of bannersComUrlRemovida) {
      await supabase
        .from('promotional_banners')
        .update({ image_url: '' })
        .eq('id', banner.id);
        
      console.log(`URL removida do banner ${banner.id}`);
    }
    
    if (bannersComUrlRemovida.length > 0) {
      toast({
        title: "URL removida",
        description: `A URL específica foi removida de ${bannersComUrlRemovida.length} banner(s).`,
        variant: "default"
      });
    }
    
    return bannersComUrlRemovida.length;
  } catch (error) {
    console.error('Erro ao tentar remover URL específica:', error);
    return 0;
  }
};

/**
 * Busca todos os banners ativos
 */
export const buscarBannersAtivos = async (): Promise<Banner[]> => {
  try {
    // Remover a URL indesejada primeiro
    await removerUrlDoBancoDeDados();
    
    // Buscar todos os banners ativos
    const { data, error } = await supabase
      .from('promotional_banners')
      .select('*')
      .eq('active', true)
      .order('id');
      
    if (error) throw error;
    
    // Filtrar banners que tenham imagem ou vídeo 
    const validBanners = (data || []).filter(banner => 
      banner.image_url && 
      banner.image_url.trim() !== ""
    );
    
    return validBanners;
  } catch (error) {
    console.error('Erro ao buscar banners ativos:', error);
    return [];
  }
};

/**
 * Busca todos os banners (ativos e inativos)
 */
export const buscarTodosBanners = async (): Promise<Banner[]> => {
  try {
    // Remover a URL indesejada primeiro
    await removerUrlDoBancoDeDados();
    
    // Buscar todos os banners
    const { data, error } = await supabase
      .from('promotional_banners')
      .select('*')
      .order('id');
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar banners:', error);
    return [];
  }
}; 