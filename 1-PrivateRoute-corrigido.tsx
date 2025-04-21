import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // ajuste este caminho conforme seu projeto

/**
 * Componente corrigido de PrivateRoute - permite acesso para qualquer usuário logado
 * Substitua o código do seu componente PrivateRoute por este
 */
export const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // ✅ CORRETO: Verifica apenas se o usuário está logado
    // ❌ INCORRETO: Verificar se é super_admin (user.role === 'super_admin')
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);
  
  if (loading) {
    return <div>Carregando...</div>;
  }
  
  // ✅ CORRETO: Retorna as children se o usuário estiver logado
  // ❌ INCORRETO: Verificar role (user && user.role === 'super_admin')
  return user ? children : null;
}; 