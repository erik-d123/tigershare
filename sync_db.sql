BEGIN;
-- Drop existing tables in correct order
DROP TABLE IF EXISTS ride_participants CASCADE;
DROP TABLE IF EXISTS ride_requests CASCADE;
DROP TABLE IF EXISTS rides CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Now run the backup
\i local_backup.sql

COMMIT;