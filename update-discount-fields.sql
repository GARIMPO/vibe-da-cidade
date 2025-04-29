-- Adicionar campos de cupom de desconto à tabela bars
ALTER TABLE bars 
ADD COLUMN IF NOT EXISTS discount_code TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS discount_description TEXT DEFAULT NULL;

-- Atualizar dados de exemplo com cupons de desconto
UPDATE bars 
SET 
    discount_code = 'BLUES10',
    discount_description = '10% de desconto em todas as cervejas artesanais'
WHERE name = 'Boteco do Blues';

UPDATE bars 
SET 
    discount_code = 'ROOFTOP20',
    discount_description = '20% de desconto em todos os coquetéis'
WHERE name = 'Rooftop Lounge'; 