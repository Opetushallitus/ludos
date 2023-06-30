-- Create a new unique constraint on the attachment_file_key column in the certificate tables.
-- We assume that attachments are never shared between certificates, so enforce that.
ALTER TABLE certificate ADD CONSTRAINT unique_certificate_attachment_file_key UNIQUE (attachment_file_key);
ALTER TABLE suko_certificate ADD CONSTRAINT unique_suko_certificate_attachment_file_key UNIQUE (attachment_file_key);
ALTER TABLE puhvi_certificate ADD CONSTRAINT unique_puhvi_certificate_attachment_file_key UNIQUE (attachment_file_key);
ALTER TABLE ld_certificate ADD CONSTRAINT unique_ld_certificate_attachment_file_key UNIQUE (attachment_file_key);
