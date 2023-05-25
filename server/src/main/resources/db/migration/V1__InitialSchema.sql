CREATE TYPE publish_state AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE assignment
(
    assignment_id                      serial PRIMARY KEY,
    assignment_name_fi                 text          NOT NULL,
    assignment_name_sv                 text          NOT NULL,
    assignment_content_fi              text          NOT NULL,
    assignment_content_sv              text          NOT NULL,
    assignment_instruction_fi          text          NOT NULL,
    assignment_instruction_sv          text          NOT NULL,
    assignment_publish_state           publish_state NOT NULL,
    assignment_created_at              timestamptz   NOT NULL default now(),
    assignment_updated_at              timestamptz   NOT NULL default now(),
    laajaalainen_osaaminen_koodi_arvos text[]        NOT NULL
);

CREATE TABLE suko_assignment
(
    suko_aihe_koodi_arvos           text[] NOT NULL,
    suko_assignment_type_koodi_arvo text   NOT NULL,
    suko_oppimaara_koodi_arvo       text   NOT NULL,
    suko_tavoitetaso_koodi_arvo     text   NOT NULL,
    PRIMARY KEY (assignment_id)
) INHERITS (assignment);

CREATE INDEX suko_assignment_suko_oppimaara_koodi_arvo_index on suko_assignment (suko_oppimaara_koodi_arvo);
COMMENT ON INDEX suko_assignment_suko_oppimaara_koodi_arvo_index IS 'For AssignmentRepository.getOppimaarasInUse()';

CREATE TABLE puhvi_assignment
(
    puhvi_assignment_type_koodi_arvo text   NOT NULL,
    puhvi_lukuvuosi_koodi_arvos      text[] NOT NULL,
    PRIMARY KEY (assignment_id)
) INHERITS (assignment);
CREATE TABLE ld_assignment
(
    ld_lukuvuosi_koodi_arvos text[] NOT NULL,
    ld_aine_koodi_arvo      text   NOT NULL,
    PRIMARY KEY (assignment_id)

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
    PRIMARY KEY (instruction_id)

) INHERITS (instruction);

CREATE TABLE puhvi_instruction
(
    PRIMARY KEY (instruction_id)
) INHERITS (instruction);

CREATE TABLE ld_instruction
(
    PRIMARY KEY (instruction_id)
) INHERITS (instruction);
