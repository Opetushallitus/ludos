-- Forgot to do this in V0021__content_versioning.sql
ALTER TABLE instruction_attachment DROP CONSTRAINT instruction_attachment_pkey;
ALTER TABLE instruction_attachment ADD PRIMARY KEY (attachment_file_key, instruction_version);
