CREATE TABLE assignment_favorite
(
    assignment_id integer NOT NULL,
    user_oid      text    NOT NULL,
    PRIMARY KEY (assignment_id, user_oid),
    FOREIGN KEY (assignment_id)
        REFERENCES assignment (assignment_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE suko_assignment_favorite
(
    PRIMARY KEY (assignment_id, user_oid),
    CONSTRAINT fk_assignment_favorite_assignment_id FOREIGN KEY (assignment_id)
        REFERENCES suko_assignment (assignment_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) INHERITS (assignment_favorite);

CREATE TABLE ld_assignment_favorite
(
    PRIMARY KEY (assignment_id, user_oid),
    CONSTRAINT fk_assignment_favorite_assignment_id FOREIGN KEY (assignment_id)
        REFERENCES ld_assignment (assignment_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) INHERITS (assignment_favorite);

CREATE TABLE puhvi_assignment_favorite
(
    PRIMARY KEY (assignment_id, user_oid),
    CONSTRAINT fk_assignment_favorite_assignment_id FOREIGN KEY (assignment_id)
        REFERENCES puhvi_assignment (assignment_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) INHERITS (assignment_favorite);
