/**
 * Este script ajuda a encontrar onde está o código que bloqueia usuários comuns
 * de acessar a página Admin
 */

/*
Palavras-chave para procurar nos arquivos:
1. "super_admin"
2. "role"
3. "admin"
4. "navigate('/login')"
5. "redirect"
6. "PrivateRoute" ou "ProtectedRoute"
7. "isAdmin" ou "isSuperAdmin"

Arquivos para verificar:
1. src/components/PrivateRoute.tsx (ou .jsx)
2. src/routes/ProtectedRoute.tsx (ou .jsx)
3. src/App.tsx
4. src/router.tsx (ou router/index.tsx)
5. src/pages/Admin.tsx
6. src/context/AuthContext.tsx
*/

// Possíveis locais onde a verificação pode estar:

// POSSIBILIDADE 1: Em um componente de rota protegida
// Exemplo:
/*
export const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  
  // AQUI - Esta linha bloqueia acesso para não-admin
  if (!user || user.role !== 'super_admin') {
    return <Navigate to="/login" />;
  }
  
  return children;
};
*/

// POSSIBILIDADE 2: Em um useEffect dentro do componente Admin
// Exemplo:
/*
const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // AQUI - Este useEffect bloqueia acesso
    if (!user || user.role !== 'super_admin') {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Resto do componente...
}
*/

// POSSIBILIDADE 3: Em um contexto de autenticação
// Exemplo:
/*
export const AuthProvider = ({ children }) => {
  // ...
  
  const checkAccess = (requiredRole) => {
    // AQUI - Esta função pode estar verificando roles
    return user && user.role === requiredRole;
  };
  
  return (
    <AuthContext.Provider value={{ user, checkAccess }}>
      {children}
    </AuthContext.Provider>
  );
};
*/

// POSSIBILIDADE 4: Na definição de rotas
// Exemplo:
/*
<Routes>
  <Route path="/" element={<Home />} />
  <Route 
    path="/admin" 
    element={
      <RequireAuth requiredRole="super_admin"> // AQUI - Está exigindo role
        <AdminPage />
      </RequireAuth>
    } 
  />
</Routes>
*/

/**
 * INSTRUÇÕES PARA CORRIGIR:
 * 
 * 1. Ao encontrar a verificação de role, remova ou modifique:
 *    - De: user.role === 'super_admin'
 *    - Para: simplesmente verificar se o usuário está logado (user !== null)
 * 
 * 2. Se a verificação estiver em uma prop passada ao componente:
 *    - Procure por algo como <PrivateRoute requiredRole="super_admin">
 *    - Remova a prop requiredRole ou passe um valor que todos os usuários têm
 * 
 * 3. Verifique se o componente Admin está renderizando corretamente para usuários comuns:
 *    - Deve verificar o role do usuário apenas para mostrar interfaces diferentes
 *    - Não deve bloquear acesso completamente
 */ 