CREATE TABLE certificate
(
    certificate_id               serial PRIMARY KEY,
    certificate_name             text          NOT NULL,
    certificate_description      text          NOT NULL,
    certificate_publish_state    publish_state NOT NULL,
    certificate_created_at       timestamptz   NOT NULL default now(),
    certificate_updated_at       timestamptz   NOT NULL default now(),
    certificate_file_name        text          NOT NULL,
    certificate_file_key         text          NOT NULL,
    certificate_file_upload_date timestamptz   NOT NULL default now()
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
