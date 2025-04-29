import { useQuery } from '@tanstack/react-query';
import { getBars, getEvents } from '@/lib/supabase';

// Hook para obter a lista de bares do Supabase
export function useBars() {
  return useQuery({
    queryKey: ['bars'],
    queryFn: getBars,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
  });
}

// Hook para obter a lista de eventos do Supabase
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
  });
} 