DROP TABLE IF EXISTS loggers CASCADE;
CREATE TABLE loggers (
    logger_id VARCHAR(15) UNIQUE,
    description TEXT,
    latitude FLOAT,
    longitude FLOAT
);

DROP TABLE IF EXISTS sensordata CASCADE;
CREATE TABLE sensordata (
    logger_id VARCHAR(15),
    hw_version INT,
    sw_version INT,
    measurement_number INT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    rc_temperature FLOAT,
    mag_x FLOAT,
    mag_y FLOAT,
    mag_z FLOAT
);

