-- Reset JYP cooldown para ele aparecer
UPDATE jyp_state SET last_robbery_at = NULL, updated_at = now() WHERE id = 1;