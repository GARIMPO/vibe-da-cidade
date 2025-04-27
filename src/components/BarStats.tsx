import React, { useEffect, useState, memo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, ArrowLeft, RefreshCcw, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface BarView {
  id: number;
  bar_id: number | string;
  view_count: number;
  last_viewed: string;
  bar_name?: string;
  bars?: {
    name: string;
  } | null;
}

// Componente de Card de estatísticas memorizado para evitar re-renderizações desnecessárias
const StatCard = memo(({ stat, onResetViews }: { stat: BarView, onResetViews: (barId: number | string) => Promise<void> }) => {
  const [isResetting, setIsResetting] = useState(false);

  const handleResetViews = async () => {
    try {
      setIsResetting(true);
      await onResetViews(stat.bar_id);
    } finally {
      setIsResetting(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/?bar=${stat.bar_id}`;
    const message = `Procurando um lugar bacana na cidade, venha para ${stat.bar_name} confira: ${url}`;
      
    // Tentar abrir o WhatsApp Web
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
          
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-white/10 hover:bg-nightlife-600/20 flex items-center justify-center gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Compartilhar meu bar agora
            </Button>
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
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error('Erro ao verificar papel do usuário:', userError);
        toast({
          title: "Erro",
          description: "Não foi possível verificar suas permissões. Tente novamente mais tarde.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
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
        
        if (error) {
          console.error('Erro ao buscar estatísticas:', error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar estatísticas. Tente novamente mais tarde.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
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
          bar_name: item.bars ? item.bars.name || 'Bar sem nome' : 'Bar sem nome'
        }));
        
        setStats(formattedData);
      } else {
        // Usuário normal vê apenas seu próprio bar
        const { data: barData, error: barError } = await supabase
          .from('bars')
          .select('id, name')
          .eq('user_id', user.id)
          .single();
        
        if (barError) {
          console.error('Erro ao buscar bar do usuário:', barError);
          toast({
            title: "Erro",
            description: "Não foi possível encontrar seu bar. Tente novamente mais tarde.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        if (barData) {
          const { data: viewData, error } = await supabase
            .from('bar_views')
            .select(`
              id,
              bar_id,
              view_count,
              last_viewed
            `)
            .eq('bar_id', barData.id)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            console.error('Erro ao buscar estatísticas:', error);
            toast({
              title: "Erro",
              description: "Não foi possível carregar estatísticas. Tente novamente mais tarde.",
              variant: "destructive"
            });
          }
          
          if (viewData) {
            setStats([{
              ...viewData,
              bar_name: barData.name || 'Meu bar'
            }]);
          } else {
            // Se não houver dados, criar um registro vazio para indicar que não há visualizações
            setStats([{
              id: 0,
              bar_id: barData.id,
              view_count: 0,
              last_viewed: new Date().toISOString(),
              bar_name: barData.name || 'Meu bar'
            }]);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetViews = async (barId: number | string) => {
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
        console.error('Erro ao zerar visualizações:', error);
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
        <div className="flex items-center mb-6">
          <Link to="/admin">
            <Button variant="outline" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Admin
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Estatísticas do Sistema</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <Skeleton className="h-6 w-1/2 bg-gray-700" />
              <Skeleton className="h-4 w-1/3 bg-gray-700" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-5 w-full bg-gray-700" />
                <Skeleton className="h-5 w-full bg-gray-700" />
                <Skeleton className="h-10 w-full bg-gray-700" />
                <Skeleton className="h-40 w-full bg-gray-700" />
              </div>
            </CardContent>
          </Card>
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
          <h1 className="text-2xl font-bold">Estatísticas do Sistema</h1>
        </div>
        
        {stats.length === 0 ? (
          <Card className="bg-gray-800/50 border-white/10">
            <CardContent className="pt-6">
              <p className="text-center text-white/70">Nenhuma estatística disponível. As visualizações serão registradas quando os usuários visualizarem os detalhes do seu bar.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <StatCard key={stat.id || String(stat.bar_id)} stat={stat} onResetViews={resetViews} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(BarStats); 