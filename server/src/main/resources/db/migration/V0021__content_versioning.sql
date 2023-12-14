----------------
-- ASSIGNMENT --
----------------

-- Add version columns
ALTER TABLE assignment ADD COLUMN assignment_version integer NOT NULL DEFAULT 1;
ALTER TABLE assignment ALTER COLUMN assignment_version DROP DEFAULT;
ALTER TABLE assignment_content ADD COLUMN assignment_version integer NOT NULL DEFAULT 1;
ALTER TABLE assignment_content ALTER COLUMN assignment_version DROP DEFAULT;
ALTER TABLE assignment_content DROP CONSTRAINT assignment_content_pkey;
ALTER TABLE assignment_content ADD CONSTRAINT assignment_content_pkey PRIMARY KEY (assignment_id, assignment_content_language, assignment_content_order_index, assignment_version);
ALTER TABLE assignment_favorite ADD COLUMN assignment_version integer NOT NULL DEFAULT 1;
ALTER TABLE assignment_favorite ALTER COLUMN assignment_version DROP DEFAULT;

-- Add version column to primary key and foreign keys referencing assignment
ALTER TABLE assignment_content DROP CONSTRAINT assignment_content_assignment_id_fkey;
ALTER TABLE assignment_favorite DROP CONSTRAINT assignment_favorite_assignment_id_fkey;
ALTER TABLE assignment DROP CONSTRAINT assignment_pkey;
ALTER TABLE assignment ADD CONSTRAINT assignment_pk PRIMARY KEY (assignment_id, assignment_version);
ALTER TABLE assignment_content ADD CONSTRAINT assignment_fk FOREIGN KEY (assignment_id, assignment_version) REFERENCES assignment(assignment_id, assignment_version);
ALTER TABLE assignment_favorite ADD CONSTRAINT assignment_fk FOREIGN KEY (assignment_id, assignment_version) REFERENCES assignment(assignment_id, assignment_version);

-- Add version column to primary keys and foreign keys referencing suko_assignment
ALTER TABLE suko_assignment_content DROP CONSTRAINT suko_assignment_content_pkey;
ALTER TABLE suko_assignment_content ADD CONSTRAINT suko_assignment_content_pkey PRIMARY KEY (assignment_id, assignment_content_language, assignment_content_order_index, assignment_version);
ALTER TABLE suko_assignment_content DROP CONSTRAINT suko_assignment_content_assignment_id_fkey;
ALTER TABLE suko_assignment_favorite DROP CONSTRAINT fk_assignment_favorite_assignment_id;
ALTER TABLE suko_assignment DROP CONSTRAINT suko_assignment_pkey;
ALTER TABLE suko_assignment ADD CONSTRAINT suko_assignment_pk PRIMARY KEY (assignment_id, assignment_version);
ALTER TABLE suko_assignment_content ADD CONSTRAINT suko_assignment_fk FOREIGN KEY (assignment_id, assignment_version) REFERENCES suko_assignment(assignment_id, assignment_version);
ALTER TABLE suko_assignment_favorite ADD CONSTRAINT suko_assignment_fk FOREIGN KEY (assignment_id, assignment_version) REFERENCES suko_assignment(assignment_id, assignment_version);

-- Add version column to primary keys and foreign keys referencing ld_assignment
ALTER TABLE ld_assignment_content DROP CONSTRAINT ld_assignment_content_pkey;
ALTER TABLE ld_assignment_content ADD CONSTRAINT ld_assignment_content_pkey PRIMARY KEY (assignment_id, assignment_content_language, assignment_content_order_index, assignment_version);
ALTER TABLE ld_assignment_content DROP CONSTRAINT ld_assignment_content_assignment_id_fkey;
ALTER TABLE ld_assignment_favorite DROP CONSTRAINT fk_assignment_favorite_assignment_id;
ALTER TABLE ld_assignment DROP CONSTRAINT ld_assignment_pkey;
ALTER TABLE ld_assignment ADD CONSTRAINT ld_assignment_pk PRIMARY KEY (assignment_id, assignment_version);
ALTER TABLE ld_assignment_content ADD CONSTRAINT ld_assignment_fk FOREIGN KEY (assignment_id, assignment_version) REFERENCES ld_assignment(assignment_id, assignment_version);
ALTER TABLE ld_assignment_favorite ADD CONSTRAINT ld_assignment_fk FOREIGN KEY (assignment_id, assignment_version) REFERENCES ld_assignment(assignment_id, assignment_version);

