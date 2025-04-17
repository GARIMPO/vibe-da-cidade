/**
 * CORREÇÕES COMPLETAS PARA PERMITIR QUE USUÁRIOS COMUNS ACESSEM A ÁREA ADMIN
 * 
 * Este arquivo contém diversas correções que podem ser necessárias dependendo
 * de como seu código está estruturado. Vamos cobrir os casos mais comuns.
 */

// ========== CORREÇÃO PARA App.tsx ou router.tsx ==========
// Se o bloqueio estiver na definição de rotas:

/*
// ANTES:
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route 
    path="/admin" 
    element={
      <PrivateRoute requiredRole="super_admin">
        <Admin />
      </PrivateRoute>
    } 
  />
</Routes>

// DEPOIS:
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route 
    path="/admin" 
    element={
      <PrivateRoute>
        <Admin />
      </PrivateRoute>
    } 
  />
</Routes>
*/

// ========== CORREÇÃO PARA PrivateRoute.tsx ==========
// Se o componente PrivateRoute estiver verificando a role:

/*
// ANTES:
export const PrivateRoute = ({ children, requiredRole = "super_admin" }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user || user.role !== requiredRole) {
      navigate('/login');
    }
  }, [user, navigate, requiredRole]);
  
  return user && user.role === requiredRole ? children : null;
};

// DEPOIS:
export const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  return user ? children : null;
};
*/

// ========== CORREÇÃO PARA Admin.tsx - useEffect ==========
// Se a verificação estiver dentro do componente Admin:

/*
// ANTES:
const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user || user.role !== 'super_admin') {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Resto do componente...
};

// DEPOIS:
const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Resto do componente...
};
*/

// ========== CORREÇÃO PARA Admin.tsx - Interface ==========
// Adicionando interface adaptativa para usuários comuns:

/*
const AdminPage = () => {
  const { user } = useAuth();
  const [bars, setBars] = useState([]);
  
  // Verificar se é super_admin para adaptar a interface
  const isSuperAdmin = user?.role === 'super_admin';
  
  useEffect(() => {
    if (user) {
      fetchBars();
    }
  }, [user]);
  
  const fetchBars = async () => {
    // A consulta é a mesma para todos os usuários
    // RLS vai filtrar automaticamente
    const { data, error } = await supabase
      .from('bars')
      .select('*');
    
    if (!error) {
      setBars(data || []);
    }
  };
  
  return (
    <div className="admin-container">
      <h1>
        {isSuperAdmin ? 'Painel Administrativo' : 'Gerenciar Meu Bar'}
      </h1>
      
      {isSuperAdmin ? (
        // Interface para super_admin
        <div>
          <h2>Todos os Bares</h2>
          <div className="bars-list">
            {bars.map(bar => (
              <div key={bar.id} className="bar-item">
                <h3>{bar.name}</h3>
                <div className="actions">
                  <button onClick={() => handleEdit(bar)}>Editar</button>
                  <button onClick={() => handleDelete(bar.id)}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Interface para usuário comum
        <div>
          {bars.length > 0 ? (
            // O usuário já tem um bar
            <div>
              <h2>Meu Bar</h2>
              {bars.map(bar => (
                <div key={bar.id} className="my-bar">
                  <h3>{bar.name}</h3>
                  <p>{bar.description}</p>
                  <div className="actions">
                    <button onClick={() => handleEdit(bar)}>Editar Meu Bar</button>
                    <button onClick={() => handleDelete(bar.id)}>Excluir Meu Bar</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // O usuário ainda não tem um bar
            <div>
              <h2>Registrar Meu Bar</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nome do Bar</label>
                  <input type="text" name="name" required />
                </div>
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea name="description" required></textarea>
                </div>
                <button type="submit">Adicionar Meu Bar</button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
*/

// ========== CORREÇÃO PARA função handleCreateBar ==========
// Garantindo que user_id é associado ao bar:

/*
const handleCreateBar = async (formData) => {
  try {
    // Adiciona o user_id automaticamente
    const barData = {
      ...formData,
      user_id: user.id
    };
    
    const { data, error } = await supabase
      .from('bars')
      .insert([barData])
      .select();
    
    if (error) throw error;
    
    // Atualiza a lista
    fetchBars();
    
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao criar bar:', error);
    return { success: false, error };
  }
};
*/

// ========== CORREÇÃO PARA RequireAuth.tsx ==========
// Se estiver usando um componente RequireAuth:

/*
// ANTES:
export const RequireAuth = ({ children, requiredRole }) => {
  const { user, checkAccess } = useAuth();
  
  if (!user || !checkAccess(requiredRole)) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// DEPOIS:
export const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};
*/

// ========== CORREÇÃO PARA AuthContext.tsx ==========
// Se a verificação estiver no contexto de autenticação:

/*
// ANTES:
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  // Outras funções...
  
  const checkAccess = (requiredRole) => {
    return user && user.role === requiredRole;
  };
  
  return (
    <AuthContext.Provider value={{ user, checkAccess, /* outras props */ }}>
      {children}
    </AuthContext.Provider>
  );
};

// DEPOIS:
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  // Outras funções...
  
  const checkAccess = () => {
    return !!user; // Apenas verifica se o usuário está logado
  };
  
  return (
    <AuthContext.Provider value={{ user, checkAccess, /* outras props */ }}>
      {children}
    </AuthContext.Provider>
  );
};
*/

/**
 * INSTRUÇÕES FINAIS:
 * 
 * 1. Procure no seu código por verificações que incluam "super_admin" ou roles específicas
 * 2. Substitua essas verificações para apenas verificar se o usuário está logado
 * 3. Adapte a interface do Admin para mostrar conteúdo diferente baseado no tipo de usuário
 * 4. A políticas RLS do Supabase cuidarão de restringir o acesso aos dados
 * 
 * Lembre-se que o importante é:
 * - Remover bloqueios de acesso à página Admin
 * - Manter a diferenciação de interface baseada no role
 * - Deixar o RLS fazer o trabalho de restringir dados
 */ 