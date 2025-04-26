// Script para reparar o sistema e criar um bar padrão
// Execute com: node reparar-sistema.js

import { createClient } from '@supabase/supabase-js';

// Configuração
const supabaseUrl = 'https://ikuxbrtbayefaqfiuiop.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrdXhicnRiYXllZmFxZml1aW9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDYwMDk5OSwiZXhwIjoyMDYwMTc2OTk5fQ.NsOSnC5OdXkpX76okI4t4Nx7aDlywDz6RkVGLpvg4GA';

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Dados para um novo bar padrão
const barPadrao = {
  name: "Bar Modelo",
  location: "Centro, Rua Principal, 123",
  description: "Um bar incrível com ambiente agradável e diversas opções de bebidas.",
  rating: 4.7,
  tags: ["Música ao vivo", "Cerveja artesanal", "Petiscos", "Ambiente familiar"],
  phone: "(11) 99999-8888",
  hours: "Segunda: 18:00 - 00:00\nTerça: 18:00 - 00:00\nQuarta: 18:00 - 00:00\nQuinta: 18:00 - 00:00\nSexta: 18:00 - 02:00\nSábado: 18:00 - 02:00\nDomingo: 16:00 - 22:00",
  image: "https://ikuxbrtbayefaqfiuiop.supabase.co/storage/v1/object/public/bar-images/bar_padrao.jpg",
  additional_images: []
};

async function repararSistema() {
  try {
    console.log('Iniciando reparo do sistema...');

    // 1. Verificar se existem bares no sistema
    const { data: bars, error: barsError } = await supabase
      .from('bars')
      .select('id, name')
      .limit(5);

    if (barsError) {
      console.error('Erro ao verificar bares existentes:', barsError);
      return;
    }

    console.log(`Encontrados ${bars.length} bares no sistema.`);

    if (bars.length === 0) {
      console.log('Nenhum bar encontrado. Criando um bar padrão...');
      
      // Criar um bar padrão
      const { data: newBar, error: createError } = await supabase
        .from('bars')
        .insert(barPadrao)
        .select()
        .single();
        
      if (createError) {
        console.error('Erro ao criar bar padrão:', createError);
        return;
      }
      
      console.log('Bar padrão criado com sucesso!');
      console.log('Detalhes do novo bar:');
      console.log(`- ID: ${newBar.id}`);
      console.log(`- Nome: ${newBar.name}`);
      console.log(`- Localização: ${newBar.location}`);
    } else {
      console.log('Bares encontrados no sistema:');
      console.table(bars);
      
      // 2. Verificar e corrigir estatísticas de visualização
      console.log('Verificando estatísticas de visualização...');
      
      for (const bar of bars) {
        const { data: stats, error: statsError } = await supabase
          .from('bar_views')
          .select('*')
          .eq('bar_id', bar.id)
          .single();
          
        if (statsError && statsError.code === 'PGRST116') {
          console.log(`Criando estatísticas para o bar "${bar.name}" (ID: ${bar.id})...`);
          
          const { error: createStatsError } = await supabase
            .from('bar_views')
            .insert({
              bar_id: bar.id,
              view_count: 1,
              last_viewed: new Date().toISOString()
            });
            
          if (createStatsError) {
            console.warn(`Aviso: Erro ao criar estatísticas para o bar ${bar.id}:`, createStatsError);
          } else {
            console.log(`Estatísticas para o bar ${bar.id} criadas com sucesso!`);
          }
        } else if (statsError) {
          console.warn(`Aviso: Erro ao verificar estatísticas do bar ${bar.id}:`, statsError);
        } else {
          console.log(`Bar ${bar.id} já possui estatísticas: ${stats.view_count} visualizações`);
        }
      }
    }
    
    // 3. Verificar usuários e permissões
    console.log('\nVerificando usuários admin no sistema...');
    
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'super_admin');
      
    if (adminError) {
      console.error('Erro ao verificar usuários admin:', adminError);
    } else if (adminUsers.length === 0) {
      console.log('AVISO: Nenhum usuário super_admin encontrado no sistema!');
    } else {
      console.log(`Encontrados ${adminUsers.length} usuários super_admin:`);
      console.table(adminUsers);
    }

    console.log('\nReparo do sistema concluído com sucesso!');
    console.log('Por favor, atualize sua aplicação para ver as mudanças.');

  } catch (error) {
    console.error('Ocorreu um erro inesperado durante o reparo:', error);
  }
}

// Executar a função
repararSistema(); 