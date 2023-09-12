DO $$
    BEGIN
        IF EXISTS (SELECT 1
                   FROM information_schema.tables
                   WHERE table_schema = 'public' AND table_name = 'spring_session') THEN
            TRUNCATE TABLE spring_session CASCADE;
        END IF;
END $$;