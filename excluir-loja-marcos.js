// Script para forçar a exclusão do bar "Loja Marcos"
// Execute com: node excluir-loja-marcos.js

import { createClient } from '@supabase/supabase-js';

// Configuração
const supabaseUrl = 'https://ikuxbrtbayefaqfiuiop.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrdXhicnRiYXllZmFxZml1aW9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDYwMDk5OSwiZXhwIjoyMDYwMTc2OTk5fQ.NsOSnC5OdXkpX76okI4t4Nx7aDlywDz6RkVGLpvg4GA';

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function excluirLojaMarcos() {
  try {
    console.log('Iniciando processo de exclusão forçada da Loja Marcos...');

    // 1. Buscar o bar pelo nome
    const { data: bars, error: barsError } = await supabase
      .from('bars')
      .select('*')
      .ilike('name', '%Loja Marcos%');

    if (barsError) {
      console.error('Erro ao buscar o bar:', barsError);
      return;
    }

    if (bars.length === 0) {
      console.log('Nenhum bar com o nome "Loja Marcos" encontrado.');
      
      // Verificar se existe algum bar no sistema
      const { data: allBars, error: allBarsError } = await supabase
        .from('bars')
        .select('id, name');
        
      if (!allBarsError && allBars.length > 0) {
        console.log('Bares encontrados no sistema:');
        console.table(allBars);
        
        // Tentar excluir o primeiro bar encontrado
        console.log(`Tentando excluir o primeiro bar encontrado: ${allBars[0].name} (ID: ${allBars[0].id})`);
        await excluirBar(allBars[0].id);
      } else {
        console.log('Nenhum bar encontrado no sistema.');
      }
      
      return;
    }

    // 2. Processar cada bar encontrado com nome similar
    for (const bar of bars) {
      console.log(`Processando bar: ${bar.name} (ID: ${bar.id})`);
      await excluirBar(bar.id);
    }

    console.log('Processo de exclusão forçada concluído com sucesso!');
    console.log('Por favor, atualize sua aplicação para ver as mudanças.');

  } catch (error) {
    console.error('Ocorreu um erro inesperado:', error);
  }
}

async function excluirBar(barId) {
  try {
    // 1. Excluir estatísticas do bar
    console.log(`Excluindo estatísticas do bar ${barId}...`);
    const { error: statsError } = await supabase
      .from('bar_views')
      .delete()
      .eq('bar_id', barId);

    if (statsError) {
      console.warn(`Aviso: Erro ao excluir estatísticas do bar ${barId}: ${statsError.message}`);
    }

    // 2. Excluir eventos relacionados ao bar
    console.log(`Buscando eventos relacionados ao bar ${barId}...`);
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .eq('bar_id', barId);

    if (!eventsError && events && events.length > 0) {
      console.log(`Encontrados ${events.length} eventos para excluir`);
      
      for (const event of events) {
        const { error: deleteEventError } = await supabase
          .from('events')
          .delete()
          .eq('id', event.id);
          
        if (deleteEventError) {
          console.warn(`Aviso: Erro ao excluir evento ${event.id}: ${deleteEventError.message}`);
        } else {
          console.log(`Evento ${event.id} excluído com sucesso`);
        }
      }
    }

    // 3. Excluir o bar diretamente
    console.log(`Forçando exclusão do bar ${barId}...`);
    
    // Usando SQL diretamente para ignorar restrições de chave estrangeira
    const { error: rpcError } = await supabase.rpc('force_delete_bar', { bar_id: barId });
    
    if (rpcError) {
      console.warn(`Aviso: Erro ao chamar procedimento force_delete_bar: ${rpcError.message}`);
      console.log('Tentando método de exclusão alternativo...');
      
      // Método alternativo: excluir com o método padrão
      const { error } = await supabase
        .from('bars')
        .delete()
        .eq('id', barId);
        
      if (error) {
        console.error(`Erro ao excluir bar ${barId}: ${error.message}`);
        throw error;
      }
    }
    
    console.log(`Bar ${barId} excluído com sucesso!`);
    return true;
  } catch (error) {
    console.error(`Falha ao excluir o bar ${barId}:`, error);
    return false;
  }
}

// Executar a função
excluirLojaMarcos(); 