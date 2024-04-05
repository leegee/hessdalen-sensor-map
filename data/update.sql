ALTER TABLE sensordata 
    ADD CONSTRAINT fk_sensordata_logger
    FOREIGN KEY (logger_id) REFERENCES loggers(logger_id);

ALTER TABLE loggers
    ADD COLUMN point GEOMETRY(POINT, 3857);

UPDATE loggers 
    SET point = ST_Transform(
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
        3857
);

-- Alter the column to timestamp with time zone
-- ALTER TABLE sensordata
-- ALTER COLUMN timestamp TYPE timestamp with time zone 
-- USING timestamp AT TIME ZONE 'UTC';

-- -- Set the default time zone for the column to UTC
-- ALTER TABLE sensordata
-- ALTER COLUMN timestamp SET DEFAULT NULL;
