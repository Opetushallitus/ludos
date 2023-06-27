CREATE TABLE attachment
(
    attachment_file_key    text PRIMARY KEY,
    attachment_file_name   text        NOT NULL,
    attachment_upload_date timestamptz NOT NULL
);

CREATE TABLE certificate_attachment
(
    PRIMARY KEY (attachment_file_key)
) INHERITS (attachment);


CREATE TABLE certificate
(
    certificate_id            serial PRIMARY KEY,
    certificate_name          text          NOT NULL,
    certificate_description   text          NOT NULL,
    certificate_publish_state publish_state NOT NULL,
    certificate_created_at    timestamptz   NOT NULL default now(),
    certificate_updated_at    timestamptz   NOT NULL default now(),
    attachment_file_key       text REFERENCES certificate_attachment (attachment_file_key) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE suko_certificate
(
    PRIMARY KEY (certificate_id)

) INHERITS (certificate);

CREATE TABLE puhvi_certificate
(
    PRIMARY KEY (certificate_id)
) INHERITS (certificate);

CREATE TABLE ld_certificate
(
    PRIMARY KEY (certificate_id)
) INHERITS (certificate);
