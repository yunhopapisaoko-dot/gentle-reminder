-- Atualizar todos os itens com fotos corretas
DELETE FROM supermarket_items;

INSERT INTO supermarket_items (item_id, item_name, item_image, category, price, stock, attributes) VALUES
-- Padaria
('bread', 'Pão de Forma', 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=300', 'Padaria', 12, 20, '{"description": "Pão de forma macio e fresco"}'),

-- Hortifruti
('lettuce', 'Alface', 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?w=300', 'Hortifruti', 8, 20, '{"description": "Alface fresca e crocante"}'),
('tomato', 'Tomate', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300', 'Hortifruti', 8, 20, '{"description": "Tomate maduro"}'),

-- Frutas
('banana', 'Banana', 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=300', 'Frutas', 6, 20, '{"description": "Banana madura"}'),

-- Laticínios
('milk', 'Leite', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300', 'Laticínios', 10, 20, '{"description": "Leite integral fresco"}'),
('butter', 'Manteiga', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300', 'Laticínios', 22, 20, '{"description": "Manteiga de primeira qualidade"}'),
('cream_cheese', 'Cream Cheese', 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=300', 'Laticínios', 25, 15, '{"description": "Cream cheese cremoso"}'),
('queijo_coalho', 'Queijo Coalho', 'https://images.unsplash.com/photo-1634487359989-3e90c9432133?w=300', 'Laticínios', 32, 15, '{"description": "Queijo coalho para churrasco"}'),

-- Básicos
('egg', 'Ovo', 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=300', 'Básicos', 5, 30, '{"description": "Ovo caipira fresco"}'),
('eggs', 'Ovos Caipira (6un)', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300', 'Básicos', 15, 20, '{"description": "Ovos caipira selecionados"}'),

-- Bebidas
('coffee_beans', 'Grãos de Café', 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=300', 'Bebidas', 35, 15, '{"description": "Grãos de café arábica premium"}'),

-- Ingredientes
('cake_flour', 'Farinha de Trigo', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300', 'Ingredientes', 18, 20, '{"description": "Farinha de trigo especial"}'),
('sugar', 'Açúcar', 'https://images.unsplash.com/photo-1581268604846-2d89fa02fa21?w=300', 'Ingredientes', 12, 25, '{"description": "Açúcar refinado"}'),
('cocoa', 'Cacau em Pó', 'https://images.unsplash.com/photo-1610450949065-1f2841536c88?w=300', 'Ingredientes', 28, 15, '{"description": "Cacau em pó 100%"}'),

-- Coreano
('korean_rice', 'Arroz Coreano', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300', 'Coreano', 30, 15, '{"description": "Arroz de grão curto coreano"}'),
('gochujang', 'Gochujang', 'https://images.unsplash.com/photo-1541379889336-70f26e4f0c0d?w=300', 'Coreano', 45, 10, '{"description": "Pasta de pimenta fermentada"}'),
('sesame_oil', 'Óleo de Gergelim', 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=300', 'Coreano', 38, 12, '{"description": "Óleo de gergelim torrado"}'),

-- Japonês
('sushi_rice', 'Arroz para Sushi', 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=300', 'Japonês', 32, 15, '{"description": "Arroz japonês para sushi"}'),
('nori', 'Alga Nori', 'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=300', 'Japonês', 28, 15, '{"description": "Folhas de alga nori"}'),
('salmon', 'Salmão Fresco', 'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=300', 'Peixes', 85, 8, '{"description": "Salmão fresco para sashimi"}'),
('soy_sauce', 'Shoyu', 'https://images.unsplash.com/photo-1585507252242-11fe632c26e8?w=300', 'Japonês', 22, 20, '{"description": "Molho de soja"}'),
('dashi', 'Dashi em Pó', 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=300', 'Japonês', 25, 15, '{"description": "Caldo dashi em pó"}'),
('mirin', 'Mirin', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300', 'Japonês', 28, 12, '{"description": "Vinho de arroz doce"}'),

-- Brasileiro
('feijao_preto', 'Feijão Preto', 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300', 'Brasileiro', 18, 20, '{"description": "Feijão preto selecionado"}'),
('farofa', 'Farofa', 'https://images.unsplash.com/photo-1601409751850-a3fae8c5a304?w=300', 'Brasileiro', 12, 20, '{"description": "Farofa temperada"}'),

-- Carnes
('linguica', 'Linguiça Calabresa', 'https://images.unsplash.com/photo-1622485831135-f7c38f0dd68a?w=300', 'Carnes', 35, 15, '{"description": "Linguiça calabresa defumada"}'),
('pork_belly', 'Barriga de Porco', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300', 'Carnes', 48, 10, '{"description": "Barriga de porco fresca"}'),
('picanha', 'Picanha', 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=300', 'Carnes', 120, 8, '{"description": "Picanha bovina premium"}'),

-- Doces
('leite_condensado', 'Leite Condensado', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300', 'Doces', 15, 25, '{"description": "Leite condensado cremoso"}')