
-- Corrigir itens que não atualizaram por causa do item_id diferente
-- (e trocar por URLs novas para evitar cache)
UPDATE public.supermarket_items
SET item_image = 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=600&q=80&v=2'
WHERE item_id = 'cake_flour';

UPDATE public.supermarket_items
SET item_image = 'https://images.unsplash.com/photo-1610647004862-3f3f10b3f976?auto=format&fit=crop&w=600&q=80&v=2'
WHERE item_id = 'cocoa';

UPDATE public.supermarket_items
SET item_image = 'https://images.unsplash.com/photo-1604909052743-94e838f0b6a4?auto=format&fit=crop&w=600&q=80&v=2'
WHERE item_id = 'soy_sauce';

UPDATE public.supermarket_items
SET item_image = 'https://images.unsplash.com/photo-1625944525533-473f1d6d3d5a?auto=format&fit=crop&w=600&q=80&v=2'
WHERE item_id = 'nori';

UPDATE public.supermarket_items
SET item_image = 'https://images.unsplash.com/photo-1604908176997-125f4d6b0b9f?auto=format&fit=crop&w=600&q=80&v=2'
WHERE item_id = 'dashi';

-- Açúcar: atualizar por nome (caso o item_id seja diferente)
UPDATE public.supermarket_items
SET item_image = 'https://images.unsplash.com/photo-1607082349566-1870c1fdc019?auto=format&fit=crop&w=600&q=80&v=2'
WHERE item_name ILIKE '%açucar%'
   OR item_name ILIKE '%acucar%'
   OR item_id = 'sugar';
