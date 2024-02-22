CREATE TABLE assignment_favorite_folder
(
    assignment_favorite_folder_id        serial NOT NULL,
    assignment_favorite_folder_user_oid  text   NOT NULL,
    assignment_favorite_folder_parent_id integer,
    assignment_favorite_folder_name      text   NOT NULL,
    PRIMARY KEY (assignment_favorite_folder_id, assignment_favorite_folder_user_oid),
    FOREIGN KEY (assignment_favorite_folder_parent_id, assignment_favorite_folder_user_oid)
        REFERENCES assignment_favorite_folder (assignment_favorite_folder_id, assignment_favorite_folder_user_oid)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE suko_assignment_favorite_folder
(
    PRIMARY KEY (assignment_favorite_folder_id, assignment_favorite_folder_user_oid),
    FOREIGN KEY (assignment_favorite_folder_parent_id, assignment_favorite_folder_user_oid)
        REFERENCES suko_assignment_favorite_folder (assignment_favorite_folder_id, assignment_favorite_folder_user_oid)
        ON DELETE CASCADE ON UPDATE CASCADE
) INHERITS (assignment_favorite_folder);

CREATE TABLE ld_assignment_favorite_folder
(
    PRIMARY KEY (assignment_favorite_folder_id, assignment_favorite_folder_user_oid),
    FOREIGN KEY (assignment_favorite_folder_parent_id, assignment_favorite_folder_user_oid)
        REFERENCES ld_assignment_favorite_folder (assignment_favorite_folder_id, assignment_favorite_folder_user_oid)
        ON DELETE CASCADE ON UPDATE CASCADE
) INHERITS (assignment_favorite_folder);

CREATE TABLE puhvi_assignment_favorite_folder
(
    PRIMARY KEY (assignment_favorite_folder_id, assignment_favorite_folder_user_oid),
    FOREIGN KEY (assignment_favorite_folder_parent_id, assignment_favorite_folder_user_oid)
        REFERENCES puhvi_assignment_favorite_folder (assignment_favorite_folder_id, assignment_favorite_folder_user_oid)
        ON DELETE CASCADE ON UPDATE CASCADE
) INHERITS (assignment_favorite_folder);

TRUNCATE TABLE assignment_favorite;

ALTER TABLE assignment_favorite
    RENAME COLUMN user_oid TO assignment_favorite_user_oid;

ALTER TABLE assignment_favorite
    ADD COLUMN assignment_favorite_folder_id integer;

ALTER TABLE assignment_favorite
    ADD CONSTRAINT assignment_favorite_folder_fk FOREIGN KEY (assignment_favorite_folder_id, assignment_favorite_user_oid)
        REFERENCES assignment_favorite_folder (assignment_favorite_folder_id, assignment_favorite_folder_user_oid) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE assignment_favorite
    DROP CONSTRAINT assignment_favorite_pkey;
ALTER TABLE assignment_favorite
    ADD CONSTRAINT assignment_favorite_pkey PRIMARY KEY (assignment_id, assignment_favorite_user_oid,
                                                         assignment_favorite_folder_id);

ALTER TABLE suko_assignment_favorite
    DROP CONSTRAINT suko_assignment_favorite_pkey;
ALTER TABLE suko_assignment_favorite
    ADD CONSTRAINT suko_assignment_favorite_pkey PRIMARY KEY (assignment_id, assignment_favorite_user_oid,
                                                              assignment_favorite_folder_id);
ALTER TABLE suko_assignment_favorite
    ADD CONSTRAINT suko_assignment_favorite_folder_fk FOREIGN KEY (assignment_favorite_folder_id, assignment_favorite_user_oid)
        REFERENCES suko_assignment_favorite_folder (assignment_favorite_folder_id, assignment_favorite_folder_user_oid) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE ld_assignment_favorite
    DROP CONSTRAINT ld_assignment_favorite_pkey;
ALTER TABLE ld_assignment_favorite
    ADD CONSTRAINT ld_assignment_favorite_pkey PRIMARY KEY (assignment_id, assignment_favorite_user_oid,
                                                              assignment_favorite_folder_id);
ALTER TABLE ld_assignment_favorite
    ADD CONSTRAINT ld_assignment_favorite_folder_fk FOREIGN KEY (assignment_favorite_folder_id, assignment_favorite_user_oid)
        REFERENCES ld_assignment_favorite_folder (assignment_favorite_folder_id, assignment_favorite_folder_user_oid) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE puhvi_assignment_favorite
    DROP CONSTRAINT puhvi_assignment_favorite_pkey;
ALTER TABLE puhvi_assignment_favorite
    ADD CONSTRAINT puhvi_assignment_favorite_pkey PRIMARY KEY (assignment_id, assignment_favorite_user_oid,
                                                            assignment_favorite_folder_id);
ALTER TABLE puhvi_assignment_favorite
    ADD CONSTRAINT puhvi_assignment_favorite_folder_fk FOREIGN KEY (assignment_favorite_folder_id, assignment_favorite_user_oid)
        REFERENCES puhvi_assignment_favorite_folder (assignment_favorite_folder_id, assignment_favorite_folder_user_oid) ON DELETE CASCADE ON UPDATE CASCADE;

