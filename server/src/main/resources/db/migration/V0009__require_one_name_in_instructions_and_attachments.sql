ALTER TABLE assignment ADD CONSTRAINT assignment_name_check CHECK ( assignment_name_fi <> '' or assignment_name_sv <> '');
ALTER TABLE instruction ADD CONSTRAINT instruction_name_check CHECK ( instruction_name_fi <> '' or instruction_name_sv <> '');
