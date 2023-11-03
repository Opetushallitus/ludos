-- description
ALTER TABLE puhvi_certificate
    RENAME puhvi_certificate_description TO puhvi_certificate_description_fi;
ALTER TABLE puhvi_certificate
    ADD COLUMN puhvi_certificate_description_sv text NOT NULL default '';

ALTER TABLE suko_certificate
    RENAME suko_certificate_description TO suko_certificate_description_fi;
ALTER TABLE suko_certificate
    ADD COLUMN suko_certificate_description_sv text NOT NULL default '';

-- name
ALTER TABLE certificate
    RENAME certificate_name TO certificate_name_fi;
ALTER TABLE certificate
    ADD COLUMN certificate_name_sv text NOT NULL default '';


-- attachment
ALTER TABLE certificate
    RENAME attachment_file_key TO attachment_file_key_fi;
ALTER TABLE certificate RENAME CONSTRAINT certificate_attachment_fk TO attachment_file_key_fi_fk;

ALTER TABLE suko_certificate RENAME CONSTRAINT suko_certificate_attachment_fk TO suko_attachment_file_key_fi_fk;
ALTER TABLE ld_certificate RENAME CONSTRAINT ld_certificate_attachment_fk TO ld_attachment_file_key_fi_fk;
ALTER TABLE puhvi_certificate RENAME CONSTRAINT puhvi_certificate_attachment_fk TO puhvi_attachment_file_key_fi_fk;

ALTER TABLE certificate
    ADD COLUMN attachment_file_key_sv text;

UPDATE suko_certificate SET attachment_file_key_sv = attachment_file_key_fi;
UPDATE ld_certificate SET attachment_file_key_sv = attachment_file_key_fi;
UPDATE puhvi_certificate SET attachment_file_key_sv = attachment_file_key_fi;

ALTER TABLE certificate ALTER COLUMN attachment_file_key_sv SET NOT NULL;

ALTER TABLE certificate ADD CONSTRAINT attachment_file_key_sv_fk
    FOREIGN KEY (attachment_file_key_sv)
        REFERENCES certificate_attachment(attachment_file_key);
ALTER TABLE suko_certificate ADD CONSTRAINT suko_attachment_file_key_sv_fk
    FOREIGN KEY (attachment_file_key_sv)
        REFERENCES certificate_attachment(attachment_file_key);
ALTER TABLE ld_certificate ADD CONSTRAINT ld_attachment_file_key_sv_fk
    FOREIGN KEY (attachment_file_key_sv)
        REFERENCES certificate_attachment(attachment_file_key);
ALTER TABLE puhvi_certificate ADD CONSTRAINT puhvi_attachment_file_key_sv_fk
    FOREIGN KEY (attachment_file_key_sv)
        REFERENCES certificate_attachment(attachment_file_key);
