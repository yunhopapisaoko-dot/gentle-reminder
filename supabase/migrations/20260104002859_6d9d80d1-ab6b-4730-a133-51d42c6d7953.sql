DELETE FROM chat_messages 
WHERE location = 'padaria' 
AND (user_id = '00000000-0000-0000-0000-000000000000' OR character_name = 'Sistema');