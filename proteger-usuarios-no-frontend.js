// proteger-usuarios-no-frontend.js
// Funções para implementar no frontend para proteção adicional de super_admin

/**
 * Retorna true se o usuário for um super_admin
 */
export const isSuperAdmin = (user) => {
  return user?.role === 'super_admin';
};

/**
 * Verifica se uma operação de exclusão é permitida
 * Retorna um objeto { allowed: boolean, message: string }
 */
export const canDeleteUser = (targetUser, currentUser) => {
  // Não permitir exclusão de super_admin
  if (targetUser?.role === 'super_admin') {
    return { 
      allowed: false, 
      message: "Não é possível excluir usuários administradores (super_admin)." 
    };
  }
  
  // Verificar se o usuário atual tem permissão para excluir outros usuários
  if (!isSuperAdmin(currentUser)) {
    return { 
      allowed: false, 
      message: "Você não tem permissão para excluir usuários." 
    };
  }
  
  return { allowed: true };
};

/**
 * Verifica se uma operação de alteração de papel (role) é permitida
 * Retorna um objeto { allowed: boolean, message: string }
 */
export const canChangeUserRole = (targetUser, newRole, currentUser) => {
  // Não permitir alteração do papel de super_admin
  if (targetUser?.role === 'super_admin' && newRole !== 'super_admin') {
    return { 
      allowed: false, 
      message: "Não é possível alterar o papel de um super_admin." 
    };
  }
  
  // Verificar se o usuário atual tem permissão para alterar papéis
  if (!isSuperAdmin(currentUser)) {
    return { 
      allowed: false, 
      message: "Você não tem permissão para alterar papéis de usuários." 
    };
  }
  
  return { allowed: true };
};

/**
 * Função a ser usada antes de fazer requisições de exclusão
 * Retorna uma Promise que resolve se a operação for permitida, ou rejeita com um erro se não for
 */
export const validateDeleteOperation = async (targetId, currentUser, supabase) => {
  try {
    // Verificar se o usuário atual é super_admin
    if (!isSuperAdmin(currentUser)) {
      throw new Error("Você não tem permissão para excluir usuários.");
    }
    
    // Buscar dados do usuário alvo
    const { data: targetUser, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', targetId)
      .single();
    
    if (error) throw error;
    
    // Verificar se é um super_admin
    if (targetUser?.role === 'super_admin') {
      throw new Error("Não é possível excluir contas de administrador (super_admin).");
    }
    
    return true;
  } catch (error) {
    console.error("Erro na validação:", error);
    throw error;
  }
}; 