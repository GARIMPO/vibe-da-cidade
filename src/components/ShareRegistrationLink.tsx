import React, { useState } from 'react';
import { Share2, Copy, Check, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ShareRegistrationLink: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Mensagem de marketing e URL de cadastro
  const marketingMessage = "VIBE DA CIDADE, Cadastre seu estabelecimento no melhor site de busca de bares e restaurantes!";
  const registrationUrl = `${window.location.origin}/register`;
  const fullMessage = `${marketingMessage} Segue o link: ${registrationUrl}`;
  
  // Função para compartilhar no WhatsApp
  const shareOnWhatsApp = () => {
    if (!phone) {
      toast({
        title: "Telefone necessário",
        description: "Por favor, digite um número de telefone para compartilhar.",
        variant: "destructive"
      });
      return;
    }
    
    // Formatar número de telefone (remover caracteres não numéricos)
    const formattedPhone = phone.replace(/\D/g, '');
    
    // Verificar se o número tem pelo menos 10 dígitos (DDD + número)
    if (formattedPhone.length < 10) {
      toast({
        title: "Telefone inválido",
        description: "Por favor, digite um número de telefone válido com DDD.",
        variant: "destructive"
      });
      return;
    }
    
    // Criar URL do WhatsApp
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(fullMessage)}`;
    
    // Abrir link em nova janela
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Link compartilhado",
      description: "WhatsApp aberto com a mensagem de cadastro."
    });
  };
  
  // Função para copiar o link para a área de transferência
  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullMessage).then(() => {
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Link de cadastro copiado para a área de transferência."
      });
      
      // Resetar o ícone após 2 segundos
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  };
  
  return (
    <Card className="bg-gradient-to-r from-nightlife-900 to-indigo-900 border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Share2 className="h-5 w-5" />
          Compartilhar Link de Cadastro
        </CardTitle>
        <CardDescription className="text-white/70">
          Compartilhe o link de cadastro com bares e restaurantes para expandir o Vibe da Cidade
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-nightlife-950/70 rounded-md border border-white/10">
            <p className="text-sm font-medium text-white">Mensagem de divulgação:</p>
            <p className="mt-1 text-sm text-white/80">{marketingMessage}</p>
            <p className="mt-2 text-xs text-white/60 break-all">Link: {registrationUrl}</p>
          </div>
          
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="flex-1 relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                type="text"
                placeholder="Telefone com DDD (ex: 11999998888)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-nightlife-950/70 border-white/10 pl-10"
              />
            </div>
            <Button 
              onClick={shareOnWhatsApp}
              className="bg-green-600 hover:bg-green-700 min-w-[220px]"
            >
              Compartilhar via WhatsApp
            </Button>
            <Button 
              onClick={copyToClipboard}
              variant="outline"
              className="border-white/20 min-w-[100px]"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-2">{copied ? 'Copiado' : 'Copiar'}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareRegistrationLink; 