-- Add version column to primary keys and foreign keys referencing puhvi_assignment
ALTER TABLE puhvi_assignment_content DROP CONSTRAINT puhvi_assignment_content_pkey;
ALTER TABLE puhvi_assignment_content ADD CONSTRAINT puhvi_assignment_content_pkey PRIMARY KEY (assignment_id, assignment_content_language, assignment_content_order_index, assignment_version);
ALTER TABLE puhvi_assignment_content DROP CONSTRAINT puhvi_assignment_content_assignment_id_fkey;
ALTER TABLE puhvi_assignment_favorite DROP CONSTRAINT fk_assignment_favorite_assignment_id;
ALTER TABLE puhvi_assignment DROP CONSTRAINT puhvi_assignment_pkey;
ALTER TABLE puhvi_assignment ADD CONSTRAINT puhvi_assignment_pk PRIMARY KEY (assignment_id, assignment_version);
ALTER TABLE puhvi_assignment_content ADD CONSTRAINT puhvi_assignment_fk FOREIGN KEY (assignment_id, assignment_version) REFERENCES puhvi_assignment(assignment_id, assignment_version);
ALTER TABLE puhvi_assignment_favorite ADD CONSTRAINT puhvi_assignment_fk FOREIGN KEY (assignment_id, assignment_version) REFERENCES puhvi_assignment(assignment_id, assignment_version);


-----------------
-- INSTRUCTION --
-----------------

-- Add version columns
ALTER TABLE instruction ADD COLUMN instruction_version integer NOT NULL DEFAULT 1;
ALTER TABLE instruction ALTER COLUMN instruction_version DROP DEFAULT;
ALTER TABLE instruction_attachment ADD COLUMN instruction_version integer NOT NULL DEFAULT 1;
ALTER TABLE instruction_attachment ALTER COLUMN instruction_version DROP DEFAULT;

-- Add version column to primary key and foreign keys referencing instruction
ALTER TABLE instruction DROP CONSTRAINT instruction_pkey;
ALTER TABLE instruction ADD CONSTRAINT instruction_pk PRIMARY KEY (instruction_id, instruction_version);
ALTER TABLE instruction_attachment ADD CONSTRAINT instruction_fk FOREIGN KEY (instruction_id, instruction_version) REFERENCES instruction(instruction_id, instruction_version);

-- Add version column to primary keys and foreign keys referencing suko_instruction
ALTER TABLE suko_instruction_attachment DROP CONSTRAINT suko_instruction_attachment_instruction_id_fk;
ALTER TABLE suko_instruction DROP CONSTRAINT suko_instruction_pkey;
ALTER TABLE suko_instruction ADD CONSTRAINT suko_instruction_pk PRIMARY KEY (instruction_id, instruction_version);
ALTER TABLE suko_instruction_attachment ADD CONSTRAINT suko_instruction_fk FOREIGN KEY (instruction_id, instruction_version) REFERENCES suko_instruction(instruction_id, instruction_version);
ALTER TABLE suko_instruction_attachment DROP CONSTRAINT suko_instruction_attachment_pkey;
ALTER TABLE suko_instruction_attachment ADD PRIMARY KEY (attachment_file_key, instruction_version);

DROP INDEX suko_instruction_attachment_instruction_id_idx;
CREATE INDEX suko_instruction_attachment_instruction_id_idx ON suko_instruction_attachment (instruction_id, instruction_version);

