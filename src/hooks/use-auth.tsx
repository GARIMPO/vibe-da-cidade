// Este hook foi removido pois a autenticação foi desativada no site
// Se for necessário reativar, reimplemente a lógica de autenticação
export function useAuth() {
  return {
    user: null,
    loading: false
  };
} 