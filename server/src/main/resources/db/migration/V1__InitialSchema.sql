CREATE TABLE assignment
(
    assignment_id         serial PRIMARY KEY,
    assignment_name       text        NOT NULL,
    assignment_content    text        NOT NULL,
    assignment_is_draft   boolean     NOT NULL,
    assignment_created_at timestamptz NOT NULL default now(),
    assignment_updated_at timestamptz NOT NULL default now()
);

CREATE TABLE suko_assignment
(
    suko_assignment_type text NOT NULL
) INHERITS (assignment);

CREATE TABLE puhvi_assignment
(
) INHERITS (assignment);
CREATE TABLE ld_assignment
(
) INHERITS (assignment);
