-- Limpar itens existentes do supermercado
DELETE FROM supermarket_items;

-- Inserir apenas os ingredientes necessários para as receitas
INSERT INTO supermarket_items (item_id, item_name, item_image, category, price, stock, attributes) VALUES
-- Ingredientes para Sanduíche Natural
('bread', 'Pão de Forma', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300', 'Padaria', 12, 20, '{"description": "Pão de forma macio e fresco"}'),
('lettuce', 'Alface', 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=300', 'Hortifruti', 8, 20, '{"description": "Alface fresca e crocante"}'),

-- Ingredientes para Vitamina de Frutas
('banana', 'Banana', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300', 'Frutas', 6, 20, '{"description": "Banana madura"}'),
('milk', 'Leite', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300', 'Laticínios', 10, 20, '{"description": "Leite integral fresco"}'),

-- Ingredientes para Omelete
('egg', 'Ovo', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300', 'Básicos', 5, 30, '{"description": "Ovo caipira fresco"}'),

-- Ingredientes para Salada Mista
('tomato', 'Tomate', 'https://images.unsplash.com/photo-1546470427-e26264be0b0c?w=300', 'Hortifruti', 8, 20, '{"description": "Tomate maduro"}'),

-- Ingredientes para Café Especial
('coffee_beans', 'Grãos de Café', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300', 'Bebidas', 35, 15, '{"description": "Grãos de café arábica premium"}'),

-- Ingredientes para Bolo de Chocolate
('cake_flour', 'Farinha para Bolo', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300', 'Ingredientes', 18, 20, '{"description": "Farinha especial para bolos"}'),
('sugar', 'Açúcar', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300', 'Ingredientes', 12, 25, '{"description": "Açúcar refinado"}'),
('eggs', 'Ovos Caipira (6un)', 'https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?w=300', 'Básicos', 15, 20, '{"description": "Ovos caipira selecionados"}'),
('cocoa', 'Cacau em Pó', 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=300', 'Ingredientes', 28, 15, '{"description": "Cacau em pó premium"}'),
('butter', 'Manteiga Premium', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300', 'Laticínios', 22, 20, '{"description": "Manteiga de primeira qualidade"}'),

-- Ingredientes para Cupcakes Red Velvet
('cream_cheese', 'Cream Cheese', 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300', 'Laticínios', 25, 15, '{"description": "Cream cheese cremoso"}'),

-- Ingredientes para Bibimbap
('korean_rice', 'Arroz Coreano', 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=300', 'Coreano', 30, 15, '{"description": "Arroz de grão curto coreano"}'),
('gochujang', 'Gochujang', 'https://images.unsplash.com/photo-1635321593217-40050ad13c74?w=300', 'Coreano', 45, 10, '{"description": "Pasta de pimenta fermentada coreana"}'),
('sesame_oil', 'Óleo de Gergelim', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300', 'Coreano', 38, 12, '{"description": "Óleo de gergelim torrado"}'),

-- Ingredientes para Sushi Variado
('sushi_rice', 'Arroz para Sushi', 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=300', 'Japonês', 32, 15, '{"description": "Arroz japonês para sushi"}'),
('nori', 'Alga Nori', 'https://images.unsplash.com/photo-1580651315530-69c8e0026377?w=300', 'Japonês', 28, 15, '{"description": "Folhas de alga nori torrada"}'),
('salmon', 'Salmão Fresco', 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=300', 'Peixes', 85, 8, '{"description": "Salmão fresco para sashimi"}'),
('soy_sauce', 'Shoyu Premium', 'https://images.unsplash.com/photo-1628689469838-524a4a973b8e?w=300', 'Japonês', 22, 20, '{"description": "Molho de soja premium"}'),

-- Ingredientes para Feijoada Completa
('feijao_preto', 'Feijão Preto', 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300', 'Brasileiro', 18, 20, '{"description": "Feijão preto selecionado"}'),
('linguica', 'Linguiça Calabresa', 'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=300', 'Carnes', 35, 15, '{"description": "Linguiça calabresa defumada"}'),
('pork_belly', 'Barriga de Porco', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300', 'Carnes', 48, 10, '{"description": "Barriga de porco fresca"}'),

-- Ingredientes para Brigadeiros
('leite_condensado', 'Leite Condensado', 'https://images.unsplash.com/photo-1628689469838-524a4a973b8e?w=300', 'Doces', 15, 25, '{"description": "Leite condensado cremoso"}'),

-- Ingredientes para Churrasco Completo
('picanha', 'Picanha Premium', 'https://images.unsplash.com/photo-1558030006-450675393462?w=300', 'Carnes', 120, 8, '{"description": "Picanha bovina premium"}'),
('queijo_coalho', 'Queijo Coalho', 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300', 'Laticínios', 32, 15, '{"description": "Queijo coalho para churrasco"}'),
('farofa', 'Farofa Pronta', 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=300', 'Brasileiro', 12, 20, '{"description": "Farofa temperada pronta"}'),

-- Ingredientes para Ramen Tonkotsu
('dashi', 'Dashi em Pó', 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=300', 'Japonês', 25, 15, '{"description": "Caldo dashi em pó"}'),
('mirin', 'Mirin', 'https://images.unsplash.com/photo-1628689469838-524a4a973b8e?w=300', 'Japonês', 28, 12, '{"description": "Vinho de arroz doce japonês"}')