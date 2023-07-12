-- Default to Salla Sigvart (QA oid = 1.2.246.562.24.47443131353)
ALTER TABLE assignment ADD COLUMN assignment_author_oid text NOT NULL DEFAULT '1.2.246.562.24.47443131353';
ALTER TABLE assignment ALTER COLUMN assignment_author_oid DROP DEFAULT;

ALTER TABLE instruction ADD COLUMN instruction_author_oid text NOT NULL DEFAULT '1.2.246.562.24.47443131353';
ALTER TABLE instruction ALTER COLUMN instruction_author_oid DROP DEFAULT;

ALTER TABLE certificate ADD COLUMN certificate_author_oid text NOT NULL DEFAULT '1.2.246.562.24.47443131353';
ALTER TABLE certificate ALTER COLUMN certificate_author_oid DROP DEFAULT;
