ALTER TYPE publish_state ADD VALUE 'DELETED';

CREATE INDEX suko_assignment_publish_state_index ON suko_assignment (assignment_publish_state);
CREATE INDEX ld_assignment_publish_state_index ON ld_assignment (assignment_publish_state);
CREATE INDEX puhvi_assignment_publish_state_index ON puhvi_assignment (assignment_publish_state);

CREATE INDEX suko_instruction_publish_state_index ON suko_instruction (instruction_publish_state);
CREATE INDEX ld_instruction_publish_state_index ON ld_instruction (instruction_publish_state);
CREATE INDEX puhvi_instruction_publish_state_index ON puhvi_instruction (instruction_publish_state);

CREATE INDEX suko_certificate_publish_state_index ON suko_certificate (certificate_publish_state);
CREATE INDEX ld_certificate_publish_state_index ON ld_certificate (certificate_publish_state);
CREATE INDEX puhvi_certificate_publish_state_index ON puhvi_certificate (certificate_publish_state);