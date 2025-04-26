import React, { useEffect, useState, lazy, Suspense, memo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, ArrowLeft, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

// Lazy load do gráfico para reduzir o tamanho inicial do bundle
const ChartComponent = lazy(() => import('./StatsChart'));

interface BarView {
  id: number;
  bar_id: number;
  view_count: number;
  last_viewed: string;
  bar_name?: string;
}

// Componente de Card de estatísticas memorizado para evitar re-renderizações desnecessárias
const StatCard = memo(({ stat, onResetViews }: { stat: BarView, onResetViews: (barId: number) => Promise<void> }) => {
  const [isResetting, setIsResetting] = useState(false);

  const handleResetViews = async () => {
    try {
      setIsResetting(true);
      await onResetViews(stat.bar_id);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card key={stat.id} className="bg-gray-800/50 border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-nightlife-400" />
          {stat.bar_name}
        </CardTitle>
        <CardDescription className="text-white/70">
          Estatísticas de visualização
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-white/70">Total de visualizações:</span>
            <span className="text-xl font-bold text-nightlife-400">{stat.view_count}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/70">Última visualização:</span>
            <span className="text-white/90">
              {new Date(stat.last_viewed).toLocaleDateString()}
            </span>
          </div>
          
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-white/10 hover:bg-red-900/20 flex items-center justify-center gap-2"
              onClick={handleResetViews}
              disabled={isResetting}
            >
              <RefreshCcw className="h-4 w-4" />
              {isResetting ? 'Zerando...' : 'Zerar visualizações'}
            </Button>
          </div>
          
          {/* Gráfico carregado de forma lazy */}
          <div className="h-40 mt-4">
            <Suspense fallback={<div className="h-full flex items-center justify-center text-white/50">Carregando gráfico...</div>}>
              <ChartComponent viewCount={stat.view_count} />
            </Suspense>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

const BarStats: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<BarView[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchStats = async () => {
    if (!user) return;
    
    try {
      // Verificar se o usuário é admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      const isUserAdmin = userData?.role === 'super_admin';
      setIsAdmin(isUserAdmin);
      
      if (isUserAdmin) {
        // Admin vê todos os bares - otimizado para buscar somente dados essenciais
        const { data: viewData, error } = await supabase
          .from('bar_views')
          .select(`
            id,
            bar_id,
            view_count,
            last_viewed,
            bars:bar_id(name)
          `)
          .order('view_count', { ascending: false });
        
        if (error) return;
        
        // Remover duplicações: manter apenas um card por bar_id (o com maior contagem)
        const uniqueBarIds = new Map();
        
        // Para cada entrada, vamos manter apenas a de maior visualização por bar
        viewData.forEach(item => {
          const existingItem = uniqueBarIds.get(item.bar_id);
          if (!existingItem || existingItem.view_count < item.view_count) {
            uniqueBarIds.set(item.bar_id, item);
          }
        });
        
        // Converter o Map de volta para um array
        const uniqueViewData = Array.from(uniqueBarIds.values());
        
        // Formatar os dados para incluir o nome do bar
        const formattedData = uniqueViewData.map(item => ({
          ...item,
          bar_name: item.bars ? (item.bars as any).name || 'Bar sem nome' : 'Bar sem nome'
        }));
        
        setStats(formattedData);
      } else {
        // Usuário normal vê apenas seu próprio bar
        const { data: barData } = await supabase
          .from('bars')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (barData) {
          const { data: viewData, error } = await supabase
            .from('bar_views')
            .select(`
              id,
              bar_id,
              view_count,
              last_viewed,
              bars:bar_id(name)
            `)
            .eq('bar_id', barData.id)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            console.error('Erro ao buscar estatísticas:', error);
          }
          
          if (viewData) {
            setStats([{
              ...viewData,
              bar_name: viewData.bars ? (viewData.bars as any).name || 'Bar sem nome' : 'Bar sem nome'
            }]);
          } else {
            // Se não houver dados, criar um registro vazio
            setStats([{
              id: 0,
              bar_id: barData.id,
              view_count: 0,
              last_viewed: new Date().toISOString(),
              bar_name: 'Bar sem nome'
            }]);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetViews = async (barId: number) => {
    try {
      // Atualizar as visualizações para zero
      const { error } = await supabase
        .from('bar_views')
        .update({ 
          view_count: 0,
          last_viewed: new Date().toISOString() 
        })
        .eq('bar_id', barId);
      
      if (error) {
        throw error;
      }
      
      // Atualizar os dados na UI
      await fetchStats();
      
      toast({
        title: "Visualizações zeradas",
        description: "O contador de visualizações foi resetado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao zerar visualizações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível zerar as visualizações. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isMounted) {
        setLoading(true);
        await fetchStats();
      }
    };
    
    loadData();
    
    // Cleanup para evitar memory leaks
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-t-2 border-nightlife-400 rounded-full animate-spin mb-4"></div>
            <p>Carregando estatísticas...</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex items-center mb-6">
          <Link to="/admin">
            <Button variant="outline" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Admin
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Estatísticas de Visualização</h1>
        </div>
        
        {stats.length === 0 ? (
          <Card className="bg-gray-800/50 border-white/10">
            <CardContent className="pt-6">
              <p className="text-center text-white/70">Nenhuma estatística disponível.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.map((stat) => (
              <StatCard key={stat.id} stat={stat} onResetViews={resetViews} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(BarStats); 