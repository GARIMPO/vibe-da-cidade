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

// Função para fazer upload de imagem para o Supabase Storage
export async function uploadImage(file: File, bucket: string = 'bar-images'): Promise<string | null> {
  try {
    console.log(`Iniciando upload para o bucket ${bucket}`, file);
    console.log(`Tipo de arquivo: ${file.type}, tamanho: ${file.size} bytes`);
    
    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      console.error(`Tipo de arquivo inválido: ${file.type}. Tipos válidos: ${validTypes.join(', ')}`);
      throw new Error(`Tipo de arquivo não suportado. Use apenas: ${validTypes.join(', ')}`);
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error(`Arquivo muito grande: ${file.size} bytes. Máximo: ${maxSize} bytes`);
      throw new Error(`Arquivo muito grande. O tamanho máximo é 5MB.`);
    }
    
    // Criar um nome de arquivo único baseado no timestamp e nome original
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    console.log(`Nome do arquivo gerado: ${filePath}`);
    console.log(`Usando URL do Supabase: ${supabaseUrl}`);
    
    // Upload para o bucket especificado no Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });
    
    console.log('Resposta do upload:', { data, error });
    
    if (error) {
      console.error('Erro detalhado do Supabase:', error);
      console.error('Mensagem de erro:', error.message);
      console.error('Nome do erro:', error.name);
      console.error('Erro completo:', JSON.stringify(error, null, 2));
      
      if (error.message.includes('Permission denied')) {
        throw new Error('Permissão negada ao fazer upload da imagem. Verifique as permissões do bucket.');
      } else if (error.message.includes('Access forbidden')) {
        throw new Error('Acesso proibido. Verifique a configuração de CORS no Supabase.');
      } else if (error.message.includes('authentication')) {
        throw new Error('Erro de autenticação. Verifique a chave anônima do Supabase.');
      }
      throw error;
    }
    
    // Gerar URL pública da imagem
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    console.log('URL pública gerada:', urlData.publicUrl);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Erro ao fazer upload da imagem:", error);
    
    if (error instanceof Error) {
      console.error("Stack trace:", error.stack);
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    } else {
      console.error("Erro não é uma instância de Error:", typeof error);
      throw new Error('Ocorreu um erro desconhecido ao fazer upload da imagem');
    }
  }
} 