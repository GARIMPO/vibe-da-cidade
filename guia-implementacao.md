# Guia de Implementação para Corrigir Acesso à Área Admin

Este guia te ajudará a corrigir o problema onde usuários comuns não conseguem acessar a página Admin para gerenciar seus próprios bares.

## Passo 1: Encontrar e Modificar o Componente de Rota Protegida

1. Procure no seu projeto por arquivos que provavelmente contêm o componente que protege rotas:
   - `src/components/PrivateRoute.tsx` (ou .jsx)
   - `src/routes/ProtectedRoute.tsx` (ou .jsx)
   - `src/App.tsx` (se as rotas são definidas aqui)

2. Uma vez encontrado, modifique o código para remover a verificação de `super_admin`. Mude:

```jsx
// De (código atual - bloqueia usuários que não são super_admin):
if (!user || user.role !== 'super_admin') {
  navigate('/login');
}

// Para (código corrigido - apenas verifica se está logado):
if (!user) {
  navigate('/login');
}
```

E também mude:

```jsx
// De:
return user && user.role === 'super_admin' ? children : null;

// Para:
return user ? children : null;
```

Você também encontrará isso em um useEffect ou algum hook similar que verifica o acesso.

## Passo 2: Modificar a Página Admin

1. Localize sua página Admin, provavelmente em:
   - `src/pages/Admin.tsx` (ou .jsx)
   - `src/views/Admin.tsx` (ou .jsx)

2. Adicione uma verificação para identificar se o usuário é super_admin:

```jsx
const isSuperAdmin = user?.role === 'super_admin';
```

3. Adapte a interface para mostrar conteúdo diferente com base no tipo de usuário:

```jsx
return (
  <div>
    <h1>
      {isSuperAdmin ? 'Painel Administrativo' : 'Gerenciar Meu Bar'}
    </h1>
    
    {isSuperAdmin ? (
      // Interface para super_admin (ver todos os bares)
      <div>
        <h2>Todos os Bares</h2>
        {/* Lista completa de bares */}
      </div>
    ) : (
      // Interface para usuário comum (ver apenas seu bar)
      <div>
        {bars.length > 0 ? (
          <div>
            <h2>Meu Bar</h2>
            {/* Mostrar o bar do usuário */}
          </div>
        ) : (
          <div>
            <h2>Registrar Meu Bar</h2>
            {/* Formulário para criar um bar */}
          </div>
        )}
      </div>
    )}
  </div>
);
```

4. Mantenha a consulta ao Supabase sem filtros explícitos - o RLS já aplicará as restrições:

```jsx
const fetchBars = async () => {
  const { data, error } = await supabase
    .from('bars')
    .select('*');
  
  if (!error) {
    setBars(data || []);
  }
};
```

## Passo 3: Ajustar Funções de Gerenciamento de Bares

1. Quando criar um novo bar para um usuário comum, certifique-se de associar o `user_id`:

```jsx
const handleCreateBar = async (barData) => {
  const newBar = {
    ...barData,
    user_id: user.id // Associa o bar ao usuário atual
  };
  
  const { data, error } = await supabase
    .from('bars')
    .insert([newBar]);
    
  // Tratar resposta...
};
```

## Passo 4: Testar

1. Teste com diferentes tipos de usuários:
   - Login como super_admin: deve ver todos os bares
   - Login como usuário comum: deve ver apenas seu bar ou opção para criar um

2. Verifique se as políticas RLS estão funcionando corretamente:
   - Usuários comuns não devem conseguir ver bares de outros usuários
   - Usuários comuns não devem conseguir criar mais de um bar

## Observações Importantes

1. **Não filtre dados no frontend** - deixe o RLS fazer esse trabalho
2. **Não bloqueie o acesso à página Admin** para usuários comuns
3. **Adapte a UI** para mostrar controles diferentes conforme o tipo de usuário

## Código de Exemplo

Dois arquivos com exemplos de código foram criados para você:

1. `1-PrivateRoute-corrigido.tsx` - Exemplo de como deve ficar o componente de rota protegida
2. `2-AdminPage-corrigido.tsx` - Exemplo de como deve ficar a página Admin

**Adapte esses exemplos** ao seu projeto, considerando a estrutura atual do seu código. 