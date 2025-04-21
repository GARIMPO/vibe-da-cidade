import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // ajuste este caminho conforme seu projeto
import { useAuth } from '../contexts/AuthContext'; // ajuste este caminho conforme seu projeto

/**
 * Página Admin corrigida - adapta a interface com base no tipo de usuário
 * Substitua o código da sua página Admin por este, ajustando conforme necessário
 * para seu projeto específico
 */
const AdminPage = () => {
  const { user } = useAuth();
  const [bars, setBars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Verifica se o usuário é super_admin para mostrar interfaces diferentes
  const isSuperAdmin = user?.role === 'super_admin';
  
  useEffect(() => {
    fetchBars();
  }, []);
  
  const fetchBars = async () => {
    setLoading(true);
    
    try {
      // A consulta é a mesma para todos os usuários
      // O RLS (Row Level Security) do Supabase já filtrará automaticamente:
      // - Usuários comuns verão apenas seus próprios bares
      // - Super admin verá todos os bares
      const { data, error } = await supabase
        .from('bars')
        .select('*');
      
      if (error) throw error;
      
      setBars(data || []);
    } catch (err) {
      console.error('Erro ao carregar bares:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Função para criar um novo bar
  const handleCreateBar = async (barData) => {
    try {
      // Adicionar o user_id ao bar sendo criado
      const newBar = {
        ...barData,
        user_id: user.id,
      };
      
      const { data, error } = await supabase
        .from('bars')
        .insert([newBar])
        .select();
      
      if (error) throw error;
      
      // Recarregar a lista de bares
      fetchBars();
      
      return { success: true };
    } catch (err) {
      console.error('Erro ao criar bar:', err);
      return { success: false, error: err.message };
    }
  };
  
  if (loading) {
    return <div>Carregando...</div>;
  }
  
  if (error) {
    return <div>Erro ao carregar dados: {error}</div>;
  }
  
  return (
    <div className="admin-container">
      <h1>
        {isSuperAdmin ? 'Painel Administrativo' : 'Gerenciar Meu Bar'}
      </h1>
      
      {isSuperAdmin ? (
        // Interface para super_admin
        <div>
          <h2>Todos os Bares</h2>
          <div className="bars-grid">
            {bars.map(bar => (
              <div key={bar.id} className="bar-card">
                <h3>{bar.name}</h3>
                <p>{bar.description}</p>
                <div className="actions">
                  <button onClick={() => handleEditBar(bar)}>Editar</button>
                  <button onClick={() => handleDeleteBar(bar.id)}>Excluir</button>
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
              <div className="bar-details">
                {bars.map(bar => (
                  <div key={bar.id} className="bar-card">
                    <h3>{bar.name}</h3>
                    <p>{bar.description}</p>
                    <div className="actions">
                      <button onClick={() => handleEditBar(bar)}>Editar Meu Bar</button>
                      <button onClick={() => handleDeleteBar(bar.id)}>Excluir Meu Bar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // O usuário ainda não tem um bar
            <div>
              <h2>Registrar Meu Bar</h2>
              <form onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const barData = {
                  name: formData.get('name'),
                  description: formData.get('description'),
                  address: formData.get('address'),
                  // Adicione outros campos conforme necessário
                };
                handleCreateBar(barData);
              }}>
                <div className="form-group">
                  <label>Nome do Bar</label>
                  <input type="text" name="name" required />
                </div>
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea name="description" required></textarea>
                </div>
                <div className="form-group">
                  <label>Endereço</label>
                  <input type="text" name="address" required />
                </div>
                {/* Adicione outros campos conforme necessário */}
                <button type="submit">Registrar Bar</button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage; 