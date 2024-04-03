#!/usr/bin/env bash

set -e

export SENSOR_DB_NAME="sensors";
export LOCATION_CSV_PATH="location-data.csv"; 
export SENSOR_DATA_CVS_PATH="mock-data.csv";

# Function to get Windows path
get_windows_path() {
  local path="$1"
  local PWD=$(pwd)
  local DRIVE_LC=$(echo "${PWD}" | cut -c 2)
  local DRIVE_UC=$(echo "${PWD}" | cut -c 2 | tr '[:lower:]' '[:upper:]')
  local PWD_WIN=$(echo "${PWD}" | sed "s|^/${DRIVE_LC}/|${DRIVE_UC}:\\\\|")
  local PWD_WIN=$(echo "${PWD_WIN}" | tr '/' '\\')
  local full_path="${PWD_WIN}\\${path}"
  echo "$full_path"
}

FULL_LOCATION_CSV_PATH=$(get_windows_path "$LOCATION_CSV_PATH")  # Full path for location CSV
FULL_SENSOR_DATA_CSV_PATH=$(get_windows_path "$SENSOR_DATA_CVS_PATH")

echo "Full location path: $FULL_LOCATION_CSV_PATH";  # Print location CSV path
echo "Full path: $FULL_SENSOR_DATA_CSV_PATH";

node mock-data.js

if [ ! -f "$LOCATION_CSV_PATH" ]; then  
  echo "Error: File $LOCATION_CSV_PATH not found!"
  exit 1
fi

if [ ! -f "$SENSOR_DATA_CVS_PATH" ]; then
  echo "Error: File $SENSOR_DATA_CVS_PATH not found!"
  exit 1
fi

psql -c "DROP DATABASE IF EXISTS ${SENSOR_DB_NAME}"
psql -c "CREATE DATABASE ${SENSOR_DB_NAME}"

psql -d ${SENSOR_DB_NAME} < csv-scheme.sql

echo "Copy loggers into DB";
psql -d ${SENSOR_DB_NAME} -c "COPY loggers FROM '${FULL_LOCATION_CSV_PATH}' WITH (FORMAT CSV, HEADER);"
# psql -d ${SENSOR_DB_NAME} -c "ALTER TABLE loggers ADD COLUMN ID SERIAL PRIMARY KEY";
psql -d ${SENSOR_DB_NAME} -c "SELECT COUNT(*) FROM loggers";

echo "Copy sensordata into DB";
psql -d ${SENSOR_DB_NAME} -c "COPY sensordata FROM '${FULL_SENSOR_DATA_CSV_PATH}' WITH (FORMAT CSV, HEADER);"
psql -d ${SENSOR_DB_NAME} -c "ALTER TABLE sensordata ADD COLUMN ID SERIAL PRIMARY KEY";
psql -d ${SENSOR_DB_NAME} -c "SELECT COUNT(*) FROM sensordata";

psql -d ${SENSOR_DB_NAME} -f update.sql
