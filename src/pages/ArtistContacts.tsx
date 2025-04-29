import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Trash, RefreshCw, Plus, Phone, User as UserIcon, Link as LinkIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import Navbar from '@/components/Navbar';

interface ArtistContact {
  id: number;
  name: string;
  phone: string;
  url: string;
  active: boolean;
}

const ArtistContacts: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ArtistContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showArtistContacts, setShowArtistContacts] = useState(false);
  const contactsContainerRef = useRef<HTMLDivElement>(null);
  const [newContactId, setNewContactId] = useState<number | null>(null);
  
  // Buscar contatos existentes e configurações
  useEffect(() => {
    const fetchContacts = async () => {
      if (!user) return;
      
      try {
        // Buscar configuração de exibição
        const { data: settingsData, error: settingsError } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'show_artist_contacts')
          .single();
          
        if (!settingsError && settingsData) {
          setShowArtistContacts(settingsData.value === 'true');
        }
        
        // Buscar contatos
        const { data, error } = await supabase
          .from('artist_contacts')
          .select('*')
          .order('id');
          
        if (error) throw error;
        
        setContacts(data || []);
      } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os contatos de artistas.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchContacts();
  }, [user]);
  
  // Adicionar novo contato
  const addNewContact = () => {
    const newId = Date.now();
    setContacts([
      {
        id: newId, // ID temporário
        name: '',
        phone: '',
        url: '',
        active: true
      },
      ...contacts
    ]);
    
    // Salvar o ID do novo contato para destacá-lo
    setNewContactId(newId);
    
    // Limpar o destaque após 3 segundos
    setTimeout(() => {
      setNewContactId(null);
    }, 3000);
    
    // Rolar para o topo da lista de contatos após render
    setTimeout(() => {
      if (contactsContainerRef.current) {
        contactsContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };
  
  // Atualizar campo de um contato
  const updateContact = (index: number, field: keyof ArtistContact, value: string | boolean) => {
    const newContacts = [...contacts];
    newContacts[index] = { 
      ...newContacts[index], 
      [field]: value 
    };
    setContacts(newContacts);
  };
  
  // Remover contato
  const removeContact = (index: number) => {
    const newContacts = [...contacts];
    newContacts.splice(index, 1);
    setContacts(newContacts);
    
    toast({
      title: "Contato removido",
      description: "O contato foi removido da lista."
    });
  };
  
  // Salvar contatos e configuração
  const saveContacts = async () => {
    if (user?.role !== 'super_admin') {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para salvar contatos.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // Verificar se a tabela existe, criar se não existir
      try {
        await supabase.rpc('create_artist_contacts_if_not_exists');
      } catch (error) {
        console.log('Tabela pode já existir ou não foi possível criar:', error);
      }
      
      // Validar contatos antes de salvar
      const validContacts = contacts.filter(
        contact => contact.name.trim() && contact.phone.trim()
      );
      
      if (validContacts.length < contacts.length) {
        toast({
          title: "Atenção",
          description: "Contatos sem nome ou telefone serão ignorados.",
          variant: "default"
        });
      }
      
      // Limpar tabela existente
      await supabase.from('artist_contacts').delete().not('id', 'in', '(0)');
      
      // Inserir contatos atualizados
      if (validContacts.length > 0) {
        // Remover IDs temporários para inserção
        const contactsToInsert = validContacts.map(({ id, ...rest }) => rest);
        
        const { error } = await supabase
          .from('artist_contacts')
          .insert(contactsToInsert);
          
        if (error) throw error;
      }
      
      // Salvar configuração de exibição
      const { error: settingsError } = await supabase
        .from('site_settings')
        .upsert({ 
          key: 'show_artist_contacts',
          value: showArtistContacts.toString()
        }, { onConflict: 'key' });
        
      if (settingsError) throw settingsError;
      
      toast({
        title: "Contatos salvos",
        description: "Seus contatos foram salvos com sucesso."
      });
    } catch (error) {
      console.error('Erro ao salvar contatos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os contatos.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Formatar o número de telefone para link WhatsApp
  const formatWhatsAppLink = (phone: string): string => {
    // Remover qualquer caractere não numérico
    const numericPhone = phone.replace(/\D/g, '');
    
    // Verificar se começa com código do país Brasil
    if (numericPhone.startsWith('55')) {
      return `https://wa.me/${numericPhone}`;
    }
    
    // Adicionar código do país Brasil se não estiver presente
    return `https://wa.me/55${numericPhone}`;
  };
  
  // Renderizar lista de contatos para usuários comuns
  const renderUserView = () => {
    if (!showArtistContacts || contacts.length === 0) {
      return (
        <Card className="bg-gray-800/50 border-white/10">
          <CardContent className="pt-6">
            <p className="text-center text-white/70">
              Não há contatos de artistas disponíveis no momento.
            </p>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.filter(contact => contact.active).map((contact, index) => (
          <Card key={index} className="bg-gray-800/50 border-white/10">
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-nightlife-400" />
                  <h3 className="font-medium">{contact.name}</h3>
                </div>
                
                <div className="flex space-x-3">
                  <a 
                    href={formatWhatsAppLink(contact.phone)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-md px-3 py-2 text-sm flex items-center justify-center space-x-2"
                  >
                    <Phone className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </a>
                  
                  {contact.url && (
                    <a 
                      href={contact.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-2 text-sm flex items-center justify-center space-x-2"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span>Conhecer</span>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  // Renderizar formulário de edição para super_admin
  const renderAdminView = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gray-800/50 border border-white/10 rounded-lg p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium">Mostrar contatos para usuários</span>
            <Switch 
              checked={showArtistContacts}
              onCheckedChange={setShowArtistContacts}
            />
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="border-white/20"
              onClick={addNewContact}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Contato
            </Button>
            
            <Button 
              onClick={saveContacts} 
              className="bg-nightlife-600 hover:bg-nightlife-700"
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="space-y-4" ref={contactsContainerRef}>
          {contacts.map((contact, index) => (
            <Card 
              key={index} 
              className={`bg-gray-800/50 border-white/10 transition-all duration-500 ${contact.id === newContactId ? 'ring-2 ring-nightlife-400 animate-pulse' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Contato #{index + 1}</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-200/10"
                      onClick={() => removeContact(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/70 mb-1 block">Nome do Artista</label>
                      <Input
                        placeholder="Nome completo"
                        value={contact.name}
                        onChange={(e) => updateContact(index, 'name', e.target.value)}
                        className="bg-nightlife-950 border-white/20"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-white/70 mb-1 block">Telefone (WhatsApp)</label>
                      <Input
                        placeholder="Ex: 11999999999"
                        value={contact.phone}
                        onChange={(e) => updateContact(index, 'phone', e.target.value)}
                        className="bg-nightlife-950 border-white/20"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-white/70 mb-1 block">Link "Conhecer"</label>
                    <Input
                      placeholder="https://..."
                      value={contact.url}
                      onChange={(e) => updateContact(index, 'url', e.target.value)}
                      className="bg-nightlife-950 border-white/20"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={contact.active}
                      onCheckedChange={(checked) => updateContact(index, 'active', checked)}
                    />
                    <label className="text-sm text-white/70">Ativo</label>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {contacts.length === 0 && (
            <Card className="bg-gray-800/50 border-white/10">
              <CardContent className="p-6">
                <p className="text-center text-white/70">
                  Nenhum contato adicionado. Clique em "Novo Contato" para começar.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };
  
  // Verificar se o usuário é super_admin
  const isSuperAdmin = user?.role === 'super_admin';
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-black text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex-grow">
          <div className="flex items-center mb-6">
            <Link to="/admin">
              <Button variant="outline" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Admin
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Contatos de Artistas</h1>
          </div>
          
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin h-8 w-8 border-t-2 border-nightlife-400 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex items-center mb-6">
          <Link to="/admin">
            <Button variant="outline" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Admin
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Contatos de Artistas</h1>
        </div>
        
        {isSuperAdmin ? renderAdminView() : renderUserView()}
      </div>
    </div>
  );
};

export default ArtistContacts; 