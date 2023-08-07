CREATE TYPE language AS ENUM ('FI', 'SV');

CREATE TABLE instruction_attachment
(
    instruction_id                  integer  NOT NULL,
    instruction_attachment_name     text     NOT NULL,
    instruction_attachment_language language NOT NULL,
    PRIMARY KEY (attachment_file_key)
) INHERITS (attachment);

CREATE TABLE suko_instruction_attachment
(
    PRIMARY KEY (attachment_file_key),
    CONSTRAINT suko_instruction_attachment_instruction_id_fk
        FOREIGN KEY (instruction_id)
            REFERENCES suko_instruction (instruction_id)
            ON DELETE RESTRICT
            ON UPDATE CASCADE
) INHERITS (instruction_attachment);
CREATE INDEX suko_instruction_attachment_instruction_id_idx ON suko_instruction_attachment (instruction_id);

CREATE TABLE puhvi_instruction_attachment
(
    PRIMARY KEY (attachment_file_key),
    CONSTRAINT puhvi_instruction_attachment_instruction_id_fk
        FOREIGN KEY (instruction_id)
            REFERENCES puhvi_instruction (instruction_id)
            ON DELETE RESTRICT
            ON UPDATE CASCADE
) INHERITS (instruction_attachment);
CREATE INDEX puhvi_instruction_attachment_instruction_id_idx ON puhvi_instruction_attachment (instruction_id);

CREATE TABLE ld_instruction_attachment
(
    PRIMARY KEY (attachment_file_key),
    CONSTRAINT ld_instruction_attachment_instruction_id_fk
        FOREIGN KEY (instruction_id)
            REFERENCES ld_instruction (instruction_id)
            ON DELETE RESTRICT
            ON UPDATE CASCADE
) INHERITS (instruction_attachment);
CREATE INDEX ld_instruction_attachment_instruction_id_idx ON ld_instruction_attachment (instruction_id);
