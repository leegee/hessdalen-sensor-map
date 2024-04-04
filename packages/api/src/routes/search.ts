import { PassThrough, Writable } from 'stream';
import type { Context } from 'koa';
import type { FeatureCollection } from 'geojson';
import type { ParsedUrlQuery } from "querystring";

import { FeatureSourceAttributeType, MapDictionary, QueryParams, QueryResponseType, isFeatureSourceAttributeType } from '@hessdalen-sensor-map/common-types/src';
import config from '@hessdalen-sensor-map/config/src';
import { CustomError } from '../middleware/errors';
import { listToCsvLine } from '../lib/csv';

type SqlBitsType = {
    selectColumns: string[],
    whereColumns: string[],
    whereParamsStack: Array<string|Date>,
    orderByClause?: Array<string|Date>,
};

export async function search(ctx: Context) {
    const body: QueryResponseType = {
        msg: '',
        status: 200,
        dictionary: {} as MapDictionary,
        results: undefined,
    };

    const userArgs: QueryParams | null = await getCleanArgs(ctx);

    if (!userArgs) {
        throw new CustomError({
            action: 'query',
            msg: 'Missing request parameters',
            details: userArgs
        })
    }

    let forErrorReporting = {};
    const acceptHeader = ctx.headers.accept || '';
    const sendCsv = acceptHeader.includes('text/csv');

    try {
        let sqlBits = await constructSqlBits(ctx, userArgs);
        let sql = sendCsv ? csvForPoints(sqlBits) : geoJsonForPoints(sqlBits);

        const formattedQueryForLogging = sql.replace(/\$(\d+)/g, (_: string, index: number) => {
            const param = sqlBits.whereParamsStack ? sqlBits.whereParamsStack[index - 1] : undefined;
            return typeof param === 'string' ? `'${param}'` : '';
        });

        forErrorReporting = { sql, sqlBits, formattedQuery: formattedQueryForLogging, userArgs };

        if (sendCsv) {
            await sendCsvResponse(ctx, sql, sqlBits);
        }

        else {
            const { rows } = await ctx.dbh.query(sql, sqlBits.whereParamsStack ? sqlBits.whereParamsStack : undefined);
            if (!rows[0] || !rows[0].jsonb_build_object
                || rows[0].jsonb_build_object.features === null && config.api.debug
            ) {
                console.warn({ action: 'query', msg: 'Found no features', forErrorReporting });
            } else {
                console.log({ action: 'query', msg: `Found ${rows.length} features` });
            }
            body.results = rows[0].jsonb_build_object as FeatureCollection;
            body.dictionary = await getDictionary(body.results);
            ctx.body = JSON.stringify(body);
        }
    }
    catch (e) {
        throw new CustomError({
            action: 'query',
            details: JSON.stringify(forErrorReporting, null, 2),
            error: e as Error
        });
    }
}

async function sendCsvResponse(ctx: Context, sql: string, sqlBits: SqlBitsType) {
    ctx.type = 'text/csv';
    ctx.attachment('data.csv');

    const results = await ctx.dbh.query(sql, sqlBits.whereParamsStack ? sqlBits.whereParamsStack : undefined);
    type ResponseBody = PassThrough | string | Buffer | NodeJS.WritableStream | null;
    let bodyStream: ResponseBody = ctx.body as ResponseBody;
    if (!bodyStream || typeof bodyStream === 'string' || Buffer.isBuffer(bodyStream)) {
        bodyStream = new PassThrough();
        ctx.body = bodyStream;
    }

    // Should enforce order. Map?
    let firstLine = true;
    for (const row of results.rows) {
        if (firstLine) {
            listToCsvLine(Object.keys(row), bodyStream);
            firstLine = false;
        }
        listToCsvLine(Object.values(row), bodyStream);
    }

    bodyStream.end();
}

async function getCleanArgs(ctx) {
    const args: ParsedUrlQuery = ctx.request.query;
    const userArgs: QueryParams = {
        zoom: parseInt(args.zoom as string),
        minlng: parseFloat(args.minlng as string),
        minlat: parseFloat(args.minlat as string),
        maxlng: parseFloat(args.maxlng as string),
        maxlat: parseFloat(args.maxlat as string),

        to_date: args.to_date ? (Array.isArray(args.to_date) ? args.to_date[0] : args.to_date) : undefined,
        from_date: args.from_date ? (Array.isArray(args.from_date) ? args.from_date[0] : args.from_date) : undefined,

        // Potentially the subject of a text search:
        q: args.q ? String(args.q).trim() : undefined,

        // Potentially the subject of the text search: undefined = search all cols defined in config.api.searchableTextColumnNames
        // Not yet implemented.
        q_subject: args.q_subject && [config.api.searchableTextColumnNames].includes(
            args.q_subject instanceof Array ? args.q_subject : [args.q_subject]
        ) ? String(args.q_subject) : undefined,

        sort_order: String(args.sort_order) === 'ASC' || String(args.sort_order) === 'DESC' ? String(args.sort_order) as 'ASC' | 'DESC' : undefined,

        ... (
            isFeatureSourceAttributeType(args.source)
                ? { source: args.source as FeatureSourceAttributeType }
                : {}
        )
    };

    if (!userArgs.sort_order) {
        userArgs.sort_order = 'DESC';
    }
    if (userArgs.from_date) {
        userArgs.from_date = new Date(Number(userArgs.from_date)).toISOString();
    }
    if (userArgs.to_date) {
        userArgs.to_date = new Date(Number(userArgs.to_date)).toISOString();
    }

    console.log('................',userArgs.from_date);

    return (
        userArgs !== null &&
        userArgs.minlat !== undefined && userArgs.minlng !== undefined &&
        userArgs.maxlat !== undefined && userArgs.maxlng !== undefined
    ) ? userArgs : null;
}

