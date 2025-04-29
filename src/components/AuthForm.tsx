import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Instagram } from 'lucide-react';

interface AuthFormProps {
  mode: 'login' | 'register';
}

const AuthForm: React.FC<AuthFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    address: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Fazer login através do Supabase Auth
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      if (authData.user) {
        // Buscar dados do usuário incluindo o papel (role)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (userError) {
          console.error('Erro ao buscar dados do usuário:', userError);
          throw userError;
        }

        console.log('Dados do usuário:', userData);

        toast({
          title: "Login realizado",
          description: "Você foi autenticado com sucesso.",
          variant: "default"
        });

        // Redirecionar com base no papel do usuário
        if (userData.role === 'super_admin') {
          console.log('Redirecionando para /admin');
          navigate('/admin');
        } else {
          console.log('Redirecionando para /');
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Erro de login:', error);
      toast({
        title: "Erro no login",
        description: "Email ou senha incorretos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      console.log("Iniciando registro com email:", formData.email);
      
      // Primeiro, criar o usuário na autenticação
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) {
        console.error("Erro na autenticação:", authError);
        throw authError;
      }

      console.log("Resposta da autenticação:", authData);

      if (authData.user) {
        console.log("Usuário criado, adicionando ao perfil. ID:", authData.user.id);
        
        // Depois, inserir os dados do perfil
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            role: 'user',
            approved: false
          });

        if (profileError) {
          console.error("Erro ao criar perfil:", profileError);
          throw profileError;
        }

        toast({
          title: "Conta criada",
          description: "Sua conta foi criada com sucesso. Você já pode fazer login.",
          variant: "default"
        });

        navigate('/login');
      } else {
        throw new Error("Não foi possível criar o usuário");
      }
    } catch (error: any) {
      console.error('Erro detalhado no registro:', error);
      
      let errorMessage = "Não foi possível criar sua conta. Tente novamente.";
      
      if (error.message) {
        if (error.message.includes("duplicate key")) {
          errorMessage = "Este email já está cadastrado.";
        } else if (error.message.includes("Password should be")) {
          errorMessage = "A senha deve ter pelo menos 6 caracteres.";
        } else if (error.message.includes("permission denied")) {
          errorMessage = "Permissão negada. Verifique as políticas de acesso.";
        }
      }
      
      toast({
        title: "Erro no registro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-0">
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-white">Email</label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="bg-nightlife-950/80 backdrop-blur-sm border-white/20 text-white placeholder-white/50"
            placeholder="Seu email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Senha</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="bg-nightlife-950/80 backdrop-blur-sm border-white/20 pr-10 text-white placeholder-white/50"
              placeholder="Sua senha"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-nightlife-600 hover:bg-nightlife-700 mt-6"
          disabled={loading}
        >
          {loading ? 'Carregando...' : 'Entrar'}
        </Button>
      </form>

      <div className="mt-6 text-center space-y-3">
        <p className="text-sm text-white/80">
          Credenciais de acesso fornecidas pelo administrador
        </p>
        <div className="pt-2 border-t border-white/10">
          <p className="text-sm text-white/80 font-medium">
            Feito por Garimpo de Ofertas
          </p>
          <a 
            href="https://www.instagram.com/garimpodeofertas_top?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-nightlife-400 hover:text-nightlife-300 mt-1"
          >
            <Instagram size={16} />
            <span>@garimpodeofertas_top</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthForm; 