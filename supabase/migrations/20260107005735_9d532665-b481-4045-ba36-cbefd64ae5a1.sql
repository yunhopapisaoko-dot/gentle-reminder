-- Remove todas as mensagens da ABBY restantes
DELETE FROM chat_messages WHERE character_name = 'ABBY' OR user_id = '00000000-0000-0000-0000-000000000001'::uuid;