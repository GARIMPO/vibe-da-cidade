import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import AllBars from '@/pages/AllBars';
import AllEvents from '@/pages/AllEvents';
import Admin from '@/pages/Admin';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Criar o cliente do React Query
const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/bares" element={<AllBars />} />
          <Route path="/eventos" element={<AllEvents />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
};

export default App;
