import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import CookieConsent from '@/components/CookieConsent';
import LoadingScreen from '@/components/LoadingScreen';
import { preloadCommonImages } from '@/lib/preloadImages';

// Criar o cliente do React Query com configurações melhoradas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: true, // Atualizado para true para refetchar ao voltar à página
      refetchOnMount: true, // Atualizado para true para refetchar ao montar
      refetchOnReconnect: true, // Atualizado para true para refetchar ao reconectar
      retry: 1,
      gcTime: 10 * 60 * 1000, // 10 minutos
    },
  },
});

// Lazy loading para componentes pesados
const Index = lazy(() => import('@/pages/Index'));
const AllBars = lazy(() => import('@/pages/AllBars'));
const Admin = lazy(() => import('@/pages/Admin'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Marketing = lazy(() => import('@/pages/Marketing'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const BarStats = lazy(() => import('@/components/BarStats'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const App: React.FC = () => {
  // Pré-carregar imagens comuns quando o app iniciar
  useEffect(() => {
    // Iniciar o pré-carregamento de imagens de alta prioridade
    preloadCommonImages(1);
    
    // Programar o carregamento de imagens de menor prioridade para mais tarde
    const timer = setTimeout(() => {
      preloadCommonImages(2);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/bares" element={<AllBars />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/privacidade" element={<PrivacyPolicy />} />
            <Route path="/termos" element={<TermsOfService />} />
            <Route 
              path="/bar-stats" 
              element={
                <ProtectedRoute>
                  <BarStats />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <CookieConsent />
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
};

export default App;