SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid <> pg_backend_pid() and datname = 'ludos'; drop database ludos; create database ludos;
