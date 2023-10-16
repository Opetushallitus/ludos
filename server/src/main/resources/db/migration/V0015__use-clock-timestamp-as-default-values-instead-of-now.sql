-- now() keeps returning the same value inside a transaction

ALTER TABLE assignment ALTER COLUMN assignment_created_at SET DEFAULT clock_timestamp();
ALTER TABLE assignment ALTER COLUMN assignment_updated_at SET DEFAULT clock_timestamp();

ALTER TABLE instruction ALTER COLUMN instruction_created_at SET DEFAULT clock_timestamp();
ALTER TABLE instruction ALTER COLUMN instruction_updated_at SET DEFAULT clock_timestamp();

ALTER TABLE certificate ALTER COLUMN certificate_created_at SET DEFAULT clock_timestamp();
ALTER TABLE certificate ALTER COLUMN certificate_updated_at SET DEFAULT clock_timestamp();
