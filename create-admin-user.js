// Arquivo para criar manualmente um usuário administrador
// Execute este script em uma página HTML temporária ou no console do navegador

async function createAdminUser() {
  // Substitua estas constantes pela URL e chave anônima do seu projeto Supabase
  const SUPABASE_URL = 'https://ikuxbrtbayefaqfiuiop.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrdXhicnRiYXllZmFxZml1aW9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDYwMDk5OSwiZXhwIjoyMDYwMTc2OTk5fQ.NsOSnC5OdXkpX76okI4t4Nx7aDlywDz6RkVGLpvg4GA';

  console.log('Iniciando criação de usuário administrador...');
  
  try {
    // Criar um cliente do Supabase
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Dados do usuário
    const email = 'marcos.rherculano@gmail.com';
    const password = 'markinhos123'; // Senha mais forte com pelo menos 6 caracteres
    const userData = {
      name: 'Marcos Herculano',
      role: 'super_admin'
    };
    
    // 1. Verificar se o usuário já existe
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
      
    if (checkError) {
      console.error('Erro ao verificar usuário existente:', checkError);
      return;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('Usuário já existe, atualizando para administrador...');
      
      // Obter ID do usuário existente
      const userId = existingUsers[0].id;
      
      // Atualizar para administrador
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'super_admin', approved: true })
        .eq('id', userId);
        
      if (updateError) {
        console.error('Erro ao atualizar usuário para admin:', updateError);
        return;
      }
      
      console.log('Usuário atualizado com sucesso para super_admin!');
      return;
    }
    
    // 2. Criar um novo usuário
    console.log('Criando novo usuário...');
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (signUpError) {
      console.error('Erro ao criar usuário:', signUpError);
      return;
    }
    
    console.log('Usuário criado com sucesso!', authData);
    
    if (authData && authData.user) {
      // 3. Atualizar role para super_admin
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          role: 'super_admin',
          approved: true
        })
        .eq('id', authData.user.id);
        
      if (updateError) {
        console.error('Erro ao atualizar usuário para admin:', updateError);
        return;
      }
      
      console.log('Usuário configurado como super_admin com sucesso!');
    }
  } catch (error) {
    console.error('Erro durante o processo:', error);
  }
}

// Você pode executar esta função no console do navegador
// ou adicionar um botão em uma página HTML temporária

// Para executar no console do navegador:
// 1. Abra seu site
// 2. Cole este código no console (F12 > Console)
// 3. Execute createAdminUser() 