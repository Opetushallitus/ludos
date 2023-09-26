CREATE TABLE assignment_content
(
    assignment_content_content_id         serial PRIMARY KEY,
    assignment_id      integer REFERENCES assignment (assignment_id),
    assignment_content_language           language,
    assignment_content_assignment_content text    NOT NULL,
    assignment_content_order_index                integer NOT NULL,
    CONSTRAINT assignment_id_content_language_unique UNIQUE (assignment_id, assignment_content_language)
);

-- suko
CREATE TABLE suko_assignment_content
(
    PRIMARY KEY (assignment_content_content_id),
    CONSTRAINT suko_assignment_content_assignment_id_fkey FOREIGN KEY (assignment_id)
        REFERENCES suko_assignment (assignment_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) INHERITS (assignment_content);
CREATE INDEX suko_assignment_content_content_id_idx ON suko_assignment_content (assignment_content_content_id);
-- Migrate contentFi
INSERT INTO suko_assignment_content (assignment_id, assignment_content_language,
                                     assignment_content_assignment_content, assignment_content_order_index)
SELECT a.assignment_id, 'FI', a.assignment_content_fi, 0
FROM suko_assignment a;
-- Migrate contentSv
INSERT INTO suko_assignment_content (assignment_id, assignment_content_language,
                                     assignment_content_assignment_content, assignment_content_order_index)
SELECT a.assignment_id, 'SV', a.assignment_content_sv, 0
FROM suko_assignment a;

-- ld
CREATE TABLE ld_assignment_content
(
    PRIMARY KEY (assignment_content_content_id),
    CONSTRAINT ld_assignment_content_assignment_id_fkey FOREIGN KEY (assignment_id)
        REFERENCES ld_assignment (assignment_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) INHERITS (assignment_content);
CREATE INDEX ld_assignment_content_content_id_idx ON ld_assignment_content (assignment_content_content_id);
-- Migrate contentFi
INSERT INTO ld_assignment_content (assignment_id, assignment_content_language,
                                   assignment_content_assignment_content, assignment_content_order_index)
SELECT a.assignment_id, 'FI', a.assignment_content_fi, 0
FROM ld_assignment a;
-- Migrate contentSv
INSERT INTO ld_assignment_content (assignment_id, assignment_content_language,
                                   assignment_content_assignment_content, assignment_content_order_index)
SELECT a.assignment_id, 'SV', a.assignment_content_sv, 0
FROM ld_assignment a;

-- puhvi
CREATE TABLE puhvi_assignment_content
(
    PRIMARY KEY (assignment_content_content_id),
    CONSTRAINT puhvi_assignment_content_assignment_id_fkey FOREIGN KEY (assignment_id)
        REFERENCES puhvi_assignment (assignment_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) INHERITS (assignment_content);
CREATE INDEX puhvi_assignment_content_content_id_idx ON puhvi_assignment_content (assignment_content_content_id);
-- Migrate contentFi
INSERT INTO puhvi_assignment_content (assignment_id, assignment_content_language,
                                      assignment_content_assignment_content, assignment_content_order_index)
SELECT a.assignment_id, 'FI', a.assignment_content_fi, 0
FROM puhvi_assignment a;
-- Migrate contentSv
INSERT INTO puhvi_assignment_content (assignment_id, assignment_content_language,
                                      assignment_content_assignment_content, assignment_content_order_index)
SELECT a.assignment_id, 'SV', a.assignment_content_sv, 0
FROM puhvi_assignment a;


-- drop assignment_content from assignment
ALTER TABLE assignment DROP COLUMN assignment_content_fi;
ALTER TABLE assignment DROP COLUMN assignment_content_sv;