import { useQuery } from '@tanstack/react-query';
import { getBars, getEvents } from '@/lib/supabase';

// Hook para obter a lista de bares do Supabase
export function useBars() {
  return useQuery({
    queryKey: ['bars'],
    queryFn: getBars,
    staleTime: 1000, // 1 segundo
    refetchOnWindowFocus: true,
  });
}

// Hook para obter a lista de eventos do Supabase
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
    staleTime: 1000, // 1 segundo
    refetchOnWindowFocus: true,
  });
} 