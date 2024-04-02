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
