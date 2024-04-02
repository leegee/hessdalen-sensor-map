import fs from 'fs';

const SENSOR_DATA_CSV_PATH = process.env.SENSOR_DATA_CVS_PATH;
const LOCATION_CSV_PATH = process.env.LOCATION_CSV_PATH;

if ( !SENSOR_DATA_CSV_PATH || !LOCATION_CSV_PATH ) {
    console.error( "No value in env SENSOR_DATA_CSV_PATH or LOCATION_CSV_PATH" );
    process.exit( -1 );
}

function generateCSV ( rows, filePath ) {
    let csvContent = "logger_id,hw_version,sw_version,measurement_number,timestamp,rc_temperature,mag_x,mag_y,mag_z\n";

    for ( let row of rows ) {
        csvContent += `${ row.logger_id },${ row.hw_version },${ row.sw_version },${ row.measurement_number },${ row.timestamp },${ row.rc_temperature },${ row.mag_x },${ row.mag_y },${ row.mag_z }\n`;
    }

    fs.writeFileSync( filePath, csvContent );
    console.log( 'CSV file generated', filePath );
}

function generateLocationCSV ( locations, filePath ) {
    let csvContent = "logger_id,description,latitude,longitude\n";

    for ( let location of locations ) {
        csvContent += `${ location.logger_id },${ location.description },${ location.latitude },${ location.longitude }\n`;
    }

    fs.writeFileSync( filePath, csvContent );
    console.log( 'Location CSV file generated', filePath );
}

function generateData ( numRows, loggerIds ) {
    let data = [];
    let startDate = new Date(); // Current date and time
    for ( let i = 0; i < numRows; i++ ) {
        let randomIndex = Math.floor( Math.random() * loggerIds.length );
        let timestamp = new Date( startDate.getTime() - i * 60 * 60 * 24 * 1000 ); // Subtract i days from the current date
        let row = {
            logger_id: loggerIds[ randomIndex ],
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

function generateIPv4 () {
    return Array.from( { length: 4 }, () => Math.floor( Math.random() * 256 ) ).join( '.' );
}

// Generate 100 rows of data for locations
let locationRows = generateLocationData( 100 );
generateLocationCSV( locationRows, LOCATION_CSV_PATH );

// Use locationRows to generate data for sensordata
let sensorRows = generateData( 1000, locationRows.map( location => location.logger_id ) );
generateCSV( sensorRows, SENSOR_DATA_CSV_PATH );
