import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cnpj: '',
    address: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const formatCNPJ = (value: string) => {
    // Remove todos os caracteres não numéricos
    const digits = value.replace(/\D/g, '');
    
    // Limita o tamanho a 14 dígitos (CNPJ)
    const truncated = digits.slice(0, 14);
    
    // Formata o CNPJ: XX.XXX.XXX/XXXX-XX
    if (truncated.length <= 2) {
      return truncated;
    } else if (truncated.length <= 5) {
      return `${truncated.slice(0, 2)}.${truncated.slice(2)}`;
    } else if (truncated.length <= 8) {
      return `${truncated.slice(0, 2)}.${truncated.slice(2, 5)}.${truncated.slice(5)}`;
    } else if (truncated.length <= 12) {
      return `${truncated.slice(0, 2)}.${truncated.slice(2, 5)}.${truncated.slice(5, 8)}/${truncated.slice(8)}`;
    } else {
      return `${truncated.slice(0, 2)}.${truncated.slice(2, 5)}.${truncated.slice(5, 8)}/${truncated.slice(8, 12)}-${truncated.slice(12)}`;
    }
  };
  
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setFormData(prev => ({
      ...prev,
      cnpj: formatted
    }));
  };
  
  const formatPhone = (value: string) => {
    // Remove todos os caracteres não numéricos
    const digits = value.replace(/\D/g, '');
    
    // Limita o tamanho a 11 dígitos (com DDD)
    const truncated = digits.slice(0, 11);
    
    // Formata o telefone: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (truncated.length <= 2) {
      return truncated;
    } else if (truncated.length <= 6) {
      return `(${truncated.slice(0, 2)}) ${truncated.slice(2)}`;
    } else if (truncated.length <= 10) {
      return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 6)}-${truncated.slice(6)}`;
    } else {
      return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 7)}-${truncated.slice(7)}`;
    }
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({
      ...prev,
      phone: formatted
    }));
  };
  
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('O nome é obrigatório');
      return false;
    }
    
    if (!formData.phone.trim()) {
      setError('O telefone é obrigatório');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('O e-mail é obrigatório');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor, forneça um e-mail válido');
      return false;
    }
    
    if (!formData.cnpj.trim()) {
      setError('O CNPJ é obrigatório');
      return false;
    }
    
    // Verifica se o CNPJ tem o formato correto
    const cnpjNumbers = formData.cnpj.replace(/\D/g, '');
    if (cnpjNumbers.length !== 14) {
      setError('Por favor, forneça um CNPJ válido');
      return false;
    }
    
    if (!formData.address.trim()) {
      setError('O endereço é obrigatório');
      return false;
    }
    
    setError('');
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Registrar o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10), // Senha temporária aleatória
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
            address: formData.address,
            cnpj: formData.cnpj,
            role: 'client', // Definir o papel como 'client' para proprietários de estabelecimentos
          },
        },
      });
      
      if (authError) {
        throw authError;
      }
      
      // Se o registro foi bem-sucedido, guarde os dados na tabela registration_requests
      const { error: dbError } = await supabase
        .from('registration_requests')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          cnpj: formData.cnpj,
          address: formData.address,
          user_id: authData.user?.id,
          status: 'pending',
        });
      
      if (dbError) {
        throw dbError;
      }
      
      setSubmitted(true);
      
    } catch (error) {
      console.error('Erro ao registrar:', error);
      setError(error instanceof Error ? error.message : 'Ocorreu um erro ao processar o registro. Por favor, tente novamente.');
      
      toast({
        title: "Erro no registro",
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao processar o registro.',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-2 text-center">Cadastre seu estabelecimento</h1>
        <p className="text-white/70 text-center mb-8">
          Junte-se ao Vibe da Cidade e aumente a visibilidade do seu bar ou restaurante
        </p>
        
        {submitted ? (
          <Card className="bg-nightlife-900 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                Cadastro Enviado com Sucesso!
              </CardTitle>
              <CardDescription>
                Seu cadastro foi recebido e está em análise.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/70">
                Enviamos um e-mail de confirmação para <strong>{formData.email}</strong>. 
                Por favor, verifique sua caixa de entrada e confirme seu e-mail para completar o cadastro.
              </p>
              <div className="bg-green-900/20 border border-green-600/20 rounded-md p-4">
                <p className="text-green-400 font-medium">Próximos passos:</p>
                <ol className="list-decimal ml-5 mt-2 space-y-1 text-white/80">
                  <li>Confirme seu e-mail através do link enviado</li>
                  <li>Nossa equipe irá analisar os dados do seu estabelecimento</li>
                  <li>Após aprovação, você receberá as credenciais de acesso</li>
                  <li>Você poderá adicionar fotos, eventos e mais informações sobre seu estabelecimento</li>
                </ol>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-nightlife-600 hover:bg-nightlife-700"
                onClick={() => window.location.href = '/'}
              >
                Voltar para a Página Inicial
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="bg-nightlife-900 border-white/10">
            <CardHeader>
              <CardTitle>Informações do Estabelecimento</CardTitle>
              <CardDescription>
                Preencha os dados abaixo para cadastrar seu bar ou restaurante
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-900/20 border border-red-600/20 rounded-md p-3 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm text-white/70 mb-1 block">Nome do Estabelecimento*</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nome do seu bar ou restaurante"
                    className="bg-nightlife-950 border-white/20"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm text-white/70 mb-1 block">Telefone*</label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="(00) 00000-0000"
                    className="bg-nightlife-950 border-white/20"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm text-white/70 mb-1 block">E-mail*</label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="exemplo@seudominio.com"
                    className="bg-nightlife-950 border-white/20"
                    required
                  />
                  <p className="text-xs text-white/50 mt-1">
                    Você receberá um e-mail para confirmar o cadastro e acessar o sistema
                  </p>
                </div>
                
                <div>
                  <label className="text-sm text-white/70 mb-1 block">CNPJ*</label>
                  <Input
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleCNPJChange}
                    placeholder="00.000.000/0000-00"
                    className="bg-nightlife-950 border-white/20"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm text-white/70 mb-1 block">Endereço Completo*</label>
                  <Textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Rua, número, bairro, cidade - UF, CEP"
                    className="bg-nightlife-950 border-white/20 resize-none h-20"
                    required
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex-col gap-3">
                <Button 
                  type="submit" 
                  className="w-full bg-nightlife-600 hover:bg-nightlife-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Cadastrar Estabelecimento'}
                </Button>
                <p className="text-xs text-white/50 text-center">
                  Ao se cadastrar, você concorda com nossos Termos de Serviço e Política de Privacidade.
                </p>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Register; 