import { createClient } from '@supabase/supabase-js';

// Usar variáveis de ambiente fornecidas pelo Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ikuxbrtbayefaqfiuiop.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrdXhicnRiYXllZmFxZml1aW9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDYwMDk5OSwiZXhwIjoyMDYwMTc2OTk5fQ.NsOSnC5OdXkpX76okI4t4Nx7aDlywDz6RkVGLpvg4GA';

// Cria o cliente do Supabase para uso em toda a aplicação
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Exporta funções de utilidade para trabalhar com o Supabase

// Função para fazer login usando e-mail e senha
export async function loginWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return { data: null, error };
  }
}

// Função para fazer registro usando e-mail e senha
export async function registerWithEmail(email: string, password: string, fullName: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return { data: null, error };
  }
}

// Função para obter a sessão atual
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    return { session: data.session, error: null };
  } catch (error) {
    console.error('Erro ao obter sessão:', error);
    return { session: null, error };
  }
}

// Função para fazer logout
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    return { error: null };
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return { error };
  }
}

// Exemplo: Função para buscar bares do Supabase
export async function getBars() {
  try {
    const { data, error } = await supabase
      .from('bars')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar bares:', error);
      return [];
    }
    
    // Retornar os dados ordenados, sem embaralhar
    return data || [];
  } catch (err) {
    console.error('Erro na requisição:', err);
    return [];
  }
}

// Função para buscar eventos do Supabase
export async function getEvents() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true }); // Ordenar por data
    
    if (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Erro na requisição:', err);
    return [];
  }
}

// Função para embaralhar um array (algoritmo Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Função melhorada para substituir imagens existentes
export const uploadImage = async (file: File, bucket: string, existingImageUrl?: string): Promise<string> => {
  if (!file) {
    throw new Error('Nenhum arquivo fornecido para upload');
  }

  try {
    // Se existir uma URL de imagem anterior, exclua-a primeiro
    if (existingImageUrl) {
      await deleteImage(existingImageUrl);
    }

    // Gerar um nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Fazer upload do arquivo para o bucket especificado
    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
    }

    // Obter a URL pública da imagem
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Erro no upload da imagem:', error);
    throw error;
  }
};

// Função melhorada para excluir imagens
export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  if (!imageUrl) return false;

  try {
    // Extrair o caminho do arquivo da URL
    // A URL tem o formato: https://xxx.supabase.co/storage/v1/object/public/bucket-name/file-path
    const urlParts = imageUrl.split('/');
    const bucketParts = urlParts[urlParts.length - 2]; // Obtém o bucket
    const fileName = urlParts[urlParts.length - 1]; // Obtém o nome do arquivo
    
    // Extrair o nome do bucket da URL
    let bucket = '';
    if (imageUrl.includes('bar-images')) {
      bucket = 'bar-images';
    } else if (imageUrl.includes('event-images')) {
      bucket = 'event-images';
    } else {
      console.error('Não foi possível determinar o bucket da imagem:', imageUrl);
      return false;
    }

    // Excluir o arquivo do Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      console.error('Erro ao excluir imagem:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao processar exclusão da imagem:', error);
    return false;
  }
};

// Função para limpar imagens não utilizadas
export const cleanupUnusedImages = async (bucketName: string = 'bar-images'): Promise<boolean> => {
  try {
    // 1. Obter lista de todas as imagens no armazenamento
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from(bucketName)
      .list();
    
    if (storageError) {
      console.error('Erro ao listar arquivos do storage:', storageError);
      return false;
    }
    
    // 2. Obter lista de todas as imagens referenciadas no banco de dados
    const { data: barsData, error: barsError } = await supabase
      .from('bars')
      .select('image, additional_images');
      
    if (barsError) {
      console.error('Erro ao buscar imagens dos bares:', barsError);
      return false;
    }
    
    // 3. Obter lista de todas as imagens de eventos referenciadas no banco de dados
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('image');
      
    if (eventsError) {
      console.error('Erro ao buscar imagens dos eventos:', eventsError);
      return false;
    }
    
    // 4. Extrair nomes de arquivos de todas as URLs referenciadas
    const usedFileNames: Set<string> = new Set();
    
    // Adicionar imagens principais dos bares
    barsData.forEach(bar => {
      if (bar.image) {
        const fileName = extractFileNameFromUrl(bar.image);
        if (fileName) usedFileNames.add(fileName);
      }
      
      // Adicionar imagens adicionais dos bares
      if (Array.isArray(bar.additional_images)) {
        bar.additional_images.forEach(imgUrl => {
          if (imgUrl) {
            const fileName = extractFileNameFromUrl(imgUrl);
            if (fileName) usedFileNames.add(fileName);
          }
        });
      }
    });
    
    // Adicionar imagens dos eventos
    eventsData.forEach(event => {
      if (event.image) {
        const fileName = extractFileNameFromUrl(event.image);
        if (fileName) usedFileNames.add(fileName);
      }
    });
    
    // 5. Identificar arquivos não utilizados
    const unusedFiles = storageFiles.filter(file => !usedFileNames.has(file.name));
    
    console.log(`Encontrados ${unusedFiles.length} arquivos não utilizados em ${bucketName}`);
    
    // 6. Excluir arquivos não utilizados
    if (unusedFiles.length > 0) {
      for (const file of unusedFiles) {
        const { error } = await supabase.storage
          .from(bucketName)
          .remove([file.name]);
        
        if (error) {
          console.error(`Erro ao excluir arquivo ${file.name}:`, error);
        } else {
          console.log(`Arquivo não utilizado removido: ${file.name}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao limpar imagens não utilizadas:', error);
    return false;
  }
};

// Função auxiliar para extrair o nome do arquivo de uma URL
const extractFileNameFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  try {
    const urlParts = url.split('/');
    // O nome do arquivo geralmente é o último segmento da URL
    return urlParts[urlParts.length - 1];
  } catch (error) {
    console.error('Erro ao extrair nome do arquivo da URL:', error);
    return null;
  }
}; 