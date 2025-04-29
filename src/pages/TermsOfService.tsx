import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      <main className="flex-grow py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">Termos de Uso</h1>
          
          <div className="space-y-8 text-white/80">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Termos</h2>
              <p>
                Ao acessar o site Vibe da Cidade, você concorda em cumprir estes termos de uso, todas as leis 
                e regulamentos aplicáveis e concorda que é responsável pelo cumprimento de quaisquer leis locais 
                aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">2. Licença de Uso</h2>
              <p>
                É concedida permissão para download temporário de uma cópia dos materiais no site Vibe da Cidade 
                apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, 
                não uma transferência de título, e sob esta licença você não pode:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Modificar ou copiar os materiais</li>
                <li>Usar os materiais para qualquer finalidade comercial</li>
                <li>Remover quaisquer direitos autorais ou outras notações de propriedade</li>
                <li>Transferir os materiais para outra pessoa ou 'espelhar' os materiais em qualquer outro servidor</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">3. Isenção de Responsabilidade</h2>
              <p>
                Os materiais no site do Vibe da Cidade são fornecidos 'como estão'. O Vibe da Cidade não oferece 
                garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, 
                incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim 
                específico ou não violação de propriedade intelectual ou outra violação de direitos.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">4. Limitações</h2>
              <p>
                Em nenhum caso o Vibe da Cidade ou seus fornecedores serão responsáveis por quaisquer danos 
                decorrentes do uso ou da incapacidade de usar os materiais do Vibe da Cidade, mesmo que o 
                Vibe da Cidade ou um representante autorizado tenha sido notificado, oralmente ou por escrito, 
                da possibilidade de tais danos.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">5. Revisões e Erratas</h2>
              <p>
                Os materiais exibidos no site do Vibe da Cidade podem incluir erros técnicos, tipográficos ou 
                fotográficos. O Vibe da Cidade não garante que qualquer material em seu site seja preciso, 
                completo ou atual. O Vibe da Cidade pode fazer alterações nos materiais contidos em seu 
                site a qualquer momento, sem aviso prévio.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">6. Links</h2>
              <p>
                O Vibe da Cidade não analisou todos os sites vinculados ao seu site e não é responsável pelo conteúdo de nenhum site vinculado. A inclusão de quaisquer link ou imagem por nossos clientes é de unica e exclusividade de responsabilidade do mesmo, não implica endosso por parte do Vibe da Cidade do site. O uso de qualquer site inserido e vinculado por algum estabelecimento, é por conta e risco do usuário. (Denúncias garimpodeofertas2025@gmail.com)
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">7. Modificações dos Termos de Uso</h2>
              <p>
                O Vibe da Cidade pode revisar estes termos de uso de seu site a qualquer momento, sem aviso prévio. 
                Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de uso.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">8. Lei Aplicável</h2>
              <p>
                Estes termos e condições são regidos e interpretados de acordo com as leis brasileiras.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService; 