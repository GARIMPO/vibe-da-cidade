import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import CookieConsent from '@/components/CookieConsent';
import LoadingScreen from '@/components/LoadingScreen';
import { preloadCommonImages } from '@/lib/preloadImages';
import BarStats from '@/components/BarStats';
import PromotionalBanners from '@/components/PromotionalBanners';

// Lazy loading para outras páginas
const Index = lazy(() => import('@/pages/Index'));
const AllBars = lazy(() => import('@/pages/AllBars'));
const Admin = lazy(() => import('@/pages/Admin'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Marketing = lazy(() => import('@/pages/Marketing'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const ArtistContacts = lazy(() => import('@/pages/ArtistContacts'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Criar o cliente do React Query com configurações melhoradas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1,
      gcTime: 10 * 60 * 1000, // 10 minutos
    },
  },
});

const App: React.FC = () => {
  // Pré-carregar imagens comuns quando o app iniciar
  React.useEffect(() => {
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
            <Route 
              path="/banners-promocionais" 
              element={
                <ProtectedRoute>
                  <PromotionalBanners />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contatos-artistas" 
              element={
                <ProtectedRoute>
                  <ArtistContacts />
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