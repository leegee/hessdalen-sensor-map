import { PassThrough, Writable } from 'stream';
import type { Context } from 'koa';
import type { FeatureCollection } from 'geojson';
import type { ParsedUrlQuery } from "querystring";

import {  MapDictionaryType, QueryParams, QueryResponseType } from '@hessdalen-sensor-map/common-types/src';
import config from '@hessdalen-sensor-map/config/src';
import { CustomError } from '../middleware/errors';
import { listToCsvLine } from '../lib/csv';

type SqlBitsType = {
    selectColumns: string[],
    whereColumns: string[],
    whereParamsStack: Array<string>,
    orderByClause?: Array<string | Date>,
    groupBy: string,
};

type UserArgsType = QueryParams & {
    timestamp_min: Number;
    timestamp_max: Number;
};


export async function search(ctx: Context) {
    const body: QueryResponseType = {
        msg: '',
        status: 200,
        dictionary: {} as MapDictionaryType,
        results: undefined,
    };

    const userArgs: UserArgsType = await getCleanArgs(ctx);

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
                || rows[0].jsonb_build_object.features === null
            ) {
                console.warn({ action: 'query', msg: 'Found no features', forErrorReporting });
            } else {
                console.log({ action: 'query', msg: `Found ${rows[0].jsonb_build_object.features.length} features` });
            }
            body.results = rows[0].jsonb_build_object as FeatureCollection;
            body.dictionary = getDictionary( userArgs);
            ctx.body = JSON.stringify(body);
            console.log(body.dictionary.datetime)
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

/** 
 * @throws if the args are unacceptable 
 **/
async function getCleanArgs(ctx: Context) {
    const args: ParsedUrlQuery = ctx.request.query;
    const userArgs: UserArgsType = {
        zoom: parseInt(args.zoom as string),
        minlng: parseFloat(args.minlng as string),
        minlat: parseFloat(args.minlat as string),
        maxlng: parseFloat(args.maxlng as string),
        maxlat: parseFloat(args.maxlat as string),
        to_date: args.to_date ? (Array.isArray(args.to_date) ? args.to_date[0] : args.to_date) : undefined,
        from_date: args.from_date ? (Array.isArray(args.from_date) ? args.from_date[0] : args.from_date) : undefined,
        timestamp_min: 0,
        timestamp_max: 0,
    };

    const [spatialWhereClause, spatialwhereParamsStack] = getSpatialWhereBits(userArgs, []);
    const sql = `SELECT MIN(sensordata.timestamp) AS min, MAX(sensordata.timestamp) AS max 
        FROM sensordata
        JOIN loggers ON sensordata.logger_id = loggers.logger_id
        WHERE ${spatialWhereClause}
    `;
    try {
        const { rows } = await ctx.dbh.query(sql, spatialwhereParamsStack);
        userArgs.timestamp_min = new Date(rows[0].min).getTime();
        userArgs.timestamp_max = new Date(rows[0].max).getTime();
    } catch (error) {
        console.error({action: 'getCleanArgs default from_date', sql, spatialwhereParamsStack });
        throw error;
    }

    if (!userArgs.from_date || Number(userArgs.from_date) < 0) {
        userArgs.from_date = Number(userArgs.timestamp_min);
        userArgs.to_date = Number(userArgs.timestamp_min) + Number(config.gui.time_window_ms);
    }

    if (userArgs.from_date && Number(userArgs.from_date) > 1) {
        userArgs.from_date = new Date(Number(userArgs.from_date)).toISOString();
        if (userArgs.to_date && Number(userArgs.to_date) > 1) {
            userArgs.to_date = new Date(Number(userArgs.to_date)).toISOString();
        }
    }

    if (userArgs.minlat === undefined || userArgs.minlng === undefined
        || userArgs.maxlat === undefined || userArgs.maxlng === undefined
    ) {
        throw new CustomError({
            action: 'query',
            msg: 'Missing request parameters',
            details: userArgs
        })
    }

    console.debug({action: 'getCleanArgs done', userArgs})

    return userArgs;
}

/**
 * 
 * @param userArgs UserArgsType
 * @param whereParamsStack Current 'whereParamsStack' stack
 * @returns A string, and the updated 'whereParamsStack' stack.
 * @example const [spatialWhereColumns, spatialwhereParamsStack] = getSpatialWhereBits(userArgs, whereParamsStack);
 */
