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
    whereParams: string[],
    orderByClause?: string[],
};

const epsMapping = [
    200000,
    200000,
    200000,
    160000,
    90000,
    25000,
    10000,
    7000,
    5000,
];


export async function search(ctx: Context) {
    const body: QueryResponseType = {
        msg: '',
        status: 200,
        dictionary: {} as MapDictionary,
        results: undefined,
    };

    const userArgs: QueryParams | null = getCleanArgs(ctx.request.query);

    if (!userArgs) {
        throw new CustomError({
            action: 'query',
            msg: 'Missing request parameters',
            details: userArgs
        })
    }

    if (userArgs.q && userArgs.q.length < config.minQLength) {
        throw new CustomError({
            action: 'query',
            msg: 'Text query too short',
            details: { q: userArgs.q }
        });
    }

    let forErrorReporting = {};

    const acceptHeader = ctx.headers.accept || '';
    const sendCsv = acceptHeader.includes('text/csv');

    try {
        let sql: string;
        let sqlBits = constructSqlBits(userArgs);

        if (sendCsv) {
            sql = `SELECT * FROM sightings WHERE ${sqlBits.whereColumns.join(' AND ')}`;
        }
        else {
            sql = geoJsonForPoints(sqlBits);    
        }
        // else if (userArgs.zoom >= config.zoomLevelForPoints) {
        //     sql = geoJsonForPoints(sqlBits);
        // }
        // else {
        //     sql = geoJsonForClusters(sqlBits, userArgs);
        // }

        const formattedQueryForLogging = sql.replace(/\$(\d+)/g, (_: string, index: number) => {
            const param = sqlBits.whereParams ? sqlBits.whereParams[index - 1] : undefined;
            return typeof param === 'string' ? `'${param}'` : '';
        });

        forErrorReporting = { sql, sqlBits, formattedQuery: formattedQueryForLogging, userArgs };

        if (sendCsv) {
            await sendCsvResponse(ctx, sql, sqlBits);
        }

        else {
            const { rows } = await ctx.dbh.query(sql, sqlBits.whereParams ? sqlBits.whereParams : undefined);
            if (rows[0].jsonb_build_object.features === null && config.api.debug) {
                console.warn({ action: 'query', msg: 'Found no features', sql, sqlBits });
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

    const results = await ctx.dbh.query(sql, sqlBits.whereParams ? sqlBits.whereParams : undefined);
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

function constructSqlBits(userArgs: QueryParams): SqlBitsType {
    const whereColumns: string[] = [];
    const selectColumns = [
        'sensordata.logger_id', 'sensordata.measurement_number',
        'sensordata.timestamp', 'sensordata.rc_temperature',
        'sensordata.mag_x', 'sensordata.mag_y', 'sensordata.mag_z',
        'loggers.logger_id', 'loggers.point'
    ];
    const whereParams: string[] = [];
    const orderByClause: string[] = [];

    whereColumns.push(`(loggers.point && ST_Transform(ST_MakeEnvelope($${whereParams.length + 1}, $${whereParams.length + 2}, $${whereParams.length + 3}, $${whereParams.length + 4}, 4326), 3857))`);

    whereParams.push(
        String(userArgs.minlng), String(userArgs.minlat), String(userArgs.maxlng), String(userArgs.maxlat)
    );

    if (userArgs.from_date !== undefined && userArgs.to_date !== undefined) {
        whereColumns.push(
            `(timestamp BETWEEN $${whereParams.length + 1} AND $${whereParams.length + 2})`
        );
        whereParams.push(
            userArgs.from_date,
            userArgs.to_date
        );
        orderByClause.push('timestamp ' + userArgs.sort_order);
    }
    else if (userArgs.from_date !== undefined) {
        whereColumns.push(`(timestamp >= $${whereParams.length + 1})`);
        whereParams.push(userArgs.from_date);
        orderByClause.push('timestamp ' + userArgs.sort_order);
    }
    else if (userArgs.to_date !== undefined) {
        whereColumns.push(`(timestamp <= $${whereParams.length + 1})`);
        whereParams.push(userArgs.to_date);
        orderByClause.push('timestamp ' + userArgs.sort_order);
    }

    const rv: SqlBitsType = {
        selectColumns: selectColumns,
        whereColumns: whereColumns,
        whereParams: whereParams,
        orderByClause: orderByClause.length ? orderByClause : undefined,
    };

    return rv;
}

async function getDictionary(featureCollection: FeatureCollection | undefined) {
    const dictionary: MapDictionary = {
        datetime: {
            min: undefined,
            max: undefined,
        },
    };

    let min: Date | undefined = undefined;
    let max: Date | undefined = undefined;

    if (!featureCollection || !featureCollection.features) {
        console.warn({ action: 'getDictionary', warning: 'no features', featureCollection });
        return dictionary;
    }

    for (const feature of featureCollection.features) {
        let thisDatetime: Date | undefined;

        try {
            thisDatetime = new Date(feature.properties?.timestamp);
        } catch (e) {
            thisDatetime = undefined;
        }

        if (typeof thisDatetime !== 'undefined') {
            if (typeof min === 'undefined' || thisDatetime.getTime() < min.getTime()) {
                min = thisDatetime;
            }
            if (typeof max === 'undefined' || thisDatetime.getTime() > max.getTime()) {
                max = thisDatetime;
            }
        }
    }

    dictionary.datetime = {
        min: typeof min !== 'undefined' ? min.getTime() : undefined,
        max: typeof max !== 'undefined' ? max.getTime() : undefined,
    };

    return dictionary;
}

function getCleanArgs(args: ParsedUrlQuery) {
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

    if (args.source)

        if (userArgs.from_date && Number(userArgs.from_date) === 1) {
            delete userArgs.from_date;
        }
    if (userArgs.to_date && Number(userArgs.to_date) === 1) {
        delete userArgs.to_date;
    }

    if (userArgs.from_date) {
        userArgs.from_date = new Date(userArgs.from_date + " 01-01 00:00:00").toISOString();
    }
    if (userArgs.to_date) {
        userArgs.to_date = new Date(userArgs.to_date + " 12-31 23:59:59").toISOString();
    }

    if (!userArgs.sort_order) {
        userArgs.sort_order = 'DESC';
    }

    return (
        userArgs !== null &&
        userArgs.minlat !== undefined && userArgs.minlng !== undefined &&
        userArgs.maxlat !== undefined && userArgs.maxlng !== undefined
    ) ? userArgs : null;
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
                SELECT ${sqlBits.selectColumns.join(', ')} FROM sensordata
            JOIN
                loggers ON sensordata.logger_id = loggers.logger_id
                WHERE ${sqlBits.whereColumns.join(' AND ')}
                ${sqlBits.orderByClause ? ' ORDER BY ' + sqlBits.orderByClause.join(',') : ''}
            ) AS s
        ) AS fc`;
}


function geoJsonForClusters(sqlBits: SqlBitsType, userArgs: QueryParams) {
    // For cluster boudnaries
    // const eps = epsFromZoom(userArgs.zoom);

    // For heatmaps
    const eps = 1000 * 10;

    return config.db.engine === 'postgis' ?
        `SELECT jsonb_build_object(
            'type', 'FeatureCollection',
            'features', jsonb_agg(feature),
            'pointsCount', 0,
            'clusterCount', COUNT(*)
        )
        FROM (
            SELECT jsonb_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(s.cluster_geom, 3857)::jsonb,
                'properties', jsonb_build_object(
                    'cluster_id', s.cluster_id,
                    'num_points', s.num_points
                )
            ) AS feature
            FROM (
                SELECT 
                    cluster_id,
                    ST_ConvexHull(ST_Collect(point)) AS cluster_geom,
                    COUNT(*) AS num_points
                FROM (
                    SELECT 
                        ST_ClusterDBSCAN(point, eps := ${eps}, minpoints := 1) OVER() AS cluster_id,
                        point
                    FROM sightings
                    WHERE ${sqlBits.whereColumns.join(' AND ')}
                ) AS clustered_points
                GROUP BY cluster_id
            ) AS s
        ) AS fc;
        `
        :
        `SELECT JSON_OBJECT(
        'type', 'FeatureCollection',
        'features', JSON_ARRAYAGG(feature),
        'pointsCount', 0,
        'clusterCount', COUNT(*)
    )
    FROM(
        SELECT JSON_OBJECT(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(s.cluster_geom):: json,
            'properties', JSON_OBJECT(
                'cluster_id', s.cluster_id,
                'num_points', s.num_points
            )
        ) AS feature
            FROM(
            SELECT 
                    cluster_id,
            ST_Centroid(ST_Collect(point)) AS cluster_geom,
            COUNT(*) AS num_points
                FROM(
                SELECT 
                        ST_ClusterDBSCAN(point, ${config.gui.map.cluster_eps_metres}, 1) OVER() AS cluster_id,
                point
                    FROM sightings
                    WHERE ${sqlBits.whereColumns.join(' AND ')}
            ) AS clustered_points
                GROUP BY cluster_id
        ) AS s
    ) AS fc`;
}

function epsFromZoom(zoomLevel: number): number {
    const eps = epsMapping[Math.min(Math.max(zoomLevel - 1, 1), config.zoomLevelForPoints)];
    console.info({ zoomLevel, eps });
    return eps;
}



/* 
function sqlForMvt(sqlBits: SqlBitsType, userArgs: MvtParams): string {
    const eps = epsFromZoom(userArgs.z);
    let sql = '';

    // No clustering when zoomed in
    if (userArgs.no_clusters || userArgs.z >= config.zoomLevelForPoints) {
        console.log(`POINTS because z${userArgs.z} >= ${config.zoomLevelForPoints}`);
        sql = `SELECT ST_AsMVT(q, 'sighting_points', 4096, 'geom')
            FROM (
                SELECT
                    ${sqlBits.selectColumns.join(', ')},
                    ST_AsMvtGeom(
                        point,
                        BBox(${userArgs.x}, ${userArgs.y}, ${userArgs.z}),
                        4096,
                        256,
                        true
                    ) AS geom
                FROM sightings
                WHERE 
                ST_Intersects(point, BBox(${userArgs.x}, ${userArgs.y}, ${userArgs.z}))
                ${sqlBits.whereColumns.length ? ' AND ' + sqlBits.whereColumns.join(' AND ') : ''}
                GROUP BY id
            ) AS q;`;
        // point && BBox(${userArgs.x}, ${userArgs.y}, ${userArgs.z})
    }

    else {
        // sql = `SELECT ST_AsMVT(q, 'sightings', 4096, 'geom')
        // FROM (
        //   SELECT
        //     clusters.cluster_id,
        //     COUNT(*) as num_points,
        //     ST_AsMVTGeom(
        //       ST_Centroid(ST_Collect(clusters.point)),
        //       BBox(${userArgs.x}, ${userArgs.y}, ${userArgs.z}),
        //       4096, 256, true
        //     ) AS geom,
        //     MAX(sightings.id) as id,
        //     MAX(sightings.datetime) as datetime,
        //     MAX(sightings.location_text) as location_text
        //   FROM (
        //     SELECT
        //       ST_ClusterDBSCAN(point, eps := ${eps}, minpoints := 1) OVER() AS cluster_id,
        //       point,
        //       ${sqlBits.selectColumns.join(', ')}
        //     FROM sightings
        //     WHERE
        //       ST_Intersects(point, BBox(${userArgs.x}, ${userArgs.y}, ${userArgs.z}))
        //       ${sqlBits.whereColumns.length ? ' AND ' + sqlBits.whereColumns.join(' AND ') : ''}
        //   ) AS clusters
        //   INNER JOIN sightings ON clusters.point = sightings.point
        //   GROUP BY clusters.cluster_id
        // ) AS q`;

        // One convex hull per tile:
        // sql = `SELECT ST_AsMVT(q, 'sightings', 4096, 'geom')
        // FROM (
        //   SELECT
        //     1 as id,
        //     COUNT(*) as num_points,
        //     ST_AsMVTGeom(
        //       ST_ConvexHull(ST_Collect(sightings.point)),
        //       BBox(${userArgs.x}, ${userArgs.y}, ${userArgs.z}),
        //       4096, 256, true
        //     ) AS geom
        //   FROM sightings
        //   WHERE
        //     ST_Intersects(point, BBox(${userArgs.x}, ${userArgs.y}, ${userArgs.z}))
        //     ${sqlBits.whereColumns.length ? ' AND ' + sqlBits.whereColumns.join(' AND ') : ''}
        // ) AS q`;

        // Four hulls per tile:
        sql = `SELECT ST_AsMVT(q, 'sighting_clusters', 4096, 'geom')
        FROM (
          SELECT 
            quadrant,
            COUNT(*) as num_points,
            ST_AsMVTGeom(
              ST_ConvexHull(ST_Collect(point)),
              BBox(${userArgs.x}, ${userArgs.y}, ${userArgs.z}),
              4096, 256, true
            ) AS geom
          FROM (
            SELECT 
              CASE 
                WHEN ST_Intersects(point, ST_SetSRID(ST_MakeEnvelope(bbox.xmin, bbox.ymin, bbox.xmin + (bbox.xmax-bbox.xmin)/2, bbox.ymin + (bbox.ymax-bbox.ymin)/2), 3857)) THEN 'quadrant1'
                WHEN ST_Intersects(point, ST_SetSRID(ST_MakeEnvelope(bbox.xmin + (bbox.xmax-bbox.xmin)/2, bbox.ymin, bbox.xmax, bbox.ymin + (bbox.ymax-bbox.ymin)/2), 3857)) THEN 'quadrant2'
                WHEN ST_Intersects(point, ST_SetSRID(ST_MakeEnvelope(bbox.xmin, bbox.ymin + (bbox.ymax-bbox.ymin)/2, bbox.xmin + (bbox.xmax-bbox.xmin)/2, bbox.ymax), 3857)) THEN 'quadrant3'
                ELSE 'quadrant4'
              END AS quadrant,
              point
            FROM sightings,
                 (SELECT 
                    ST_XMin(BBox(${userArgs.x}, ${userArgs.y}, ${userArgs.z})) as xmin,
                    ST_YMin(BBox(${userArgs.x}, ${userArgs.y}, ${userArgs.z})) as ymin,
                    ST_XMax(BBox(${userArgs.x}, ${userArgs.y}, ${userArgs.z})) as xmax,
                    ST_YMax(BBox(${userArgs.x}, ${userArgs.y}, ${userArgs.z})) as ymax
                 ) as bbox
            WHERE 
              ST_Intersects(point, BBox(${userArgs.x}, ${userArgs.y}, ${userArgs.z}))
              ${sqlBits.whereColumns.length ? ' AND ' + sqlBits.whereColumns.join(' AND ') : ''}
          ) AS s
          GROUP BY quadrant
        ) AS q`;


    }
    //                   -- point && BBox(${userArgs.x}, ${userArgs.y}, ${userArgs.z}) AND

    return sql;
}
*/