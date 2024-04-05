import fs from 'fs';

const SENSOR_DATA_CSV_PATH = process.env.SENSOR_DATA_CVS_PATH;
const LOCATION_CSV_PATH = process.env.LOCATION_CSV_PATH;

if ( !SENSOR_DATA_CSV_PATH || !LOCATION_CSV_PATH ) {
    console.error( "No value in env SENSOR_DATA_CSV_PATH or LOCATION_CSV_PATH" );
    process.exit( -1 );
}

function generateIPv4 () {
    return Array.from( { length: 4 }, () => Math.floor( Math.random() * 256 ) ).join( '.' );
}

function generateSensorCsv ( rows, filePath ) {
    let csvContent = "logger_id,hw_version,sw_version,measurement_number,timestamp,rc_temperature,mag_x,mag_y,mag_z\n";

    for ( let row of rows ) {
        csvContent += `${ row.logger_id },${ row.hw_version },${ row.sw_version },${ row.measurement_number },${ row.timestamp },${ row.rc_temperature },${ row.mag_x },${ row.mag_y },${ row.mag_z }\n`;
    }

    fs.writeFileSync( filePath, csvContent );
    console.log( 'CSV file generated', filePath );
}

function generateLocationCsv ( locations, filePath ) {
    let csvContent = "logger_id,description,latitude,longitude\n";

    for ( let location of locations ) {
        csvContent += `${ location.logger_id },${ location.description },${ location.latitude },${ location.longitude }\n`;
    }

    fs.writeFileSync( filePath, csvContent );
    console.log( 'Location CSV file generated', filePath );
}

function generateSensorData ( loggerIds ) {
    let data = [];
    let startDate = new Date( '2222-02-02T00:00:00Z' );
    let totalIntervals = 7 * 24 * 6; // 7 days * 24 hours * 6 intervals per hour
    let interval = 10 * 60 * 1000; // 10 minutes in milliseconds

    for ( const loggerId of loggerIds ) {
        console.log( 'Logger ID', loggerId );
        for ( let i = 0; i < totalIntervals; i++ ) {
            let timestamp = new Date( startDate.getTime() - i * interval ); // Subtract i intervals from the current date
            let row = {
                logger_id: loggerId,
                hw_version: Math.floor( Math.random() * 100 ),
                sw_version: Math.floor( Math.random() * 100 ),
                measurement_number: i + 1,
                timestamp: timestamp.toISOString(),
                rc_temperature: Math.random().toFixed( 2 ),
                mag_x: Math.random().toFixed( 2 ),
                mag_y: Math.random().toFixed( 2 ),
                mag_z: Math.random().toFixed( 2 )
            };
            data.push( row );
        }
    }
    return data;
}

function generateLocationData ( numRows ) {
    let data = [];
    for ( let i = 0; i < numRows; i++ ) {
        let location = {
            logger_id: generateIPv4(),
            description: `Location ${ i + 1 }`,
            latitude: ( Math.random() * 0.4 + 62.10 ).toFixed( 6 ),  // Random latitude between 62.10 and 62.50
            longitude: ( Math.random() * 0.5 + 10.50 ).toFixed( 6 )  // Random longitude between 10.50 and 11.00
        };
        data.push( location );
    }
    return data;
}

let locationRows = generateLocationData( 100 );

let sensorRows = generateSensorData( locationRows.map( location => location.logger_id ) );

generateLocationCsv( locationRows, LOCATION_CSV_PATH );
generateSensorCsv( sensorRows, SENSOR_DATA_CSV_PATH );
