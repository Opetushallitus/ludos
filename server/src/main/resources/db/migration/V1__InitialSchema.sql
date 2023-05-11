CREATE TYPE publish_state AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE assignment
(
    assignment_id            serial PRIMARY KEY,
    assignment_name_fi       text          NOT NULL,
    assignment_name_sv       text          NOT NULL,
    assignment_content_fi    text          NOT NULL,
    assignment_content_sv    text          NOT NULL,
    assignment_publish_state publish_state NOT NULL,
    assignment_created_at    timestamptz   NOT NULL default now(),
    assignment_updated_at    timestamptz   NOT NULL default now()
);

CREATE TABLE suko_assignment
(
    suko_assignment_type_koodi_arvo text NOT NULL
) INHERITS (assignment);

CREATE TABLE puhvi_assignment
(
) INHERITS (assignment);
CREATE TABLE ld_assignment
(
) INHERITS (assignment);


CREATE TABLE instruction
(
    instruction_id            serial PRIMARY KEY,
    instruction_name_fi       text          NOT NULL,
    instruction_name_sv       text          NOT NULL,
    instruction_content_fi    text          NOT NULL,
    instruction_content_sv    text          NOT NULL,
    instruction_publish_state publish_state NOT NULL,
    instruction_created_at    timestamptz   NOT NULL default now(),
    instruction_updated_at    timestamptz   NOT NULL default now()
);

CREATE TABLE suko_instruction
(
) INHERITS (instruction);

CREATE TABLE puhvi_instruction
(
) INHERITS (instruction);

CREATE TABLE ld_instruction
(
) INHERITS (instruction);