/**
 * 
 * @param userArgs QueryParams
 * @param whereParamsStack Current 'whereParamsStack' stack
 * @returns A string, and the updated 'whereParamsStack' stack.
 * @example const [spatialWhereColumns, spatialwhereParamsStack] = getSpatialWhereBits(userArgs, whereParamsStack);
 */
function getSpatialWhereBits(userArgs: QueryParams, whereParamsStack): [string, string[]] {
    return [
        `(loggers.point && ST_Transform(ST_MakeEnvelope($${whereParamsStack.length + 1}, $${whereParamsStack.length + 2}, $${whereParamsStack.length + 3}, $${whereParamsStack.length + 4}, 4326), 3857))`,
        [String(userArgs.minlng), String(userArgs.minlat), String(userArgs.maxlng), String(userArgs.maxlat)]
    ];
}

async function constructSqlBits(ctx: Context, userArgs: QueryParams): Promise<SqlBitsType> {
    const whereColumns: string[] = [];
    const selectColumns = [
        'sensordata.logger_id', 'sensordata.measurement_number',
        'sensordata.timestamp', 'sensordata.rc_temperature',
        'sensordata.mag_x', 'sensordata.mag_y', 'sensordata.mag_z',
        'loggers.logger_id', 'loggers.point'
    ];
    const whereParamsStack: Array<string|Date> = [];
    const orderByClause: Array<string|Date> = [];

    const [spatialWhereColumns, spatialwhereParamsStack] = getSpatialWhereBits(userArgs, whereParamsStack);

    whereColumns.push(spatialWhereColumns);
    whereParamsStack.push( ...spatialwhereParamsStack);

    if (!userArgs.from_date || !userArgs.to_date) {
        const [spatialWhereClause, spatialwhereParamsStack] = getSpatialWhereBits(userArgs, []);
        const sql = `SELECT MIN(sensordata.timestamp) 
            FROM sensordata 
            JOIN loggers ON sensordata.logger_id = loggers.logger_id
            WHERE ${spatialWhereClause}
        `;
        try {
            const { rows } = await ctx.dbh.query(sql, spatialwhereParamsStack);
            userArgs.from_date = new Date(rows[0].min);
            userArgs.to_date = new Date(
                userArgs.from_date.getTime() + Number(config.gui.time_window_ms)
            );
            console.log({ action: 'getCleanArgs default from_date', rows, from_date: userArgs.from_date, to_date: userArgs.to_date })
        } catch (error) {
            console.error({action: 'getCleanArgs default from_date', sql, spatialwhereParamsStack });
            throw error;
        }
    }

    if (userArgs.from_date !== undefined && userArgs.to_date !== undefined) {
        whereColumns.push( `(timestamp BETWEEN $${whereParamsStack.length + 1} AND $${whereParamsStack.length + 2})` );
        whereParamsStack.push(
            userArgs.from_date,
            userArgs.to_date
        );
        orderByClause.push('timestamp ' + userArgs.sort_order);
    }
    else if (userArgs.from_date !== undefined) {
        whereColumns.push(`(timestamp >= $${whereParamsStack.length + 1})`);
        whereParamsStack.push(userArgs.from_date);
        orderByClause.push('timestamp ' + userArgs.sort_order);
    }
    else if (userArgs.to_date !== undefined) {
        whereColumns.push(`(timestamp <= $${whereParamsStack.length + 1})`);
        whereParamsStack.push(userArgs.to_date);
        orderByClause.push('timestamp ' + userArgs.sort_order);
    }

    const rv: SqlBitsType = {
        selectColumns: selectColumns,
        whereColumns: whereColumns,
        whereParamsStack: whereParamsStack,
        orderByClause: orderByClause.length ? orderByClause : undefined,
    };

    return rv;
}


function innserSelect(sqlBits: SqlBitsType) {
    return `SELECT ${sqlBits.selectColumns.join(', ')}, sensordata.logger_id 
    FROM sensordata
    JOIN loggers ON sensordata.logger_id = loggers.logger_id
    WHERE ${sqlBits.whereColumns.join(' AND ')}
         ${sqlBits.orderByClause ? ' ORDER BY ' + sqlBits.orderByClause.join(',') : ''}
    ) AS s`;
}

function geoJsonForPoints(sqlBits: SqlBitsType) {
    return `SELECT jsonb_build_object(
            'type', 'FeatureCollection',
            'features', jsonb_agg(feature),
            'pointsCount', COUNT(*),
            'clusterCount', 0
        )
        FROM (
            SELECT jsonb_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(s.point, 3857)::jsonb,
                'properties', to_jsonb(s) - 'point'
            ) AS feature
        FROM (
            ${innserSelect(sqlBits)}
        ) AS fc`;
}




function csvForPoints(sqlBits: SqlBitsType) {
    return innserSelect(sqlBits);
}


async function getDictionary(featureCollection: FeatureCollection | undefined) {
    const dictionary: MapDictionary = {
        datetime: {
            min: Infinity,
            max: 0,
        },
    };

    let min = Infinity;
    let max = 0;

    if (!featureCollection || !featureCollection.features) {
        console.warn({ action: 'getDictionary', warning: 'no features', featureCollection });
        return dictionary;
    }

    for (const feature of featureCollection.features) {
        let thisDatetime: number;

        thisDatetime = new Date(feature.properties?.timestamp).getTime();

        if (typeof thisDatetime !== 'undefined') {
            if (typeof min === 'undefined' || thisDatetime < min) {
                min = thisDatetime;
            }
            if (typeof max === 'undefined' || thisDatetime > max) {
                max = thisDatetime;
            }
        }
    }

    dictionary.datetime = { min, max };

    return dictionary;
}
