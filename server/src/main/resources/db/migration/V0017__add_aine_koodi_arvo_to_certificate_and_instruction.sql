ALTER TABLE ld_certificate
    ADD COLUMN ld_certificate_aine_koodi_arvo text DEFAULT '9';
ALTER TABLE ld_instruction
    ADD COLUMN ld_instruction_aine_koodi_arvo text DEFAULT '9';
UPDATE ld_certificate
SET ld_certificate_aine_koodi_arvo = '9'
WHERE ld_certificate_aine_koodi_arvo IS NULL;
UPDATE ld_instruction
SET ld_instruction_aine_koodi_arvo = '9'
WHERE ld_instruction_aine_koodi_arvo IS NULL;
ALTER TABLE ld_certificate
    ALTER COLUMN ld_certificate_aine_koodi_arvo SET NOT NULL;
ALTER TABLE ld_instruction
    ALTER COLUMN ld_instruction_aine_koodi_arvo SET NOT NULL;


ALTER TABLE suko_certificate
    ADD COLUMN suko_certificate_description text;
ALTER TABLE puhvi_certificate
    ADD COLUMN puhvi_certificate_description text;
ALTER TABLE suko_instruction
    ADD COLUMN suko_instruction_short_description_fi text;
ALTER TABLE suko_instruction
    ADD COLUMN suko_instruction_short_description_sv text;
ALTER TABLE puhvi_instruction
    ADD COLUMN puhvi_instruction_short_description_fi text;
ALTER TABLE puhvi_instruction
    ADD COLUMN puhvi_instruction_short_description_sv text;

UPDATE suko_certificate
SET suko_certificate_description = certificate_description;
UPDATE puhvi_certificate
SET puhvi_certificate_description = certificate_description;
UPDATE suko_instruction
SET suko_instruction_short_description_fi = instruction_short_description_fi,
    suko_instruction_short_description_sv = instruction_short_description_sv;
UPDATE puhvi_instruction
SET puhvi_instruction_short_description_fi = instruction_short_description_fi,
    puhvi_instruction_short_description_sv = instruction_short_description_sv;

ALTER TABLE suko_certificate
    ALTER COLUMN suko_certificate_description SET NOT NULL;
ALTER TABLE puhvi_certificate
    ALTER COLUMN puhvi_certificate_description SET NOT NULL;
ALTER TABLE suko_instruction
    ALTER COLUMN suko_instruction_short_description_fi SET NOT NULL;
ALTER TABLE suko_instruction
    ALTER COLUMN suko_instruction_short_description_sv SET NOT NULL;
ALTER TABLE puhvi_instruction
    ALTER COLUMN puhvi_instruction_short_description_fi SET NOT NULL;
ALTER TABLE puhvi_instruction
    ALTER COLUMN puhvi_instruction_short_description_sv SET NOT NULL;

ALTER TABLE certificate
    DROP COLUMN certificate_description;
ALTER TABLE instruction
    DROP COLUMN instruction_short_description_fi,
    DROP COLUMN instruction_short_description_sv;