-- Add version column to primary keys and foreign keys referencing ld_instruction
ALTER TABLE ld_instruction_attachment DROP CONSTRAINT ld_instruction_attachment_instruction_id_fk;
ALTER TABLE ld_instruction DROP CONSTRAINT ld_instruction_pkey;
ALTER TABLE ld_instruction ADD CONSTRAINT ld_instruction_pk PRIMARY KEY (instruction_id, instruction_version);
ALTER TABLE ld_instruction_attachment ADD CONSTRAINT ld_instruction_fk FOREIGN KEY (instruction_id, instruction_version) REFERENCES ld_instruction(instruction_id, instruction_version);
ALTER TABLE ld_instruction_attachment DROP CONSTRAINT ld_instruction_attachment_pkey;
ALTER TABLE ld_instruction_attachment ADD PRIMARY KEY (attachment_file_key, instruction_version);

DROP INDEX puhvi_instruction_attachment_instruction_id_idx;
CREATE INDEX puhvi_instruction_attachment_instruction_id_idx ON puhvi_instruction_attachment (instruction_id, instruction_version);

-- Add version column to primary keys and foreign keys referencing puhvi_instruction
ALTER TABLE puhvi_instruction_attachment DROP CONSTRAINT puhvi_instruction_attachment_instruction_id_fk;
ALTER TABLE puhvi_instruction DROP CONSTRAINT puhvi_instruction_pkey;
ALTER TABLE puhvi_instruction ADD CONSTRAINT puhvi_instruction_pk PRIMARY KEY (instruction_id, instruction_version);
ALTER TABLE puhvi_instruction_attachment ADD CONSTRAINT puhvi_instruction_fk FOREIGN KEY (instruction_id, instruction_version) REFERENCES puhvi_instruction(instruction_id, instruction_version);
ALTER TABLE puhvi_instruction_attachment DROP CONSTRAINT puhvi_instruction_attachment_pkey;
ALTER TABLE puhvi_instruction_attachment ADD PRIMARY KEY (attachment_file_key, instruction_version);

DROP INDEX ld_instruction_attachment_instruction_id_idx;
CREATE INDEX ld_instruction_attachment_instruction_id_idx ON ld_instruction_attachment (instruction_id, instruction_version);

-----------------
-- CERTIFICATE --
-----------------

ALTER TABLE certificate ADD COLUMN certificate_version integer NOT NULL DEFAULT 1;
ALTER TABLE certificate ALTER COLUMN certificate_version DROP DEFAULT;

ALTER TABLE certificate DROP CONSTRAINT certificate_pkey;
ALTER TABLE certificate ADD CONSTRAINT certificate_pk PRIMARY KEY (certificate_id, certificate_version);
ALTER TABLE certificate DROP CONSTRAINT unique_certificate_attachment_file_key;

ALTER TABLE suko_certificate DROP CONSTRAINT suko_certificate_pkey;
ALTER TABLE suko_certificate ADD CONSTRAINT suko_certificate_pk PRIMARY KEY (certificate_id, certificate_version);
ALTER TABLE suko_certificate DROP CONSTRAINT unique_suko_certificate_attachment_file_key;

ALTER TABLE ld_certificate DROP CONSTRAINT ld_certificate_pkey;
ALTER TABLE ld_certificate ADD CONSTRAINT ld_certificate_pk PRIMARY KEY (certificate_id, certificate_version);
ALTER TABLE ld_certificate DROP CONSTRAINT unique_ld_certificate_attachment_file_key;

ALTER TABLE puhvi_certificate DROP CONSTRAINT puhvi_certificate_pkey;
ALTER TABLE puhvi_certificate ADD CONSTRAINT puhvi_certificate_pk PRIMARY KEY (certificate_id, certificate_version);
ALTER TABLE puhvi_certificate DROP CONSTRAINT unique_puhvi_certificate_attachment_file_key;

