-- Remove todos os itens atuais do supermercado
DELETE FROM supermarket_items;

-- Insere apenas os itens necessários para as receitas
INSERT INTO supermarket_items (item_id, item_name, item_image, category, price, stock, attributes) VALUES
-- Ingredientes básicos para receitas simples
('bread', 'Pão', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200', 'Padaria', 15, 10, '{"description": "Pão fresco para sanduíches"}'),
('lettuce', 'Alface', 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=200', 'Hortifruti', 10, 10, '{"description": "Alface fresca e crocante"}'),
('tomato', 'Tomate', 'https://images.unsplash.com/photo-1546470427-e26264be0b0c?w=200', 'Hortifruti', 12, 10, '{"description": "Tomate maduro"}'),
('banana', 'Banana', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200', 'Frutas', 8, 10, '{"description": "Banana madura"}'),
('milk', 'Leite', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200', 'Laticínios', 20, 10, '{"description": "Leite integral fresco"}'),
('egg', 'Ovo', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200', 'Laticínios', 25, 10, '{"description": "Ovo fresco de galinha"}'),
('coffee_beans', 'Grãos de Café', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200', 'Bebidas', 35, 10, '{"description": "Grãos de café arábica"}'),

-- Ingredientes para Bolo de Chocolate
('cake_flour', 'Farinha para Bolo', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200', 'Ingredientes', 25, 10, '{"description": "Farinha especial para bolos"}'),
('sugar', 'Açúcar Refinado', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200', 'Ingredientes', 18, 10, '{"description": "Açúcar refinado"}'),
('eggs', 'Ovos Caipira', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200', 'Ingredientes', 40, 10, '{"description": "Ovos caipira selecionados"}'),
('cocoa', 'Cacau em Pó', 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=200', 'Ingredientes', 45, 10, '{"description": "Cacau em pó premium"}'),
('butter', 'Manteiga Premium', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=200', 'Laticínios', 55, 10, '{"description": "Manteiga premium sem sal"}'),

-- Ingredientes para Cupcakes Red Velvet
('cream_cheese', 'Cream Cheese', 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200', 'Laticínios', 50, 10, '{"description": "Cream cheese cremoso"}'),

-- Ingredientes coreanos para Bibimbap e Kimbap
('korean_rice', 'Arroz Coreano', 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=200', 'Coreano', 35, 10, '{"description": "Arroz de grão curto coreano"}'),
('gochujang', 'Gochujang', 'https://images.unsplash.com/photo-1635321593217-40050ad13c74?w=200', 'Coreano', 60, 10, '{"description": "Pasta de pimenta fermentada coreana"}'),
('sesame_oil', 'Óleo de Gergelim', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200', 'Coreano', 45, 10, '{"description": "Óleo de gergelim torrado"}'),
('nori', 'Alga Nori', 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=200', 'Japonês', 40, 10, '{"description": "Folhas de alga para kimbap e sushi"}'),

-- Ingredientes para Kimbap
('tuna', 'Atum Enlatado', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=200', 'Enlatados', 35, 10, '{"description": "Atum em conserva"}'),
('mayonnaise', 'Maionese', 'https://images.unsplash.com/photo-1587578932405-7c740a762f7f?w=200', 'Condimentos', 20, 10, '{"description": "Maionese cremosa"}'),

-- Ingredientes para Ramen
('ramen_noodles', 'Macarrão Ramen', 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=200', 'Japonês', 30, 10, '{"description": "Macarrão para ramen"}'),
('chicken', 'Frango', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200', 'Carnes', 50, 10, '{"description": "Peito de frango fresco"}'),
('onion', 'Cebola', 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=200', 'Hortifruti', 8, 10, '{"description": "Cebola amarela"}'),
('soy_sauce', 'Molho de Soja', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200', 'Japonês', 25, 10, '{"description": "Shoyu tradicional"}'),

-- Ingredientes para Tteokbokki
('chili_peppers', 'Pimenta Dedo-de-Moça', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200', 'Hortifruti', 15, 10, '{"description": "Pimentas frescas"}'),
('rice_cakes', 'Tteok (Bolinhos de Arroz)', 'https://images.unsplash.com/photo-1635321593217-40050ad13c74?w=200', 'Coreano', 55, 10, '{"description": "Bolinhos de arroz coreanos"}');