function getSpatialWhereBits(userArgs: UserArgsType, whereParamsStack): [string, string[]] {
    return [
        `(loggers.point && ST_Transform(ST_MakeEnvelope($${whereParamsStack.length + 1}, $${whereParamsStack.length + 2}, $${whereParamsStack.length + 3}, $${whereParamsStack.length + 4}, 4326), 3857))`,
        [String(userArgs.minlng), String(userArgs.minlat), String(userArgs.maxlng), String(userArgs.maxlat)]
    ];
}

async function constructSqlBits(ctx: Context, userArgs: UserArgsType): Promise<SqlBitsType> {
    const whereColumns: string[] = [];
    const selectColumns = [
        'loggers.point',
        'loggers.logger_id', 
        'sensordata.logger_id',
        'AVG(sensordata.rc_temperature) as rc_temperature',
        'AVG(sensordata.mag_x) as mag_x',
        'AVG(sensordata.mag_y) as mag_y',
        'AVG(sensordata.mag_z) as mag_z',
        'MIN(sensordata.timestamp) AS timestamp'
    ];
    const whereParamsStack: Array<string> = [];
    const orderByClause: Array<string | Date> = [];
    const groupBy = 'GROUP BY sensordata.logger_id, loggers.logger_id,  loggers.point';

    const [spatialWhereColumns, spatialwhereParamsStack] = getSpatialWhereBits(userArgs, whereParamsStack);

    whereColumns.push(spatialWhereColumns);
    whereParamsStack.push( ...spatialwhereParamsStack);

    const from_date_str = `${userArgs.from_date}`;
    const to_date_str = `${userArgs.to_date}`;

    if (userArgs.from_date !== undefined && userArgs.to_date !== undefined) {
        whereColumns.push( `(sensordata.timestamp BETWEEN $${whereParamsStack.length + 1} AND $${whereParamsStack.length + 2})` );
        whereParamsStack.push( from_date_str, to_date_str );
    }
    else if (userArgs.from_date !== undefined) {
        whereColumns.push(`(sensordata.timestamp >= $${whereParamsStack.length + 1})`);
        whereParamsStack.push(from_date_str);
    }
    else if (userArgs.to_date !== undefined) {
        whereColumns.push(`(sensordata.timestamp <= $${whereParamsStack.length + 1})`);
        whereParamsStack.push(to_date_str);
    }

    const rv: SqlBitsType = {
        selectColumns: selectColumns,
        whereColumns: whereColumns,
        whereParamsStack: whereParamsStack,
        orderByClause: orderByClause.length ? orderByClause : undefined,
        groupBy
    };

    return rv;
}


function innserSelect(sqlBits: SqlBitsType) {
    // return `SELECT ${sqlBits.selectColumns.join(', ')}, sensordata.logger_id 
    // FROM sensordata
    // JOIN loggers ON sensordata.logger_id = loggers.logger_id
    // WHERE ${sqlBits.whereColumns.join(' AND ')}
    // ) AS s`;
    return `SELECT ${sqlBits.selectColumns.join(', ')}
        FROM sensordata
        JOIN loggers ON sensordata.logger_id = loggers.logger_id
        WHERE ${sqlBits.whereColumns.join(' AND ')}
        ${sqlBits.groupBy}`; 
}

function geoJsonForPoints(sqlBits: SqlBitsType) {
    return `
        SELECT jsonb_build_object(
            'type', 'FeatureCollection',
            'features', jsonb_agg(feature),
            'pointsCount', COUNT(*),
            'clusterCount', 0
        )
        FROM (
            SELECT jsonb_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(fc.point, 3857)::jsonb,
                'properties', to_jsonb(fc) - 'point'
          ) AS feature
        FROM (
            ${innserSelect(sqlBits)}
        ) AS fc
    ) as final_query`;
}




function csvForPoints(sqlBits: SqlBitsType) {
    return innserSelect(sqlBits);
}


function getDictionary( userArgs: UserArgsType): MapDictionaryType {
    return  {
        datetime: {
            min: userArgs.timestamp_min,
            max: userArgs.timestamp_max,
        },
    } as MapDictionaryType;
}
