ALTER TABLE ld_certificate
    ADD COLUMN ld_certificate_aine_koodi_arvo text DEFAULT '9' NOT NULL;
ALTER TABLE ld_instruction
    ADD COLUMN ld_instruction_aine_koodi_arvo text DEFAULT '9' NOT NULL;
