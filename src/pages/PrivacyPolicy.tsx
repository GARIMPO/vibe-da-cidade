import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      <main className="flex-grow py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">Política de Privacidade</h1>
          
          <div className="space-y-8 text-white/80">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Informações Coletadas</h2>
              <p>
                O Vibe da Cidade coleta apenas os e-mails dos anunciantes e, no caso de todos os usuários, apenas as informações básicas necessárias para o funcionamento do site. Esses dados são registrados automaticamente durante o uso dos nossos serviços. Reforçamos que não coletamos dados sensíveis dos usuários.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">2. Uso das Informações</h2>
              <p>
                As informações que coletamos são utilizadas para:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Personalizar sua experiência</li>
                <li>Melhorar nosso site com base no feedback e uso</li>
                <li>Administrar informações simples de clientes cadastrados em nosso site.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">3. Proteção de Informações</h2>
              <p>
                Implementamos diversas medidas de segurança para proteger suas informações pessoais. 
                Utilizamos criptografia para proteger informações sensíveis transmitidas online e armazenamos 
                dados em ambientes seguros.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">4. Cookies</h2>
              <p>
                Usamos cookies para melhorar o acesso ao nosso site e identificar visitantes recorrentes. 
                Os cookies nos ajudam a rastrear quais páginas fornecem mais interesse aos usuários, tornando 
                sua experiência mais eficiente.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">5. Compartilhamento de Informações</h2>
              <p>
                Não vendemos, comercializamos ou transferimos suas informações pessoais para terceiros. 
                Isso não inclui parceiros confiáveis que nos ajudam a operar nosso site ou prestar serviços, 
                desde que concordem em manter essas informações confidenciais.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">6. Consentimento</h2>
              <p>
                Ao usar nosso site, você concorda com nossa política de privacidade.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">7. Alterações na Política de Privacidade</h2>
              <p>
                Quaisquer alterações em nossa política de privacidade serão publicadas nesta página. 
                Esta política foi atualizada pela última vez em 16 de Abril de 2025.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">8. Contato</h2>
              <p>
                Se tiver dúvidas sobre esta política de privacidade, entre em contato pelo e-mail: 
                <a href="mailto:Garimpodeofertas2025@gmail.com" className="text-nightlife-400 hover:underline ml-1">
                  Garimpodeofertas2025@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy; 