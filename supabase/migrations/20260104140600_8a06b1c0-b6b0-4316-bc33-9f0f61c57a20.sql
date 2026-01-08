-- Reset JYP state to allow next robbery
UPDATE jyp_state SET last_robbery_at = NULL, updated_at = now() WHERE id = 1;