import Navbar from "@/components/Navbar";

export default function Marketing() {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Olá gostaria de anunciar meu estabelecimento, como faço para cadastrar ?");
    window.open(`https://wa.me/5535998135712?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-black text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-16 flex-grow">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-8">
            Vibe da Cidade
          </h1>
          <p className="text-xl text-center text-gray-300 mb-12">
            Conectando pessoas aos melhores estabelecimentos da cidade.
          </p>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="bg-gray-800/50 p-8 rounded-xl">
              <h2 className="text-2xl font-semibold mb-4">Sobre o Site</h2>
              <p className="text-gray-300">
                O Vibe da Cidade é a plataforma com foco em proporcionar integração de pessoas com os melhores estabelecimentos da cidade. Conectamos experiências agradáveis, criando uma comunidade vibrante para todos.
              </p>
            </div>

            <div className="bg-gray-800/50 p-8 rounded-xl">
              <h2 className="text-2xl font-semibold mb-4">Por que Anunciar?</h2>
              <ul className="text-gray-300 space-y-3">
                <li>• Alcance direto ao seu público-alvo</li>
                <li>• Aumente sua visibilidade na cidade</li>
                <li>• Gerencie eventos e cupons de descontos</li>
                <li>• Conecte-se com novos clientes</li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleWhatsAppClick}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 text-lg font-semibold rounded-full hover:opacity-90 transition-opacity"
            >
              Quero Anunciar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 