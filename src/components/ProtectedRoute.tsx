// Este componente foi simplificado pois a autenticação foi desativada no site
// Agora apenas renderiza seus filhos sem verificar autenticação ou papéis

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'user';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Verificar se o usuário está autenticado
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
          setIsAuthenticated(false);
          setHasRequiredRole(false);
          setLoading(false);
          return;
        }
        
        setIsAuthenticated(true);
        
        // Se não há papel requerido, qualquer usuário autenticado pode acessar
        if (!requiredRole) {
          setHasRequiredRole(true);
          setLoading(false);
          return;
        }
        
        // Se há um papel requerido, verificar na tabela users
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', sessionData.session.user.id)
          .single();
          
        setHasRequiredRole(userData?.role === requiredRole);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
        setHasRequiredRole(false);
        setLoading(false);
      }
    }
    
    checkAuth();
  }, [requiredRole]);
  
  if (loading) {
    // Mostrar indicador de carregamento enquanto verifica a autenticação
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nightlife-500"></div>
      </div>
    );
  }
  
  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Se estiver autenticado mas não tiver o papel requerido, redirecionar para home
  if (requiredRole && !hasRequiredRole) {
    return <Navigate to="/" replace />;
  }
  
  // Se estiver autenticado e tiver o papel requerido (ou não precisar de papel específico), mostrar a rota
  return <>{children}</>;
} 