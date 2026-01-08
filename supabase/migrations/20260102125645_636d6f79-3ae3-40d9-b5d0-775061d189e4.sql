-- Reset JYP state to allow robbery again
UPDATE jyp_state SET last_robbery_at = NULL, updated_at = now() WHERE id = 1;