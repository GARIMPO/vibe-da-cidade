import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import AllBars from '@/pages/AllBars';
import Admin from '@/pages/Admin';
import Login from '@/pages/Login';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookieConsent from '@/components/CookieConsent';

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

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
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
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/termos" element={<TermsOfService />} />
        </Routes>
        <CookieConsent />
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
};

export default App;